## Context

`top()` in `src/domain/dashboard.ts` sorts both Top teams and Top players by count, then by the entry's name with `Intl.Collator`. For players the name starts with the first name. `lastNameKey(card)` in `src/domain/query.ts` already gives the list's sort key: the Sort name when set, the whole player text for a team card, else the last name with suffixes dropped.

## Decisions

- **Tie key comes from `lastNameKey`, kept in a side map per player.** While the one pass groups cards by normalized player, a second map holds `{ key, explicit }` per player; `top()` takes it as an optional argument, so Top teams (no map) still compare names. Order: count descending, then key, then full name.
  Alternatives: add a `sortKey` field to `TeamStat` (leaks a list-only detail into the type the screen and teams share); re-sort players in the screen (a second place that must know the rule). $0: no dependency, no service.

- **One key per player from the first non-empty Sort name, else the first card met.** A player's cards are one entry, so one key is needed. A Sort name is the owner's explicit wish, so it beats a derived key; among several Sort names the first in card order wins, which keeps the result stable for one list order.
  Alternatives: the smallest key over all cards (changes when an unrelated card is added); always the first card's key (ignores a Sort name set on a later card). $0: none.

- **A team card or multi-player card uses `lastNameKey` as it is.** "Atlanta Braves Team Card" sorts under A, "Mike Trout / Shohei Ohtani" under Trout, as in the Cards list. Alternative: a dashboard-only rule (two rules for one idea). $0: none.

## Risks

- A player whose cards disagree (one has a Sort name, others do not) sorts by the Sort name. Intended.
