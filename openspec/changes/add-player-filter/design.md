## Context

`Filters` in `src/domain/query.ts` is the one predicate behind the list, its chips and the dashboard tiles. Search joins player, team, set, subset, insert and notes into one string. The sheet's text-valued filters (team, set and so on) are selects over existing values; the filter sheet has no free-text field.

## Goals / Non-Goals

**Goals:**
- Match on the player field only, with the same case and accent folding as Search.

**Non-Goals:**
- No change to the Search box, no autocomplete list, no dashboard tile for it, no saved filters.

## Decisions

- **Free-text field, not a select.** A partial name is what people type, and player names are the longest list in a binder. It reuses `key()` and `normalize()` so folding matches Search.
  Alternatives: a select of distinct players (long list, exact match only); narrowing Search itself to player (loses team, set and notes search). $0: no dependency.
- **Substring match.** "acuna" finds "Ronald Acuña Jr.".
  Alternatives: exact match (misses partial names); prefix match (misses last names). $0: no dependency.
- **Placed first in the Card group.** It is the filter people reach for most. The chip text is the typed value, named "Player", like the other chips. The chip and badge count appear only when the trimmed text is not empty, since `key()` trims and a blank field filters nothing.
  Alternatives: a new "Player" group (a heading for one field); the top of the sheet (breaks the existing grouping). $0: no dependency.
- **Clear all** resets it with the rest; `clearAll` already keeps only the search text.
  Alternatives: none; it is the existing behaviour. $0: no dependency.

## Risks / Trade-offs

- A field and a Search box that both find players may look redundant; the sheet field is the exact-scope one. Accepted.
