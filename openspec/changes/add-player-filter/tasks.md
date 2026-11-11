## 1. Filter

- [x] 1.1 Write the test in `src/domain/query.test.ts`: "acuna" matches "Ronald AcuÃ±a Jr." but not a card whose team or notes contain "acuna"; empty or all-space text matches all. Verify it fails
- [x] 1.2 Add `player: string` to `Filters` and `emptyFilters`, and match it against `c.player` in `matcher` with `key()`, in `src/domain/query.ts`. Verify the 1.1 test passes

## 2. Sheet

- [x] 2.1 Write the "Filter by player" and "Clear all clears the player filter" scenarios in `e2e/catalog.spec.ts`, following "Filter by insert" there (fill the field, tap Show, check the `Remove Player filter` chip). Verify they fail
- [x] 2.2 Add the Player text field first in the Card group and a Player chip to `applied` in `src/app/CollectionScreen.tsx`; the chip shows only when `f.player.trim()` is not empty. Verify the 2.1 scenarios pass
- [x] 2.3 Run the repo check
