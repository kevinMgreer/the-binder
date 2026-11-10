# Tasks

## 1. Project setup

- [x] 1.1 Scaffold React + Vite + TypeScript app with Dexie, Zod, Vitest and Playwright (mobile viewport project); verify `npm run build`, `npm test` and `npx playwright test` all pass on an empty smoke test
- [x] 1.2 Create ports (`CollectionStore`, `RemoteStore`, `PhotoStore`, `PhotoSource`, `Recognizer`, `AuthProvider`, `AppInfo`, `ReleaseFeed`) and in-memory/fake adapters per design D10; verify a smoke test wires the app shell to the fakes
- [x] 1.3 Add Capacitor with an Android project only: package `io.github.kevinmgreer.thebinder`; a debug build type with `applicationIdSuffix ".debug"`, the label "The Binder (dev)" and the dev Drive root (design D2, D4); pin `server.androidScheme` and `hostname` in `capacitor.config.ts` with a comment that they must never change (design D11); and add `@capacitor/app` and `@capacitor/network`. Verify `npx cap sync android`, `./gradlew assembleDebug` and an unsigned `assembleRelease` succeed, that `aapt dump badging` shows `io.github.kevinmgreer.thebinder.debug` for debug and `io.github.kevinmgreer.thebinder` for release, and that `.gitignore` excludes `android/**/build`, `*.jks` and `*.keystore`
- [ ] 1.4 Install the debug build on my phone over ADB (`adb install -r`); verify "The Binder (dev)" opens to the app shell, and that reinstalling the same debug build over it with `adb install -r` keeps a test record written to IndexedDB
- [ ] 1.5 Write `docs/setup.md` covering the repository, signing key, Google Cloud (both Android OAuth clients), Cloudflare, Anthropic and phone setup steps from design "Migration Plan"; verify by following it on a clean Google Cloud project
- [ ] 1.6 Confirm the public repository's safeguards (design D2): secret scanning and push protection on, all commits authored with the GitHub noreply address, and no personal email anywhere in the tree; verify in the repository's security settings, with `git log --format='%ae' | sort -u`, and by searching the tree for email addresses other than the noreply address, finding nothing

## 2. Card catalog (offline, local only)

- [x] 2.1 Write acceptance tests for every scenario in `specs/card-catalog/spec.md` (against fakes); verify they fail for the right reason
- [x] 2.2 Implement the card Zod schema and validation (required fields, serial ≤ print run, graded vs raw); verify the "Missing required field", "Serial above print run" and "Graded card" tests pass
- [x] 2.3 Implement add, edit and delete (tombstone) in `DexieCollectionStore`; verify the edit and delete tests pass
- [x] 2.4 Implement duplicate detection and quantity increment; verify "Add a duplicate" passes
- [ ] 2.5 Build the virtualized collection list with default sort and summary totals; verify "Totals with duplicates" passes and a 5,000-card seeded list renders its first screen under 1 s in a Playwright trace with CPU throttling 4×, and spot-check the same seeded list on the phone
- [x] 2.6 Implement search (case- and accent-insensitive) and the filters; verify "Text search" and "Combined filters" pass
- [x] 2.7 Implement the "?/99" unreadable-serial display and print-run filter; verify both serial scenarios pass

## 3. Card photos

- [x] 3.1 Write acceptance tests for every scenario in `specs/card-photos/spec.md` (against `FakePhotoSource`); verify they fail for the right reason
- [ ] 3.2 Build capture (front then back, skip back) with `CapacitorCameraPhotoSource` over `@capacitor/camera` and the "Pick from photos" fallback (design D7); verify "Camera capture on Android", "Camera closed without a photo" and "Choose existing image" pass, and manually verify all three on the phone (phone 2026-11-09: capture, cancel and pick work; the system camera app, not this app, chooses the lens, so "the rear camera opens" is open until the in-app camera change)
- [ ] 3.3 Implement the worker-based resize/WebP pipeline and thumbnails (design D7); verify a 12 MP fixture compresses to ≤ 500 KB in a Vitest test, and on the phone ML Kit still reads the serial stamp from the compressed fixture
- [x] 3.4 Store photos and thumbnails in the local `PhotoStore` (IndexedDB, size-capped full-photo cache), with retake/replace; verify "Replace front photo" passes against the fake remote
- [ ] 3.5 Build the zoomable detail view and offline thumbnail fallback; verify "View full photo offline" and "Zoom to read serial" pass, and pinch-zoom is smooth on the phone

## 4. Google sign-in

- [x] 4.1 Write acceptance tests for every scenario in `specs/google-sign-in/spec.md` using `FakeAuthProvider`; verify they fail for the right reason
- [ ] 4.2 Implement `NativeGoogleAuthProvider` through a Capacitor plugin: Credential Manager sign-in with the web client ID as `serverClientId`, plus Drive authorization for `drive.file`, with in-memory tokens (design D3); verify the sign-in, decline and consent-scope scenarios pass against the fake, and on the phone confirm sign-in works on both the debug and the release build and the consent screen lists only access to the app's own files
- [ ] 4.3 Implement silent renewal of the access and ID tokens and the "Sign in again" fallback; verify both renewal scenarios pass, and on the phone that Drive calls still succeed after the app sits idle for over an hour
- [ ] 4.4 Implement sign out with unsynced-changes warning, token revocation, Credential Manager state clearing and local data wipe; verify both sign-out scenarios pass, and on the phone that IndexedDB is empty after sign out (checked with Chrome remote debugging)

## 5. Drive storage and sync

- [x] 5.1 Write acceptance tests for every scenario in `specs/drive-storage/spec.md` against `InMemoryRemoteStore` (with injectable failures and a second simulated install); verify they fail for the right reason
- [x] 5.2 Implement the pure merge function (union by id, latest `updatedAt`, tombstones, 90-day purge) with unit tests; verify all three merge scenarios pass
- [ ] 5.3 Implement `DriveRemoteStore`: find-or-create the "The Binder" root folder via `appProperties`, read/write `collection.json`, upload/delete photos with readable names (design D4); verify against a real test Google account with a scripted integration test, that "Browse photos in Google Drive" holds, and that a debug build creates and uses only "The Binder (dev)" and never finds the release root folder
- [x] 5.4 Implement the sync engine: outbox, debounced push, pull on start/resume/interval, post-write version check, backoff, foreground only (design D6); verify "Change while online", "Changes made offline", "Sync status is visible" and "Drive rate limit or outage" pass
- [x] 5.5 Handle a deleted data file with the restore-or-start-empty prompt; verify "Data file deleted in Drive" passes
- [ ] 5.6 Verify the photo size budget scenario passes on a card with front and back photos, and on the phone that uninstalling, reinstalling and signing in restores the collection ("Reinstall or second Android device")

## 6. Card identification

- [x] 6.1 Write acceptance tests for every scenario in `specs/card-identification/spec.md` (app side against `FakeRecognizer` and a mock `/identify`, proxy side in Miniflare); verify they fail for the right reason
- [ ] 6.2 Capture ML Kit text output from at least 20 real card-back photos on the phone as JSON fixtures, then implement the OCR text parser (year, card number, serial/print run, known set names); verify parser unit tests pass against the fixtures and "Scan a base card" passes
- [ ] 6.3 Integrate ML Kit text recognition with the bundled model through a Capacitor plugin as `MlKitRecognizer` (design D8); verify "Works offline" and "Nothing recognized" pass against the fake, and on the phone that recognition runs in airplane mode on a fresh install
- [x] 6.4 Build the suggestion review UI (suggestion and low-confidence flags, `source` recorded on save); verify "Low-confidence field" and "User overrides a suggestion" pass
- [x] 6.5 Implement the Cloudflare Worker `/identify` (Google ID token verification of signature, issuer, `aud` = web client ID and expiry, owner email check, no Origin gate, size limit, KV daily counter, Anthropic call with forced JSON tool output) per design D9; verify all proxy scenarios pass in Miniflare, including that a request with the app's Origin header but another account's token is rejected without calling Claude
- [x] 6.6 Wire `ClaudeRecognizer` to the Worker with the offline guard and silent ID token refresh; verify "Identify a parallel", "Never automatic" and "Offline" pass
- [ ] 6.7 Deploy the Worker with secrets and KV, set the Anthropic Console spend limit, and document both in `docs/setup.md`; verify a real identification from the phone, and that "Inspect the APK" holds: unzip the release APK and search it for the key prefix (`sk-ant-`), finding nothing

## 7. App distribution

- [x] 7.1 Write acceptance tests for every scenario in `specs/app-distribution/spec.md`: Playwright tests for the settings version and the four update-check scenarios against `FakeAppInfo` and `FakeReleaseFeed`; a unit test for tag-to-version-code derivation; and a written on-device checklist for the install, update and signing scenarios; verify the automated tests fail for the right reason
- [x] 7.2 Derive `versionName` and `versionCode` from the git tag in Gradle (`major*10000 + minor*100 + patch`, design D2); verify the unit test and "Version code increases" pass
- [ ] 7.3 Show the version name and version code in settings via `CapacitorAppInfo`; verify "Version in settings" passes, and on the phone the values match the installed release
- [ ] 7.4 Create the release signing workflow in GitHub Actions: on a `v*` tag run tests and build, decode the keystore from Actions secrets into the runner temp directory, run `assembleRelease`, run `apksigner verify`, and attach the APK to the GitHub Release; verify a test tag produces a Release with an APK whose `apksigner verify --print-certs` digest matches the release key and not the debug key ("Release APK is signed with the release key"), and that `git ls-files` lists no `.jks` or `.keystore` file
- [ ] 7.5 Implement the update check with `GitHubReleaseFeed` (latest release, semver compare, check on start when online and from "Check for updates", silent automatic failure, opens the APK link in the system browser); verify the four update-check scenarios pass, and on the phone a check against the real GitHub Releases reports a newer release when one exists
- [ ] 7.6 On the phone, run the on-device checklist: install the first release from a downloaded APK through Android's sideload flow and over ADB, add cards and leave one change unsynced offline, install the next release over it, then try to install a release-package APK signed with a throwaway test key over it (the debug build has its own package, so it can't test this); verify "Install over ADB", "Install from a downloaded APK", "Update with the same signing key" and "APK signed with a different key" all hold

## 8. End-to-end check and retirement

- [ ] 8.1 On the phone with the latest release: sign in, scan and identify three cards (one each manual, ML Kit and Claude), go offline, add a card, come back online; verify a reinstall or second Android device shows all four cards and the photos are in the "The Binder" Drive folder
- [ ] 8.2 Confirm the Google Cloud project has no billing account, Cloudflare shows only free-plan usage, and GitHub Actions usage is within the free allowance
- [ ] 8.3 Retire the-binder: shut down the old app's hosting and delete its resources, exporting nothing; verify the old URL no longer serves the app and no old resources remain in the hosting accounts

## Workflow follow-up

- Run `/opsx:archive` after review to promote the six specs into `openspec/specs/`.
- Next change to propose: card pricing, once a free sold-price data source is chosen.
