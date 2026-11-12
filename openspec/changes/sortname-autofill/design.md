## Context

`lastNameKey(card)` in `src/domain/query.ts` returns the sort name when set, else derives the last name (team card keeps its whole text, first of several players, suffixes dropped). `dashboard.ts` treats a non-blank `sortName` as an explicit tie key and otherwise falls back to `lastNameKey`.

## Decisions

- The field value is derived with `lastNameKey` on a card with the current Player and Team and no sort name, so the form can never disagree with sorting.
- A form-local `follow` flag decides whether the field tracks Player and Team. It starts true for a new card and for a card with no stored sort name, and false for a card with a stored one: a stored sort name is never changed on its own. Typing in the field sets it to whether the field is now blank, so clearing it by hand turns following back on (the field stays blank until Player or Team next changes). Suggestions from a photo go through the same Player change, so they fill it too.
- The initial draft of a card with no stored sort name already shows the derived value, so opening and closing the form is not "dirty".
- Saved value: the trimmed field text, or none when it equals the derived value. A card whose stored sort name is unchanged is saved as it was. This keeps old cards, derived cards and the dashboard's explicit-versus-derived tie keys exactly as they are, and needs no migration or schema version change.

## Risks

- The derived key of a stored-blank old card shows in the field when it is edited; saving without touching it stores nothing new.
