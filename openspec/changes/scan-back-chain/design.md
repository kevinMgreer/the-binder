## Context

See proposal.md for why. Each photo tile is its own `PhotoSlot` (`src/app/PhotoSlot.tsx`): tapping it opens a chooser sheet, and its `take(how)` closes the sheet, sets busy (the form holds Save through `onBusy`), acquires the photo and hands it to `onChange`, or shows "Camera permission denied. Pick from photos instead." / "Could not load that photo." on error. A closed scanner changes nothing. `CardForm` (`src/app/CardForm.tsx`) renders the two slots, keeps `photos` and `preparing` state, and runs on-device recognition in an effect for each newly attached photo.

The scanner is the ML Kit document scanner (`BinderScannerPlugin.java`, `play-services-mlkit-document-scanner` 16.0.0, base mode, no gallery import) behind `ScannerPhotoSource`, which falls back to the system camera when ML Kit cannot run. The scanner's own screens handle capture, retake, crop and accept; it returns to the app only when it closes. Android back inside the scanner closes it without a result.

The first version of this change (merged into this branch, not into main) chained two one-page scans from the form: the front tile reported a successful scan and the form called a `scan()` handle on the back tile. On the phone the form showed for a moment between the two scanners, which the owner rejected.

**Checked in the installed library.** `GmsDocumentScannerOptions.Builder.setPageLimit(int)` takes any value of 1 or more (it rejects less than 1), and `GmsDocumentScanningResult.getPages()` returns a `List<Page>`, each with `getImageUri()`. Google's ML Kit pages describe a viewfinder screen and a preview screen and list "reorder pages" among base mode's editing tools, but do not name the control that adds a page, so no in-app text quotes it.

**Order with photo-detail-polish.** The card-photos delta here is written against the "Capture front and back" text that photo-detail-polish left (tiles and choosers), now in main. The card-scanner delta is written against the main spec.

## Goals / Non-Goals

**Goals:** scan both sides in one scanner session, with no return to the form between them, and every existing behaviour of the form unchanged.

**Non-Goals:** the photo pipeline, recognition, any in-app text. See proposal.md "Out of scope".

## Decisions

### D1. One scanner session with a page limit of 2

"Scan front" on an empty Front tile, while the Back tile is empty, starts the ML Kit scanner with `setPageLimit(2)`. Page 1 is the front, page 2 the back. The owner's "hit next" is the scanner's own control for another page; its accept (Done) closes the scanner. When it closes with two pages, the form attaches the first to the Front tile and the second to the Back tile; with one page, only the front.

- Closing the scanner without accepting (close button or Android back) returns `RESULT_CANCELED`: nothing is attached, even a page already taken. This is how every closed scan already behaves.
- Base mode lets the user reorder or delete pages in the preview. The app trusts the order it gets back: page 1 is the front. A user who swaps them gets swapped tiles and fixes them with Retake. Accepted.
- "Back empty" is the form's `hasPhoto("back")` at the moment "Scan front" is chosen: no stored back that was kept, no captured back. A back removed on the edit form counts as empty.

Alternatives:

- **Keep the chain (two one-page scans).** Rejected: the form flashes between the scanners, the thing the owner asked to remove.
- **Our own camera screen (CameraX) with "Front" and "Back" labels.** Rejected: it loses ML Kit's edge detection, straightening and crop, which `card-scanner` requires, and is a large native build of its own.
- **An interstitial "Now the back" screen between two scans.** Rejected: it is still a return to the app between the scanners, plus an added delay on every card.

$0: no new dependency.

### D2. The port returns a list of pages

- `PhotoSource.capture(side, pages = 1): Promise<Blob[]>`: up to `pages` photos, `side` first; an empty list means closed. `DocumentScanner.scan(hint, pages)` and the plugin's `scan({ hint, pages })` → `{ uris: string[] }` follow the same shape, so ML Kit's page list passes through unchanged.
- `acquirePhotos(source, side, how, pages = 1)` (was `acquirePhoto`) returns the processed photos in order, each through `processPhoto` (compress, thumbnail) like a single scan. If any page fails to process, the whole call fails and nothing is attached.
- Alternative: a separate `captureFrontAndBack()` method. Rejected: a second path through every adapter and the fake for what is the same call with a different page limit.

### D3. The front tile asks, the form attaches

- `PhotoSlot` gets `onBackPage?: (photo) => void`. When it is set and the tile is empty, "Scan" asks for two pages and hands page 2 to it after `onChange(page 1)`. Retake (tile filled) and Pick always ask for one page.
- `CardForm` passes `onBackPage` to the Front tile only while `hasPhoto("back")` is false, and it is the same attach function the Back tile's own `onChange` uses, so page 2 is stored, saved, discarded and recognized exactly like a back scan.
- Both photos attach in the same tick, so the recognition effect sees both as new and runs on-device recognition once with front and back together. Each photo is recognized once.
- While the pages are processed, the Front tile shows "Processing photo…" and the form holds Save (`preparing.front`); the Back tile fills when both are ready. The form counts as changed from then on (Cancel asks, Discard drops both).
- The first version's `onScanned`, `scan()` ref handle, `PhotoSlotHandle` and its busy/filled guard are removed: no second scan is started from the form, so there is no race between two takes. A Back tile that is still processing makes the next front scan single-page, so page 2 cannot overwrite it.

### D4. The system-camera fallback opens twice

The system camera takes one photo per launch. When ML Kit cannot run and two pages were asked for, `ScannerPhotoSource` opens the fallback for the front and, if a front came back, again for the back. This keeps the first version's behaviour on such phones (the form shows briefly between the two, as before) in two lines in the adapter; the form does not know which path ran. An error on the back launch fails the whole call, like any failed scan.

### D5. A hint names the side over the scanner

The ML Kit screens cannot be customised, so the plugin shows a short Android `Toast` (`LENGTH_LONG`) as the scanner opens. `ScannerPhotoSource` builds the text: "Scan the front of the card, then the back" for two pages, "Scan the front of the card" / "Scan the back of the card" for one. The wording does not name the scanner's add-page control, because its label could not be confirmed. `pick()` never reaches the scanner; the system-camera fallback shows no hint.

- Alternative: a persistent in-app banner. Rejected: the scanner covers the whole screen.

### D6. Test seams

- Vitest mocks `acquirePhotos` as the files do now; the two-page case is `["front", "camera", 2]` resolving to two photos.
- e2e: `FakePhotoSource.nextBack?: Blob | null` is page 2 of a two-page capture (`undefined`: same as `next`; `null`: the user finished after the front). One-page captures and `pick()` ignore it.

## Risks / Trade-offs

- [The Toast fades after about 3.5 s, before the user reaches the back] → it names the order up front; the phone check covers whether it is enough.
- [The scanner's flow for a second page is not documented (whether it stays in the viewfinder or goes to the preview first)] → the phone check confirms the user can add the back without help; if not, the owner decides between a reworded Toast and another approach.
- [The owner sometimes adds a card with only a front] → press Done after the front; no extra step.
- [Android back after taking the front loses the front] → same as closing any scan; the user scans again.
- [Phones without Play services still see the form between two system-camera launches] → accepted; the owner's phone has Play services.

## Open Questions

- Owner to confirm on the phone that the scanner's own add-page step reads as "next" and the Toast wording is clear enough.
