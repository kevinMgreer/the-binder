## Context

`collectionStats` already makes Top teams in its one pass: trim, normalize, count distinct cards, sort by count then name, keep five. The list's Player filter (add-player-filter, archived) is a normalized substring match on `Card.player`. The look comes from restyle-card-back (ruled stat table, tokens, 56 dp rows).

## Goals / Non-Goals

**Goals:** a Top players group that behaves like Top teams, opens the list by the Player filter, and Recently added last.

**Non-Goals:** a new filter, splitting "A / B" cards into two players, paging, quantity counts.

## Decisions

- **Same rules as Top teams, same pass.** Group by the player string trimmed and normalized (case, accents), count one per card (quantity ignored), sort by count then name with the same collator, keep five. Players are counted inside the existing loop through one small shared tally helper used for teams too. Tombstoned cards are not in `cards`, so they are skipped as for the tiles.
  Alternatives: a second pass for players (the spec says one pass); a generic "top N by key" configuration object (more shape than two call sites need). $0: no dependency.
- **Display the first spelling seen** (the order of the cards list) for a group of spellings of one player.
  Alternatives: the most common spelling (needs a second count per spelling for a label nobody compares); the longest (arbitrary). $0: none.
- **A team or multi-player card is just its player string.** "Braves Team Card" or "Judge / Soto" is its own entry. No splitting.
  Alternatives: split on "/" and "&" (names with those characters, double counting a card). $0: none.
- **Tap sets `Filters.player` to the displayed name; no new filter.** The Player filter is a substring match, so tapping "Ronald Acuña Jr." also lists a card whose player is "Ronald Acuña Jr. / Mookie Betts", and tapping a short name like "Wood" lists "Wood" and "Woodward". The list therefore shows at least the entry's number of cards, and exactly that number whenever no other player string contains this one. The chip shows the name, so the owner sees what was applied and can edit or remove it. Accepted because players are almost always full names and a mismatch is visible and harmless.
  Alternatives: an exact-match `playerExact` filter (a new filter, chip and tests for a rare case; revisit if the owner meets it); a count taken from the substring match (the number would no longer match the group it labels). $0: none.
- **Empty state: the group is hidden when no card has a player.** The dashboard's existing empty state is "tiles read zero, groups with no content are not shown" (Recently added, Top teams). A placeholder line would be the only one. Player is a required field, so in practice the group is hidden only with no cards.
  Alternatives: a short "No players yet" line (inconsistent with the other groups). $0: none.
- **Order: tiles, Top teams, Top players, Recently added.** Recently added moves to the bottom as the owner ruled; the two ruled tables stay together above the picture row. Tiles stay first so the six tiles remain visible without scrolling on a 360 by 800 phone.
  Alternatives: Top players above Top teams (owner named Recently added last only; teams were first and stay first). $0: none.
- **Look: the Top teams ruled table.** Top players reuses the `.teams`/`.team` classes through one render helper (no CSS change): 56 dp rows, 1 px rules, name left, slab number right, 48 dp tap target, tokens only. The heading is "Top players".
  Alternatives: a copy of the CSS under new names (drift); player thumbnails in the rows (a different component, not asked). $0: none.
- **Archive order.** refine-card-fields archives first, then restyle-card-back, then this change. The MODIFIED blocks in `specs/dashboard/spec.md` carry the full requirement text as it reads after the first two archives (restyle's rewrite of the design-system and app-opens requirements; the unchanged fast-dashboard text). The Six stat tiles requirement (refine-card-fields) is not touched here.
  Alternatives: delta against the main spec as it is today (would erase the restyle's wording on archive). $0: none.

## Risks / Trade-offs

- Substring tap can list extra cards (see above). Accepted and visible through the chip.
- If the restyle or refine archives change their text before this one archives, the MODIFIED blocks need re-basing; `openspec validate --strict` and a read of the archived dashboard spec catch it.
