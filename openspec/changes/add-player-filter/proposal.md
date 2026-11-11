## Why

The collection list has one Search box that matches player, team, set, subset, insert and notes together. Typing a player's name also returns every card whose team, set or notes happen to contain that text, and the Filter sheet has no way to narrow to the player alone.

## What Changes

- Add a "Player" text field to the Filter sheet, in the Card group. It keeps cards whose player name contains the text, ignoring case and accents.
- Show an applied Player filter as a removable chip and count it in the Filter button's badge, like the other filters.
- The Search box stays as it is.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `collection-list`: the filter sheet gains a Player text filter, with a chip and badge count.

## Impact

- `src/domain/query.ts`: `Filters` gains `player`, `emptyFilters` and `matcher` handle it.
- `src/app/CollectionScreen.tsx`: the sheet field and the chip.
- Tests in `query.test.ts` and the collection screen tests.
- No change to stored cards, Drive files or `schemaVersion`; filters are never saved.
