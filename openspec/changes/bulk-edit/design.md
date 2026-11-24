## Context

- `src/usecases/cards.ts` has `saveCard` (one card, re-reads the stored photos so stale form refs never win) and `deleteCard`. Neither calls sync; `useCards` calls `sync.notifyChange()` after each, and `notifyChange` debounces a push.
- `CollectionStore.putMany(cards)` already exists: Dexie writes the cards and their outbox rows in one transaction (`src/adapters/dexie.ts`), and the in-memory fake matches (`src/adapters/fakes.ts`).
- `CollectionScreen` owns `shown` (filtered and sorted) and renders `CardList` or `CardGrid`; both are TanStack virtualisers and take `cards`, `onOpen`, `returnTo`.
- Android back runs `goBack` in `App.tsx`, which first calls the newest entry of `openSheets` (exported from `Sheet.tsx`) and only then changes screen.
- `parallel` is an object (`name`, `serialNumbered?`, `serial`, `serialLegible`, `printRun`) or `null` on a base card; `grading` is `{ kind: "raw", condition }` or `{ kind: "graded", company, grade }`. The form stores blank subset and insert as `""`.

## Goals / Non-Goals

**Goals:** change shared fields on many cards in one step; write only what the user changed; one sync push; no slowdown at 5,000 cards.

**Non-Goals:** bulk delete, bulk photo work, undo, clearing a field on many cards, any schema or sync engine change.

## Decisions

### D1. A `saveCards(deps, ids, patch)` use case, one `putMany`

`patch` is a `BulkPatch`: optional `team`, `year`, `manufacturer`, `set`, `subset`, `insert`, `parallelName`, `rookie`, `autograph`, `relic`, `grading`. An absent key means "Keep as is". `saveCards` reads the stored cards once with `collection.list()`, takes the ids asked for that exist and are not deleted, applies the patch with a pure `applyPatch(card, patch)`, drops cards where nothing changed, stamps one shared `updatedAt` on the rest and writes them with a single `collection.putMany`. It returns the number of cards written.

- Applying to the stored copy, not the screen's copy, means a sync that landed while the sheet was open is not undone on the fields the user did not touch.
- `applyPatch` copies only the patched keys, so photos, serial, card number, player, sort name, notes, quantity, `createdAt` and `source` cannot change: the type of `BulkPatch` has no key for them.
- `parallelName`: on a card with a parallel, replace only `name`; on a base card (`parallel: null`), a non-blank name creates `{ name, serialNumbered: false, serial: null, serialLegible: true, printRun: null }`, a blank one leaves it `null`.
- `grading` replaces the whole object (raw with a condition, or graded with company and grade).
- Text values are trimmed; the sheet never sends a blank text value (blank means keep).

Alternatives: calling `saveCard` per card (N transactions, N outbox writes, and `saveCard` would also re-run its photo loop for nothing); a per-card `get` (N reads, where one `list()` is a single IndexedDB call even at 5,000 cards); a generic `Partial<Card>` patch (lets a caller write the per-card fields, which the requirement forbids). $0: local IndexedDB only.

### D2. One sync push, from the hook

`useCards` gets `saveMany(ids, patch)`: `await saveCards(...)`, `await refresh()`, then one `sync.notifyChange()`, as `save` does for one card. The use case stays free of sync, like `saveCard`. The engine pushes the whole outbox in one Drive write, so one `notifyChange` means one push.

Alternative: notify per card (debounced to one push anyway, but N pending-count refreshes). $0: the existing Drive file write.

### D3. Selection state lives in `CollectionScreen`

`CollectionScreen` holds `selecting: boolean` and `selected: Set<string>` (card ids) in `useState`. `CardList` and `CardGrid` stay presentational and get three more props: `selected?: Set<string>` (undefined when not selecting), `onToggle(card)`, `onLongPress(card)`. Because the state sits above the view switch, switching list and grid keeps it. Leaving the screen (opening a card, the dashboard) unmounts it and drops the selection, which is what the owner expects after navigating.

Alternatives: lifting it to `App.tsx` beside `filters` (survives navigation, which nobody asked for, and widens the diff); a context (one consumer, no need). $0: client state.

### D4. Android back reuses the `openSheets` stack

While `selecting` is true, `CollectionScreen` pushes its own "leave selection mode" callback onto `openSheets` in an effect and removes it on cleanup, exactly as `Sheet` does. `goBack` in `App.tsx` already calls the newest entry first, so back closes an open sheet (pushed later), then leaves selection mode, then goes to the dashboard. No change to `App.tsx`.

Alternatives: a new `onBack` hook in `App.tsx` that asks the screen (a second mechanism for the same thing); renaming `openSheets` to a general back stack (a rename across files for one new user). $0: none involved.

### D5. Rendering stays cheap at 5,000 cards

- `selected` is a `Set`, so a row checks `selected.has(c.id)` in O(1); only the 10 to 30 virtual rows or tiles in view render, so toggling re-renders those only. The virtualisers keep their `count`, `estimateSize` and keys, so nothing re-measures.
- "Select all" builds one `new Set(shown.map((c) => c.id))`; the bar reads `selected.size`.
- Each toggle makes a new `Set` (copy of up to 5,000 strings), well under a frame.
- The selected look is a class and a check mark inside the existing row and tile, with no height change, so the list's fixed 112 dp rows and the grid's measured tiles keep their sizes.

Alternatives: an array of ids (`includes` per row is O(n) per render); a selection flag on each card object (new card objects on every toggle break the virtualiser's cheap re-renders). $0: none involved.

### D6. Interaction details

- Long press: `pointerdown` starts a 500 ms timer on the row or tile button, `pointerup`, `pointercancel` and `pointermove` past 10 px clear it, and a fired long press swallows the following click. `contextmenu` is prevented on the button so Android's text menu does not appear. No library.
- In selection mode the row and tile buttons get `aria-pressed` and their tap calls `onToggle`; while selecting, the selection bar ("N selected", "Select all", "Edit", "Cancel") takes the place of the shown row that holds "Select" and the view switch, and the view switch stays reachable in the bar.
- What counts is the selection intersected with `shown`: if the user changes the search or a filter while selecting, a hidden card is neither counted nor edited. This keeps "N selected", "Change N cards?" and what is written the same number.
- `BulkEditSheet` is a `Sheet` with one control per field: text inputs (empty with placeholder "Keep as is"), year as a number input, the three flags and grading as `select`s whose first option is "Keep as is", and grading company, grade or condition fields shown under the grading choice like the form does. Its foot has "Change N cards" (disabled while the patch is empty) and opens the centred `alertdialog` "Change N cards?" with "Change" and "Cancel", as Delete does.
- Team, set, manufacturer, subset, insert and parallel inputs offer the existing values through a `datalist` from `distinctValues`, which `CollectionScreen` already computes for the filter sheet.

Alternatives: a checkbox column (wider rows, breaks the 112 dp row layout); a library for long press (a dependency for a dozen lines). $0: none involved.

## Risks / Trade-offs

- A sync pull landing between "Select all" and confirm can add or remove cards; the ids are fixed at confirm and `saveCards` skips ids that no longer exist or were deleted, so it never resurrects a card. The count in the dialog can then be higher than what is written; the result is still correct.
- Last-writer-wins merge (`src/sync/merge.ts`) compares whole cards by `updatedAt`: a bulk change on this phone and an edit of the same card elsewhere before sync keep only the newer. Same as one-card edits today.
- `CollectionScreen` grows (selection state, bar, sheet mount); `BulkEditSheet` keeps the field controls out of it. The structure review checks the split.
- Long press and the virtualiser's touch scrolling share the same pointer; the 10 px move threshold keeps a scroll from selecting. Checked on the phone (task 4).

## Open Questions

- Changing the search or a filter while selecting: this design keeps the hidden ids but ignores them (D6). The other choice is to clear the selection on any filter change. Owner to confirm.
- Clearing a field on many cards (for example removing a wrong subset) is out of scope; a blank input means "Keep as is". If the owner wants it, a per-field "Clear" option is a follow-up.
- Where the "Select" action sits: this design puts it in the shown row beside the list/grid switch (the title row already holds the title, sync state and gear and must not wrap at 360 dp). The brief says "header action". The frontend pass confirms against `DESIGN.md`.
