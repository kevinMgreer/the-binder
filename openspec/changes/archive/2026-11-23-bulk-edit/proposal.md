## Why

Fixing the same mistake on many cards means opening, editing and saving each one: a whole box filed under the wrong set, or twenty cards missing their team. The list already finds those cards with search and filters; it should let the owner change them in one go.

## What Changes

- The collection list and grid get a selection mode: a "Select" action above the cards, or a long press on a card, starts it. In selection mode a tap toggles a card instead of opening it.
- A bar shows "N selected" with "Select all" (the cards the current search and filters show), "Edit" and "Cancel".
- Edit opens a sheet with the fields cards often share: team, year, manufacturer, set, subset, insert, parallel name, rookie, autograph, relic, and grading or condition. Each field starts as "Keep as is". Only the fields the user changes are written; every other field of every card stays as it was.
- Saving asks "Change N cards?", writes the changed cards with a new last-edited time in one local save, and starts one sync after it.
- The fields that belong to one card are never part of a bulk change: photos, serial number, card number, player, sort name, notes and quantity.
- Android back and Cancel leave selection mode before they leave the screen. The selection stays when the user switches between list and grid.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `collection-list`: new requirement "Select several cards and change them together".

## Impact

- `src/usecases/cards.ts`: a new `saveCards` use case beside `saveCard`.
- `src/app/useCards.ts`: a `saveMany` that calls it and notifies sync once.
- `src/app/CollectionScreen.tsx`, `src/app/CardList.tsx`, `src/app/CardGrid.tsx`, `src/app/app.css`: selection mode and the selection bar.
- New `src/app/BulkEditSheet.tsx` and its test.
- No change to the card schema, the Drive file version, the sync engine or the Worker. The $0 constraint holds: everything runs on the device and uses the existing Drive sync.

## Out of scope

- Bulk delete.
- Bulk photo work (adding, replacing, removing or rescanning photos on several cards).
- Undo of a bulk change.
- Clearing a field on several cards at once (a blank field means "Keep as is").
- Changing the per-card fields listed above.
- The card form (`CardForm.tsx`), photo suggestions and the Worker.
