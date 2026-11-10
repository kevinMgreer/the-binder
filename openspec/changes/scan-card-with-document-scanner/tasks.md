## 1. Scanner photo source (TypeScript)

- [ ] 1.1 Write the failing Vitest tests first for `ScannerPhotoSource`: a scan returns its image as a blob; cancel returns `null` and never calls the fallback; an `UNAVAILABLE` rejection calls the system-camera `capture` and returns its result; any other error is rethrown; `pick` goes straight to the existing source; verify they fail before the code exists
- [ ] 1.2 Implement `src/adapters/document-scanner-photo-source.ts` (design D3) and its Capacitor binding `src/adapters/capacitor-scanner.ts`; verify the tests from 1.1 pass and `tsc -b` is clean
- [ ] 1.3 Use `ScannerPhotoSource` in `src/main.tsx` on the native platform only, keeping the fake source on the web; verify `npm test` and the Playwright e2e suite still pass unchanged

## 2. Android plugin

- [ ] 2.1 Add the `play-services-mlkit-document-scanner` dependency and `BinderScannerPlugin.java` with `scan()` per design D1 and D2 (page limit 1, JPEG, gallery import off, `UNAVAILABLE` on missing Play services), and register it in `MainActivity.java`; verify `gradlew assembleDebug` succeeds and the app still launches on the phone
- [ ] 2.2 Check the release build is unaffected: verify `gradlew assembleRelease` succeeds and the APK still contains no `sk-ant-` string

## 3. On the phone

- [ ] 3.1 Tap "Scan card" and verify the scanner opens on the rear camera and a card on a table is saved straightened and cropped to the card ("Scanner opens on the rear camera", "Photo cropped to the card")
- [ ] 3.2 Scan the front, skip the back, retake the front once, and cancel the scanner once; verify one front photo is saved, no back photo, and cancelling adds nothing ("Front then back", "Retake", "User cancels the scanner")
- [ ] 3.3 Scan a serial-numbered card and verify the stored full photo is at most 500 KB and the serial stamp is readable when zoomed ("Scanned photo stays within the size budget")
- [ ] 3.4 Verify the fallback: with the phone offline on a fresh install, or any other way to make the scanner unavailable, "Scan card" opens the system camera with no error; if the scanner cannot be made unavailable on this phone, record that and rely on the 1.1 test ("Scanner unavailable")

## 4. Specs

- [ ] 4.1 Reword the foundation's `card-photos` scenario "Camera capture on Android" to refer to the scanner and close the rear-lens note on its task 3.2 (design D5); verify `openspec validate add-collection-foundation --strict` passes
- [ ] 4.2 Run `openspec validate scan-card-with-document-scanner --strict`, then, once 3.1 to 3.4 are ticked and merged, archive the change with `/opsx:archive`; verify `card-scanner` appears under `openspec/specs/`
