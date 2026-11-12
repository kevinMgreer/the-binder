## Why

The owner finds the top of the Cards screen clunky and overly full: a Filter button in the search row and a "Sort: Last name ↑" button in the "Showing N" row, each with its own sheet. Sort and filter both answer "which cards, in which order", so one button and one sheet do the job with one control less on the first screen.

## What Changes

- The search row keeps one button, "Filter & sort" on screen (accessible name "Filter and sort", or "Filter and sort, N applied"), with the existing applied-filters badge.
- That button opens one full-height sheet named "Filter and sort". It starts with the sort choice (Sort by: Last name, Year, Team, Set; Direction: Ascending, Descending; a choice applies at once, as today), followed by the existing filter groups and the existing footer (Show N cards, Clear all).
- The sort choice is not a filter. It is never counted in the badge, it shows no chip, and Clear all keeps it (Clear all also still keeps the search text).
- **BREAKING (UI)**: the separate Sort button and the compact Sort sheet are removed. The "Showing N" row becomes the count and the current order as plain, quiet text ("Showing 5000 · Last name ↑", read aloud as "sorted by Last name, ascending") on the left, with the one List / Grid view button on the right. The order text is not tappable.
- Every sort behaviour stays: Last name ascending by default and on every fresh start, applied to the filtered cards, ties broken by year, then set, then number, descending as the exact reverse, the order kept while the app runs and never stored.
- Every filter behaviour stays: the same groups and fields, chips, badge, Show N cards, and Clear all keeping the search.
- The first screen still shows at least three list rows or two rows of grid tiles above the bottom navigation.

Out of scope: moving or restyling the sync actions, restyling the header or the title row, new sort fields (the four orders stay), storing the sort order, changing the filter fields, chips or the grid.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `collection-list`: "The list leads with finding a card", "The first screen holds with the bottom navigation", "The active filter is clear", "The user chooses list or grid view" (the button now sits at the right end of the Showing row, with no Sort button beside it) and "Sheets clear the system bars" are modified. "The user chooses the list order" is removed and replaced by the added "The list order is chosen in the Filter and sort sheet", which keeps every sort rule.
- `app-theme`: "Every screen wears the card-back look" swaps its Filter sheet and Sort sheet lines for one Filter and sort sheet line.

## Impact

- Code: `src/app/CollectionScreen.tsx` (one button, one sheet, the order text in the Showing row) and `src/app/app.css` (the order text and a visually hidden helper). `src/app/App.tsx`, `src/domain/query.ts` and `src/app/Sheet.tsx` stay as they are (the `compact` prop stays because `PhotoSlot` uses it).
- Tests: `src/app/list-sort.test.tsx`, `src/app/back-button.test.tsx`, `e2e/design.spec.ts`, `e2e/catalog.spec.ts`, `e2e/grid.spec.ts` and `e2e/fonts.spec.ts` use the Sort button, the "Sort" dialog, the "Filters" dialog name or the exact "Filter" button name.
- Docs: `DESIGN.md` (Chips and badge, the Sort button paragraph, the view switch paragraph) and `docs/device-checklist.md` (the sort-order, Sort sheet and Cards grid lines, plus a new phone check).
- Order: depends on `cards-grid-view` being archived first (see design.md).
- No dependency, no storage, no cost change.
