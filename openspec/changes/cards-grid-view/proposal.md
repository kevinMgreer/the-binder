## Why

The Cards screen shows one card per 112 dp row, so a screen holds about four cards and the owner finds a card by reading names. Many cards are easier to spot by their front photo. The owner wants to choose between today's list and a grid of photo thumbnails.

## What Changes

- A List / Grid view toggle on the Cards screen: two 48 dp icon buttons ("List view", "Grid view", `aria-pressed`) in the "Showing N" row, left of Sort.
- **List** is today's list, unchanged.
- **Grid** shows each card as a tile: its front thumbnail in the existing trading-card frame (whole photo, never cropped; the placeholder frame when there is no front photo), with a two-line caption under it (player; year, with a "×N" quantity badge when the quantity is above one). 3 columns on a phone of 360 dp, 4 from 480 dp wide. A tap opens the card, like a row.
- The grid is virtualized like the list, so a 5,000-card collection stays fast; it uses the stored 320 px thumbnails and never downloads a photo.
- Search, filters, chips, the "Showing N" count, Sort, and the empty and no-match states apply to both views.
- The chosen view is kept on the device and survives a relaunch. Sort still resets on a fresh start, as today.
- Back from a card returns to that card in the view it was opened from (scrolled into view and focused), in both views. Today the list returns to its top.
- TalkBack reads a tile as "Player, year set, number N"; the grid is a list of list items.
- DESIGN.md gains a "Card grid" component entry; the device checklist gains a phone check.

## Out of scope

- Pinch-to-zoom between column counts.
- A setting for the number of columns.
- Grouping or section headers (by year, team or set).
- New sort options.
- A serial stamp on grid tiles (the tile's caption stays two short lines).
- Any change to the list rows themselves (row height and thumbnail are set by `photo-detail-polish`).
- Larger or re-generated thumbnails.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `collection-list`: the screen layout and the first-screen rule name the view toggle and the grid; new requirements for the toggle and its persistence, the grid tiles and their virtualization, and the return to the opened card.
- `app-theme`: "Photos sit in trading-card frames" also covers the grid tiles.

## Impact

- Code: `src/app/CollectionScreen.tsx` (toggle, view switch), `src/app/App.tsx` (view state and storage, last opened card), new `src/app/CardGrid.tsx`, `src/app/CardList.tsx` (return to the opened card), `src/app/Icon.tsx` (list and grid icons), `src/app/app.css`.
- Tests: new unit tests beside `src/app/list-sort.test.tsx`; e2e in `e2e/design.spec.ts`, `e2e/catalog.spec.ts` or a new `e2e/grid.spec.ts`, and `e2e/perf.spec.ts`.
- Docs: `DESIGN.md`, `docs/device-checklist.md`.
- No new dependency (`@tanstack/react-virtual` is already used and supports lanes), no network calls, no stored personal data. $0.
- Archives after `photo-detail-polish`.
