## Context

See proposal.md for the why. Facts the approach rests on:

- `Card` (`src/domain/card.ts`) is stored whole in Dexie and written whole to the Drive file (`CollectionFile`, `schemaVersion: 2`). `DriveRemoteStore.readCollection` casts the JSON; nothing on the read path parses or strips fields. `cardSchema` (zod, `src/domain/schema.ts`) is used only by `validateCard` on save from the form.
- `merge` (`src/sync/merge.ts`) unions by id and returns the winning input object as is (last `updatedAt` wins, tombstones included). `sameAsRemote` in `src/sync/engine.ts` compares `JSON.stringify` of whole cards.
- `Filters` / `emptyFilters` / `matcher` (`src/domain/query.ts`) are the one predicate behind the list, its chips and the dashboard tiles. `App` holds filters in `useState(emptyFilters)` (not persisted) and a tile tap sets `{ ...emptyFilters, ...tile.filters }`.
- `collectionStats` (`src/domain/dashboard.ts`) walks every card once for the tiles, Top teams/players and Recently added.
- Bulk edit (#61) is in: `useSelection(shown)`, `BulkEditSheet`, `applyPatch` spreads the card and writes only patched fields. `CardDetail` uses the shared `ConfirmDialog`.
- `CardForm.toCard` spreads `existing`, so any field the form does not set is kept on edit.

## Goals / Non-Goals

**Goals:**
- One optional boolean on the card, no migration, no Drive format change.
- The default views (list, counts, dashboard) look exactly as today for an owner with no wanted cards.

**Non-Goals:**
- A wish-list screen, priority or price fields, sharing.
- Wanted in bulk edit (D7).

## Decisions

### D1. `Card.wanted?: boolean`, stored only when true
Add `wanted?: boolean` to `Card` and `wanted: z.boolean().optional()` to `cardSchema`. Absent or `false` means owned. The form writes `wanted: true` when ticked and `undefined` when not (JSON drops it), like `sortName` is stored only when it differs, so an owned card's JSON is unchanged and an unchanged card never looks different to `sameAsRemote`.
- Alternative: `status: "owned" | "wanted"`, required. Needs a migration of every stored card and a `schemaVersion` bump; buys nothing with two states.
- Alternative: a separate `wanted.json` on Drive. Breaks ruling T-57 (same form, same record) and doubles the sync code.
- $0: no new service or call.

### D2. Old Drive files and the schema version
No `schemaVersion` bump. A file without the field reads as all owned, which is the truth. Nothing on the read path validates or strips fields, so no loader change. An older app build reading a newer file keeps `wanted` too: it also spreads/returns whole objects, so the field survives a round-trip through it (it would just show wanted cards as owned; one phone, so acceptable).
- Alternative: bump to 3 and rewrite on first sync. Costs a forced write and a version check for no gain.

### D3. Merge needs no change
`merge` picks whole objects; the field rides with its card, and "Mark as owned" gives the card a new `updatedAt`, so it wins the merge like any edit. Clearing the mark is a real field removal; because the winner is the whole newer object, a stale remote `wanted: true` cannot leak back in. A test in `src/sync/merge.test.ts` pins both (newer owned beats older wanted; newer wanted beats older owned) so a future per-field merge cannot drop the field silently.
- Alternative: field-level merge. Not needed; the app is last-write-wins per card today.

### D4. The Show choice is a filter field
Add `show: "owned" | "wanted" | "all"` to `Filters`, `"owned"` in `emptyFilters`, and one line in `matcher`: `if (f.show !== "all" && !!c.wanted !== (f.show === "wanted")) return false;`. Then the default list, `applyFilters`, "Select all", the badge/chip machinery and Clear all (which resets to `emptyFilters`) all get owned-by-default for free, and the dashboard opens a wanted list with `filters: { show: "wanted" }` through the existing `onTile`.
- Alternative: a separate `show` state beside filters in `App`/`CollectionScreen`. A second source of truth that Clear all, tiles and chips would each have to learn.
- Alternative: filter wanted cards out in `useCards`. Hides them everywhere, including the form's duplicate check and suggestions, and needs a second card array for the wanted view.

`distinctValues` for the sheet's pickers and bulk edit's datalists keep using all cards: a team only on wanted cards still appears as an option. Harmless and simpler.

### D5. Dashboard: skip wanted cards in the one pass
In `collectionStats`, at the top of the loop: `if (card.wanted) { wanted++; continue; }`. This keeps tiles, Top teams, Top players and Recently added owned-only in one place. `CollectionStats` gains `wanted: number`. Tile tests already go through `matcher({ ...emptyFilters, ...})`, which now means owned, so they agree with the loop.
`Dashboard.tsx` renders, when `wanted > 0`, one text button under the tiles ("N wanted", quiet text style, 48 dp target, `aria-label="Wanted, N"`) that calls `onTile({ label: "Wanted", filters: { show: "wanted" }, count: "match" })`. No change to `App`.
- Alternative: a seventh tile. The owner asked for something quiet; the six-tile grid is specified as exactly six.

### D6. UI placement (quiet)
- Filter and sort sheet: a "Show" radio group (Owned / Wanted / All on one row) after Direction, before Year, using the sheet's existing `radio` helper. Chips: "Wanted" or "Owned and wanted", `clear: { show: "owned" }`; nothing for Owned.
- List row: a `.tag` "Wanted" beside the serial tag in the title row (`CardList.tsx`). Grid tile: the same tag in `.grid-meta` (`CardGrid.tsx`), and `accessibleName` gains ", wanted". No new colour; the existing `.tag` style; no height change.
- Card form: the checkbox right under the "Add card"/"Edit card" title, before the photo tiles, so it is set before the user thinks about photos. A `Draft.wanted` boolean via the existing `check` helper.
- Card detail: a `.tag` "Wanted" in the title row (beside the serial tag), and a "Mark as owned" button in the detail actions (the primary action for a wanted card; Edit becomes outline there). No confirm dialog: one tap, undone by editing.
- Nothing in the title header or bottom navigation.

### D7. Bulk edit does not offer Wanted
`BulkPatch` stays as it is. `applyPatch` spreads the card, so the mark is kept. Selection works on `shown`, so with the default Owned "Select all" never takes a wanted card; with All a mixed selection changes the shared fields on both and leaves each mark. Bulk "mark as owned" is out of scope (owner default: keep it out).
- Alternative: a Wanted Yes/No row in the sheet. Easy, but nobody asked, and a mis-tap could flip many cards' status at once.

### D8. Duplicate check compares owned cards only
`findDuplicate` returns no match when the new card is wanted, and skips wanted cards as candidates. Otherwise "Increase quantity" could add to a wanted card's quantity, and the dialog's "(N owned)" text would be wrong.
- Alternative: match within the same status. Then two wanted copies would prompt with wording about owned copies; needs new copy text.
- Alternative: when an owned card matches a wanted one, offer "Mark as owned". Nice, but a new dialog branch; out of scope.

### D9. Mark as owned
`CardDetail` gets an `onMarkOwned` prop; `App` passes `() => save({ ...card, wanted: undefined, updatedAt: now })` through the existing `useCards().save`, which queues sync. `createdAt` is kept.

## Risks / Trade-offs

- [Search hides wanted cards under the default Owned] The owner searching for a wanted card sees "No cards match" → the Wanted chip, and the dashboard line, are one tap away; the empty-state text stays as is.
- [A collection with only wanted cards shows "No cards match" instead of the empty-binder text] Rare and self-explaining once the Show choice is known. Not handled.
- [Mark as owned keeps `createdAt`, so a card just bought does not appear in Recently added] Kept simple; see Open Questions.
- [An older build on a second device shows wanted cards as owned] One phone; the field survives its writes (D2).
- [Users of `Filters` in tests build objects by hand] Adding a required `show` field breaks literal `Filters` objects in tests that do not spread `emptyFilters`; the domain task fixes them.

## Migration Plan

None. Ship the build; existing cards stay owned. Rollback: an older build ignores the field and keeps it on write.

## Open Questions

- Should "Mark as owned" also reset `createdAt` so the card shows in Recently added? Default no; a one-line change if the owner wants it.
- Should adding a wanted card that matches an owned one say "you already own this"? Left out (D8); can be added later without changing the data.
