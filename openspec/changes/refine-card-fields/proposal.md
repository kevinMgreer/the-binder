## Why

Two rules on the card form do not match real cards. Not every card prints a number, yet card number is required, so those cards cannot be saved. And a print run cannot be entered without also treating the card as serial-numbered, although many cards state a print run ("/99") without being individually numbered.

## What Changes

- Card number becomes optional. A card with no number saves, lists and opens; the "#" is left out of the row and the detail line when the number is empty. The form no longer marks Card number as required.
- Add a "Serial-numbered" checkbox to the form. The Serial field and "Serial unreadable" show only when it is checked. Print run is always enterable.
- The "?/99" style serial label, the Serial-numbered filter and the dashboard Serial-numbered tile follow the checkbox, not the print run. A card with print run 99 and not serial-numbered shows no label, matches the Print run filter, and does not match the Serial-numbered filter.
- Cards saved before this change keep their meaning: one with a serial number or a print run counts as serial-numbered.
- Out of scope: changing what Search or the other filters match, scanner or Claude suggestions (they still suggest a number when they find one), a migration of stored cards, a "number unknown" marker.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `card-catalog`: card number optional; print run independent of serial-numbered; duplicate match and sort with a missing number.
- `card-form-guidance`: required fields are player, year and set.
- `collection-list`: row and tag rules for a card without a number and for print run without serial-numbered.

## Impact

- `src/domain/card.ts`, `schema.ts`, `format.ts`, `query.ts`; `src/app/CardForm.tsx`, `CardList.tsx`, `CardDetail.tsx`, `Dashboard.tsx`; `src/sync/names.ts` if an empty number leaves a gap in photo file names.
- Tests: `schema`, `format`, `query`, `card-form-guidance`, e2e card specs that fill Serial.
- Stored shape: `parallel` gains an optional `serialNumbered` boolean. `schemaVersion` stays 2 (see design).
