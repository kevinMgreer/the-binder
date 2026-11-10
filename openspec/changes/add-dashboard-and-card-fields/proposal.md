## Why

The owner opens the app to see what the collection holds, not only to find one card: how many autos, relics, numbered cards, Topps Gold and Braves cards there are. Today the first screen is the list, and those numbers need a filter each. Two card fields also fall short: condition is free text, so the same condition is spelled several ways, and a card has only a Set, with no place for the subset or insert it belongs to.

## What Changes

- **Condition picklist.** On the add and edit form, a raw card's condition is picked from a fixed list: Mint, Near Mint, Excellent, Very Good, Good, Fair, Poor (or left unset). Graded cards keep their free-text company and grade fields. Existing free-text conditions are kept as they are: a value that matches a list entry ignoring case shows as that entry; any other value shows as its own extra choice and is saved unchanged unless the owner picks another.
- **Subset and Insert fields.** Two optional text fields next to Set. They are shown on the card detail screen, included in text search, and offered as filters in the filter sheet.
- **Data file version 2.** The Drive data file's `schemaVersion` goes from 1 to 2. Cards written before this change have no subset or insert and still load, display, edit and sync; a version 1 file is read as is and rewritten once as version 2 on the first sync, with the same cards. No card is changed.
- **Dashboard landing screen.** The app opens on a dashboard instead of the list. It shows a fixed set of stat tiles in this order: Cards (total, counting quantity), Distinct, Autos, Relics, Serial-numbered, Topps Gold, Atlanta Braves. Tapping a tile opens the collection list with that tile's filter applied (shown as chips, removable as today); a Browse collection button opens the list unfiltered. Stats are computed in one pass over the cards and only when the cards change.
- **Filters gain Manufacturer, Subset and Insert,** and the text filters (team, set, parallel, manufacturer, subset, insert) match ignoring case and accents, so a tile's count always equals the number of rows its list shows.
- **Navigation.** Android back from the list returns to the dashboard; back on the dashboard closes the app. Settings, scan and the add form return to the screen that opened them. No screen gets an on-screen Back control. The list's filters survive opening a card and coming back.

Out of scope:
- Tiles the owner can add, remove or reorder; the set is fixed (see design D5).
- Charts, trends over time, or value/price statistics.
- Filtering or sorting by condition.
- Recognising subset or insert from photos (OCR or Claude); the identification prompt and parser are unchanged.
- Rewriting stored condition values to the new list, or any bulk data migration.
- Guarding older app versions against the new file version (they cannot be changed; see design Risks).
- Showing subset or insert on the list row; the row content stays as the collection-list spec defines it.

## Capabilities

### New Capabilities
- `dashboard`: the landing screen with fixed stat tiles that open the list pre-filtered, its performance budget at 5,000 cards, and its look in both themes.

### Modified Capabilities
- `card-catalog` (ADDED requirements only): "Subset and insert", "Raw condition picklist", and "Filters ignore case; subset, insert and manufacturer filters". The capability is defined by the unarchived `add-collection-foundation` change, so its existing requirements are extended, not MODIFIED.
- `drive-storage` (ADDED): "Older data files keep working": the file carries version 2, and version 1 files and cards without the new fields keep loading and syncing. Also defined by `add-collection-foundation`.
- `collection-list` (ADDED): "The list returns to the dashboard" (by the Android back button) and filters kept across opening a card. Defined by the unarchived `redesign-ui-binder-pockets` change.
- `app-shell` (MODIFIED): "Hardware back button goes up one screen" closes the app from the dashboard, not the list, and returns from Settings to the screen that opened it.

## Impact

- Domain: `src/domain/card.ts` (`Card.subset`, `Card.insert`, `CONDITIONS`, `CollectionFile.schemaVersion`), `src/domain/schema.ts`, `src/domain/query.ts` (`Filters`, `applyFilters` split into `matches`), new `src/domain/dashboard.ts` (tile list and one-pass stats).
- Sync: `src/sync/engine.ts` (`file()` writes version 2; the no-change skip in `pullMergePush` also requires the remote file to be version 2). `src/sync/merge.ts` and `src/adapters/drive-remote-store.ts` need no change; the merge and engine tests gain version 1 cases.
- UI: `src/app/App.tsx` (dashboard view, lifted filter state, back handling), new `src/app/Dashboard.tsx`, `src/app/CollectionScreen.tsx` (controlled filters, new filter fields, Back), `src/app/CardForm.tsx` (condition select, subset and insert inputs), `src/app/CardDetail.tsx`, `src/app/app.css` (tile grid on existing tokens), `DESIGN.md` (stat tile component; the three single-add-button lines reworded to one add button per screen).
- Dev and tests: `src/dev/seed.ts`, unit tests beside the domain and sync files, and every e2e spec that starts on the list (they first open the collection from the dashboard).
- Archive order: none required. The deltas to capabilities from unarchived changes are ADDED only, so this change archives on its own.
- No new dependency, service or cost; the $0 constraint holds.
