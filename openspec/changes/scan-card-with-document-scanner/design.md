## Context

`CapacitorCameraPhotoSource` implements the `PhotoSource` port (`capture(side)`, `pick()`) over `@capacitor/camera`, which starts Android's own camera app through an intent. The app does not pick the lens and gets the full frame. `ScanFlow` already handles front, back, skip back, cancel (a `null` blob) and errors, and `acquirePhoto` feeds the blob to the compression pipeline. A local Capacitor plugin already exists as a pattern: `BinderAuthPlugin.java`, registered in `MainActivity.java`, bound in `src/adapters/capacitor-native-auth.ts`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Rear camera, edges found, photo cropped to the card, with the smallest new surface.
- Keep the `PhotoSource` port, `ScanFlow` and the pipeline unchanged.
- A failure of the scanner never leaves the user without a way to capture.

**Non-Goals:**
- Building our own camera preview or edge detector.
- Replacing "Pick from photos".
- Changing OCR or Claude identification.

## Decisions

**D1. Use Google ML Kit Document Scanner (`play-services-mlkit-document-scanner`).** It is a ready-made screen: rear camera, live edge detection, perspective correction, crop with manual adjust, retake, on device. It is configured with a page limit of 1, JPEG output and gallery import off (the app has its own "Pick from photos"). It brings no camera permission flow of our own: the scanner activity handles it. The scanner module is delivered by Google Play services.
- Alternatives: CameraX plus OpenCV (full control and no Play services, but a native library of many MB, custom UI, and tuning edge detection on shiny cards and busy backgrounds); CameraX plus our own edge detection (the same UI work and worse detection); keep the system camera and crop by hand in the app (still the wrong lens, and manual cropping on every card); a community Capacitor document-scanner plugin (not checked as maintained, and a dependency we do not control; a local plugin is about 80 lines).
- Keeps $0: the API is free, runs on the device and needs no account or key.

**D2. A small local Capacitor plugin, `BinderScanner`, with one method `scan()`.** It reports availability through the call itself: it rejects with the code `UNAVAILABLE` when Google Play services is missing or the scanner cannot start, resolves `{ uri: null }` when the user cancels, and resolves `{ uri }` for a scan. It follows `BinderAuthPlugin`: one activity-result launcher registered in `load()`, one pending call.
- Alternative: reuse `@capacitor/camera` for everything (cannot choose the lens).
- Keeps $0: no new dependency beyond the Gradle artifact in D1.

**D3. The port stays; a new `ScannerPhotoSource` composes the scanner with the existing source.** `capture` asks the scanner and turns `{ uri }` into a `Blob` (`fetch` of the converted file URL, as the camera adapter does today); `null` on cancel; on `UNAVAILABLE` it calls `CapacitorCameraPhotoSource.capture`. `pick` goes straight to the existing source. Any other scanner error is rethrown so `ScanFlow` shows its error screen.
- Alternative: put the fallback in `ScanFlow` (UI code would then know about two capture mechanisms).
- Keeps $0: no new service.

**D4. The photo pipeline is untouched.** The scanner output is compressed to WebP like any photo, so the 500 KB budget in the foundation specs still decides what is stored.

**D5. The foundation spec is corrected where it promised a lens it could not deliver.** `add-collection-foundation/specs/card-photos` "Camera capture on Android" is reworded to refer to the scanner, because main specs are empty until the foundation is archived and there is no delta to write.

**Assumptions** (not asked of the user): the owner's phone keeps Google Play services; a first scan on a fresh install may need to fetch the scanner module, which is why the offline fallback is specified; the scanner's crop is good enough for card edges (checked on the phone, task 3.1).

## Risks / Trade-offs

- [The cropped image is lower resolution than the sensor, so a small serial stamp is unreadable after compression] → measure on the phone with a real serial-numbered card (task 3.3); if it fails, switch the scanner to full mode or reconsider D1 before merging.
- [First use offline cannot fetch the scanner module] → the unavailable fallback opens the system camera; verified by a unit test and, if reproducible, on the phone.
- [Dependence on Google Play services for scanning] → acceptable for one Samsung phone; the fallback covers the rest. Text recognition (D8 of the foundation) already depends on the same services.
- [Edge detection fails on a card against a similar-coloured background] → the scanner lets the user adjust the crop corners or retake; no code of ours.
- [The scanner's own screens are not themed] → accepted; the visual redesign is a separate change.
- [The lens choice is the scanner's, not ours] → it opens on the rear camera by design; verified on the phone.

## Open Questions

- Whether a future in-app preview with a card-shaped overlay is wanted on top of this. It does not change the specs or tasks here.
