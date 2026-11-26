## Why

The owner keeps a mental list of cards he is hunting for. Ruling T-57: a wanted card is a normal card in the collection with a Wanted mark, entered with the same form and synced through Drive like any other card, so the list is on the phone at a card show and survives a reinstall.

## What Changes

- A card gets an optional Wanted mark. Cards and Drive files saved before the mark have no field and count as owned. No schema version bump.
- The card form gets one checkbox, "Wanted (I don't have it yet)". Photos stay optional, so a wanted card needs none.
- The card detail of a wanted card shows a small Wanted tag and a "Mark as owned" action that clears the mark in one tap.
- The Filter and sort sheet gets a "Show" choice: Owned, Wanted or All, default Owned, so today's list, counts and dashboard links do not change. Wanted and All show as a removable chip; Owned (the default) shows none. Clear all returns to Owned.
- Wanted rows and grid tiles carry a "Wanted" tag in text, not colour alone.
- The dashboard counts owned cards only (tiles, Top teams, Top players, Recently added) and adds one quiet line "N wanted" under the tiles, shown when N > 0, that opens the list filtered to wanted cards.
- The duplicate check on Add compares owned cards only: a wanted card never offers "Increase quantity" and is never offered as the card to increase.
- Bulk edit does not offer Wanted as a field and keeps each card's mark as stored.
- Nothing new in the header or the bottom navigation.

Out of scope:
- Priority, maximum price or any other wish-list fields.
- Sharing or exporting the wish list.
- A "you already own this" hint when adding a wanted card that matches an owned one.
- Setting or clearing Wanted on several cards at once (bulk edit).
- A separate wish-list screen or navigation entry.
- Starting the Add form with Wanted ticked when the list shows wanted cards.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `card-catalog`: new Wanted mark on the card record (form checkbox, detail tag, Mark as owned, old cards count as owned); the duplicate check compares owned cards only.
- `collection-list`: Show Owned / Wanted / All in the Filter and sort sheet, the Wanted chip, the Wanted tag on rows and tiles, bulk edit leaves the mark alone.
- `dashboard`: every figure covers owned cards only; one "N wanted" line that opens the wanted list.

## Impact

- Domain: `src/domain/card.ts` (`Card.wanted?`), `src/domain/schema.ts`, `src/domain/query.ts` (`Filters.show`, `matcher`, `findDuplicate`), `src/domain/dashboard.ts` (`collectionStats`).
- UI: `src/app/CardForm.tsx`, `src/app/CardDetail.tsx`, `src/app/App.tsx` (Mark as owned wiring), `src/app/CollectionScreen.tsx`, `src/app/CardList.tsx`, `src/app/CardGrid.tsx`, `src/app/Dashboard.tsx`, `src/app/app.css`, `DESIGN.md`.
- Sync: no code change. `src/sync/merge.ts` keeps whole card objects, so the field rides along; a test pins that.
- No new dependency, no Drive format change, no cost.
