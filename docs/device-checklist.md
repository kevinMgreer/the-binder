# On-device checklist

Everything here needs a real Android phone, because Android itself does the work (installer, camera, sign-in, ML Kit). Automated tests cover the rest. Tick each box when it holds; note the build version you tested.

Use two apps on the phone: **The Binder** (release build) and **The Binder (dev)** (debug build, package suffix `.debug`, its own Drive folder). They install side by side.

## Install and signing (app-distribution)

- [ ] **Install over ADB.** `adb install the-binder-<version>.apk` succeeds and the app opens to the sign-in screen.
- [ ] **Install from a downloaded APK.** Download the APK from the GitHub Release in the phone's browser, open it, allow installs from that source when Android asks. It installs and opens with no Play Store involvement.
- [ ] **Release APK is signed with the release key.** `apksigner verify --print-certs the-binder-<version>.apk` shows the release key's SHA-256, not the debug key's.
- [ ] **Update with the same signing key.** With release N installed, signed in, some cards added, and one card changed while offline (unsynced indicator showing): install release N+1 over it. The app updates without uninstalling, the cards and the pending change are still there, and there is no sign-in prompt.
- [ ] **APK signed with a different key.** Build the release-package APK signed with a throwaway key and try to install it over the installed release. Android refuses ("App not installed" / signatures do not match) and the installed app and its data are unchanged. (The debug build has its own package, so it cannot be used for this test.)
- [ ] **Version in settings.** Settings shows the version name and version code, and both match the GitHub Release the APK came from.
- [ ] **Update check.** With an older release installed and a newer one published, "Check for updates" shows the new version and a link that opens the APK download in the phone's browser. With the latest installed it says it is up to date. In airplane mode it says it could not check, and the app keeps working.

## Sign-in and Drive (google-sign-in, drive-storage)

- [ ] Sign in works on **both** the release and the debug build, and the Google consent screen lists only access to the app's own files, not "See, edit, create and delete all of your Google Drive files".
- [ ] After the app sits idle for over an hour, a change still reaches Drive (silent renewal, no prompt).
- [ ] Revoke the app's access in the Google account settings, then change a card: sync pauses, local changes stay, and "Sign in again" restores it.
- [ ] Sign out, then check with Chrome remote debugging (`chrome://inspect`) that IndexedDB for the app is empty.
- [ ] The debug build creates and uses only **The Binder (dev)** in Drive and never finds the release app's **The Binder** folder.
- [ ] Uninstall the release app, install it again, sign in: the collection and thumbnails come back, and Drive still has only one **The Binder** folder.

## Camera and photos (card-photos)

- [ ] **Scan card** opens the rear camera, takes the front, prompts for the back with a skip option.
- [ ] Deny the camera permission: the app offers **Pick from photos** instead and it works.
- [ ] **Pick from photos** uses the chosen image.
- [ ] A 12 MP photo is stored at 500 KB or less and the serial number stamp is still readable when zoomed in.
- [ ] Pinch-zoom and pan on the full photo are smooth.
- [ ] The photos folder in Google Drive shows files named with year, manufacturer, card number, player and front/back.

## Identification (card-identification)

- [ ] On-device recognition runs in airplane mode on a freshly installed app (no model download) and pre-fills year, card number and set from a real card back.
- [ ] **Identify with Claude** returns suggestions for a real serial-numbered card. After the Worker is deployed: unzip the release APK and search it for `sk-ant-`; nothing is found.

## Performance

- [ ] A seeded 5,000-card collection shows its first screen in about a second on the phone and scrolls smoothly.
