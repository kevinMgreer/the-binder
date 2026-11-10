## Context

See proposal.md for why. The code this change lands on:

- `Card` (`src/domain/card.ts`) already has `manufacturer`, `team`, `parallel.name` and `flags.autograph` / `flags.relic`, so every tile the owner asked for is expressible without new trait flags. `isSerialNumbered` (`src/domain/format.ts`) already counts a print run with an unreadable serial.
- `grading` is a union; the raw branch holds `condition: string`, validated by zod as any string (`src/domain/schema.ts`).
- `applyFilters` (`src/domain/query.ts`) compares team, set and parallel with `!==`, so "Atlanta Braves" and "atlanta braves" are different values today.
- The Drive file is cast, not parsed: `DriveRemoteStore.readCollection` returns `response.json() as CollectionFile`, the engine ignores `schemaVersion` on read and writes `1` in `SyncEngine.file()`. `merge` returns the input card objects, so fields it does not know survive a pull-merge-push. Dexie stores cards keyed by `id` only.
- `CardForm.toCard` rebuilds a card field by field from the draft, so any field it does not list is dropped when a card is edited.
- `App.tsx` holds a `View` union with `list` as home; `CollectionScreen` owns its filter state, which is lost whenever the user opens a card.
- `add-collection-foundation` and `redesign-ui-binder-pockets` are not archived yet; `card-catalog`, `drive-storage` and `collection-list` live only in those changes. This change therefore only ADDs requirements to those three capabilities (new requirement names, no MODIFIED), so it archives on its own in any order; `app-shell` is in `openspec/specs/` and is MODIFIED.

## Goals / Non-Goals

**Goals:**
- Tile numbers and the list they open come from the same predicate, so they cannot disagree.
- Old files and old cards need no migration step.

**Non-Goals:**
- A general statistics engine or configurable tiles.
- A schema version check on read (no version above 2 exists to guard against).

## Decisions

### D1. Subset and insert are optional strings on `Card`
`Card` gains `subset?: string` and `insert?: string`; zod gets `z.string().optional()`; readers use `card.subset ?? ""`. The form always writes a string (empty when blank).
- Alternative: required strings plus an upgrade step on every read path (Drive read, Dexie list, Dexie get). More code, three places to miss, and a Dexie version bump. Rejected.
- Alternative: a nested `{ set, subset, insert }` object. Breaks every reader of `card.set`. Rejected.
- $0: no new service or dependency.

### D2. Data file version 2, read leniently
`CollectionFile.schemaVersion` becomes `1 | 2`; `SyncEngine.file()` writes `2`. `pullMergePush` today skips the write when every merged card equals the remote one (`src/sync/engine.ts` around line 253); that skip also requires `remoteData.file.schemaVersion === 2`, so the first sync after the update rewrites a version 1 file as version 2 once. Reading stays as it is: any version is accepted and cards are used as stored, so version 1 files load. No card is changed for the bump; the rewrite carries the same card objects, and a card only changes when it is edited. Tests cover a version 1 file round trip in `engine.test.ts` and a missing-field card in `merge.test.ts`.
- Alternative: keep version 1 (the fields are optional, so nothing strictly needs the bump). Rejected because the owner asked for the bump and a reader of the file in Drive should see that its shape changed.
- Alternative: reject unknown versions on read. Deferred (non-goal): nothing newer exists and older APKs cannot be made to honour it.
- $0: unchanged storage.

### D3. Editing keeps fields the form does not know
`toCard` starts from `...existing` before the form's fields, so a field this version does not edit (today none, later any) survives an edit. One spread; it closes the hole that drops data on edit for every future field.
- Alternative: leave as is. The next field added would repeat this design's risk. Rejected.

### D4. Condition is a select over a fixed list; storage unchanged
`CONDITIONS = ["Mint", "Near Mint", "Excellent", "Very Good", "Good", "Fair", "Poor"] as const` in `src/domain/card.ts`. The form's Condition becomes a `<select>` with an empty "Not set" option plus the list. When the draft's value matches an entry ignoring case, `toDraft` maps it to that entry; when it matches none, the select adds one extra `<option>` with the stored value, selected, so saving without touching it keeps it. The schema keeps `condition: z.string()`, so legacy values stay valid and nothing is migrated.
- The list follows the raw-card terms collectors use (the PSA scale's names without the half-steps and Gem Mint, which is a grading-company term). Fair is added between Good and Poor because it is a standard step.
- Alternative: zod enum for condition. Would make every legacy card invalid. Rejected.
- Alternative: rewrite legacy values on sync. Silent data change. Rejected.
- Alternative: a combo box (list plus free text). Keeps the spelling drift the owner wants gone. Rejected.
- Graded cards keep free-text company and grade (owner request).
- $0: no change.

### D5. A fixed set of seven tiles, defined as filters
`src/domain/dashboard.ts` exports `TILES: { label: string; filters: Partial<Filters> | null; count: "total" | "distinct" | "match" }[]`:

| Tile | Filters | Counts |
| --- | --- | --- |
| Cards | none | sum of quantity |
| Distinct | none | cards |
| Autos | `{ autograph: true }` | matching cards |
| Relics | `{ relic: true }` | matching cards |
| Serial-numbered | `{ serialNumbered: true }` | matching cards |
| Topps Gold | `{ manufacturer: "Topps", parallel: "Gold" }` | matching cards |
| Atlanta Braves | `{ team: "Atlanta Braves" }` | matching cards |

"Topps Gold" means manufacturer equals "Topps" and the parallel name equals "Gold", both after `normalize` and trim. "Gold Refractor", "Gold Foil" and Bowman cards do not count. Autos and Relics use the existing flags; no new trait flag is needed.

Match tiles count distinct cards, so the list a tile opens shows exactly the tile's number of rows ("Showing N").
- Alternative: owner-pickable tiles stored in settings. Needs a settings store, a picker UI and a sync story for the choice, for a single owner whose wishes fit in seven tiles. Rejected; a tile is one line in `TILES` to add later.
- Alternative: count quantity on every tile. Then the tile and the list it opens disagree. Rejected.
- $0: no change.

### D6. One predicate, one pass
`applyFilters` is split into `matches(card, filters): boolean` and `applyFilters = cards.filter(c => matches(c, f))`. `collectionStats(cards)` loops over the cards once and, per card, adds quantity to the total and runs `matches` for each match tile. `Dashboard` calls it inside `useMemo(() => collectionStats(cards), [cards])`, so it recounts only when the cards list it is given changes, not on a re-render for a sync state or update-banner change. `useCards` sets a new array after every finished sync even when no card changed, so one recount per sync remains; at one pass that is cheap, and avoiding it is not worth a deep compare. Tile filter values are normalized once, outside the loop.
- Alternative: `applyFilters` once per tile. Five passes and five array allocations; simple but against the owner's one-pass request. Rejected.
- Alternative: keep counters in Dexie updated on write. A second source of truth that sync merges would have to maintain. Rejected.
- Budget: 5,000 cards x 5 predicates with at most three `normalize` calls per card is well under the 1 s first-screen budget; the e2e perf test proves it on the throttled run.

### D7. Text filters compare normalized values
In `matches`, team, manufacturer, set, subset, insert and parallel compare `normalize(value.trim())` on both sides (the existing `normalize` lowercases and strips accents). The search haystack adds subset and insert. Filters gains `manufacturer`, `subset`, `insert` (empty string = any). The filter sheet's Card group adds Manufacturer, Subset and Insert selects built like Team, from `distinctValues`; a select also lists the active value when no card has that exact spelling, so a tile's filter always shows as selected.
- Alternative: exact compare and rely on the select. The Braves tile would miss a lowercase entry. Rejected.

### D8. Dashboard is home; filters live in `App`
`View` gains `{ name: "dashboard" }`, which becomes the initial view. `App` holds `filters` in state and passes `filters` and `onFiltersChange` to `CollectionScreen` (which drops its own `useState`). A tile tap sets `{ ...emptyFilters, ...tile.filters }` and shows the list; Browse collection sets `emptyFilters`. Because the state sits above the views, the list keeps its filters across card detail and edit.

`scan`, `settings` and new-card `form` views carry `from: "dashboard" | "list"`, so cancel, save and the hardware back return to the screen that opened them. Back handling: list goes to dashboard, dashboard exits, the rest as today. No screen gets an on-screen Back button (the owner ruled Android back is enough); the user always has the hardware back, and the dashboard's Browse collection is the way down.

The Add card button and its sheet move out of `CollectionScreen` into a small `AddCard` component used by both screens, so each screen keeps exactly one add entry. `DESIGN.md`'s three single-add-button lines (Overview "one bottom-anchored add button", Buttons "the single entry point for adding", Don't "add a second add entry point") are reworded to one add button per screen, on the list and the dashboard.
- Alternative: a router library. A dependency for two more states. Rejected.
- Alternative: no Add card on the dashboard. Adding a card, the most frequent action, would cost an extra tap from launch. Rejected.

### D9. Tile look on existing tokens
Tiles are pocket buttons (the `button` styles) in a two-column CSS grid with `--space-2` gaps and `--space-3` page gutters. The label uses `--type-label` in `--color-text-muted`; the number uses `--type-title` in `--type-mono` and `--color-text`. Cards and Distinct come first as the first row. The accessible name is "<label>, <number>" (`aria-label`). Numbers use `toLocaleString()`. No new token, so both themes and the contrast tests cover the tiles already; the touch-target and theme e2e checks gain the dashboard.
- Alternative: accent-filled tiles. The accent is for the one primary action and chips (DESIGN.md). Rejected.

## Risks / Trade-offs

- [An older APK on a second device edits a card that has a subset or insert; its `toCard` drops them and its edit wins by `updatedAt`] → Install the new APK on every device before entering subsets or inserts (the app's update link shows it); D3 prevents this for fields added after this change.
- [An older APK writes the file back as version 1] → Harmless: version 1 and 2 are read the same way and the fields survive in the card objects unless edited there (previous risk).
- [Owner enters the team as "Braves"] → Not counted by the tile. The owner can correct the team; aliases are out of scope.
- [Owner's idea of Topps Gold includes Gold Refractor or Gold Foil] → The definition is one entry in `TILES`; widening it is a later spec change.
- [Normalizing filter values adds cost per card] → Measured by the existing 5,000-card perf test on both the dashboard and the list.
- [The foundation's "Card record" and "Search and filter" texts do not mention subset, insert or the condition list] → The ADDED requirements here extend them by name; a later spec tidy can fold them together once all three changes are archived.
- [This change archives before the foundation] → Archive creates `card-catalog`, `drive-storage` and `collection-list` with a placeholder Purpose; the later archives add their requirements to them and the Purpose is filled in by hand then.

## Migration Plan

No data migration. Ship the APK through the existing release flow; the first sync after install rewrites the file as version 2 even when no card changed (D2). Rollback: install the previous APK; it reads the version 2 file (it ignores the version) and keeps subsets and inserts on cards it does not edit.

## Open Questions

- Should Topps Gold also count "Gold Foil", "Gold Refractor" or "Gold Rainbow" parallels, or Topps-made brands such as Bowman? Defaults to the exact definition in D5.
- Should team "Braves" count toward Atlanta Braves? Defaults to no.
