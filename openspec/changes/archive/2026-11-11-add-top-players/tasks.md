## 1. Tests first

- [x] 1.1 In `src/domain/dashboard.test.ts` add "Top players merge spellings, count distinct cards, order ties by name, cap at five, ignore quantity": 3 cards of one player with quantity 3 each count 3 (a player with one card of quantity 3 counts 1), "Ronald Acuña Jr." and " ronald acuna jr. " are one entry showing the first spelling, ties are alphabetical, seven players give five entries, an empty collection gives `[]`; verify it fails (no `players` yet)
- [x] 1.2 In `src/app/dashboard-memo.test.tsx` extend the title and the assertion that the players are part of the one `collectionStats` call (no second call); in `e2e/dashboard.spec.ts` add "Top players: order, distinct count, tap opens the list with a Player chip", "Recently added is the last group", "No Top players heading with no cards" and a 360 by 800 check that all six tiles stay visible and every Top players row is at least 48 dp; verify they fail

## 2. Implement

- [x] 2.1 `src/domain/dashboard.ts`: one tally helper shared by teams and players, `players` in `CollectionStats`; verify 1.1 passes and the Top teams test still passes
- [x] 2.2 `src/app/Dashboard.tsx`: Top players group (button per entry, `data-testid="player"`, accessible name "player, number", tap calls `onTile` with `{ player: name }`), group order tiles, Top teams, Top players, Recently added; Top players shares the Top teams table classes; verify 1.2 passes and the existing dashboard e2e still pass

## 3. Close out

- [x] 3.1 Run `openspec validate add-top-players --strict` and the repo check; verify both exit 0
- [x] 3.2 Archive with `/opsx:archive` after refine-card-fields and restyle-card-back are archived; also rewrite the Purpose line of the main dashboard spec by hand (archiving does not touch it) to name Top teams, Top players, then Recently added last; verify `openspec validate --specs --strict` passes and the main dashboard spec holds the Top players requirement
