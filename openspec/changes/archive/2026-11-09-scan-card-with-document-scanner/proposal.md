## Why

"Scan card" hands off to the phone's own camera app. On the owner's Samsung it opens the selfie lens (the app cannot choose the lens: `@capacitor/camera`'s `direction` option is iOS and web only), and the photo is the whole frame, so every card photo carries table and background. The foundation spec promised "the rear camera opens" and that scenario cannot be met this way. A card-shaped capture that finds the card's edges and crops to it fixes both at once.

## What Changes

- "Scan card" opens an in-app scanner on the rear camera that detects the card's edges, straightens it and crops the photo to the card (Google ML Kit Document Scanner, on device, no cost).
- Front then back with "skip back", and retake, work as they do today.
- Cancelling the scanner adds nothing. If the scanner cannot run (no Google Play services, or its module cannot be fetched while offline), "Scan card" falls back to the existing system camera, with no error.
- The scanned image goes through the unchanged compression pipeline.
- The foundation's `card-photos` scenario "Camera capture on Android" is reworded to point at the scanner, and its task 3.2 note about the open rear-lens scenario is closed.
- Out of scope: the visual redesign, OCR and identification changes (the ML Kit text recognition work stays as planned), iOS, importing from the gallery inside the scanner (the app's separate "Pick from photos" stays), multi-page scans, and image filters (colour, black-and-white) the scanner offers.

## Capabilities

### New Capabilities
- `card-scanner`: capturing a card photo through an in-app rear-camera scanner that crops to the card, with a fallback to the system camera.

### Modified Capabilities
<!-- None: the foundation's specs are not archived yet, so there is no main spec to delta. The card-photos scenario is reworded in add-collection-foundation as a task. -->

## Impact

- New Android plugin `BinderScannerPlugin.java` and one Gradle dependency (`com.google.android.gms:play-services-mlkit-document-scanner`), registered in `MainActivity.java`.
- New `src/adapters/document-scanner-photo-source.ts` (composes the scanner with the existing `CapacitorCameraPhotoSource`) and a Capacitor binding; `src/main.tsx` wiring. The `PhotoSource` port, `ScanFlow` and the photo pipeline are unchanged.
- `openspec/changes/add-collection-foundation/specs/card-photos/spec.md` and its task 3.2 (one scenario reworded, one note).
- Cost stays $0: on-device, no new account, no network call of ours. The scanner depends on Google Play services, which the owner's phone has.
