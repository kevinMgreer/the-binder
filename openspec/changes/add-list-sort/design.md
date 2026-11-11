## Context

See proposal.md for why. Today `sortCards` in `src/domain/query.ts` sorts by year, set, then card number with one shared `Intl.Collator(undefined, { numeric: true, sensitivity: "base" })` (case- and accent-insensitive, numbers by value). Its only caller is `CollectionScreen` (`sortCards(applyFilters(cards, filters))` in a `useMemo`). Filters live in `App.tsx` as `useState<Filters>(emptyFilters)` and are passed to `CollectionScreen` as `filters` / `onFiltersChange`, because `App` swaps whole screens (`view.name`), so state held inside `CollectionScreen` would be lost on opening a card. The filter sheet uses the shared `Sheet` component with `.group` headings and `label.check` rows. `CardForm` is one flat column of fields (there is no "Card" group heading in it today); `Field` takes a `hint`, which `CardForm` currently fills only with "Suggested" marks.

Archive order: `refine-card-fields` first, then `restyle-card-back`, then this change. The MODIFIED blocks here are written as the full text that results after both of those are archived: `collection-list` "The list leads with finding a card" and "The first screen holds with the bottom navigation" start from `restyle-card-back`'s text; `card-catalog` "Card record" and "List the collection" start from `refine-card-fields`' text. Archiving this change before either of them would let their older MODIFIED text overwrite these blocks; if that happens, re-apply the Sort button and sort-name wording by hand.

## Goals / Non-Goals

**Goals:**
- Last name ascending by default; Year, Team and Set as the other orders, each ascending or descending.
- The order survives moving around the app and resets on a fresh launch.
- An optional per-card Sort name, with a derived last name when it is blank, and no migration.

**Non-Goals:**
- Persisting the order, a first/last name split, suggesting sort names, searching by sort name, and anything on the dashboard (see the proposal's Out of scope).

## Decisions

- **Sort options live in `src/domain/query.ts` beside `Filters`.** `export type SortBy = "lastName" | "year" | "team" | "set"`, `export interface Sort { by: SortBy; descending: boolean }`, `export const defaultSort: Sort = { by: "lastName", descending: false }`, and `sortCards(cards, sort = defaultSort)`. The comparator compares the chosen key with the existing collator (Year numerically), then falls back to the existing year, set, card number comparison; descending multiplies the whole result by -1, so descending is the exact reverse of ascending. Keys are computed once per card per sort (a `Map` from card to key) so a 5,000-card list does not re-derive a name on every comparison.
  Alternatives: reverse only the primary key (ties stay oldest first in descending; nicer for Year, but "descending" is then not a plain reverse and needs more tests); one sort function per order (four near-copies). $0: no dependency, no service.

- **Last-name key derived at read time by `lastNameKey(card)` in `query.ts`.** Rule, in order:
  1. A non-blank trimmed `sortName` wins.
  2. Team card: when `team` is not blank and `normalize(player)` contains `normalize(team)` as a whole word, the key is the whole player text ("Atlanta Braves Team Card" with team "Atlanta Braves").
  3. Multi-player: split on `/`, `&` or the word `and` (spaces around it, any case) and keep the first part ("Mike Trout / Shohei Ohtani" gives "Mike Trout").
  4. Drop trailing suffixes `Jr`, `Sr`, `II`, `III`, `IV`, each with an optional period and an optional comma before it, ignoring case, repeatedly ("Ken Griffey, Jr." gives "Ken Griffey").
  5. Take the last whitespace-separated word; if nothing is left (player "Jr."), use the whole player text.
  The key is compared with the same collator, so "Acuña" and "Acuna" sort together.
  Alternatives: store a derived last name on save (needs a migration of every existing card and goes stale when Player is edited); a first/last split of Player (owner ruled against it); a list of known team names to detect team cards (data to maintain; the card's own Team field is already there). $0: none.

- **`sortName?: string` on `Card`, `z.string().optional()` in `cardSchema`; no `schemaVersion` bump.** The form writes the trimmed value (an empty string when blank, like `subset`), and blank counts as none. Same reasoning as `refine-card-fields` with `parallel.serialNumbered`: a version 2 file with or without the field is valid for every build, and a bump would force a rewrite of an unchanged collection.
  Alternatives: bump to 3 (a rewrite with nothing to convert, and older builds would still read it); a separate sort-name map outside the card (two places to sync). $0: none.

- **Do older builds drop the field? Checked in code, mostly no.** No reader parses cards through `cardSchema` (`validateCard` only checks the form's card and discards the parsed output, so zod's stripping of unknown keys never reaches storage). `DriveRemoteStore.readCollection` casts the JSON as is (`src/adapters/drive-remote-store.ts`), `merge` returns the input objects whole (`src/sync/merge.ts`), Dexie stores the objects as given, and `SyncEngine.file()` writes the merged objects back. Every rewrite of an existing card spreads it: delete (`{ ...stored, deletedAt }` in `src/usecases/cards.ts`), photo upload (`{ ...fresh, photos }` in `src/sync/engine.ts`), Increase quantity (`{ ...duplicate.existing, quantity }`) and the edit form (`toCard` starts with `...existing`). The one gap: `...existing` entered `toCard` in commit 789b901 (2026-11-10). A build from before that date rebuilds an edited card from the form's fields only, so editing a card there drops `sortName`, and that edit wins the merge because it is newer. So the honest rule is: every device should run a build from 2026-11-10 or later before Sort name is used; builds from that date on keep the field untouched (they cannot show or edit it). A build that cannot sort by it still lists the card by year as before.
  Alternatives: a `schemaVersion` bump to lock old builds out (no build has a "newer version" guard, so it would not stop them either). $0: none.

- **Sort state is plain `useState<Sort>(defaultSort)` in `App.tsx`, next to `filters`.** Passed to `CollectionScreen` as `sort` / `onSortChange`, the same way as `filters`. It is never written to Dexie, `localStorage` or Drive, so a fresh launch starts at Last name ascending. Tapping a dashboard tile keeps the sort (it resets filters only).
  Alternatives: state inside `CollectionScreen` (lost on opening a card, since `App` unmounts the screen); `localStorage` (the owner ruled: not persisted). $0: none.

- **Sort button at the right end of the "Showing N" line, opening a `Sheet`.** The `p.shown` line becomes a row with the count at the left and a plain button "Sort: Last name ↑" at the right, `aria-label` "Sort: Last name, ascending", at least `--target-min` high. It adds no row, so the first-screen requirements (title, sync state, gear, search, Filter, three rows) hold. The sheet, labelled "Sort", reuses `Sheet` with two `.group` sections: "Order" (Last name, Year, Team, Set) and "Direction" (Ascending, Descending), each a radio group in `label.check` rows; a change applies at once and the sheet closes with its own Close control or Android back, so it needs no foot button (if `Sheet` requires a `foot`, a primary "Done" that closes it). Only existing tokens and classes; no new colour, size or radius.
  Alternatives: a Sort button in the search row (at 360 dp the search field, Filter and Sort do not fit without shrinking search below a usable width); a native `<select>` (two controls for order and direction, and the Android picker does not wear the card-back look); a header menu (the header row is full: title, sync state, gear). $0: none.

- **Sort name field directly under Player in `CardForm`.** It is not required and not a `FieldKey`. Its hint is the fixed text "Optional: how this card sorts, e.g. Acuña"; `text()` gets an optional fixed hint that is used when no "Suggested" mark applies. It is not part of `Suggestion`, the duplicate identity, search or the detail screen.
  Alternatives: a "Card" group heading in the form (the form has no groups today; adding them is a layout change outside this change); showing Sort name on the detail screen (not asked for). $0: none.

- **No delta for `card-form-guidance`.** Its "Required fields are marked" scenario says no field other than player, year and set is marked required; Sort name is not, so the requirement holds unchanged. The hint is specified in `card-catalog` "Sort name".

## Risks / Trade-offs

- [Compound surnames sort by their last word: "Elly De La Cruz" under "Cruz", "Andy Van Slyke" under "Slyke"] → the owner fills in Sort name for those cards; the hint names the purpose.
- [Non-person cards whose player text does not contain the team ("League Leaders", "World Series Highlights") sort by their last word] → Sort name fixes them; see open question.
- [A device on a build from before 2026-11-10 drops Sort name when it edits a card] → update every device before using Sort name (see the decision above).
- [The "↑" and "↓" glyphs may fall back to a system font if the bundled UI font lacks them] → the e2e screenshot check during apply shows it; replace with the existing `Icon` component if they look off.
- [Changing the default order changes the first row in existing e2e tests that list several cards] → task 2.6 checks `e2e/catalog.spec.ts` assertions that rely on `rows(page).first()`.

## Open Questions

- Ties within Last name follow year, set, card number (owner ruling). Should first name come before year, so "Ken Griffey Jr." and "Ken Griffey Sr." cards group by person? Not in this change unless the owner asks.
- Non-person cards that are not team cards ("League Leaders"): the code has no reliable signal to tell them from a person, so they fall back to the last word and the owner sets Sort name when it matters. Is that acceptable, or does the owner want a different fallback?
- Should Sort name show on the card detail screen so the owner can see why a card sorts where it does? Not specified; left off.
