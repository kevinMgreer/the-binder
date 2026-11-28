## 1. Spec

- [x] 1.1 `npx openspec validate wish-list --strict` passes. Verify: exit 0.

## 2. Domain and schema, tests first (implementer)

- [x] 2.1 Tests first in `src/domain/schema.test.ts`: a card without `wanted` and a card with `wanted: true` both pass `validateCard`; a fixture shaped like an old Drive card (no `wanted` key) passes too. In `src/domain/query.test.ts`: `matcher` with `emptyFilters` keeps owned cards (no field, `false`) and drops `wanted: true`; `show: "wanted"` keeps only wanted; `show: "all"` keeps both; `show` combines with `team`; `findDuplicate` returns nothing when the new card is wanted and never returns a wanted card (D8). Verify: the new tests fail on today's code.
- [x] 2.2 Tests first in `src/domain/dashboard.test.ts`: the dashboard spec scenario "Wanted cards are not counted" (tiles, `teams`, `players`, `recent` skip wanted cards) and `wanted` equals the number of distinct wanted cards; with no wanted card `wanted` is 0 and the six tiles are as before. Verify: the new tests fail on today's code.
- [x] 2.3 Test in `src/sync/merge.test.ts` (D3): a newer owned copy beats an older `wanted: true` copy and the result has no `wanted`; a newer wanted copy beats an older owned one and keeps `wanted: true`. Verify: passes on today's code (it pins behaviour; no merge change expected). If it fails, stop and report: D3 is wrong.
- [x] 2.4 `src/domain/card.ts`: `wanted?: boolean` on `Card` with a one-line doc comment (absent = owned, cards saved before the mark). `src/domain/schema.ts`: `wanted: z.boolean().optional()`. Verify: 2.1 schema tests pass.
- [x] 2.5 `src/domain/query.ts`: `show: "owned" | "wanted" | "all"` on `Filters`, `"owned"` in `emptyFilters`, the one `matcher` line (D4), and the `findDuplicate` guard (D8). Fix any test or fixture that builds a `Filters` literal without spreading `emptyFilters`. Verify: 2.1 passes and `npx tsc --noEmit` is clean.
- [x] 2.6 `src/domain/dashboard.ts`: `wanted: number` on `CollectionStats`; skip and count wanted cards at the top of the `collectionStats` loop (D5). Verify: 2.2 passes, `src/app/dashboard-memo.test.tsx` still passes.

## 3. UI, tests first (frontend)

- [x] 3.1 New `src/app/wish-list.test.tsx` covering the spec scenarios at component level: the form's "Wanted (I don't have it yet)" checkbox saves `wanted: true` with no photo, and an edit that leaves it alone keeps it; the detail of a wanted card shows the "Wanted" tag and "Mark as owned", which calls the save with no `wanted`, the same notes and quantity and a new `updatedAt`; an owned card's detail shows neither; the list defaults to owned only with no chip and no badge; Show Wanted shows the wanted cards, a "Wanted" chip and "Filter and sort, 1 applied"; Show All shows an "Owned and wanted" chip; removing the chip and Clear all return to owned; wanted rows and grid tiles show "Wanted" and their accessible name includes "wanted"; "Select all" under the default selects owned cards only; the bulk edit sheet lists no Wanted field and a bulk Set change keeps each card's mark; the dashboard shows "N wanted" only when N > 0 and tapping it (through `App`) opens the list with a "Wanted" chip. Verify: the new tests fail on today's code.
- [x] 3.2 `src/app/CardForm.tsx`: `Draft.wanted` from `c?.wanted ?? false`; `toCard` writes `wanted: d.wanted ? true : undefined` (D1); the checkbox under the title, before the photo tiles, via the existing `check` helper (D6). Verify: the form tests in 3.1 pass, `src/app/card-form-*.test.tsx` still pass.
- [x] 3.3 `src/app/CardDetail.tsx`: the "Wanted" `.tag` in the title row and a "Mark as owned" button in the detail actions for a wanted card, through a new `onMarkOwned` prop; `src/app/App.tsx` passes it as a `save` of the card with `wanted: undefined` and a new `updatedAt` (D9). Verify: the detail tests in 3.1 pass, `src/app/card-detail.test.tsx` still passes.
- [x] 3.4 `src/app/CollectionScreen.tsx`: the "Show" radio group after Direction (D6), the Show entry in `applied` with `clear: { show: "owned" }`. `src/app/CardList.tsx` and `src/app/CardGrid.tsx`: the "Wanted" tag and ", wanted" in the grid's `accessibleName`; no change to row height, `estimateSize` or keys. Verify: the list, chip and select-all tests in 3.1 pass; `src/app/list-sort.test.tsx`, `src/app/card-grid.test.tsx` and `src/app/bulk-edit.test.tsx` still pass.
- [x] 3.5 `src/app/Dashboard.tsx`: the "Wanted" row under the tiles calling `onTile({ label: "Wanted", filters: { show: "wanted" }, count: "match" })` (D5); `src/app/app.css` for that line and the three-option radio row using `tokens.css` values; `DESIGN.md` notes the Wanted tag and the wanted line. Verify: the dashboard tests in 3.1 pass; Playwright screenshots at 360 by 800 of the dashboard with wanted cards, the sheet's Show row, and a list with a Wanted row show no wrap and no new header item.
- [x] 3.6 Repo check. Verify: `npm run build && npx vitest run --exclude "**/startup*"` exits 0.

## 4. On the phone

- [x] 4.1 `docs/device-checklist.md`, under "Collection list": add a wanted card with no photo, see it under Show Wanted and in "N wanted" on the dashboard and not in the tiles, sync, reinstall or restore from Drive and see it still wanted, then Mark as owned and see it in the default list and the counts after the next sync. Verify: the lines are in the file.
- [ ] 4.2 Phone run of the 4.1 lines on the debug build (owner). Verify: ticked with the build version, or a desk todo opened for what fails.

## 5. Close out

- [x] 5.1 Archive the change with the `openspec-archive-change` skill so the requirements land in `openspec/specs/card-catalog`, `collection-list` and `dashboard`. Verify: `npx openspec validate --specs --strict` passes after the archive.
