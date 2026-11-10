## Context

See proposal.md for why. Today `src/app/App.tsx` holds one `view` state (`dashboard`, `list`, `scan`, `form`, `detail`, `settings`) and one Android back handler that already does what the tabs need: list → dashboard, dashboard → exit, detail → list, form and settings → the screen they came `from`, an open sheet closes first. `AddCard.tsx` renders the fixed Add card button and the Add sheet; its Scan card and Pick from photos go through the `scan` view (`ScanFlow.tsx`), which takes the front, asks for the back (Capture back / Skip back) and then opens the form with the photos. The form already has a `PhotoSlot` per side that calls `acquirePhoto` in place (labelled "Retake front" even when the slot is empty), and `CardForm` already runs on-device recognition on every newly attached photo while never overwriting a field the user edited. The app has no icon set: the only icon is a text glyph on chips.

Specs touched: `app-shell` and `card-scanner` are in `openspec/specs/`; `collection-list`, `dashboard` and `card-photos` exist only in the merged but unarchived changes `redesign-ui-binder-pockets`, `add-dashboard-and-card-fields` and `add-collection-foundation`.

## Goals / Non-Goals

**Goals:**
- One shared bottom bar on the two top-level screens, with the back behaviour the app already has, written down as tab semantics.
- Add card reaches the form in one tap, and the form is the only place photos are taken for a new card.
- No new dependency, no new state library, no router.

**Non-Goals:**
- A router or history stack (the `view` state plus `from` covers every path).
- Restoring the form after Android kills the app while the camera or scanner is open.
- Removing Browse collection (it differs from Cards: it clears the filters).

## Decisions

**D1. The bar is a small `BottomNav` component rendered by `Dashboard` and `CollectionScreen`, not by `App`.** Each top-level screen already owns its fixed Add card button and header, so it also places the bar; `App` passes `onNavigate(screen)`. Hidden-elsewhere then needs no condition. Alternatives: render the bar in `App` around every view, with a list of screens to hide it on (more branching for two screens); a router with nested layouts (a dependency and a rewrite for two tabs). $0: no dependency.

**D2. Two destinations, against Material's three-to-five guidance.** The owner asked for a bottom bar so the dashboard is always one tap away; Material's alternative for two destinations is top tabs, which would sit in the header the owner wants smaller, and a navigation drawer hides the dashboard again. Settings stays a header action, not a third tab, because it is rarely used. Recorded as a deliberate deviation in `DESIGN.md`.

**D3. Look: Material 3 navigation bar shape on the existing tokens.** Bar height 64 dp plus the bottom inset as padding, `--color-surface` background with a 1 px pocket-edge top border, items share the width equally. Each item is a `button` with `aria-current="page"` when active (inside `<nav aria-label="Main">`): a 24 dp icon above a label-size text label. The active item gets a pill indicator (`--radius-l`, a pocket fill) behind the icon, accent icon and label colour, weight 500; inactive uses muted ink. Indicator shape plus weight carry the state without colour. Alternatives: links with `href` (no router, no URLs to link to); label-only items (no icon is fine for the 48 Rule but loses the familiar Android pattern the owner asked for).

**D4. Icons are inline SVG in one `Icon.tsx` (gear, dashboard grid, cards stack), `fill="currentColor"`, `aria-hidden`.** Colour then comes from the button's token colour. Alternatives: an icon package such as `lucide-react` or Material Symbols font (a dependency or a font fetch for three icons); text glyphs (DESIGN.md already lists the chip glyph as a defect). $0: no dependency, nothing fetched.

**D5. Tab switching keeps state already in `App`.** `filters` (search text included) already lives in `App`, so Cards shows the list with its last search and filters with no new state; only the scroll position resets, which is accepted. Back semantics need no change to the handler: `list → dashboard` and `dashboard → exit` are already what tabs with a start destination do; tests are added to pin them for the bar's paths. Alternative: a history stack so back undoes each tab switch (Material advises against it, and it would let back loop between tabs).

**D6. Add card opens the form; the `scan` view and `ScanFlow.tsx` go.** `AddCard` becomes the button only (the sheet code is deleted), `onScan` disappears from `Dashboard`, `CollectionScreen` and `App`. `PhotoSlot` labels: "Scan front" / "Scan back" when the side has no photo, "Retake front" / "Retake back" when it has one, and "Pick front from photos" / "Pick back from photos" as today. Because the scanner and picker run as overlays while `CardForm` stays mounted, field values, suggestion markers and the other photo survive without new code; Cancel already drops the in-memory photos because they are stored only by `save`. The on-device recognition effect and the Identify with Claude button stay where they are. Alternatives: keep the sheet with a fourth "Enter by hand" path (the owner asked for no sheet); keep `ScanFlow` for its back prompt (the back slot on the form already is the prompt). Permission-denied and load-error messages stay in `PhotoSlot` as today.

**D7. Spec deltas: ADDED with new names, MODIFIED only where the base is in `openspec/specs/`.** `card-scanner` is MODIFIED (its two requirements name the old "Scan card" button). `app-shell` gets ADDED requirements and leaves "Hardware back button goes up one screen" alone, because the dashboard change MODIFIES that requirement and is not archived yet. `card-photos` and `collection-list` get ADDED requirements with new names. This leaves three sentences in unarchived changes describing the Add sheet or the separate back prompt: `redesign-ui-binder-pockets` collection-list ("The list leads with finding a card" and its "One add action" scenario, and "Add card" in the "Sheets clear the system bars" scenario), `add-dashboard-and-card-fields` dashboard ("the same single Add card button and sheet") and `add-collection-foundation` card-photos ("Camera capture on Android"). Task 1.1 corrects those sentences in place in the implementation branch (they are unarchived, so their delta text is still the place to fix them), so no main spec ever carries the sheet. Alternative: MODIFIED on those requirements here (fails to archive while the base change is unarchived); leaving them (the archived specs would contradict each other).

**D8. Layout: Add card sits 8 dp above the bar.** `.add-button` bottom becomes `inset + bar height + space-2`; `.list-scroller` and the dashboard's scroll end reserve `target-min + bar height + space-2 + space-4`. Rough budget at 360 by 800 with banner and a 48 dp inset: header and banner about 170 dp, search row 56, three rows 300, Add card 48 + 8, bar 64 + 48 inset: about 694 of 800, so three rows hold with about 100 dp spare. The gear frees header width but no height. If the e2e check fails, the bar drops to 56 dp before anything else changes. $0: CSS only.

**D9. Performance.** The bar is static markup; switching tabs remounts `Dashboard`, which recomputes the tiles once (one pass, measured under 1 s at 5,000 cards by the existing perf test), and remounts the virtualised list. No new data work, no extra re-render on sync state. The existing perf tests stay as they are, with their Browse collection entry.

## Risks / Trade-offs

- [Locators collide: the nav's "Cards" matches `getByRole("button", { name: "Cards" })` with the Cards tile "Cards, N", and "Settings" stays the gear's name] → tests scope nav queries to `getByRole("navigation", { name: "Main" })` and tile queries use `exact` names; smoke and dashboard tests are checked in task 2.
- [Android kills the app while the scanner is open on a low-memory phone, and the typed fields are lost] → out of scope; the scanner was already launched from a form-less view before, so this is no worse for scans and slightly worse only for text typed first. Noted for the phone check.
- [Two-item bottom bar breaks Material guidance] → owner request, recorded in DESIGN.md (D2).
- [Removing the sheet breaks many e2e flows (`Add card` → `Scan card` / `Enter by hand`, `Capture back` / `Skip back`)] → task 2 rewrites them before the code changes so they fail first.
- [The unarchived-change corrections in task 1.1 touch merged planning text] → they are wording fixes to keep the archived specs consistent, reviewed with this branch.

## Migration Plan

UI only, no data change. Ship in one debug build; rollback is reverting the branch.

## Open Questions

- Icons for Dashboard and Cards: the default is a 2 by 2 grid for Dashboard and a stacked-cards outline for Cards; the owner may pick others at the phone review without changing the specs.
- Exact bar height (64 dp, fallback 56 dp per D8) is settled by the 360 by 800 e2e check.
