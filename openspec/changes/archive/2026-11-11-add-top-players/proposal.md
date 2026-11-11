## Why

The dashboard shows which teams the owner collects most (Top teams) but not which players. The question "who do I have the most cards of" currently takes filter work on the list.

## What Changes

- Add a "Top players" group to the dashboard: up to five players with the most distinct cards, most first, each row showing the player name and its number. Tapping a row opens the collection list with the Player filter set to that name and a Player chip.
- Move "Recently added" to the very bottom of the dashboard: tiles, Top teams, Top players, Recently added.
- The group is hidden when there are no cards, like Top teams and Recently added.
- Out of scope: a new exact-match filter (the Player filter stays a substring match), splitting multi-player cards into several players, a "show more" or full player list, counting quantity, a player tile, any change to the tiles, Top teams or the list screen.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard`: new Top players requirement; the design-system, fast-dashboard and app-opens requirements name the new group and the new order.

## Impact

- `src/domain/dashboard.ts` (stats gain `players`), `src/app/Dashboard.tsx` (new group, new order; the Top teams table classes are reused, no CSS change).
- Tests: `src/domain/dashboard.test.ts`, `src/app/dashboard-memo.test.tsx`, `e2e/dashboard.spec.ts`.
- No stored data, schema or sync change.
