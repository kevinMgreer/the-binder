## Why

Selection mode can change many cards at once but not remove them. Clearing out duplicates or a box of cards that was sold means opening each card, tapping Delete and confirming, one card at a time. The selection is already there; it should also delete.

## What Changes

- The selection bar gets an icon-only trash button, named "Delete" for assistive technology, with a 48 px touch target, placed just before "Edit". The bar keeps its single compact row. Like "Edit", it is disabled while no card is selected.
- `src/app/Icon.tsx` gets a `trash` icon.
- Delete opens the same centred dialog the detail screen uses (`ConfirmDialog`, alertdialog named "Delete cards"), asking "Delete N cards?", with Delete outlined in the danger colour on the left and Keep filled on the right with focus. Keep, a tap on the scrim, Escape and Android back close it without deleting.
- Delete removes every selected card that the current search and filters show (hidden selected cards are left alone, as in bulk edit). Each card goes through the existing `deleteCard` use case: a soft delete, with its photos queued for removal from Drive. One sync push follows, not one per card.
- When every card is deleted, selection mode ends and the list shows. A card that fails to delete stays selected, the dialog stays open and says how many cards could not be deleted, and nothing claims success for them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `collection-list`: new requirement "Delete several cards", beside "Select several cards and change them together" and in the words of "Delete asks in a centred dialog".

## Impact

- `src/usecases/cards.ts`: a `deleteCards` use case that calls `deleteCard` per card and reports which ids failed.
- `src/app/useCards.ts`: a `removeMany` that calls it, refreshes and notifies sync once.
- `src/app/useSelection.ts`: a way to narrow the selection to the cards that failed.
- `src/app/CollectionScreen.tsx`, `src/app/Icon.tsx`, `src/app/app.css`, `src/app/App.tsx` (one prop line): the trash button and the dialog.
- New tests: `src/usecases/cards.test.ts` (extended), `src/app/bulk-delete.test.tsx`, an e2e screenshot spec.
- No change to the card schema, the Drive file format, the sync engine or the Worker. The $0 constraint holds: everything runs on the device over the existing Drive sync.

## Out of scope

- Undo, and a bin of deleted cards.
- Deleting selected cards that the current search or filters hide.
- Any change to single-card delete on the detail screen.
- Bulk photo work, and any change to bulk edit beyond sharing the bar.
