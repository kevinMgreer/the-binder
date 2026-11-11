## Context

`Filters` in `src/domain/query.ts` is the one predicate behind the list, its chips and the dashboard tiles. Search joins player, team, set, subset, insert and notes into one string. The sheet's text-valued filters (team, set and so on) are selects over existing values; the filter sheet has no free-text field.

## Goals / Non-Goals

**Goals:**
- Match on the player field only, with the same case and accent folding as Search.

**Non-Goals:**
- No change to the Search box, no autocomplete list, no dashboard tile for it, no saved filters.

## Decisions

- **Free-text field, not a select.** Player names are the longest list in a binder and a partial name is what people type. It reuses `key()` and `normalize()` so folding matches Search.
- **Substring match.** "acuna" finds "Ronald Acuña Jr."; an exact-match select would not.
- **Placed first in the Card group.** It is the filter people reach for most. Chip text is the typed value, named "Player", like the other chips.
- **Clear all** resets it with the rest, as `clearAll` already keeps only the search text.

## Risks / Trade-offs

- A field and a Search box that both find players may look redundant; the sheet field is the exact-scope one. Accepted.
