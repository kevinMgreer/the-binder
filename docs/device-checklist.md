# On-device checklist

Everything here needs a real Android phone, because Android itself does the work (installer, camera, sign-in, ML Kit). Automated tests cover the rest. Tick each box when it holds; note the build version you tested.

Use two apps on the phone: **The Binder** (release build) and **The Binder (dev)** (debug build, package suffix `.debug`, its own Drive folder). They install side by side.

## Install and signing (app-distribution)

- [ ] **Install over ADB.** `adb install the-binder-<version>.apk` succeeds and the app opens to the sign-in screen.
- [ ] **Install from a downloaded APK.** Download the APK from the GitHub Release in the phone's browser, open it, allow installs from that source when Android asks. It installs and opens with no Play Store involvement.
- [ ] **Release APK is signed with the release key.** `apksigner verify --print-certs the-binder-<version>.apk` shows the release key's SHA-256, not the debug key's. [7.4, T-5]
- [ ] **Update with the same signing key.** With release N installed, signed in, some cards added, and one card changed while offline (unsynced indicator showing): install release N+1 over it. The app updates without uninstalling, the cards and the pending change are still there, and there is no sign-in prompt.
- [ ] **APK signed with a different key.** Build the release-package APK signed with a throwaway key and try to install it over the installed release. Android refuses ("App not installed" / signatures do not match) and the installed app and its data are unchanged. (The debug build has its own package, so it cannot be used for this test.)
- [ ] **Version in settings.** Settings shows the version name and version code, and both match the GitHub Release the APK came from. [7.3, T-26]
- [ ] **Update check.** With an older release installed and a newer one published, "Check for updates" shows the new version and a link that opens the APK download in the phone's browser. With the latest installed it says it is up to date. In airplane mode it says it could not check, and the app keeps working.

## Sign-in and Drive (google-sign-in, drive-storage)

- [ ] Sign in works on **both** the release and the debug build, and the Google consent screen lists only access to the app's own files, not "See, edit, create and delete all of your Google Drive files". [4.2, T-26]
- [ ] After the app sits idle for over an hour, a change still reaches Drive (silent renewal, no prompt).
- [ ] Revoke the app's access in the Google account settings, then change a card: sync pauses, local changes stay, and "Sign in again" restores it.
- [ ] Sign out, then check with Chrome remote debugging (`chrome://inspect`) that IndexedDB for the app is empty.
- [ ] The debug build creates and uses only **The Binder (dev)** in Drive and never finds the release app's **The Binder** folder.
- [ ] Uninstall the release app, install it again, sign in: the collection and thumbnails come back, and Drive still has only one **The Binder** folder.

## Camera and photos (card-photos)

- [ ] **Add card** opens the card form. **Scan front** opens the rear camera, takes the front and returns to the same form with the typed fields kept; the back slot offers **Scan back** and **Pick back from photos**.
- [ ] Deny the camera permission: the app offers **Pick front from photos** (or back) instead and it works.
- [ ] **Pick front from photos** uses the chosen image.
- [ ] A 12 MP photo is stored at 500 KB or less and the serial number stamp is still readable when zoomed in.
- [ ] Pinch-zoom and pan on the full photo are smooth.
- [ ] The photos folder in Google Drive shows files named with year, manufacturer, card number, player and front/back.

## Identification (card-identification)

- [ ] On-device recognition runs in airplane mode on a freshly installed app (no model download) and pre-fills year, card number and set from a real card back. [6.3, T-26]
- [ ] **Identify with Claude** returns suggestions for a real serial-numbered card. After the Worker is deployed: unzip the release APK and search it for `sk-ant-`; nothing is found. [6.7, T-6]

## Performance

- [ ] A seeded 5,000-card collection shows its first screen in about a second on the phone and scrolls smoothly. [2.5, T-26]

## By when (archived task ids and desk todos)

Old OpenSpec task ids are in brackets. Items above that already say the same are not repeated; these lines tie each moved task to a time and a desk todo.

### Before the first release

- [ ] Setup doc works on a clean Google Cloud project. [add-collection-foundation 1.5, T-5]
- [ ] Repo safeguards: secret scanning and push protection on; `git log --format='%ae' | sort -u` shows only the noreply address; no other email in the tree. [1.6, T-5]
- [ ] Worker deployed with secrets and KV, Anthropic spend limit set, both written in `docs/setup.md`. [6.7, T-6]
- [ ] Real "Identify with Claude" from the phone works. [6.7, T-6]
- [ ] Compressed 12 MP photo: ML Kit still reads the serial stamp. [3.3, T-26]
- [ ] Capture ML Kit text from 20 real card backs as JSON fixtures; the parser tests pass on them and "Scan a base card" passes. [6.2, T-26]
- [ ] Real Drive: a scripted integration test against a real test Google account (find-or-create the root folder, read/write `collection.json`, upload and delete photos). No such test exists yet (`drive-remote-store.test.ts` uses only FakeDrive); it belongs under T-26. [5.3, T-26]
- [ ] Card with front and back photos stays in budget; reinstall and sign in restores everything. [5.6, T-26]

### On the release APK

- [ ] Test tag `v*` builds a Release with an APK; `git ls-files` lists no `.jks` or `.keystore` (the signature check is under Install and signing). [7.4, T-5]
- [ ] Install over ADB, install from a downloaded APK, update with the same key, refuse a different key (items above). [7.6, T-26]
- [ ] Update check against real GitHub Releases reports a newer release. [7.5, T-26]

### Free tier and retire the old app

- [ ] Full run on the latest release: sign in, add three cards (manual, ML Kit, Claude), go offline, add a fourth, come back online; a reinstall shows all four and the photos are in "The Binder" in Drive. [8.1, T-26]
- [ ] Google Cloud project has no billing account; Cloudflare shows free-plan usage only; GitHub Actions within the free allowance. [8.2, owner]
- [ ] Old the-binder hosting shut down and resources deleted, exporting nothing; the old URL no longer serves the app. [8.3, owner]

### Per UI change on the phone

- [ ] Dashboard, light and dark: six tiles; Recently added and Top teams look clean and read well; a team tap opens Cards filtered to it; a recent card opens and back returns to the dashboard. [refine-cards-and-dashboard 4.1, T-24]
- [ ] Landscape photo shows landscape in the Cards list, portrait shows portrait, nothing cropped, long list scrolls smoothly. [refine 4.2, T-24]
- [ ] "Synced" sits beside the gear on both screens; airplane-mode error wording shows whole; TalkBack reads the sync state through one background sync and one offline retry; waiting through both is also to judge whether the announcements are too chatty to live with (design open question). [refine 4.3, T-24]
