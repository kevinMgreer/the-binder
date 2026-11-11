## 1. Filter

- [ ] 1.1 Add `player: string` to `Filters` and `emptyFilters`, and match it against `c.player` in `matcher` with `key()`, in `src/domain/query.ts`
- [ ] 1.2 Test in `query.test.ts`: "acuna" matches "Ronald Acuña Jr." but not a card whose team or notes contain "acuna"; empty text matches all

## 2. Sheet

- [ ] 2.1 Add the Player text field first in the Card group and a Player chip to `applied` in `src/app/CollectionScreen.tsx`
- [ ] 2.2 Test the "Filter by player" and "Clear all clears the player filter" scenarios in the collection screen tests
- [ ] 2.3 Run the repo check
