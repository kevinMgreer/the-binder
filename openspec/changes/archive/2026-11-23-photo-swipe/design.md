## Context

`CardDetail.tsx` keeps `viewing: CardSide | null` and renders `<Sheet label="Front photo view">` with `<PhotoView card side>` for one side. `PhotoView` loads the thumb and full blobs for its side and renders `ZoomableImage`, which owns every pointer on the photo (`touch-action: none` on `.zoom`): one pointer pans when `scale > 1`, two pointers pinch, a tap pair toggles zoom. It already tracks `moved` so a drag is never counted as a tap.

## Decisions

- **Swipe detection lives in `ZoomableImage`.** It gets an optional `onSwipe(direction: "left" | "right")` prop. On pointer down with one pointer it records the start point; on pointer up of that single pointer (no pinch in between), when `scale === 1`, the horizontal travel is at least 50 px and larger than the vertical travel, it calls `onSwipe`. At `scale > 1` nothing changes: the drag pans. Alternatives: a wrapper in `PhotoView` with its own pointer handlers (rejected: two owners for the same pointers, and the wrapper cannot see the zoom scale); a gesture library (rejected: a dependency for about ten lines). $0 kept: no dependency, no service.
- **Direction maps to a fixed order, front then back.** Swipe left on the front shows the back; swipe right on the back shows the front. The opposite swipe on either side does nothing. This matches how a photo pager reads (the next item is to the right). Alternative: any horizontal swipe flips (rejected for now; see open questions).
- **The side lives where it already lives.** `CardDetail` passes `onSwipe` and the control's handler, both calling `setViewing`. The Sheet label already derives from `viewing`, so it follows for free.
- **Zoom resets by remounting.** `PhotoView` is rendered with `key={viewing}`, so `ZoomableImage` (and its transform state) mounts fresh on each switch. Alternative: a reset prop or effect in `ZoomableImage` (rejected: more code for the same result).
- **The control is two buttons with `aria-pressed`**, "Front" and "Back", above the photo inside the sheet body, shown only when `card.photos.front` and `card.photos.back` both exist. The pressed one is the side shown; pressing the other switches. Alternatives: a `radiogroup` like the sort sheet in `CollectionScreen.tsx` (rejected: its `radio` helper is local to that screen and the sort sheet's radio rows are styled for a form, not a two-way toggle); arrow buttons beside the photo (rejected: hides which side is shown). Styling reuses existing tokens in `app.css`; target size at least 48 dp.
- **One photo only**: no control, and `onSwipe` is not passed, so a swipe does nothing.

## Risks

- jsdom has no `PointerEvent`, so `fireEvent.pointerDown(el, { clientX })` may drop `clientX`. The unit tests may need a small `PointerEvent` shim (a `MouseEvent` subclass with `pointerId`) in `card-detail.test.tsx`, or the gesture test moves to `e2e/photos.spec.ts`. The implementer decides; the todo's acceptance names the vitest file.
- The 50 px threshold is a guess; the phone check confirms the feel.
- A swipe that starts as a slow horizontal drag at zoom 1 now switches sides where it did nothing before. Expected; noted for the phone check.

## Open questions

- Direction: should the opposite swipe also switch (any horizontal swipe flips, since there are only two sides)? The design picks fixed order; the owner may prefer "any direction" after trying it.
- Control placement: above the photo (chosen) or in the sheet head next to Close.
