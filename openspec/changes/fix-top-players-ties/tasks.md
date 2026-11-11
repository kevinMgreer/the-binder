## 1. Top players tie order

- [x] 1.1 Write the tests in `src/domain/dashboard.test.ts`: Hank Aaron and Babe Ruth with 2 cards each list Aaron first; "Ronald Acuña Jr." sorts under Acuña before "Mookie Betts"; a Sort name on a later card of "Zack Judge" puts him before Betts; a larger count still ranks before a smaller one whatever the names. Update the existing Top players test (Betts now before Judge). Verify they fail (`npx vitest run src/domain/dashboard.test.ts` exits 1 on the order assertions)
- [x] 1.2 In `src/domain/dashboard.ts` keep a tie key per player (first non-empty Sort name, else `lastNameKey` of the first card met) and have `top()` use it after the count, then the full name; Top teams unchanged. Verify 1.1 passes
- [x] 1.3 Run the repo check (`npm run build && npx vitest run --exclude "**/startup*"`) and `openspec validate fix-top-players-ties --strict`. Verify both exit 0
