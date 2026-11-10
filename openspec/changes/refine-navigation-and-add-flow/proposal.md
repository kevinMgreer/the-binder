## Why

After using the dashboard build on the phone, the owner found that once he leaves the dashboard nothing shows it exists: the only way back is the Android back button. Settings is a text button that crowds the header, and adding a card takes a detour through a sheet (Scan card, Pick from photos, Enter by hand) before the form, even though the form already holds the photo slots.

## What Changes

- A bottom navigation bar with two destinations, Dashboard and Cards, on the two top-level screens (dashboard and collection list). Each item has an icon and a text label at least 48 dp; the active one is marked by an indicator shape, the accent colour and `aria-current`, never colour alone. It clears the gesture or button bar and uses design tokens only. It is hidden on card detail, the add and edit forms and Settings; an open sheet covers it with its scrim.
- Back semantics stay as shipped and are now stated for the bar: Cards → back → Dashboard; Dashboard → back → the app closes, however the user reached it. Switching to Cards keeps the list's last search and filters; Browse collection and the stat tiles keep their behaviour (they clear or set the filters).
- The in-app "The Binder" heading goes from the signed-in screens (Android apps rarely repeat their launcher name): the header of each top-level screen is titled by the screen, "Dashboard" or "Cards", with the list's count and sync state beneath its title. The app name stays only on the signed-out sign-in screen.
- Settings becomes a gear icon button (accessible name "Settings", 48 dp) at the top right of the header on the dashboard and the list, replacing the text button.
- **BREAKING (UI)**: Add card opens the card form directly. The Add sheet is removed. The form's photo section offers, for front and back, Scan (rear-camera scanner with crop, falling back to the system camera, as today) and Pick from photos; manual entry is the form itself. After a photo is taken the user is on the same form with the photo attached and every field kept. Cancel discards the new card and its photos. Identification is unchanged: on-device recognition runs when a photo is attached in the form, Claude only when the user taps Identify with Claude.
- The Add card button stays one per top-level screen and sits just above the bottom navigation bar. The list's first screen at 360 by 800 still shows at least three full card rows above it.
- `DESIGN.md` gains a Bottom navigation component and an icon button entry, and its add-button, sheet and navigation lines are updated.

Out of scope: more destinations (Settings stays a header action, not a tab), removing Browse collection from the dashboard, a navigation rail or tablet layout, the nav bar on card detail, restoring the form after Android kills the app while the camera is open, animations between tabs, a new icon dependency, and any change to sync, storage or identification logic.

## Capabilities

### New Capabilities

`card-photos` and `collection-list` are not in `openspec/specs/` yet: they exist only inside the unarchived changes `add-collection-foundation` and `redesign-ui-binder-pockets`. This change adds requirements to them under new names (ADDED only, with the same Purpose those changes use), so its own deltas archive whether or not those changes were archived first. What does depend on order is the old Add-sheet and back-prompt wording in those changes (design D7): while a change is unarchived, task 1.1 corrects its text in place; if it is already archived when this change is built, task 1.1 leaves it alone and instead adds a MODIFIED delta here for the affected requirement, which then makes this change archive only after that one.

- `card-photos`: photos are taken from the card form and the user returns to it with fields kept.
- `collection-list`: the list's first screen still holds with the bottom navigation bar.

### Modified Capabilities

- `app-shell`: adds the bottom navigation bar with its back semantics, screen titles instead of the app name, the gear Settings button, and the Add card button opening the form above the bar (ADDED requirements).
- `card-scanner`: "Scan a card with the rear camera" is opened from the form's Scan front/back, and its front-then-back scenario changes: the back is offered by the form's back slot, not by a separate step (MODIFIED).

## Impact

- Code: `src/app/App.tsx` (views, back handler, drops the `scan` view), new `src/app/BottomNav.tsx` and `src/app/Icon.tsx`, `src/app/AddCard.tsx` (button only), `src/app/Dashboard.tsx`, `src/app/CollectionScreen.tsx` (header title and gear, nav), `src/app/PhotoSlot.tsx` (Scan/Retake labels), `src/app/app.css`, deletion of `src/app/ScanFlow.tsx`.
- Tests: `src/app/back-button.test.tsx`, `src/app/smoke.test.tsx`; e2e `smoke` (expects the "The Binder" heading after load), `design`, `photos`, `dashboard`, `identification`, `catalog`, `auth`, `sync` specs and `e2e/helpers.ts` (flows that go through the Add sheet, and locators that would now also match the nav's "Cards" or the gear).
- Docs: `DESIGN.md`.
- Specs in unarchived changes whose wording this supersedes (the Add sheet in `redesign-ui-binder-pockets` collection-list and `add-dashboard-and-card-fields` dashboard, the back-photo prompt in `add-collection-foundation` card-photos): see design D7.
- No new dependency, no network, no cost: the $0 constraint holds.
