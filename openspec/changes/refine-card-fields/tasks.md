## 1. Card number optional

- [x] 1.1 Write the tests: `src/domain/schema.test.ts` (a card with `cardNumber: ""` validates; `REQUIRED_FIELDS` is player, year, set), `src/app/card-form-guidance.test.tsx` (only Player, Year and Set are marked required; update its existing required-fields expectation), `src/domain/query.test.ts` (an empty-number card sorts before "5" in the same set; two numberless cards with the same player/year/set/parallel/grade are found by `findDuplicate`). Verify the new ones fail
- [x] 1.2 Drop `required` from `cardNumber` in `src/domain/schema.ts` and remove it from `REQUIRED_FIELDS`. Leave `identity` and `sortCards` unchanged. Verify the 1.1 tests pass
- [x] 1.3 Write the test: a numberless card's row (`CardList`), detail line (`CardDetail`) and Dashboard aria label show no "#" and no dangling "·" (add to `src/app/card-form-fields.test.tsx` or a new `src/app/numberless.test.tsx`). Verify it fails
- [x] 1.4 Leave out the "#number" part when `cardNumber` is empty in `src/app/CardList.tsx`, `CardDetail.tsx` and `Dashboard.tsx`; check `src/sync/names.ts` makes a clean photo file name from an empty number (test in `names.test.ts`). Verify the 1.3 test passes

## 2. Print run without serial-numbered

- [x] 2.1 Write the tests: `src/domain/format.test.ts` (new): `isSerialNumbered` and `serialLabel` for `{serialNumbered:false, printRun:99}` (false, null), `{serialNumbered:true, serial:null, serialLegible:false, printRun:99}` (true, "?/99"), and an old parallel without the field and with printRun 99 (true, "?/99"); `src/domain/query.test.ts`: print run 99 and not serial-numbered matches `printRun: 99` and not `serialNumbered: true`; `src/domain/dashboard.test.ts`: the Serial-numbered tile skips it; `src/domain/schema.test.ts`: `serialNumbered` is accepted and optional. Verify they fail
- [x] 2.2 Add `serialNumbered?: boolean` to `Card["parallel"]` in `card.ts` and to the schema; make `isSerialNumbered` and `serialLabel` in `format.ts` share one test: the field when present, else a serial or a print run. `schemaVersion` stays 2. Verify the 2.1 tests pass
- [x] 2.3 Write the form tests in `src/app/card-form-fields.test.tsx`: Serial and "Serial unreadable" are absent until Serial-numbered is checked, Print run is always present; saving print run 99 unchecked stores `serialNumbered: false`, serial null; checked with unreadable stores `?/99`; editing an old print-run-only card opens with Serial-numbered checked. Verify they fail
- [x] 2.4 Add the Serial-numbered checkbox to the draft and `toDraft`/`toCard` in `src/app/CardForm.tsx`, show Serial and "Serial unreadable" only when checked, always show Print run, drop the serial on save when unchecked, keep `hasParallel` true for a print run. Verify the 2.3 tests pass
- [ ] 2.5 Update the e2e specs that fill Serial (`e2e/catalog.spec.ts`, `dashboard.spec.ts`, `identification.spec.ts`, `sync.spec.ts` as needed) to tick Serial-numbered first, and add the two acceptance scenarios (numberless card saves and lists; print run 99 unchecked shows no tag, matches Print run, not Serial-numbered) to `e2e/catalog.spec.ts`. Verify they pass where the e2e run is available; CI runs them otherwise

## 3. Finish

- [x] 3.1 Run the repo check (`npm run build && npx vitest run --exclude "**/startup*"`) and `openspec validate refine-card-fields --strict`
