## 1. Spec housekeeping

- [ ] 1.1 Correct the Add-sheet and back-prompt wording in the unarchived changes (design D7): in `openspec/changes/redesign-ui-binder-pockets/specs/collection-list/spec.md` make "The list leads with finding a card" say the Add card button opens the add form (and its "One add action" scenario: one Add card button that opens the form), and drop "Add card or" from the "Sheet above a bottom bar" scenario; in `openspec/changes/add-dashboard-and-card-fields/specs/dashboard/spec.md` change "the same single Add card button and sheet" to "the same single Add card button"; in `openspec/changes/add-collection-foundation/specs/card-photos/spec.md` make "Camera capture on Android" start from "Scan front" on the card form with the back offered by the back slot; verify `openspec validate --all --strict` exits 0 and `grep -rn "Enter by hand\|Add a card" openspec/changes` finds only archived or historical text

## 2. Failing tests first

- [ ] 2.1 In `src/app/back-button.test.tsx` add tests for the bar's paths ("Back from Cards", "Back from Dashboard after switching", "Back from card detail" with Cards active) and update "back from the add form opened on the dashboard/list" to open the form with one tap on Add card; verify they fail on the current code for the missing navigation landmark and pass after group 3
- [ ] 2.2 In `e2e/design.spec.ts` replace "One add action" with "One tap to the form" and "One add button per screen" (app-shell), add "Shown on the top-level screens", "Hidden elsewhere", "Active destination is not colour alone" in both themes, "Above the gesture bar", "Gear in the header", and extend "First screen" to "First screen with the bar" plus "Last row reachable" (collection-list) at 360 by 800 with a 48 dp inset; drop the Add sheet from the focus/Escape test (use the Filter sheet) and from the sheet-clearance list; scope nav queries to `getByRole("navigation", { name: "Main" })`; verify the new tests fail on the current build
- [ ] 2.3 Rewrite the Add flows in `e2e/photos.spec.ts`, `e2e/identification.spec.ts`, `e2e/dashboard.spec.ts` (and any `catalog`, `auth`, `sync` flow that goes through the sheet) to Add card → form → "Scan front" / "Pick front from photos"; replace the Capture back / Skip back test with "Front then back" and add "Fields kept after a scan", "Scanner closed without a photo", "Pick from photos", "Cancel discards" and "Identification triggers unchanged" (card-photos), "Switch to Cards keeps the list as it was" and "Gear opens Settings" (app-shell); verify they fail on the current build
- [ ] 2.4 Check every `getByRole("button", { name: "Cards" ... })` and `"Settings"` locator in `e2e/` and `src/app/*.test.tsx` (`smoke.test.tsx`, `dashboard.spec.ts`, `perf.spec.ts`) uses an exact tile name or the nav scope, so the new items cannot match by accident; verify with `grep -rn 'name: "Cards"' e2e src` that each hit is exact or scoped

## 3. Navigation and header

- [ ] 3.1 Add `src/app/Icon.tsx` with inline SVG gear, dashboard and cards icons (`currentColor`, `aria-hidden`), and `src/app/BottomNav.tsx` (`<nav aria-label="Main">`, two buttons with icon and label, `aria-current="page"` and indicator on the active one, `onNavigate`); style `.bottom-nav` in `src/app/app.css` from tokens only (design D3, D8); verify the 2.2 nav tests and `src/app/tokens.test.ts` pass
- [ ] 3.2 Render `BottomNav` in `src/app/Dashboard.tsx` and `src/app/CollectionScreen.tsx`, wire `onNavigate` in `src/app/App.tsx` (`dashboard` → `{ name: "dashboard" }`, `list` → `{ name: "list" }` keeping `filters`), leaving the back handler's rules as they are; verify 2.1 and the "Switch to Cards" e2e pass
- [ ] 3.3 Replace the text Settings button in the `Dashboard` and `CollectionScreen` headers with an icon button (`aria-label="Settings"`, gear icon, 48 dp, top right); verify "Gear in the header" and "Gear opens Settings" pass

## 4. Add flow

- [ ] 4.1 Reduce `src/app/AddCard.tsx` to the button calling `onAdd`; remove `onScan` from `Dashboard`, `CollectionScreen` and `App`, delete the `scan` view and `src/app/ScanFlow.tsx`; move `.add-button` above the bar and enlarge the scroller reserve in `app.css` (design D8); verify "One tap to the form", "One add button per screen", "First screen with the bar" and "Last row reachable" pass
- [ ] 4.2 In `src/app/PhotoSlot.tsx` label the camera action "Scan front"/"Scan back" when the side has no photo and "Retake front"/"Retake back" when it has one; verify the card-photos and card-scanner e2e from 2.3 pass, including "Identification triggers unchanged" with no Claude request recorded
- [ ] 4.3 Run the dashboard perf test (`e2e/perf.spec.ts`, 5,000 cards, 4x throttling); verify it still passes under 1 s

## 5. Docs and checks

- [ ] 5.1 Update `DESIGN.md`: add a Bottom navigation component (two destinations, 64 dp plus inset, indicator plus accent plus weight for the active item, top-level screens only, the two-destination deviation from Material) and an Icon button entry (gear, 48 dp, inline SVG `currentColor`); change the Overview and Buttons add-button lines to "one Add card button on each top-level screen, just above the bottom navigation, opening the add form"; drop the add sheet from Sheets ("for add and filter flows" → filter flow) and the Layout add-button position; add the bar to Navigation (Dashboard is the start destination; back from Cards goes to Dashboard); verify no line still mentions the Add sheet or "Enter by hand"
- [ ] 5.2 Run `openspec validate refine-navigation-and-add-flow --strict` and the repo check; verify both exit 0

## 6. On the phone

- [ ] 6.1 Install the debug build on the phone and, in light and dark (`adb shell cmd uimode night yes|no`), screenshot the dashboard and the list; verify the bar sits above the gesture bar, the active item reads without colour, the gear is top right, and at least three rows show above Add card on the list
- [ ] 6.2 On the phone, add a card: tap Add card, type a player, Scan front (rear camera, cropped), then Pick back from photos; verify the player is kept, both photos show, on-device suggestions fill only empty fields, and the card saves and syncs; repeat and tap Cancel after a scan, and verify nothing is added
- [ ] 6.3 On the phone, check back: Dashboard → Cards → back shows Dashboard, back again closes the app; a card's detail → back shows the list with Cards active; Settings from the gear → back returns to where it was opened; verify each
- [ ] 6.4 Owner review on the phone of the bar, its icons and the add flow; verify the owner accepts or lists changes, applied in one batch
- [ ] 6.5 Archive with `/opsx:archive` once every task here is merged; verify `app-shell` holds the four added requirements, `card-scanner` names Scan front/back, and `card-photos` and `collection-list` hold the added requirements whether or not their originating changes were archived first
