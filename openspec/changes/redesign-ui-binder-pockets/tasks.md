## 1. Tokens and guard tests

- [x] 1.1 Write the failing tests first: no colour literals (hex, rgb, hsl) in `src/**` styles or components outside `src/app/tokens.css`; both themes define every colour role; every pair listed in design D8 meets 4.5 to 1 (3 to 1 for large text and icons) in both themes with the pocket blended over the page; a Playwright test sets `colorScheme` dark then light, then flips it with `page.emulateMedia` while open, and the page background token differs each time; a test overrides `--color-accent` on the root and the primary button, an active chip and a serial tag change with it; verify they fail before the token file exists
- [x] 1.2 Create `src/app/tokens.css` with the roles, scales, `color-scheme: light dark` and both themes from design D1, D3 and D8, import it first in `main.tsx`, and move the existing `app.css` colours onto it; verify the 1.1 tests pass and `npm run build` succeeds (the chip and tag parts of the token-swap test pass after 2.2)
- [x] 1.3 Verify the theme follows the phone on the device: `adb shell cmd uimode night yes` and `no` switch the running app without a restart ("Dark system setting", "Light system setting", "Setting changes while running"); if the activity's `uiMode` config change blocks the switch, fix it before moving on

## 2. The collection list

- [x] 2.1 (superseded by 3.6) Write the failing Playwright tests first, at 412 by 915 and 360 by 800 with the update banner showing: the header shows the count and the sync state in words for each of the six states, then the search field and one chip per filter group, then rows; secondary actions (Add card, Pick from photos, Settings, Sign in again) are reachable and only Scan card is primary; a serial-numbered card shows 13/150, an unreadable one ?/99, and a card without one shows none; a row shows parallel, grade and quantity; a Year value turns the Year chip accent with `aria-pressed`, shows the match count, and tapping a chip opens the panel at its fields; verify they fail before the restyle
- [x] 2.2 (superseded by 3.6) Restyle the header, `SyncIndicator`, search, chips (design D7), `CardList` rows (pocket, new `ROW_HEIGHT` per D4) and the Scan card button on tokens only, with the safe-area insets kept; update only the `catalog.spec.ts` selectors that the chip markup requires; verify the 2.1 tests pass ("First screen", "Secondary actions stay reachable", "Each state in words", "Row content", "Long names", "Tag on a serial-numbered card", "Unreadable serial", "Filter applied", "Chip opens its field")
- [x] 2.3 Verify the 5,000-card performance test still passes (`playwright test e2e/perf.spec.ts`, 4x CPU throttling, first screen under 1 s) and that a throttled scroll of the list drops no frames beyond the baseline

## 3. The other screens

- [x] 3.1 Write the failing e2e tests first for the detail and settings screens: Delete at least 24 dp from Edit and not in the accent colour, Sign out at least 24 dp from the other settings and not in the accent colour; then restyle the card detail screen (photo pockets, serial tag, Delete set apart) and settings on tokens; verify the tests pass ("Delete is not beside Edit", "Sign out is apart in settings")
- [x] 3.2 Restyle the card form (inputs, required markers, Save and Cancel, the blocked-save message) on tokens; verify the existing form-guidance tests pass unchanged
- [x] 3.3 Restyle the scan, photo view and sign-in screens; verify the existing e2e suite passes
- [x] 3.4 Write the touch-target Playwright check first at 360 by 800 (every button, chip, input and row at least 48 dp high and wide, 8 dp to the next control) and run it against the unstyled screens to see it fail; verify it passes after 2.2 and 3.1 to 3.3 ("Touch targets")
- [x] 3.5 Style the empty collection, no-match, sync error, needs-decision dialog, confirm dialogs, update banner and offline photo note from tokens; verify an e2e test shows each at 360 by 800 in both themes with legible text, 48 dp controls and nothing under the system bars ("States at phone size")

## 3b. Revisions after the first phone review

- [x] 3.6 Write the failing e2e tests first, then rebuild the list header per D9 and the filters per D7: one Add card button opening a sheet with Scan card, Pick from photos and Enter by hand; one Filter button with a count badge opening a sheet with the existing labelled fields, Show N cards and Clear all; removable chips only for applied filters; at least three rows visible at 360 by 800; update the existing specs that click the old buttons or the old panel; verify the full Playwright suite passes ("One add action", "First screen", "Filter applied", "Remove a filter", "Nothing applied")
- [x] 3.7 Write the failing e2e test first, then make the detail photos thumbnails per D10 that open the existing photo view; verify the Edit and Delete buttons are visible without scrolling past the photos at 360 by 800 on a card with two photos, and the existing photo tests pass
- [x] 3.8 Fix the count wording ("1 card", "N cards") in the header; verify an e2e assertion for one card and several

## 3c. Revisions after the second phone review

- [x] 3.9 Write the failing e2e test first, then simplify the list row to the player in bold, one muted "year set #number" line and one compact tag and parallel line (grade and quantity follow the parallel), keeping the number visible and the row height fixed; verify the 5,000-card performance test still passes ("Row content")
- [x] 3.10 Write the failing e2e test first (a 48 dp bottom inset, the last button of the Add card and Filter sheets at least 64 dp above the bottom), then give `.sheet` the same inset as `#root` plus a 16 dp gap; the inset is already the larger of the Capacitor var and `env()`, so no new approach is needed ("Sheet above a bottom bar")
- [x] 3.11 Write the failing e2e test first, then restructure the card detail into thumbnails, title, a labelled fact grid, a muted last-edited line, Edit primary and Delete apart, on tokens in both themes ("Fact grid")

- [x] 3.12 Second polish pass after the owner saw 3.9 to 3.11 on the phone: write the failing e2e tests first, then make the row the thumbnail, the player with the tag badge at the right and one quiet "year set · #number" line (parallel, grade and quantity as plain ellipsised text, row height 100), and the detail a large title with a tag badge, a quiet subtitle, a photo strip, a ruled list of facts, a muted last-edited line, a full-width Edit and Delete apart; verify a long parallel keeps the quiet line to one line and the badge uses the accent text token ("Long extras", "Fact list")

- [x] 3.13 Owner changes after the third phone look: write the failing tests first (detail order title, subtitle, facts, photo strip, last edited, Edit, Delete; no Back button on detail and settings; Android back from each still returns to the list in `back-button.test.tsx`), then move the photo strip below the facts and remove the Back buttons from the detail and settings screens; verify the full suite passes, with the e2e specs that clicked Back reloading instead ("Fact list", "Detail and settings have no Back button"); also make the "States at phone size" loop wait for the app and re-apply the sync status until it shows

## 4. On the phone

- [ ] 4.1 Install the debug build, switch Android between dark and light with `adb shell cmd uimode night yes` and `no`, and screenshot the list, detail, form, scan and settings screens in each; verify both themes render with legible text and the pocket look, nothing sits under the system bars, and there is no white flash at launch in dark mode
- [ ] 4.2 Owner review on the phone of both themes and the serial tag; verify the owner accepts or lists changes, and apply them in one batch

## 5. Finish

- [x] 5.1 Run the impeccable finish review on the built screens, fix its material findings in one batch, and write `DESIGN.md` with the documenter; verify the reviewer's disposition is ship and `DESIGN.md` records the tokens
- [ ] 5.2 Run `openspec validate redesign-ui-binder-pockets --strict`, then archive the change with `/opsx:archive` once everything is merged; verify `app-theme` and `collection-list` appear under `openspec/specs/`
