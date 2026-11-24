## 1. Spec

- [x] 1.1 `npx openspec validate bulk-edit --strict` passes. Verify: exit 0.

## 2. Use case, test first

- [ ] 2.1 New `src/usecases/cards.test.ts` with `InMemoryCollectionStore` and `makeCard`: `saveCards` with `{ set: "Heritage" }` on 3 of 5 cards changes only those 3, only `set` and `updatedAt`, and leaves photos, serial, card number, player, sort name, notes, quantity, `createdAt` and `source` equal; one shared `updatedAt`; cards already equal to the patch are not written and not queued (`pending()`); unknown and deleted ids are skipped; `parallelName` replaces the name and keeps serial and print run, creates a non-serial parallel on a base card, and leaves a base card `null` for a blank name; `grading` replaces the whole object; `rookie: true` leaves autograph and relic; returns the written count; all written cards appear in one `putMany` call (spy). Verify: the tests fail on today's code (no `saveCards`).
- [ ] 2.2 `src/usecases/cards.ts`: export `BulkPatch`, a pure `applyPatch(card, patch)` and `saveCards({ collection }, ids, patch)` per design D1. Verify: 2.1 passes, `npx tsc --noEmit` is clean.
- [ ] 2.3 `src/app/useCards.ts`: `saveMany(ids, patch)` calls `saveCards`, `refresh()`, then `sync.notifyChange()` once (D2); return it beside `save` and `remove`. Verify: a test in `src/app/smoke.test.tsx` or a new hook test sees one `notifyChange` for a 3-card change.

## 3. UI, tests first

- [ ] 3.1 New `src/app/bulk-edit.test.tsx` covering the spec scenarios at component level: long press starts selection with that card selected; tap toggles and does not call `onOpen`; "Select all" selects the filtered cards; Cancel and a `hardware-back` event leave selection mode first and a second back reaches the dashboard (through `App`, as `back-button.test.tsx` does); switching list/grid keeps the selection; the Edit sheet starts all "Keep as is" with its save disabled; setting Set and confirming "Change N cards?" calls `saveMany` with only `{ set }`; the selected rows and tiles carry `aria-pressed="true"`. Verify: the new tests fail on today's code.
- [ ] 3.2 New `src/app/BulkEditSheet.tsx` (D6): `Sheet` with the eleven fields, `datalist`s from the existing distinct values, the patch built from changed fields only, the save disabled while empty, and the centred `alertdialog` "Change N cards?". Verify: its tests in 3.1 pass.
- [ ] 3.3 `src/app/CardList.tsx` and `src/app/CardGrid.tsx`: props `selected?`, `onToggle`, `onLongPress`; long press per D6; `aria-pressed` and a selected class on the row or tile button; no change to row height, `estimateSize` or keys. Verify: 3.1 passes and `src/app/card-grid.test.tsx` and `src/app/list-sort.test.tsx` still pass.
- [ ] 3.4 `src/app/CollectionScreen.tsx`: `selecting` and `selected: Set<string>` state (D3), the "Select" action and selection bar (D6), the `openSheets` entry while selecting (D4), the count over `selected` intersected with `shown`, and the `BulkEditSheet` mount; a new `onSaveMany` prop wired in `src/app/App.tsx` to `useCards().saveMany` (one prop line, no change to `goBack`). Verify: 3.1 passes.
- [ ] 3.5 `src/app/app.css`: the selected row and tile look (check mark plus tint, not colour alone) and the selection bar, using `tokens.css` values; `DESIGN.md` gets the selection bar and selected-row look. Verify: `npm run check` is green; Playwright screenshot of list and grid in selection mode at 360 by 800 shows no wrap in the bar.
- [ ] 3.6 e2e in `e2e/` beside the list tests: 5,000 cards, Select, Select all, the bar reads "5000 selected" and fewer than 100 rows exist; set Set on 3 cards and the rows show it. Verify: `npx playwright test` passes.

## 4. On the phone

- [ ] 4.1 `docs/device-checklist.md` under the collection list: long press selects, a scroll does not select, back leaves selection mode first, select 20 cards and change the set, then Drive sync shows them synced. Verify: the lines are in the file.
- [ ] 4.2 Phone run of the 4.1 lines on the debug build (owner). Verify: ticked with the build version, or a desk todo opened for what fails.

## 5. Close out

- [ ] 5.1 Archive the change with the `openspec-archive-change` skill so the requirement lands in `openspec/specs/collection-list/spec.md`. Verify: `npx openspec validate --specs --strict` passes after the archive.
