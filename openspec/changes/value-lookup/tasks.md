## 1. Spec

- [x] 1.1 `npx openspec validate value-lookup --strict` passes. Verify: exit 0.

## 2. Tests first

- [x] 2.1 New `src/domain/value-query.test.ts`: one test per search-word scenario of "Check sold prices" (plain base card exact words, empty fields left out with no double or edge spaces, numbered parallel ends "/50", parallel with no numbering or no print run has no "/", "RC Auto Relic" order, graded ends "PSA 10", raw condition left out) and one for `soldPricesUrl` (host and path, `_nkw` decodes to the words, `LH_Sold=1`, `LH_Complete=1`, `_sacat=213`). Use `makeCard` from `src/domain/fixtures.ts`. Commit this red on its own. Verify: `npx vitest run src/domain/value-query.test.ts` fails on today's code.
- [ ] 2.2 `src/app/card-detail.test.tsx`: the detail screen shows a "Check sold prices" link whose `href` equals `soldPricesUrl(card)`, with `target="_blank"` and `rel="noopener noreferrer"`, placed before the Delete and Edit row. Verify: the new test fails on today's code.

## 3. Implement

- [x] 3.1 New `src/domain/value-query.ts`: `valueQuery(card)` and `soldPricesUrl(card)`, using `isSerialNumbered` from `src/domain/format.ts`. Verify: `npx vitest run src/domain/value-query.test.ts` passes.
- [ ] 3.2 `src/app/CardDetail.tsx` (`CardDetail`): render `<a href={soldPricesUrl(card)} target="_blank" rel="noopener noreferrer">Check sold prices</a>` in a `<p>` after the last-edited line and before the `detail-actions` row. Verify: `npx vitest run src/app/card-detail.test.tsx` passes, and `npm run build && npx vitest run --exclude "**/startup*"` and the e2e "Two portrait photos fill the row" check stay green.

## 4. On the phone

- [ ] 4.1 Add a line to `docs/device-checklist.md` and run it on the phone: on a numbered parallel and on a graded card, tap "Check sold prices"; the phone's browser (not the app) opens eBay sold listings, and the results are that card. Verify: ticked after the phone check.
