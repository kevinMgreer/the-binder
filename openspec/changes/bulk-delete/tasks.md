## 1. Spec

- [ ] 1.1 `npx openspec validate bulk-delete --strict` passes. Verify: exit 0.

## 2. Use case, test first

- [x] 2.1 `src/usecases/cards.test.ts`: new tests for `deleteCards` with `createFakePorts`, `InMemoryCollectionStore` and `makeCard`: 3 of 10 cards, each with front and back `fileId` and `thumbId`, are soft-deleted (`deletedAt` and `updatedAt` set), their 12 ids are queued with `queueDelete`, and the other 7 cards are equal to before; the call returns `[]`. A store whose `put` throws for one id: the other cards are deleted and the call returns exactly that id, whose stored card still has `deletedAt === null`. Verify: the tests fail on today's code (no `deleteCards`).
- [x] 2.2 `src/usecases/cards.ts`: export `deleteCards(deps, cards)` per design D1, calling `deleteCard` per card in a `try`/`catch`. Verify: 2.1 passes, `npx tsc --noEmit` is clean.
- [x] 2.3 `src/app/useCards.ts`: `removeMany(cards)` calls `deleteCards`, `refresh()`, then `sync.notifyChange()` once, and returns the failed ids (D2); return it beside `remove` and `saveMany`. Verify: a test (in `src/app/use-cards.test.tsx`) deletes 3 cards and sees one `notifyChange`.

## 3. UI, tests first

- [ ] 3.1 New `src/app/bulk-delete.test.tsx` covering the "Delete several cards" scenarios at component level, in the style of `src/app/bulk-edit.test.tsx`: the bar has a button named "Delete" right before "Edit", disabled with nothing selected; Delete opens a "Delete cards" alertdialog asking "Delete 3 cards?" (and "Delete 1 card?"), with Keep focused; Keep, a scrim click, Escape and a `hardware-back` event close it without calling `onRemoveMany`, keep "3 selected", and Keep returns focus to the bar's Delete; a second back leaves selection mode; confirming calls `onRemoveMany` once with only the shown selected cards (5 selected, a filter showing 2: called with those 2) and then ends selection mode; when `onRemoveMany` resolves `["id"]` the dialog stays open, says 1 card could not be deleted and the bar shows "1 selected"; when it rejects, the dialog shows the generic error and the selection is unchanged. Verify: the new tests fail on today's code.
- [ ] 3.2 `src/app/Icon.tsx`: add the `trash` path. Verify: `npx tsc --noEmit` is clean.
- [x] 3.3 `src/app/useSelection.ts`: add `keep(ids)` (D3). Verify: 3.1's partial-failure test can use it.
- [ ] 3.4 `src/app/CollectionScreen.tsx`: the trash button in the selection bar before Edit, the `ConfirmDialog` with its busy and error state and focus return (D3, D4), and the new `onRemoveMany` prop; `src/app/App.tsx` passes `useCards().removeMany` (one prop line, no change to `goBack`). Verify: 3.1 passes, and `src/app/bulk-edit.test.tsx` and `src/app/back-button.test.tsx` still pass.
- [ ] 3.5 Playwright at 360 by 800, in `e2e/bulk-edit.spec.ts` or a new `e2e/bulk-delete.spec.ts`: screenshots of the list in selection mode with 3 cards selected and of the open delete dialog; assert the bar is one row (its height equals the 56 px `min-height`) and the Delete button's box is at least 48 by 48; then confirm and assert the 3 rows are gone. `src/app/app.css` changes only if the screenshot shows a wrap; `DESIGN.md` gets the trash button in the selection bar line. Verify: `npx playwright test e2e/bulk-delete.spec.ts` (or the bulk-edit spec) passes and the two screenshots are attached to the review.
- [ ] 3.6 Repo check. Verify: `npm run build && npx vitest run --exclude "**/startup*"` exits 0.

## 4. Close out

- [ ] 4.1 `docs/device-checklist.md` under the bulk-edit collection list section: select 3 cards, tap the trash, Keep deletes nothing; confirm deletes them; after a Drive sync and a fresh install they do not come back. Verify: the lines are in the file.
- [ ] 4.2 Archive the change with the `openspec-archive-change` skill so the requirement lands in `openspec/specs/collection-list/spec.md`. Verify: `npx openspec validate --specs --strict` passes after the archive.

## 5. On the phone (owner)

- [ ] 5.1 Owner: delete 3 cards on a dev build, sync, and check a fresh install doesn't bring them back. Verify: ticked with the build version, or a desk todo opened for what fails.
