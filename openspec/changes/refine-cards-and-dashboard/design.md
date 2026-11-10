## Context

Today (observed in the code):

- `src/app/CollectionScreen.tsx` header: a title row (h1 "Cards", `SettingsButton`) and a `.meta` line with `<p data-testid="summary">N cards, N distinct</p>` (from `summarize` in `src/domain/query.ts`) and `<SyncIndicator />`. `src/app/Dashboard.tsx` has the same header with only `<SyncIndicator />` on the `.meta` line.
- `src/app/SyncIndicator.tsx` renders a `span.sync` (dot via `::before`, `data-state`, `data-testid="sync-status"`), plus, in its states, a "Sign in again" button and an inline missing-file `role="dialog"`. The span has **no** `role="status"` today; the brief's "still role=status" is read as "make it one".
- `src/app/CardList.tsx` `Thumb` renders `img.thumb` at a fixed 48x67 with `object-fit: cover` (`app.css`), so a landscape photo is cropped to its middle. Rows are fixed `ROW_HEIGHT = 100` for `@tanstack/react-virtual`. `src/photos/compress.ts` scales photos and thumbnails keeping their aspect ratio (thumb long edge 320), so the stored thumbnail already carries the photo's orientation.
- `src/domain/dashboard.ts` `TILES` lists seven tiles; `collectionStats` does one pass using the list's own `matcher`, memoised in `Dashboard` on `cards`. `App.tsx` `onTile` sets `{ ...emptyFilters, ...tile.filters }` and shows the list. The `detail` view has no `from`, so back and delete always go to the list.

## Goals / Non-Goals

**Goals:**
- Remove the count line from Cards; put the sync state on the title row of both screens.
- Thumbnails that respect landscape and portrait with no crop, rows still 100 dp.
- A cleaner dashboard: six tiles, plus recommended Recently added and Top teams groups, one pass over the cards.

**Non-Goals:**
- No stored orientation field, schema change or photo migration.
- No new tokens, colours, type sizes or dependencies; no charts.
- No change to sync wording or states; no change to the card detail or forms beyond the back target.
- No configurable dashboard (which tiles, how many teams).

## Decisions

### 1. Sync state on the title row; actions beneath

`SyncIndicator.tsx` exports two components: `SyncIndicator` (the status `span`, now `role="status"`, same wording and `data-state`/`data-testid`) and `SyncActions` (the Sign in again button and the missing-file dialog, unchanged). Both headers become:

```
<div class="title-row"> <h1/> <SyncIndicator/> <SettingsButton/> </div>
<SyncActions/>
```

The `.meta` line is deleted from both screens. CSS: in `.title-row` the h1 does not shrink, `.sync` takes the free space (`flex: 1; min-width: 0; justify-content: flex-end; text-align: right`), may wrap to two lines (label size, line-height ~1.3, fits inside the 48 dp row), never ellipsised. Longest wording "Sync problem, retrying (3 unsynced)" needs about 250 dp; next to "Dashboard" and the gear it has about 150 dp, so it wraps to two lines; that is the accepted cost of keeping the words whole.

Alternatives: shorter wording (rejected: owner asked for the same states, and the words are the spec); ellipsis with the full text only for screen readers (rejected: hides an error from sighted users); keeping the actions inside the row (rejected: a 48 dp "Sign in again" button and an inline dialog do not fit a title row).

`role="status"` is polite, so a screen reader announces changes without interrupting. Risk: Syncing/Synced flips on every save get announced; see Open Questions.

### 2. Orientation-aware thumbnail: square slot, contained image, orientation read from the thumbnail

The row's thumbnail becomes a fixed 67x67 slot (`span.thumb-slot`, flex-centred). The `img` inside has `max-width: 100%; max-height: 100%; width: auto; height: auto` and no `object-fit`, so the browser sizes it from the image's own pixel dimensions: a portrait card photo renders about 48x67, a landscape one about 67x48, any other ratio exactly as shot. The 4 dp radius and pocket background move to the `img`, so the visible frame is the photo's own shape.

- **How orientation is known:** from the thumbnail blob's intrinsic size at render. The stored thumbnail of every existing photo already has the right ratio, so no field, no migration, no `onLoad` measuring, no JS.
- **Fallback:** no photo, or before the blob URL resolves: the existing portrait 48x67 placeholder `span`, centred in the same slot.
- **Row height:** unchanged, 67 dp slot + 2x12 dp padding + 8 dp gap = 99 to 100 dp, so `ROW_HEIGHT = 100` and the virtualiser stay as they are.
- **Cost:** the text column starts 19 dp further right than today on every row (67 instead of 48), so the text column on a 360 dp phone is about 233 dp. The quiet line's truncation order already handles that.

Alternatives: fixed height with variable width (rejected: text column jumps from row to row, and a landscape photo at 67 dp tall is 94 dp wide); storing `orientation` on `PhotoRef` from `compress.ts` (rejected: schema change, sync field and a migration for old photos, to learn what the thumbnail already says); measuring `naturalWidth` in `onLoad` and setting a class (rejected: extra state per row for what CSS does for free).

The same `Thumb` is exported from `CardList.tsx` and reused by the dashboard's Recently added.

### 3. Dashboard overhaul (Operate mode, Nine-Pocket Binder)

Direction: the dashboard is a page in the binder, read top to bottom in one thumb scroll. Same pockets, same gold only on Add card and chips, mono numbers, no new size, no shadows. Structure is carried by spacing and three muted group headings, not by boxes or colour.

```
Dashboard                Synced  [gear]
┌ Cards ─────┐ ┌ Distinct ──┐      tiles: the existing pocket tile, 2 columns
│ 1,204      │ │ 987        │
├ Autos ─────┤ ├ Relics ────┤
│ 41         │ │ 18         │
├ Serial-num.┤ ├ Rookies ───┤      (Rookies: recommendation)
│ 77         │ │ 63         │
RECENTLY ADDED                      (recommendation)
[thumb][thumb][thumb][thumb]        4 pockets, 4 columns, name under each
TOP TEAMS                           (recommendation)
Atlanta Braves              212     ruled pocket list, 48 dp rows,
Chicago Cubs                 64     name left, mono count right
...
[        Add card        ]
[ Dashboard |  Cards     ]
```

- **Tiles (kept):** Cards, Distinct, Autos, Relics, Serial-numbered in the existing `.tile` pocket, unchanged look and `data-testid="tile"`, same tap-to-filter through `onTile`.
- **Removed:** Topps Gold and Atlanta Braves, owner request.
- **RECOMMENDATION: Rookies tile** (`{ rookie: true }`, `count: "match"`). Data the app has (`flags.rookie`) and a filter the list already offers, so it is one `TILES` line. Brings the grid to an even six, three rows of two. Strike: delete the line and the six becomes five.
- **Not added: Graded tile** (owner ruled it out).
- **RECOMMENDATION: Recently added.** A group heading (h2 styled like the filter sheet's group headings: muted, label size, weight 500) and a 4-column grid of pocket buttons, each the orientation-aware `Thumb` in its 67 dp slot with the player name as stored below it, one line, ellipsis, label size. Accessible name "player, year set #number". Four, not more, because four fit 336 dp at about 78 dp each with no horizontal scroll. Tap opens the card's detail with `from: "dashboard"`. Order by `createdAt` (string compare of ISO timestamps), newest first. Hidden when the collection is empty.
- **RECOMMENDATION: Top teams.** Same group heading, then one pocket holding up to five ruled rows (1 dp pocket-edge dividers like the card facts list): team name at the left (ellipsis), its count in mono at the right, each row a 48 dp button with accessible name "team, N", `data-testid="team"`. Counts distinct cards, grouped by the list's own normalised key (`normalize(trim(team))`), so the number always equals what the Team filter shows. Displayed spelling: the first spelling met in the pass (the filter is case- and accent-blind, so any spelling filters the same). Ties by `Intl.Collator` on the name. Tap calls the existing `onTile` with `{ label: team, filters: { team }, count: "match" }`. Hidden when no card has a team.
- Empty collection: six tiles reading 0, no other group, so a new user sees a calm page rather than empty boxes.

Why a ruled list for teams and a grid for tiles: tiles are a few fixed counters to compare at a glance; teams are a ranked list of variable-length names, which reads best as rows (Operate: scanability beats symmetry).

### 4. One pass

`collectionStats(cards)` returns `{ tiles, recent, teams }`:

- per card: the existing tile increments; `teams` `Map<key, { name, count }>` increment; `recent` kept as a sorted array of at most 4 by `createdAt` (insert when newer than the last, drop the fifth).
- after the pass: sort the team map's entries (tens of teams), take 5.

Still O(n) with constant work per card, memoised on `cards` in `Dashboard` as today. `dashboard-memo.test.tsx` keeps proving no recompute.

### 5. Detail remembers where it was opened from

`App.tsx` `View` detail becomes `{ name: "detail"; id: string; from: Screen }`. The list opens it with `from: "list"`, Recently added with `from: "dashboard"`. Back and delete go to `view.from`; edit keeps going to the form and back to the detail, which keeps its `from`. The edit form's `from` stays as today.

### 6. Count line removal

The `summary` paragraph and the `summarize` helper go (its only caller is `CollectionScreen`; its test in `query.test.ts` goes with it). Tests that used `data-testid="summary"` as "the list is showing" switch to `data-testid="shown"`; tests that asserted totals ("4 cards, 2 distinct") assert the dashboard's Cards and Distinct tiles instead.

## Risks / Trade-offs

- [Two-line sync state on the title row looks busy in error states] → only in error and needs-decision; the common states ("Synced", "Syncing…", "Unsynced: 3") are one short line.
- [`role="status"` announces every Syncing/Synced flip] → polite, short words; if the owner finds it chatty on TalkBack, a follow-up can announce only state changes that matter.
- [A photo with lots of background around the card shows the card small] → that is the "no crop" rule; the scanner's crop decides the framing, not the list.
- [A photo whose EXIF says "rotate" may come out sideways if the compressed thumbnail dropped the rotation] → `createImageBitmap` applies EXIF orientation by default, so the thumbnail is upright; phone check 6.2 confirms with a real landscape card.
- [Moving thumbnails 19 dp right cuts more of the quiet line] → the existing truncation order (extras, then set, never the number) holds; e2e "Long extras" and "Long names" re-run.
- [Owner-visible removal of two tiles] → owner asked for it; the Filter reaches both.

## Migration Plan

None: no stored data changes. Rollback is a revert of the branch.

## Open Questions

1. Counts: 4 recent cards and 5 top teams are proposals; the owner may pick other numbers at review (the spec and tasks name 4 and 5).
2. The unarchived `add-collection-foundation` change carries a `card-catalog` requirement "Collection summary" whose scenario says "the user views the collection, the summary shows 4 cards, 2 distinct". This change satisfies it through the dashboard's Cards and Distinct tiles but does not edit that change's text; should that scenario be reworded ("views the dashboard") in a follow-up, or here once foundation is archived?
3. Should Top teams count quantity (copies) or distinct cards? Proposed: distinct, so the number equals the filtered list, as every other tile but Cards does.
