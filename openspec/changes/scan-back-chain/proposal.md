## Why

Adding a card almost always means scanning both sides. Today, after the front scan the owner lands back on the form and has to tap the Back tile and then "Scan back". The owner asked: "when I am scanning the front to add a card, if there is no back scanned yet, I'd like to go right into scanning the back once I hit next."

## What Changes

- After a successful "Scan front" from the Front tile, when the Back tile is empty (no stored and no captured back photo), the form opens the back scanner at once, exactly as if the user had chosen "Scan back": no extra tap, no chooser.
- Closing the back scanner without a photo (its close button or Android back) returns to the form with the front kept and no message. A failed or denied back scan shows the usual Back tile message and keeps the front.
- No chain when the front was picked from photos, when "Retake front" was used, when the Back tile already has a photo (including the edit form of a card that has a back), when the front scan was closed or failed, or after a back scan (no loop back to the front).
- On-device recognition still runs as each photo attaches; the "Processing photo…" state, Save held while preparing, Cancel with its Discard confirmation and Android back behave as the existing specs say.
- "Next" is taken to be the scanner's own accept button (the ML Kit scanner's Done, or the system camera's confirm in the fallback): the chain starts when the front scan result comes back to the form.

## Out of scope

- A setting to turn the chain off.
- A "Scan back now?" prompt after the front.
- Chaining after "Pick front from photos", or chaining front after a back scan.
- Scanning both sides in one scanner session (ML Kit multi-page).
- Any change to the scanner itself (`BinderScannerPlugin.java`, its options or the fallback camera), the photo pipeline, OCR or Claude identification.
- Any UI text or layout change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `card-photos`: "Capture front and back" gains the scan-front-then-back chain and its exceptions.
- `card-scanner`: "Scan a card with the rear camera", whose "Front then back" scenario said the form returns with the back left for the user to start; it now opens the back scanner.

## Impact

- `src/app/PhotoSlot.tsx`: reports a successful Scan of an empty side, and can start its own scan without the chooser.
- `src/app/CardForm.tsx`: starts the back scan after the front scan when the back is empty.
- `src/adapters/fakes.ts`: `FakePhotoSource` can return a different result for the back capture (e2e).
- Tests: `src/app/photo-slot.test.tsx`, `src/app/card-form-actions.test.tsx`, `e2e/photos.spec.ts`, `e2e/identification.spec.ts` (existing front-scan cases now see a back scan).
- `docs/device-checklist.md`: the Scan front line changes and a phone check is added.
- No new dependency, no native change, no cost.
