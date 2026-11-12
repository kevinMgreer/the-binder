## Context

Today `src/app/CollectionScreen.tsx` renders, under the header: the search row (Search field, then a Filter button with the applied-filters badge), the chips, then `.shown-row` with "Showing N", the List / Grid flip button and a "Sort: Last name ↑" button. Sort opens a compact `Sheet` named "Sort" (Order and Direction radios, Close only); Filter opens a full-height `Sheet` named "Filters" with five groups and a footer (Show N cards, Clear all). The sort state lives in `App.tsx` (`useState<Sort>(defaultSort)`), so it already survives opening a card and resets on a fresh start; `sortCards` and `applyFilters` in `src/domain/query.ts` do the work. None of that changes.

**Archive order.** `cards-grid-view` is being archived in a parallel PR (`archive-grid-view`). This change's deltas are written against the main spec as that archive leaves it: they modify "The user chooses list or grid view" (added by `cards-grid-view`) and keep the scenario names `cards-grid-view` introduced ("Toggle shares the Showing line", "First screen in Grid view", "Last tile reachable"). `openspec validate --strict` passes today with one INFO line saying archive would refuse the MODIFIED "The user chooses list or grid view" until that requirement exists. **This change archives after `cards-grid-view`.**

## Goals / Non-Goals

**Goals:**
- One button and one sheet for filtering and ordering, with the order shown as text so it stays visible.
- Keep every sort and filter rule exactly as specified.
- Keep the first screen at three list rows or two grid rows.

**Non-Goals:**
- Moving the sync actions, restyling the header, new sort fields, storing the order, changing filter fields, chips or the grid.

## Decisions

- **Visible label "Filter & sort", accessible name "Filter and sort".** One button in the search row reads "Filter & sort" with the existing badge after it; `aria-label` is "Filter and sort" or "Filter and sort, N applied" (today's pattern, now always set). At 360 dp the content is 312 dp wide: about 100 dp of text plus 2 x 16 dp padding plus a two-digit badge (8 dp gap, 24 dp pill) is about 164 dp, which leaves the Search field about 140 dp, enough for its "Search" placeholder; the scenario sets the floor at 120 dp with the badge "12", the 48 dp height and one line. If it does not fit, the implementer trims the button's side padding to `--space-3`, not the label.
  Alternatives: "Filter" plus a sort glyph (narrower by about 50 dp, but a glyph alone does not tell the owner that sort now lives behind this button, and it needs a new icon path); "Filter and sort" written out (about 30 dp wider, squeezes Search); keeping two buttons side by side (what the owner called clunky). $0: none, text and CSS only.

- **The sheet: "Filter and sort", Sort first.** The full-height `Sheet` is renamed "Filter and sort". Its body starts with two groups taken as they are from the Sort sheet, "Sort by" (four radios in one column) and "Direction" (Ascending and Descending in a `.pair` row), then the five filter groups, then the footer as today. The order heading changes from "Order" to "Sort by" because in a shared sheet "Order" alone is unclear. A radio change calls `onSortChange` at once, as today; Show N cards, Close, back and the scrim close the sheet. The compact Sort sheet and its open state (`sortOpen`, `closeSort`) are deleted; `Sheet`'s `compact` prop stays because `PhotoSlot` uses it.
  Alternatives: a sort row in a menu popup from the button (a second surface again, and a popup menu needs its own focus and dismiss handling); a sort chip in the chips row (puts a permanent chip on the first screen, mixing a non-removable order with removable filters); Sort as a collapsed section at the bottom (hidden below five groups). $0: none.

- **The order is not a filter.** The badge counts `applied` (filters only), as now; no chip for the order; `clearAll` keeps `{ search }` as now and does not touch `sort`, because it never did (sort is a separate prop). Recorded as a rule so a later change does not fold sort into `Filters`.
  Alternative: Clear all also resets the order to Last name ascending (surprising: "clear filters" would move the list the user just ordered). $0: none.

- **The Showing row: count, order text, flip button.** `.shown-row` holds `p.shown` and the flip button. Inside `p.shown`: `<span data-testid="shown">Showing N</span>` (the test id moves from the paragraph to this span so every `toHaveText("Showing N")` check stays exact), then `<span data-testid="order"><span aria-hidden="true"> · Last name ↑</span><span class="visually-hidden">, sorted by Last name, ascending</span></span>`. The paragraph keeps the muted uppercase label style, `flex: 1; min-width: 0`. A `.visually-hidden` rule goes in `app.css` (the same clip pattern `.search-row .field > label` already uses; that rule may then use the class). "SHOWING 5000 · LAST NAME ↑" at label size is about 210 dp, which fits the 256 dp left of the 48 dp button and 8 dp gap at 360 dp.
  The order text is plain text, not tappable (assumption from the brief). Alternative: tapping it opens the sheet scrolled to Sort (a second way into the same sheet, and a text-styled control that does not look tappable fails the "looks like what it does" rule; can be added later without a spec conflict on the rest). $0: none.

- **Scenario names kept on purpose.** `openspec archive` refuses a MODIFIED block that drops a scenario name the main spec has. "Sort button shares the Showing line" (in "The list leads with finding a card") keeps its name and now checks that no Sort button exists and the order text sits in the Showing row. "The user chooses the list order" is REMOVED and its rules move unchanged into the ADDED "The list order is chosen in the Filter and sort sheet", because its scenarios about the compact Sort sheet ("The Sort sheet does not fill the screen", "Close is the only close control") cannot honestly be kept.
  Alternative: MODIFIED with every old scenario name kept and rewritten (names that describe a sheet that no longer exists). $0: none.

## Risks / Trade-offs

- [The sort groups push the filter groups about 300 dp down the sheet, so Year and Card start below the fold at 800 dp.] → The sheet scrolls and its footer is pinned; the phone check asks the owner whether it feels long.
- [The order text and the count share one line; at a large system font it may wrap.] → The paragraph may wrap to two lines (it is `min-width: 0` in a flex row), the button keeps its 48 dp; the one-line check is at the default text size only.
- [Test churn: about 15 places name the Sort button, the "Sort" dialog, the "Filters" dialog or the exact "Filter" button name.] → Listed file by file in tasks.md; the unit tests change first.
- [The "Filter" button selector `/^Filter/` in many e2e tests keeps matching "Filter and sort".] → Only the exact-name and `toHaveText("Filter")` checks need rewriting.

## Open Questions

- Owner: is "Filter & sort" the right visible label, or "Filter" with a sort glyph? (Recommended: "Filter & sort".)
- Owner: should a tap on the order text open the sheet at Sort? (Assumed no.)
- Owner: confirm Clear all keeps the order (assumed yes, recorded as a rule).
