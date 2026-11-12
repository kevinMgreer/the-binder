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

- [ ] **Add card** opens the card form. **Scan front** opens the rear camera, takes the front, lets you add the back as a second page in the same scanner, and returns to the same form with the typed fields kept.
- [ ] [scan-back-chain, T-47] **Add card**, **Scan front**: scan the front, add a second page for the back, accept: the form is not shown between the two pages, and both tiles fill. Again, accept after the front only: the form shows the front only, no message. Again, take the front and press Android back (or close) in the scanner: neither tile fills. **Retake front**, **Scan back**, and **Scan front** while editing a card that has a back take one page only.
- [ ] Deny the camera permission: the app offers **Pick front from photos** (or back) instead and it works.
- [ ] **Pick front from photos** uses the chosen image.
- [ ] A 12 MP photo is stored at 500 KB or less and the serial number stamp is still readable when zoomed in.
- [ ] Pinch-zoom and pan on the full photo are smooth.
- [ ] The photos folder in Google Drive shows files named with year, manufacturer, card number, player and front/back.
- [ ] [scan-back-chain, T-47] **Scan front** on an empty form shows a short message over the scanner: "Scan the front of the card, then the back". Every other **Scan** and **Retake** shows "Scan the front of the card" or "Scan the back of the card" for its side. **Pick from photos** shows none.
- [ ] Front and Back tiles sit side by side on the add form; tapping an empty tile opens the chooser; **Scan front** opens the scanner and the photo lands in the Front tile; back closes the chooser without leaving the form. [photo-detail-polish, T-41]
- [ ] On a filled tile, **Retake front**, **Pick front from photos** and **Remove front photo** work; after Remove and Save on a synced card, the photo is gone from the card and from the Drive photos folder after the next sync. [photo-detail-polish, T-41]
- [ ] Remove a photo on a card added offline (not yet uploaded), save, go online: no photo for that side appears in Drive. [photo-detail-polish, T-41]
- [ ] List thumbnails look sharp at the new size; detail photos look sharp once the full photo has been opened once. [photo-detail-polish, T-41]

## Screens

- [ ] Card detail: Delete (outlined, left) and Edit (filled, right) are equal buttons; Delete opens a centred dialog, Android back closes it, Keep keeps the card, Delete removes it. [photo-detail-polish, T-41]
- [ ] Card detail header reads cleanly: title, one quiet line "year set · #number" with room around it, Team and Parallel as rows in the list. [photo-detail-polish, T-41]
- [ ] Add form: Save is visible without scrolling; with the keyboard open on Notes the field stays visible above the bar and the bar does not cover it; record whether the bar should hide while typing. [photo-detail-polish, T-41]

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
- [ ] Airplane-mode cold start: force-stop the app, open it offline; the dashboard and cards show and can be browsed, added and edited, without a sign-in screen (also note whether the launch waits noticeably on "checking"). Go online: the queued changes sync without signing in. [auth-resilience, T-51]
- [ ] Two Google accounts on the phone: sign in with each in turn (sign out between); the Drive folder used is the signed-in account's, never the other one's. [auth-resilience, T-51]

### Card-Back look (restyle-card-back)

Install the debug build; test in light and dark (`adb shell cmd uimode night yes|no`).

- [ ] **No flash at launch.** Open the app cold in dark: no white or cream flash before the navy ground; in light the ground is cream. If a flash shows, the splash or window background needs a `values-night` colour (`#101a30`). Switching the phone setting with the app open restyles it live. [restyle-card-back 5.1 and 2.3, T-29]
- [ ] **Spacing, fonts and labels.** On dashboard, list, detail, form, Settings and the filter sheet, in both themes: spacing feels open and nothing is cramped, titles and numbers are Roboto Slab and the rest Inter (also in airplane mode), and the 12 px uppercase Inter labels read at arm's length. [restyle-card-back 5.2, T-29]
- [ ] **Real photos in frames.** A real landscape and a real portrait photo show whole (never cropped) in their frames on Recently added, in the list, on the detail strip and in the form, and long lists scroll smoothly. [restyle-card-back 5.2, T-29]
- [ ] **Bottom bar and Add.** The bottom bar (Dashboard, Add, Cards) sits above the gesture bar, the Add item is reachable and recognisable, tapping it opens the card form and back returns to the same screen, scrolled content ends above the bar, and nothing sits under the system bars. [restyle-card-back 5.2, T-29]
- [ ] **Sort name and sort order.** With the same build on every device, set a Sort name on one card, sync, and check the Cards list order on the phone; restart the app and check it opens with the Showing line reading "Showing N · Last name ↑"; try Year, Team and Set and the Descending toggle. [add-list-sort 3.3]
- [ ] **TalkBack.** The sync error is read once (the title-row status), and a tile reads "Autos, 12". [restyle-card-back 5.2, T-29]
- [ ] **Owner review.** The owner looks at the whole look on the phone, including the ink-filled primary action, Night Game without Oswald and the nav icons kept, and accepts or lists changes for one batch. [restyle-card-back 5.3, T-29]
- [ ] **Form actions.** On the add and edit forms Cancel is left and Save right; Cancel or back on a form with a typed field or a photo asks "Discard this card?" / "Discard changes?", Keep editing keeps everything, back again keeps editing, Discard leaves nothing saved; an untouched form closes at once. Owner says whether outlined Cancel is right. [form-sort-polish 5.2, T-40]
- [ ] **System navigation bar.** With Android 3-button navigation, on the add form, card detail and Settings, scrolled content never shows behind the back, home and recents buttons (a solid bar in the page colour, light and dark) and the last control scrolls clear above them; the bottom bar screens look unchanged and the Add frame is a solid ink frame clearly larger than the Dashboard and Cards icons. [form-sort-polish 6.3, T-40]
- [ ] **Cards grid.** In light and dark: one List/Grid button at the right end of the Showing row (it shows the other view's icon; TalkBack reads "Grid view" or "List view"), Grid shows 3 columns of whole (uncropped) real portrait and landscape photos with readable two-line captions, a long grid scrolls smoothly, TalkBack reads a tile as player, year and set, number; back from a card returns to it; after a restart Grid is still chosen and the order text reads "Last name ↑". [cards-grid-view 3.2, T-45]
- [ ] **Filter and sort.** At 360 dp in light and dark: the search row has one "Filter & sort" button with its badge, nothing cut or wrapped; the Showing line reads "SHOWING N · LAST NAME ↑" with the List/Grid button at the right and three list rows (two grid rows) below; the sheet opens with Sort by and Direction first, a choice reorders the list behind it, Clear all keeps the order and the search; TalkBack reads the button as "Filter and sort" and the order as "sorted by Last name, ascending". Owner says whether the sheet feels too long. [filter-sort-merge 3.4, T-49]
- [ ] **Form prompts over the bar.** In light and dark, on the add form: type a player and tap Cancel twice fast: the bar shows only Discard outlined red on the left and Keep editing filled on the right (no question text), and the double tap does not discard. A later tap on Discard leaves; Keep editing and back return to the form with everything kept. Save a card already in the collection: "Duplicate card" shows centred over a dimmed screen, Increase quantity is the filled button, and back returns to the form (it no longer leaves it). On a card's detail, tap Delete: the dialog shows Delete outlined red on the left and Keep filled on the right. With TalkBack on, tapping Cancel on the form reads "Discard this card?" when focus lands on Keep editing. [form-dialogs-modal 2.6, T-50]
