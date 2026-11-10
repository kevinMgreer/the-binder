## 1. Tokens and guard tests

- [ ] 1.1 Write the failing tests first: no colour literals (hex, rgb, hsl) in `src/**` styles or components outside `src/app/tokens.css`; both themes define every colour role; every text and background pair meets 4.5 to 1 (3 to 1 for large text and icons) in both themes; verify they fail before the token file exists
- [ ] 1.2 Create `src/app/tokens.css` with the roles, scales and both themes from design D1 and D3, import it first in `main.tsx`, and move the existing `app.css` colours onto it; verify the 1.1 tests pass and `npm run build` succeeds
- [ ] 1.3 Verify the theme follows the phone: with a Playwright test using `colorScheme: "dark"` and `"light"` the page background token differs, and on the phone `adb shell cmd uimode night yes` and `no` switch the running app ("Dark system setting", "Light system setting")

## 2. The collection list

- [ ] 2.1 Write the failing Playwright tests first for the list: the header shows the count and the sync state in words, then the search field and filter chips, then rows; a serial-numbered card shows its 013/150 tag and a card without one shows none; an applied Year chip shows the accent state and the match count; verify they fail before the restyle
- [ ] 2.2 Restyle the header, `SyncIndicator`, search, chips, `CardList` rows (pocket) and the Scan card button on tokens only, with the safe-area insets kept; verify the 2.1 tests pass ("First screen", "Row content", "Long names", "Tag on a serial-numbered card", "Filter applied")
- [ ] 2.3 Verify the 5,000-card performance test still passes unchanged (`playwright test e2e/perf.spec.ts`, 4x CPU throttling, first screen under 1 s)

## 3. The other screens

- [ ] 3.1 Restyle the card detail screen (photo pockets, the serial tag, Delete set apart from Edit) on tokens; verify an e2e test finds Delete at least 24 dp from Edit and not in the accent colour ("Delete is not beside Save")
- [ ] 3.2 Restyle the card form (inputs, required markers, Save and Cancel, the blocked-save message) on tokens; verify the existing form-guidance tests pass unchanged
- [ ] 3.3 Restyle the scan, photo view, settings and sign-in screens, including the Sign out button apart from the other settings; verify the existing e2e suite passes unchanged
- [ ] 3.4 Add a Playwright check at 360 by 800 that every button, chip, input and row is at least 48 dp high and wide with 8 dp to the next control; verify it passes ("Touch targets")

## 4. On the phone

- [ ] 4.1 Install the debug build, switch Android between dark and light with `adb shell cmd uimode night yes` and `no`, and screenshot the list, detail, form, scan and settings screens in each; verify both themes render with legible text and the pocket look, and that nothing sits under the system bars
- [ ] 4.2 Owner review on the phone of both themes and the serial tag; verify the owner accepts or lists changes, and apply them in one batch

## 5. Finish

- [ ] 5.1 Run the impeccable finish review on the built screens, fix its material findings in one batch, and write `DESIGN.md` with the documenter; verify the reviewer's disposition is ship and `DESIGN.md` records the tokens
- [ ] 5.2 Run `openspec validate redesign-ui-binder-pockets --strict`, then archive the change with `/opsx:archive` once everything is merged; verify `app-theme` and `collection-list` appear under `openspec/specs/`
