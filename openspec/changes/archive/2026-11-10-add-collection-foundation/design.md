# Design

## Context

See proposal.md (Why) and config.yaml (constraints). In short: one owner, one Android phone (plus an occasional reinstall or second Android device), a sideloaded APK, no server, no database, $0 except Claude Vision taps. Google Drive is the system of record; the app keeps a working copy on the device. This replaces the-binder; nothing is migrated.

```
 ┌──────────── The Binder (Android APK, Capacitor) ─────────────┐
 │ WebView: React UI                                             │
 │   │                                                           │
 │ Collection store ── IndexedDB (cards, thumbs,                 │      ┌──────────────────┐
 │   │                 photo cache, outbox)                      │HTTPS │ Google Drive     │
 │ Sync engine ──────────────────────────────────────────────────┼─────▶│  The Binder/     │
 │ Photo pipeline (resize/WebP, Web Worker)                      │      │   collection.json│
 │ Update checker ───────────────────────────────────────────────┼──▶ GitHub Releases API │
 │ Identify client ──────────────────────────────────────────────┼──▶ Cloudflare Worker ──▶ Anthropic API
 │   │                                                           │    (key, ID-token owner check,
 │ Capacitor plugins (native):                                   │     daily cap)
 │   Google sign-in + Drive authorization (Credential Manager)   │
 │   Camera · ML Kit text recognition (bundled model)            │
 └───────────────────────────────────────────────────────────────┘
 GitHub Actions ── signed release APK ──▶ GitHub Releases ──▶ phone (download + sideload, or ADB)
```

## Goals / Non-Goals

**Goals**
- Local-first: every read and write hits the local store; Drive sync runs in the background while the app is open.
- Storage behind a port so Drive is swappable (a future OneDrive or local-folder adapter, or tests with an in-memory fake).
- Native capabilities (sign-in, camera, OCR, app info) behind ports, so the React app runs in a desktop Chromium for automated tests with fakes, and on the phone with Capacitor plugins.
- Acceptance tests for every spec scenario, runnable without a real Google account or a phone. Native integration is confirmed by a short on-device checklist.
- Updates install over the previous version without losing local data.

**Non-Goals**
- Real-time sync between installs (pull on open, on resume, and every few minutes is enough).
- Background sync while the app is closed.
- Field-level merge within a single card.
- More than one Google account per install.
- Installing updates from inside the app (the app only tells me; Android's installer does the install).

## Decisions

### D1. Stack: Capacitor wrapping React + Vite + TypeScript
- **Choice:** Capacitor (current major) with an Android project only, wrapping a React 19 + Vite + TypeScript app. Dexie for IndexedDB, Zod for the data schema, TanStack Virtual for the list. Native features come from Capacitor plugins (D3, D7, D8, plus `@capacitor/app` for version and resume events and `@capacitor/network` for connectivity). The web assets ship inside the APK, so there is no service worker and no hosted web app.
- **Alternatives:**
  - React Native / Expo: real native UI and a strong ecosystem, but a different component model and test stack from the React + Vite design, and Expo's cloud build service has free-tier limits. Local builds are $0.
  - .NET MAUI: one C# codebase with native controls, but a heavier toolchain, a weaker ecosystem for Google sign-in, ML Kit and Drive, and none of the planned React/Vitest/Playwright testing.
  - PWA (the previous plan): dropped in favor of a native APK.
- **Why Capacitor:** keeps the planned React app, ports and adapters, and Playwright tests almost unchanged, and adds the native pieces as plugins.
- **$0:** Capacitor, React, Vite, the Android SDK and Gradle are all free and open source.

### D2. Build and distribution: APK from GitHub Actions to GitHub Releases; Worker stays on Cloudflare
- **Package name:** `io.github.kevinmgreer.thebinder` (the `io.github.<username>` convention for projects without their own domain). It never changes, because the signing key, the Android OAuth clients, update-in-place and developer verification all depend on it.
- **Debug builds:** built locally (`npx cap sync android`, then `./gradlew assembleDebug`) with the Android debug key and installed with `adb install -r` on my phone over USB. The debug build type adds `applicationIdSuffix ".debug"` and is labeled "The Binder (dev)". It installs side by side with the release app instead of conflicting with it, and uses its own Drive folder (D4), so development never touches the real collection.
- **Release builds:** a GitHub Actions workflow runs on a `v*` tag. It installs Node and JDK, runs the tests, runs `vite build` and `cap sync android`, writes the keystore from a base64 Actions secret to the runner's temp directory, and runs `./gradlew assembleRelease` with the signing config read from environment variables (keystore password, key alias, key password, all Actions secrets). It then checks the signature with `apksigner verify` and attaches `the-binder-<version>.apk` to the GitHub Release for that tag.
- **Versioning:** `versionName` is the tag (for example `1.2.0`). `versionCode` comes from the tag as `major*10000 + minor*100 + patch`, so it always increases while tags follow semver, which keeps updates installing over the previous version (app-distribution spec).
- **Keystore:** never committed (`*.jks` and `*.keystore` are in `.gitignore`). It exists only in Actions secrets and in an offline backup (see Risks), because Actions secrets cannot be read back out of GitHub.
- **APK, not AAB:** sideloading needs an installable APK; app bundles are only for the Play Store.
- **Cloudflare Pages is removed.** The Vision proxy stays a Cloudflare Worker (D9), deployed with `wrangler deploy`.
- **Public repository:** the-binder is a public GitHub repository started from fresh history (the old repository becomes the private `the-binder-legacy`, keeping its history and the personal email in three old commits out of view). GitHub secret scanning and push protection are turned on. Commits use the GitHub noreply address. The owner's email, the Anthropic key and the keystore exist only in Worker and Actions secrets. The APK contains the web OAuth client ID and the Worker URL, which are public by design and protected by the owner check (D9).
- **Alternatives:** building release APKs on my laptop and uploading them by hand (the keystore would sit on the laptop and every step is manual); Firebase App Distribution (free, but adds a provider and a tester-invite flow for one person); F-Droid (needs reproducible open-source builds and a review queue); Play Store internal testing (out of scope).
- **Alternatives for the repository:** keep the-binder private and publish APKs to a separate public releases-only repository (hides the code, but needs a cross-repo token in Actions); make the existing repository public (exposes the personal email in old commits); rewrite the existing history in place with a force-push (harder to undo).
- **$0:** GitHub Releases, Actions, secret scanning and push protection are all free for public repositories. The Workers free plan covers the proxy.

### D3. Auth: native Google sign-in plus Drive authorization for `drive.file`
- **Choice:** a Capacitor plugin built on Android's Credential Manager and Google's Authorization API. Candidate: `@capgo/capacitor-social-login`. If it doesn't expose both steps cleanly, the fallback is a small local Capacitor plugin in Kotlin over `androidx.credentials` and `Identity.getAuthorizationClient`.
  1. **Sign-in (identity):** Credential Manager with the Sign in with Google option and `serverClientId` = the **web** OAuth client ID. Returns a Google ID token (`aud` = web client ID) carrying `email` and `email_verified`. Silent re-sign-in uses authorized accounts with auto-select.
  2. **Drive access:** an Authorization request for `https://www.googleapis.com/auth/drive.file`. The first time, it returns a consent intent the app launches. After that it returns an access token silently. The access token (about one hour) and the ID token live in memory only, and expiry triggers a silent re-request (google-sign-in "Session renewal").
- **Google Cloud setup:** the web OAuth client (its ID is the ID-token audience the Worker checks, D9), plus two Android OAuth clients: `io.github.kevinmgreer.thebinder` with the **release** key SHA-1, and `io.github.kevinmgreer.thebinder.debug` with the **debug** key SHA-1. Without the matching package/SHA-1 pair, authorization fails on that build.
- **Sign out:** revoke the Drive access token at Google's revoke endpoint, clear Credential Manager state, and wipe local storage (google-sign-in "Sign out").
- **Scopes:** `drive.file`, `openid`, `email`, all non-sensitive, so the consent screen can be published "In production" for my own use with no Google verification and no 7-day token expiry.
- **Alternatives:** Google Identity Services web flow inside the WebView (Google blocks OAuth in embedded WebViews with `disallowed_useragent`); AppAuth with Custom Tabs and PKCE (works, but more code and no native account picker); the legacy Google Sign-In SDK (deprecated in favor of Credential Manager); `drive.appdata` (hidden folder, so I couldn't browse photos in Drive); full `drive` scope (restricted, needs verification).
- **$0:** OAuth clients and the Drive API need no billing account.

### D4. Drive layout: one folder, one JSON file, one photo folder
```
The Binder/                    (appProperties: { thebinder: "root" })
  collection.json              (appProperties: { thebinder: "data" })
  photos/
    2024-topps-27-acuna-jr-ronald-front-<cardId8>.webp
    2024-topps-27-acuna-jr-ronald-back-<cardId8>.webp
    thumbs/<cardId>-front.webp
```
- Find the root with `files.list` on `appProperties has { key='thebinder' and value='root' } and trashed=false`; `drive.file` can see it because the app created it. Use the oldest if two exist (race on first sign-in from two installs).
- **Dev build:** `drive.file` access is per Google Cloud project, so the debug build could see the real folder. It therefore uses a separate root, "The Binder (dev)" with `appProperties: { thebinder: "root-dev" }`, chosen at build time, so testing never reads or writes the real collection.
- **Thumbnails are stored in Drive** (resolved): on a reinstall or new phone, the list fills from about 20 KB per card instead of downloading every full photo (about 2 GB at 5,000 cards) to rebuild them. They add about 100 MB.
- Photo file names are for humans; the data file references photos by Drive file ID, so renaming in Drive doesn't break anything.
- **Alternatives:** one JSON file per card (thousands of list/download calls on a new install, slow and rate-limit prone); a SQLite file in Drive (not human-readable, still a whole-file rewrite per sync); Google Sheets as the database (needs the Sheets scope; fragile with nested parallel/grade data).
- **$0:** fits in the free 15 GB Drive quota (see drive-storage "Free storage footprint").

### D5. Data file format
```jsonc
{
  "schemaVersion": 1,
  "updatedAt": "2026-11-07T17:52:00Z",
  "cards": [{
    "id": "uuid-v7",
    "player": "Ronald Acuña Jr.", "team": "Atlanta Braves",
    "year": 2024, "manufacturer": "Topps", "set": "Series 1", "cardNumber": "27",
    "parallel": { "name": "Gold", "serial": 23, "serialLegible": true, "printRun": 2024 },
    "flags": { "rookie": false, "autograph": false, "relic": false },
    "grading": { "kind": "graded", "company": "PSA", "grade": "9" },   // or { "kind": "raw", "condition": "NM" }
    "quantity": 1, "notes": "",
    "photos": { "front": { "fileId": "...", "thumbId": "..." }, "back": null },
    "source": "manual | ocr | claude",
    "createdAt": "...", "updatedAt": "...", "deletedAt": null
  }]
}
```
- Deletes are tombstones (`deletedAt`) so other installs learn about them; tombstones older than 90 days are purged on write.
- `serialLegible: false` with `serial: null` covers the "?/99" case.
- Size: about 600 bytes per card, so about 3 MB at 5,000 cards. Fine to rewrite on each sync.
- **$0:** plain file in Drive.

### D6. Sync: local-first with per-card last-writer-wins
- Every edit writes the card to IndexedDB with a new `updatedAt` and appends to an outbox. The UI never waits for Drive.
- **Push** (debounced 5 s after the last change, and when connectivity returns): pull → merge → upload new `collection.json` → upload outbox photos → clear outbox. Photos upload before the JSON that references them.
- **Pull** (on start, on app resume, every 5 min while in the foreground): read the file `version`; if it changed since the last sync, download and merge.
- Sync runs only while the app is in the foreground. Android may stop a backgrounded app at any time; the outbox is in IndexedDB, so nothing is lost and the next start pushes it.
- **Merge:** union by `id`; for the same `id`, keep the higher `updatedAt` (tombstones included). Device clock skew is tolerated because conflicts on one card across two installs within seconds are unlikely for one person.
- **Write check:** Drive v3 has no conditional write, so after upload re-read `version`; if it advanced by more than our write, another install wrote in between, so pull/merge/push again (bounded to 3 tries).
- Retries use exponential backoff with jitter on 403 rate-limit, 429 and 5xx.
- **Alternatives:** Drive as the only store (no offline); a CRDT library such as Automerge or Yjs (strong merge, but an opaque binary file and heavy for this need); Android WorkManager background sync (needs native code; not needed for one person who syncs when the app is open).
- **$0:** Drive API usage is free and one user is far below per-user quotas.

### D7. Photo capture and pipeline: native camera plugin
- *Superseded for "Scan card" by `scan-card-with-document-scanner`: capture now goes through the ML Kit Document Scanner, with `@capacitor/camera` kept as the fallback and for "Pick from photos".*
- **Capture:** `@capacitor/camera` with the camera source for the front and then the back (with "skip back"), using Android's camera at full resolution with orientation corrected, and the photos source for "Pick from photos". The plugin asks for camera permission; if it is denied, the app offers "Pick from photos" instead (card-photos spec).
- **Processing** in a Web Worker in the WebView with `OffscreenCanvas`: resize the full photo to 1600 px on the long edge as WebP at about quality 0.82 (target under 400 KB), and a 320 px thumbnail (about 20 KB).
- Thumbnails are stored in IndexedDB. Full photos are cached in IndexedDB after first view, with a size-capped least-recently-used cache. New photos stay in the outbox until uploaded.
- 2 photos × 400 KB × 5,000 cards ≈ 4 GB in Drive, within the 5 GB budget in the drive-storage spec and the free 15 GB.
- **Alternatives:** `getUserMedia` inside the WebView (needs WebView permission plumbing and gives video-frame quality, not full sensor stills); a camera-preview plugin with a card-shaped overlay (nicer framing, but more plugin surface; can be added later); native image compression in a custom plugin (not needed; the WebView encodes WebP).
- **$0:** open-source plugin; processing happens on the device.

### D8. On-device recognition: Google ML Kit text recognition
- **Choice:** Google ML Kit Text Recognition v2 (Latin script) with the **bundled** model (`com.google.mlkit:text-recognition`), so it works offline from the first launch with no model download. It is reached through a Capacitor plugin: an existing community ML Kit text-recognition plugin if a maintained one uses the bundled model, otherwise a small local Capacitor plugin in Kotlin. It runs on the back photo first, then the front, and returns text blocks and lines.
- A parser in TypeScript (unit-tested with fixture text) extracts: year (four digits 1950–current, preferring a "©" year), card number (patterns like `No. 27`, `#US123`, `27`), print run and serial (`23/2026`, `/99`), and manufacturer/set names from a small known list (Topps, Bowman, Panini, Donruss, Upper Deck, Chrome, Heritage, Update...).
- Player names are not guessed from OCR in v1; too error-prone without a checklist.
- **Alternatives:** Tesseract.js in the WebView (free and offline, but a multi-MB WASM and language download, slower on a phone, and noticeably weaker on small glossy card-back text); the unbundled ML Kit model through Play services (smaller APK, but the model downloads on first use, so the first offline scan can fail); Google Cloud Vision (needs a billing account, breaking the $0 setup).
- **$0:** ML Kit on-device APIs are free with no account or quota; the bundled model adds a few MB to the APK.

### D9. Claude Vision proxy (Cloudflare Worker)
- `POST /identify` with `Authorization: Bearer <Google ID token>` and front/back WebP images (≤ 1 MB total).
- A native app has no trustworthy `Origin` header (the WebView sends `https://localhost`, and any client can set any value), so **Origin is not a gate**. The Google token owner check is the gate. The Worker returns CORS headers for the WebView origin only so that `fetch` from the WebView works.
- Worker steps: verify the Google ID token (signature against Google's published keys, `iss` is Google, `aud == GOOGLE_WEB_CLIENT_ID`, not expired), then require `email == OWNER_EMAIL` and `email_verified` → check size → increment a daily counter in Workers KV and refuse past `DAILY_LIMIT` (default 50) → call the Anthropic Messages API with both images and a tool definition that forces a JSON result (card fields plus a per-field `confidence`) → return the JSON. Every rejection happens before any Anthropic call.
- The app gets a fresh ID token silently (D3) before calling if the cached one is near expiry.
- Secrets: `ANTHROPIC_API_KEY`, `OWNER_EMAIL`, `GOOGLE_WEB_CLIENT_ID` as Worker secrets or variables. The model ID is a Worker variable so it can change without a new APK.
- Also set a monthly spend limit in the Anthropic Console as a second guard.
- **Alternatives:** put the key in the APK (anyone can extract it from the APK); ask for the key at runtime and store it on the phone (works, but the key then lives on the device); check the Drive access token with `tokeninfo` instead of the ID token (works, but the ID token's audience ties requests to this project's web client); an `Origin` allow-list (forgeable from a native client).
- **$0:** Workers free plan (100k requests/day) and KV free tier (1,000 writes/day, well above a 50/day cap); Claude calls are the only cost, a cent or two per card.

### D10. Architecture inside the app
- Ports: `CollectionStore`, `RemoteStore` (Drive), `PhotoStore`, `PhotoSource` (camera/picker), `Recognizer` (OCR, Claude), `AuthProvider`, `AppInfo` (version), `ReleaseFeed` (latest release).
- Adapters: `DexieCollectionStore`, `DriveRemoteStore`, `InMemoryRemoteStore` (tests), `CapacitorCameraPhotoSource`, `FakePhotoSource`, `MlKitRecognizer`, `FakeRecognizer`, `ClaudeRecognizer`, `NativeGoogleAuthProvider`, `FakeAuthProvider`, `CapacitorAppInfo`, `GitHubReleaseFeed`, `FakeReleaseFeed`. Use cases depend only on ports.
- **Update check (app-distribution):** on start when online and from "Check for updates" in settings, `GitHubReleaseFeed` calls `GET https://api.github.com/repos/kevinMgreer/the-binder/releases/latest` with no credentials, compares its tag to the installed `versionName`, and returns the version and the APK asset's download URL. The app shows it and opens the link in the system browser; Android's installer does the rest. Failures are silent on start and reported on a manual check. The unauthenticated limit (60 requests/hour per IP) is far above one check per launch.
- Testing: Vitest for domain, merge, version comparison and parser logic. Playwright acceptance tests per spec scenario run the same React app from the Vite dev server in a mobile viewport against the fake adapters and a mock proxy. The Worker is tested with the Miniflare/Vitest pool. Native adapters (sign-in, camera, ML Kit, app info) are confirmed on the phone with a short checklist (tasks 7.x), since those behaviors are Android's, not ours.
- **$0:** all open source.

### D11. Local storage: IndexedDB in the WebView (Dexie), not native SQLite
- **Choice:** keep the local working copy (cards, thumbnails, full-photo cache, outbox) in IndexedDB via Dexie inside the Capacitor WebView.
- **Why:**
  - At 5,000 cards the collection is about 3 MB of JSON and loads into memory, so search and filtering run in memory and gain nothing from SQL indexes.
  - The same store runs in Vitest (`fake-indexeddb`) and in Playwright's Chromium, so acceptance tests exercise the real storage code instead of a stand-in.
  - The WebView's IndexedDB lives in the app's private data directory. It survives app updates signed with the same key and is cleared only by uninstall or "Clear storage", and Drive is the source of truth either way.
  - It stores photo blobs directly, so one store covers everything, and it needs no native plugin.
- **Constraint this creates:** IndexedDB is keyed to the WebView origin, so the Capacitor `server.androidScheme` (`https`) and `hostname` are fixed in `capacitor.config.ts` and must never change. Changing either in a later release would orphan the local data after an update.
- **Alternatives:** a native SQLite plugin such as `@capacitor-community/sqlite` (real SQL and indexes, but native code to keep current, a separate web implementation for tests, and blobs would need the filesystem; worth it only at much larger scale); Capacitor Preferences (key-value only, not for blobs or thousands of records); the Capacitor Filesystem for photos (considered for the full-photo cache; rejected to keep one store).
- **$0:** both options are free; IndexedDB needs no extra dependency.

## Risks / Trade-offs

- [Android developer verification: Google is rolling out a requirement that apps installed on certified Android devices come from verified developers, globally in 2027] → ADB installs keep working regardless. Before the global rollout, register a free limited-distribution account (meant for hobbyist and small-scale apps on a limited number of devices) with this package name and release key, so normal sideloading of the downloaded APK keeps working. Android's advanced sideload flow remains a fallback.
- [Losing the release signing key or its passwords] → Android only installs an update signed with the same key, so a lost key means uninstalling (which deletes local data), installing an APK signed with a new key, registering the new SHA-1 in Google Cloud, and updating the Actions secrets. Mitigation: when the keystore is created, store it and its passwords in a password manager or offline backup, because Actions secrets are write-only and cannot be recovered from GitHub. Drive is the source of truth, so the worst case loses only changes that were never synced.
- [Debug and release builds are signed with different keys] → The debug build has its own package (`.debug`) and Drive folder, so the two install side by side and never overwrite each other or share data.
- [A secret or personal detail gets committed to the public repository] → `.gitignore` covers keystores and env files, GitHub push protection blocks known secret formats on push, secret scanning alerts on anything that slips through, and owner-specific values live only in Worker and Actions secrets.
- [WebView origin change orphans local data] → `androidScheme`/`hostname` are pinned (D11) and called out in `capacitor.config.ts`.
- [Community Capacitor plugins (sign-in, ML Kit) lag behind Android or Capacitor releases] → Each sits behind a port; the fallback is a small local Kotlin plugin over the Google library.
- [Phone without Google Play services] → Credential Manager sign-in needs Play services; the target phone has them. Other phones are not supported.
- [Two installs sign in for the first time at the same moment and each creates a folder] → Pick the oldest root folder; a later change can merge the duplicate.
- [Whole-file rewrite of collection.json gets slow past ~20k cards] → Fine for the stated scale; if it grows, split into yearly shards behind the same `RemoteStore` port.
- [Clock skew makes last-writer-wins pick the wrong edit] → Rare for a single user; record `deviceId` with each edit so a future change can show conflicts.
- [Silent Drive authorization refused, for example after revoking access in Google account settings] → Fall back to a "Sign in again" action; local changes are never lost.
- [ML Kit accuracy on glossy, foil or tiny back text] → It only pre-fills; Claude is one tap away.
- [Drive API quotas] → One user is far below per-user quotas; backoff handles bursts like bulk photo upload.
- ["Clear storage" or uninstall on the phone] → Removes the local copy; Drive remains the source of truth, so only unsynced changes are lost. The unsynced indicator shows when that risk exists.
- [Anthropic spend creeping up] → Daily cap in the Worker plus the Console spend limit.

## Migration Plan

Nothing is migrated from the old the-binder; this is a fresh start with an empty collection. Setup order:

0. **Repository:** rename the existing GitHub repository to `the-binder-legacy` (private, keeps its history), create a new public `the-binder` whose first commit is this project's content with no old history, and turn on secret scanning and push protection.
1. **Signing key:** generate the release keystore locally with `keytool`. Back up the keystore and its passwords outside GitHub. Add the base64 keystore, store password, key alias and key password as GitHub Actions secrets. Never place the keystore in the repo.
2. **Google Cloud:** create a project → enable the Drive API → OAuth consent screen (External; scopes `drive.file`, `openid`, `email`) → publish to "In production" → create a web OAuth client (no origins needed; its client ID is the `serverClientId` and the Worker's audience) → create Android OAuth clients for `io.github.kevinmgreer.thebinder` with the release key SHA-1 and for `io.github.kevinmgreer.thebinder.debug` with the debug key SHA-1 (`./gradlew signingReport`). No billing account.
3. **Cloudflare:** create the Worker with `ANTHROPIC_API_KEY`, `OWNER_EMAIL` and `GOOGLE_WEB_CLIENT_ID`, plus a KV namespace for the daily counter; deploy with `wrangler deploy`.
4. **Anthropic Console:** create an API key for the Worker → set a monthly spend limit.
5. **Phone:** enable Developer options and USB debugging, install the debug build with `adb install -r`, and sign in.
6. **First release:** push tag `v0.1.0` → Actions builds, signs and verifies the APK and attaches it to the GitHub Release → install it on the phone (it sits alongside "The Binder (dev)").

**Retire the-binder:** the old app's hosting is shut down and its resources deleted. Nothing is exported from it. Its code and history remain only in the private `the-binder-legacy` repository.

**Rollback:** the data file and photos are plain files in my Drive; uninstalling the app loses nothing that has synced.

## Open Questions

None. Resolved: package name `io.github.kevinmgreer.thebinder` (D2); public repository with fresh history (D2); debug build as a separate `.debug` app with its own Drive folder (D2, D4); daily Claude limit 50 (D9); thumbnails stored in Drive (D4).
