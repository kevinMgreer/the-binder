## Why

The owner finds the card form and the card detail screen clumsy on the phone. Each photo side takes a full row with a frame and two buttons, so the photo section is tall and busy. Photos are small when viewing cards (67 dp list thumbnails, 140 dp detail photos). Delete on the detail screen opens an inline question below it that the user has to scroll to. The lines under the player's name sit oddly. On the long form, Save is only reachable by scrolling to the end.

## What Changes

- **Photo tiles on the form.** One row holds a Front tile and a Back tile side by side, each a trading-card frame 96 dp tall. An empty tile shows a camera icon and "Front" or "Back"; tapping it opens a small chooser sheet with "Scan front" and "Pick front from photos" (the same names the buttons have today). A filled tile shows the photo; tapping it opens "Retake front", "Pick front from photos" and "Remove front photo". The scanner fallback, OCR on attach, Cancel discarding photos, the preparing state and Save held while a photo is prepared all stay as they are.
- **Remove a photo (new).** Removing a side on the add form drops the captured photo. On the edit form it clears that side when the card is saved, and queues the old Drive files for deletion the same way a replaced photo is.
- **Bigger photos when viewing.** List thumbnails grow from a 67 dp slot to a 96 dp slot, and list rows grow from 100 dp to 112 dp so the slot fits. Detail photos grow from 140 dp to 200 dp tall and show the full photo when it is on the device, the thumbnail first otherwise, never cropped. Stored thumbnails stay at a 320 px long edge.
- **Detail actions.** Edit (primary, fills the row) and Delete (danger-coloured text button) sit side by side in one action row. Delete asks in a centred modal dialog over a scrim ("Delete this card?", Keep focused, Delete in danger red). Android back, the scrim and Escape mean Keep. Soft delete is unchanged.
- **Detail header.** The player name is the title with the serial stamp beside it. Under it come one compact line "year set · #number" and a secondary line "team · parallel" when the card has them, then the rule. Team and Parallel leave the fact list because the header now shows them.
- **Save always in reach.** The form's Cancel / Save row becomes a sticky bottom bar on the panel background with a top rule, kept above the system navigation bar. The save-blocked message moves into that bar, directly above the buttons.
- **BREAKING (spec wording only):** the app-theme requirement "Destructive actions stay apart" (scenario "Delete is not beside Edit") is removed and replaced by "Destructive actions are distinct", because the owner now wants Delete next to Edit, kept distinct by colour and weight instead of distance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `card-photos`: the photo section becomes two tiles with a chooser; a stored or captured photo can be removed; the detail screen shows the full photo when it is on the device. The "Photos are taken from the card form" delta is written against the text `form-sort-polish` leaves (see design.md).
- `collection-list`: list rows 112 dp with a 96 dp thumbnail slot; the detail screen has a new header layout, 200 dp photos and one Edit / Delete action row; Delete confirms in a centred dialog.
- `app-theme`: "Destructive actions stay apart" is replaced by "Destructive actions are distinct" (Delete may sit beside Edit as danger text); list rows stay 112 dp in the spacing rule.
- `card-form-guidance`: Cancel and Save stay in reach in a sticky bottom bar with the save-blocked message.

## Out of scope

- New photo formats or a different compression pipeline.
- Re-generating existing thumbnails, or changing `THUMB_LONG_EDGE` (320 px) or the full-size photo.
- Changes to the zoom / pinch viewer (`PhotoView`, `ZoomableImage`).
- Turning the form's Discard confirmation into the new centred dialog (it stays the inline dialog `form-sort-polish` built).
- Hiding the sticky bar while the keyboard is open (no keyboard plugin; see design.md).
- Photo cropping, rotation or editing.

## Impact

- Code: `src/app/PhotoSlot.tsx` (becomes the tile and chooser), `src/app/CardForm.tsx`, `src/app/CardDetail.tsx`, `src/app/CardList.tsx` (`ROW_HEIGHT`), `src/app/Icon.tsx` (camera path), `src/app/hooks.ts` (`useThumbUrl` reads the full photo too), `src/app/app.css`, `src/ports/index.ts` (`Photos` allows `null` for a removal), `src/usecases/cards.ts` (`saveCard`), `src/sync/engine.ts` (`uploadPhotos` skips a removed side).
- Tests: `src/app/photo-slot.test.tsx`, `src/app/card-form-actions.test.tsx`, `src/app/back-button.test.tsx`, use-case and engine tests, `e2e/photos.spec.ts`, `e2e/identification.spec.ts`, `e2e/catalog.spec.ts`, `e2e/dashboard.spec.ts`, `e2e/design.spec.ts`.
- Docs: `DESIGN.md` (Frames and photos, List row, Card facts, Sheets and dialogs, Buttons), `docs/device-checklist.md`.
- No new dependency, no data migration, $0.
