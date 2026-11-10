## Why

The first run on a real phone (Samsung, Android 16, gesture navigation) showed four defects the foundation specs never described: the app draws under the status and navigation bars so the title and the form's Save and Cancel buttons are covered, the hardware back button does nothing useful, the card form does not say which fields are required, and one camera scenario cannot happen on Android.

## What Changes

- The app lays out inside the system bar insets, so no text or button is covered by the status bar or the navigation bar, including at the end of a scrolled form.
- The hardware back button goes up one screen (form to detail or list, detail to list, scan and settings to list) and leaves the app only from the collection list.
- The card form marks the required fields before the user saves and says why a save is blocked.
- Correct the foundation's `card-photos` scenario "Camera permission denied": Capture uses Android's own camera app through an intent, so the app never asks for or loses the camera permission. The scenario is reworded to what can happen (the user backs out of the camera).
- Out of scope: opening the rear camera by default (the system camera app picks the lens; needs an in-app camera, its own change), card edge detection and cropping, the visual redesign, and any change to which fields the schema requires.

## Capabilities

### New Capabilities
- `app-shell`: how the app sits inside Android's system bars and answers the hardware back button.
- `card-form-guidance`: how the card form tells the user which fields are required and why a save was refused.

### Modified Capabilities
<!-- None: the foundation's specs are not archived yet, so there is no main spec to delta. The camera scenario is edited in add-collection-foundation/specs/card-photos/spec.md as a task. -->

## Impact

- `src/app/app.css` (insets), `src/app/App.tsx` (back button, `@capacitor/app` already installed), `src/app/CardForm.tsx` and `src/app/Field.tsx` (required marking and blocked-save message).
- `openspec/changes/add-collection-foundation/specs/card-photos/spec.md` (one scenario reworded) and its task 3.2.
- No new dependency, no Android native change, no cost.
