## 1. Spec

- [x] 1.1 `openspec validate photo-swipe --strict` passes. Verify: exit 0.

## 2. Tests first

- [x] 2.1 `src/app/card-detail.test.tsx`: a card with front and back photos; open the front view, drive pointer events on `zoom-front` (down, move, up, 80 px left) and expect `zoom-back`, the dialog named "Back photo view" and "Back" pressed; swipe right returns to the front ("Swipe to the other side"). A front-only card: the same swipe keeps `zoom-front` and the title, and no "Front"/"Back" buttons exist ("One photo only: no swipe"). Zoom in with a double tap (`data-scale` > 1), then a one-finger drag left keeps `zoom-front` and the title ("Zoomed photo pans instead of swiping"). From a zoomed front, pressing "Back" shows `zoom-back` with `data-scale="1"` ("Control switches side"). If jsdom drops `clientX` on pointer events, add a small `PointerEvent` shim in this file (see design, Risks). Verify: the new tests fail on today's code.

## 3. Implement

- [x] 3.1 `src/app/ZoomableImage.tsx`: optional `onSwipe(direction)` prop; record the single pointer's start point in `onPointerDown`; in `onPointerUp`, for a single pointer with no pinch, at `scale === 1`, horizontal travel at least 50 px and larger than vertical travel, call `onSwipe("left" | "right")`. Panning at `scale > 1` unchanged. Verify: the swipe and zoomed-pan tests pass.
- [x] 3.2 `src/app/PhotoView.tsx`: accept and pass `onSwipe` through to `ZoomableImage`. Verify: typecheck.
- [x] 3.3 `src/app/CardDetail.tsx`: render `PhotoView` with `key={viewing}` (zoom resets on switch); when both photos exist, pass `onSwipe` (left on front shows back, right on back shows front) and render the "Front" / "Back" buttons with `aria-pressed` above the photo, calling `setViewing`. Verify: all four scenario tests pass.
- [x] 3.4 `src/app/app.css`: style the Front/Back control with existing tokens, each button at least 48 dp tall; the photo keeps its `.zoom` height inside the sheet. Verify: `e2e/design.spec.ts` photo-view test still passes; the control and photo fit a 360 by 800 viewport without scrolling.
- [x] 3.5 `docs/device-checklist.md`: add a line under "Camera and photos" for the swipe and the control, tagged `[photo-swipe, T-61]`. Verify: line present.
- [x] 3.6 Repo check. Verify: `npm run build && npx vitest run --exclude "**/startup*"` exits 0.

## 4. On the phone

- [ ] 4.1 Owner: on the phone, open a card with both photos, swipe left and right in the full-size view, zoom in and drag, and use the Front/Back control; the swipe feels right (threshold, no accidental switch while panning) and the checklist line from 3.5 passes. Verify: ticked after the phone check.
