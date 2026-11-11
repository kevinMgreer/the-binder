## Why

The owner finds the current "Nine-Pocket Binder" look (see-through pockets on a flat grey page, yellow accent) neither modern nor interesting, and rejected the louder "circus" cardboard draft. The owner chose "Card-Back Calm" (light) and "Night Game" (dark): the app reads like the back of a baseball card, with cardboard cream, one navy ink, stat-line type and photos in real trading-card frames. This is a visual-system change only; every screen keeps the information it shows today.

## What Changes

- New palettes per theme, replacing the grey page, white surface and pocket colours: Card-Back Calm (cream ground, navy ink and rules, ink-filled primary button, red only on the Rookies flag) when the phone is light; Night Game (deep navy ground, lighter navy panels, cream text and cream-filled primary button, lifted red flag) when the phone is dark.
- Two bundled font faces, licence free, loaded from the app with no network: a slab face for titles and numbers (tabular figures) and a sans face for body and uppercase labels. New type scale: 12 label, 14 body, 16 button label, 18 table number, 28 title, 32 stat number (CSS px).
- New shared marks (owner phone review: the red double-stitch seam is dropped; whitespace and a single 1 px rule separate sections): ruled stat tables with thin rules, and the trading-card frame (2.5:3.5, rotated for a landscape photo, 6 px radius, keyline, inner print border).
- Red is held back to the Rookies flag, plus error text in its own danger colour. The primary action of a screen is an ink-filled button (no gold); chips and tags are never primary-styled. Spacing is more open, from new spacing tokens (gutter 24 px, sections 32 px, cells 16 px).
- Screens restyled: dashboard (six totals as a 2x3 ruled stat table, Recently added as four trading-card frames, Top teams as a ruled stat table, ink-filled Add card), Cards list (ruled rows with framed thumbnails, ink chips, stamp-style serial tag), card detail (framed photo strip, ruled facts), card form, Settings, Filter sheet, dialogs and banners, bottom navigation (bolder ink label and ink icon on the active tab, no underline).
- **BREAKING (visual)**: the pocket treatment, the see-through pocket colours and the pill indicator are removed. Requirements that name the pocket look are modified or removed. No data, storage or behaviour change.
- `DESIGN.md` is rewritten for the new system at finish.

Kept as they are: 48 dp touch targets with 8 dp between neighbours, 100 dp list rows, the 5,000-card performance budgets, orientation-aware thumbnails, WCAG AA contrast in both themes, the theme following the phone.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `app-theme`: tokens gain the two named palettes, fonts, type scale, stitch, rules and frame ratio; contrast rule drops the pocket and covers the new pairs; new requirements for bundled fonts, the stitch seam, trading-card frames and the per-screen card-back look.
- `dashboard`: the design-system requirement describes a ruled stat table, trading-card frames and a ruled Top teams table instead of tappable pockets.
- `collection-list`: "Each card is a pocket row" becomes a ruled row with a framed thumbnail; the serial tag is an ink stamp instead of accent colour; the detail screen's photo strip uses trading-card frames.
- `app-shell`: the active bottom-navigation tab is marked by ink colour, heavier weight and an ink-filled icon instead of a pill indicator in the accent colour; there is no line under the tabs.

`card-catalog` has no requirement that names the old look, so it is not changed.

## Out of scope

- Any change to what a screen shows: labels, numbers, captions, field lists and order stay the same (the mock's longer Recently added captions are not adopted; the caption stays the player name, on at most two lines then an ellipsis, by the owner's decision).
- Behaviour: navigation, back handling, filters, sync, photos, identification.
- An in-app theme switch, more themes, animations or texture images.
- New fonts beyond the two named faces, icon changes, the app launcher icon and splash artwork.
- Phone checks blocking archive: they move to `docs/device-checklist.md`.

## Impact

- Code: `src/app/tokens.css`, `src/app/app.css`, `src/main.tsx` (font imports), `src/app/Dashboard.tsx`, `src/app/BottomNav.tsx`, `src/app/CardList.tsx`, `src/app/Thumb.tsx`, `src/app/CardDetail.tsx`, `src/app/PhotoSlot.tsx`, `src/app/CardForm.tsx`, `src/app/SettingsScreen.tsx`, `src/app/Sheet.tsx`, `src/app/CollectionScreen.tsx`, `src/app/SyncIndicator.tsx`.
- Tests: `src/app/tokens.test.ts`, `e2e/design.spec.ts`, `e2e/dashboard.spec.ts`, a new fonts check.
- Dependencies: two font packages (font files bundled into the APK by Vite), $0, no runtime network.
- Docs: `DESIGN.md`, `docs/device-checklist.md`.
- APK size grows by the font files (latin subset, the weights used only).
