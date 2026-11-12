## Why

Adding a card almost always means scanning both sides. Before this change, after the front scan the owner landed back on the form and had to tap the Back tile and then "Scan back". The owner asked: "when I am scanning the front to add a card, if there is no back scanned yet, I'd like to go right into scanning the back once I hit next."

A first version opened a second scanner as soon as the front scan came back. On the phone the owner found it odd: "it shouldn't flash back to the form before opening the camera. If you want to scan, show the camera and let the user see they're scanning the front, hit next, and go straight into the camera, showing the user they're scanning the back." So the front and the back are now taken in one scanner session, with no return to the form in between.

## What Changes

- "Scan front" from an empty Front tile, while the Back tile is empty (no stored and no captured back photo), opens the scanner for two pages: page 1 is the front, page 2 the back. The scanner stays open between the two; the form is not shown until the scanner closes.
- When the scanner closes with two pages, the first goes to the Front tile and the second to the Back tile, each processed (compressed, thumbnail) like any scan. When the user finishes after one page, only the front is attached, with no message.
- Closing the scanner without accepting (its close button or Android back) attaches nothing, even if a page was already taken. A failed or denied scan attaches nothing and shows the Front tile's usual message.
- Every other scan stays one page: "Retake front", "Scan back" or "Retake back" from the Back tile, and "Scan front" when the Back tile already has a photo (including the edit form of a card that has a back). "Pick from photos" is unchanged.
- A short Android Toast over the scanner names what to scan: "Scan the front of the card, then the back" for the two-page scan, "Scan the front of the card" / "Scan the back of the card" for a one-page scan. Pick from photos shows none.
- Where the scanner cannot run (no Google Play services), the system camera opens for the front and, if the front was taken, opens again for the back; it shows no message.
- On-device recognition, the "Processing photo…" state, Save held while preparing, Cancel with its Discard confirmation and Android back on the form behave as the existing specs say.
- The first version's form-level chain (the front tile asking the back tile to start its own scan) is removed.

## Out of scope

- A setting to turn the two-page scan off.
- A "Scan back now?" prompt after the front.
- A two-page scan after "Pick front from photos", or front after a back scan.
- Labels inside the scanner's own screens: Google's scanner cannot be customised; the Toast is the only cue.
- Any change to the photo pipeline, OCR or Claude identification.
- Any in-app UI text or layout change (the hint is a native Toast).
- An interstitial screen before the scanner, or a persistent banner.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `card-photos`: "Capture front and back" gains the front-and-back scan and its exceptions.
- `card-scanner`: "Scan a card with the rear camera", whose "Front then back" scenario said the form returns with the back left for the user to start; the back is now the scanner's second page. New requirement "Name the side being scanned" for the hint.

## Impact

- `src/ports/index.ts`: `PhotoSource.capture(side, pages)` returns a list of photos (empty when closed).
- `src/adapters/document-scanner-photo-source.ts`, `src/adapters/capacitor-scanner.ts`, `src/adapters/capacitor-camera.ts`, `src/adapters/fakes.ts` and `android/.../BinderScannerPlugin.java`: the page limit, the list of pages, the hint and the Toast, the fallback's second launch.
- `src/photos/acquire.ts`: `acquirePhotos` processes each page.
- `src/app/PhotoSlot.tsx`: asks for two pages and hands the second to the form.
- `src/app/CardForm.tsx`: gives the front tile the back's attach while the back is empty.
- Tests: `src/adapters/document-scanner-photo-source.test.ts`, `src/app/photo-slot.test.tsx`, `src/app/card-form-actions.test.tsx`, `e2e/photos.spec.ts`, `e2e/identification.spec.ts`.
- `docs/device-checklist.md`: the Scan front lines change.
- No new dependency, no cost. A native change (page limit, page list, Toast), so the phone build needs a rebuild.
