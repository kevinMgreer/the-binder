## Why

The Cards list is always sorted by year, then set, then card number, so finding a player means scrolling or searching. The owner thinks of the binder by player last name, and sometimes by year or team, so the list should sort the way the owner chooses, with last name first by default.

## What Changes

- The Cards list gets a "Sort" button on the "Showing N" line that opens a sheet: sort by Last name (default), Year, Team or Set, ascending or descending. The button names the current order, for example "Sort: Last name ↑".
- The chosen sort lives in app memory like the filters: it survives opening a card and coming back, and resets to Last name ascending on a fresh launch. It is not saved.
- The default list order changes from year/set/number to player last name, with year, set and card number breaking ties. No stored data changes.
- A card gets an optional "Sort name" field in the card form, under Player, with the hint "Optional: how this card sorts, e.g. Acuña". When it is blank the last name is derived from Player when the list is sorted: suffixes (Jr., Sr., II, III, IV) are dropped and the last word is used; a multi-player card ("A / B", "A & B", "A and B") uses the first player's last name; a team card (Player contains the card's Team as a whole word) sorts by the whole Player text.
- No data migration and no `schemaVersion` bump: the field is optional and read with a fallback.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `collection-list`: the find row gains the Sort button and the first-screen requirements name it; a new requirement covers choosing the order.
- `card-catalog`: the card record gains the optional sort name; the default list order becomes last name; a new requirement defines how the last name is derived.

## Out of scope

- Saving the chosen sort across launches or syncing it between devices.
- A first/last name split of Player, or any change to how Player is shown, searched or matched for duplicates.
- Sorting by other fields (manufacturer, parallel, grade, date added) or multi-key sorts chosen by the user.
- Suggesting a Sort name from the scanner or Claude, and filling it in for existing cards.
- Searching by Sort name.
- The dashboard (its screen, `src/app/Dashboard.tsx`, `src/domain/dashboard.ts` and its spec) is not touched.
- Blank teams or other empty sort values getting special placement: they sort as empty text.

## Impact

- Code: `src/domain/card.ts`, `src/domain/schema.ts`, `src/domain/query.ts` (sort key and `sortCards` options), `src/app/App.tsx` (sort state), `src/app/CollectionScreen.tsx` (Sort button and sheet), `src/app/CardForm.tsx` (Sort name field), `src/app/app.css` (button on the Showing line); tests beside them and `e2e/catalog.spec.ts`.
- Data: cards may carry a new optional `sortName` string in the Drive file and on the device. Older app builds keep it, with one exception described in design.md.
- Depends on `refine-card-fields` and `restyle-card-back` being archived first (both touch the same requirements).
- No new dependency and no cost.
