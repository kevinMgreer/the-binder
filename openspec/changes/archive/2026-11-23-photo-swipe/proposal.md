## Why

The full-size photo view on the card detail shows one side. To see the other side the owner has to close the sheet and tap the other photo. Flipping between front and back is the most common thing done in that view (read the serial on the back, check the front again), so it should take one gesture.

## What Changes

- In the full-size photo view, a horizontal swipe switches between the front and the back when the card has both photos. The sheet's title ("Front photo view" / "Back photo view") follows the side shown.
- A visible Front / Back control in the view also switches sides, for discoverability and for users who cannot swipe. It shows only when both photos exist.
- The swipe works only when the photo is not zoomed. When zoomed in, a one-finger drag keeps panning the photo as today.
- Switching sides resets the zoom.
- The other side loads the same way the first did: full photo when stored, thumbnail plus the offline note when not.

## Capabilities

### Modified Capabilities

- `card-photos`: the "View photos" requirement gains the side switch (swipe and control) in the full-size view.

## Impact

- `src/app/CardDetail.tsx`, `src/app/PhotoView.tsx`, `src/app/ZoomableImage.tsx`, `src/app/app.css`, `src/app/card-detail.test.tsx`, `docs/device-checklist.md`.
- No data, storage, Drive or sync change. No new dependency. $0 constraint unaffected.

## Out of scope

- A slide or carousel animation between sides (the switch is immediate).
- Swiping between cards, or swiping in the collection list or the card form tiles.
- Swipe-down to close the sheet.
- Any change to pinch zoom, double-tap zoom or how photos are fetched and cached.
