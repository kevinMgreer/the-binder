## Why

Top players puts players with the same number of cards in "alphabetical order" of the whole name, which starts with the first name: Babe Ruth lists before Hank Aaron. The Cards list already sorts by last name (`add-list-sort`); the dashboard should match.

## What Changes

- Top players: ties on the number of distinct cards are ordered by the player's last name, the same key the Cards list uses (the card's Sort name when it has one, else the last name derived from Player). Equal keys fall back to the full name.
- A player can have several cards: the key comes from the first non-empty Sort name among that player's cards, else from the first card met.
- The count still ranks first. Top teams ties are unchanged.

## Capabilities

### Modified Capabilities

- `dashboard`: the "Top players" requirement's tie rule.

## Out of scope

- Top teams (ties stay in name order).
- Changing how the last name is derived (`lastNameKey` in `src/domain/query.ts`).
- Showing the player name differently; entries still show the first spelling met.

## Impact

- Code: `src/domain/dashboard.ts` and `src/domain/dashboard.test.ts`. No data change, no new dependency, no cost.
