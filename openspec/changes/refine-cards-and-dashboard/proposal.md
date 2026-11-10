## Why

The owner wants the two top-level screens calmer and more useful. The Cards screen repeats totals the dashboard already shows, the sync state takes a line of its own on both screens, and the list row crops every photo into a portrait frame, so landscape cards (horizontal designs, many inserts) lose their sides. The dashboard carries two tiles for one team and one parallel that the owner now reaches through the Filter, and it shows nothing about what was added lately.

## What Changes

- Cards screen: remove the "N cards, N distinct" line. The "Showing N" line stays; totals live on the dashboard's Cards and Distinct tiles.
- Both top-level screens: the sync state moves onto the title row, between the title and the Settings gear, as a compact dot and words. Same six states and wording, now a `role="status"` region. "Sign in again" and the missing-file choice stay in the header, beneath the title row.
- Cards list row: the thumbnail takes the photo's own orientation, landscape or portrait, and shows the whole photo without cropping, in a fixed square slot, so rows stay 100 dp tall for the virtualised list. Works for existing photos with no migration.
- Dashboard overhaul, same Nine-Pocket Binder look:
  - **BREAKING (owner-visible):** remove the Topps Gold and Atlanta Braves tiles.
  - Keep Cards, Distinct, Autos, Relics, Serial-numbered.
  - Recommended additions (owner can strike any at review, see design.md): a Rookies tile, a "Recently added" strip of the last four cards (tap opens the card), and a "Top teams" list of up to five teams (tap opens Cards filtered to that team).
  - Still one pass over the cards, recomputed only when the cards change.
- Back from a card opened on the dashboard returns to the dashboard.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard`: tile set changes (Topps Gold and Atlanta Braves removed, Rookies added), new Recently added and Top teams groups, header layout, one-pass rule extended to the new groups, design-system scenarios updated for six tiles.
- `collection-list`: no count line, sync state on the title row as a status region, orientation-aware row thumbnail.
- `app-shell`: title row holds the sync state, no count line beneath the title, back from a card returns to the screen it was opened from (dashboard or list), Add card clears the dashboard's last item.

## Impact

- Code: `src/domain/dashboard.ts` (tiles, recent cards, top teams in one pass), `src/domain/query.ts` (`summarize` becomes unused and is deleted), `src/app/Dashboard.tsx`, `src/app/CollectionScreen.tsx`, `src/app/CardList.tsx` (`Thumb`), `src/app/SyncIndicator.tsx` (split status from its actions), `src/app/App.tsx` (detail view remembers where it was opened from), `src/app/app.css`.
- Tests: `src/domain/dashboard.test.ts`, `src/domain/query.test.ts`, `src/app/dashboard-memo.test.tsx`, `src/app/back-button.test.tsx`, and every e2e spec that waits on `data-testid="summary"` (`e2e/helpers.ts`, `auth`, `catalog`, `photos`, `sync`, `design`, `dashboard`).
- Docs: `DESIGN.md` (stat tile, dashboard groups, list row thumbnail, header and sync status).
- No data, schema, sync or Drive change. No new dependency.
