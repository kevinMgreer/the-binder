## Context

See proposal.md for why. Today each photo tile is its own `PhotoSlot` (`src/app/PhotoSlot.tsx`): tapping it opens a chooser sheet, and its `take(how)` closes the sheet, sets busy (the form holds Save through `onBusy`), calls `acquirePhoto(photoSource, side, how)` and hands the result to `onChange`, or shows "Camera permission denied. Pick from photos instead." / "Could not load that photo." on error. A `null` result (scanner closed) changes nothing. `CardForm` (`src/app/CardForm.tsx`) renders the two slots, keeps `photos` and `preparing` state, and runs on-device recognition in an effect for each newly attached photo. The two slots do not know about each other.

The scanner is the ML Kit document scanner (`BinderScannerPlugin.java`, base mode, page limit 1, no gallery import) behind `ScannerPhotoSource`, which falls back to the system camera when ML Kit cannot run. The scanner's own screens handle retake and accept; when it closes, `capture()` resolves with the image or `null`. Android back inside the scanner closes it (resolves `null`).

**Order with photo-detail-polish.** The card-photos delta here is written against the text that `openspec/changes/photo-detail-polish/specs/card-photos/spec.md` leaves for "Capture front and back" (tiles and choosers), not today's `openspec/specs/card-photos/spec.md`. photo-detail-polish is being archived in a parallel PR; this change SHALL be archived after it. The card-scanner delta is written against today's main spec, which photo-detail-polish does not touch.

## Goals / Non-Goals

**Goals:** one fewer tap-pair per card on the common "scan both sides" path, with every existing behaviour of the form unchanged.

**Non-Goals:** changing the scanner's options, the photo pipeline, recognition, or any in-app text (D6 adds only a native hint over the scanner). See proposal.md "Out of scope".

## Decisions

### D1. Where "next" is: the scanner's own accept

The owner's "once I hit next" is read as the scanner's accept button (ML Kit's Done after the capture preview; the system camera's confirm in the fallback). The app never sees a separate "Next": `capture()` returns when the scanner closes. So the chain starts when the front scan result comes back and is attached.

- Alternative: add an in-app "Next" button after the front scan. Rejected: an extra tap, the thing the owner wants gone.
- Alternative: ML Kit multi-page (page limit 2) to take both sides in one session. Rejected: changes the native plugin and the photo pipeline (two images from one call), loses the per-side fallback and makes "skip the back" a different gesture. Out of scope.

$0: no new service or dependency.

### D2. The chain lives in the form, triggered by the front slot

- `PhotoSlot` gets an optional `onScanned?: () => void`, called after `take("camera")` attaches a photo on a side that was empty when the action was chosen (the chooser read "Scan", not "Retake"). Not called for "pick", for a `null` result or on error.
- `PhotoSlot` exposes `scan()` through a ref (React 19 `ref` prop with `useImperativeHandle`): it runs the same `take("camera")` path the "Scan back" button runs, without opening the chooser. Busy state, "Processing photo…", `onBusy`, errors and focus return all come for free.
- `CardForm` holds a ref to the back slot and passes the front slot `onScanned={() => { if (!hasPhoto("back")) backSlot.current?.scan(); }}`. `hasPhoto` already means "stored and not removed, or captured", so the edit form of a card with a back does not chain, and a back removed on this form counts as empty (the Back tile is empty).
- The back slot gets no `onScanned`, so a back scan never chains to the front.

`scan()` itself decides whether to start: it does nothing when the back slot is `busy` or `filled`, read from the committed state of the latest render (the handle is rebuilt each render). The form does no check of its own: its `photos` state may be stale when `onScanned` fires. The front scan does not freeze the back tile: the scanner closes first, then the front photo is prepared ("Processing photo…"), and in that window the user can start a back take from the Back tile or fill it from photos. Without the guard a second concurrent take would be rejected by the plugin ("A scan is already open") and a picked back could be replaced.

- Alternative: lift `take` and both slots' busy/error state into `CardForm`. Rejected: moves working code for one call.
- Alternative: a `scanRequest` counter prop and an effect in the back slot. Rejected: an effect to replay a one-off event; the ref call is direct.
- Alternative: chain inside `ScannerPhotoSource` (capture front, then capture back). Rejected: the adapter does not know the form's state (is there a back?) and the pipeline, OCR and error messages are per slot.

$0: client code only.

### D3. No setting, no prompt, no chain after Pick

- A setting to turn the chain off: rejected as extra; closing the back scanner (one tap or Android back) skips the back.
- A "Scan back now?" prompt: rejected, an extra tap.
- Chaining after "Pick front from photos": rejected; picking means the photos already exist, and the back scanner opening over the gallery flow would surprise. The owner asked about scanning.
- Chaining after "Retake front": rejected; a retake fixes one side.

$0: nothing added.

### D4. Recognition, preparing, Cancel and Android back unchanged

The front photo attaches (and its recognition effect runs) before `onScanned` fires; the back attaches later and only the back is new to the recognition effect, so each photo is recognized once. While either slot is busy Save stays disabled (existing `preparing`). Cancel and its Discard confirmation, and Android back on the form, act on whatever is attached when the scanner closes. Android back inside the back scanner is the scanner's close (null result): the form keeps the front and shows nothing. No sheet is open during the chained scan (the front chooser closed when "Scan front" was chosen), so the app's back stack is untouched.

### D5. Test seams

- Vitest keeps the existing pattern of mocking `acquirePhoto` (`src/app/photo-slot.test.tsx`, `src/app/card-form-actions.test.tsx`); a second call with `"back", "camera"` is the chain. Existing tests that scan the front and expect one photo get `mockResolvedValueOnce(photo).mockResolvedValue(null)` (back closed).
- e2e: `FakePhotoSource` in `src/adapters/fakes.ts` gets `nextBack?: Blob | null` (used by `capture("back")` when set, else `next`) so a test can accept the front and close or fill the back. No change to `pick()`.

### D6. A hint names the side over the scanner

After trying the chain on the phone the owner found it "not immediately clear that you're now scanning the back". The ML Kit scanner's screens cannot be customised, so the plugin shows a short Android `Toast` (`LENGTH_LONG`) naming the side: "Scan the front of the card" / "Scan the back of the card". A Toast is a system overlay that outlives the activity launch, so it shows over the scanner.

- `DocumentScanner.scan(hint)` and the plugin's `scan({ hint })` carry an optional string; `ScannerPhotoSource.capture(side)` builds it from the side, so every camera scan from a tile (Scan, Retake, the chained back scan) has one. `pick()` never reaches the scanner, so a pick has none. The system-camera fallback ignores it.
- Alternative: an interstitial "Now scan the back" screen for about a second before the scanner opens. Rejected: an added delay on every card, the thing the chain removes.
- Alternative: a persistent in-app banner. Rejected: the native scanner covers the whole screen, so the banner is invisible behind it.

$0: no new dependency.

## Risks / Trade-offs

- [The Toast fades after about 3.5 s, and some Android versions limit Toasts shown while another app or activity is in front] → the scanner is the app's own task, so it shows; the phone check covers it.

- [The owner sometimes adds a card with only a front] → one extra close (or Android back) per such card. Accepted; revisit with a setting only if the owner asks.
- [Fallback system camera shows no side hint] → it opens right after the front, as "Scan back" would; the owner sees the Back tile fill. Phone check covers it.
- [Existing tests assume one capture per front scan] → task 1.3 audits and updates them in the same branch.
- [Focus] → after the back scan finishes, focus returns to the Back tile (the existing focus-restore in `take`); acceptable, and covered by the existing focus test pattern.

## Open Questions

- Owner to confirm on the phone run that "next" is the scanner's Done (assumed in D1). There is no Next button on the form today, so no other reading fits the current flow.
- A back removed on the edit form leaves the Back tile empty, so scanning the front then chains (assumed fine: the tile is empty).
