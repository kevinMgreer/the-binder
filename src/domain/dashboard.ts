import type { Card } from "./card";
import { emptyFilters, matcher, normalize, type Filters } from "./query";

export interface Tile {
  label: string;
  /** What the list opens with; null opens it unfiltered. */
  filters: Partial<Filters> | null;
  count: "total" | "distinct" | "match";
}

export const TILES: Tile[] = [
  { label: "Cards", filters: null, count: "total" },
  { label: "Distinct", filters: null, count: "distinct" },
  { label: "Autos", filters: { autograph: true }, count: "match" },
  { label: "Relics", filters: { relic: true }, count: "match" },
  { label: "Serial-numbered", filters: { serialNumbered: true }, count: "match" },
  { label: "Rookies", filters: { rookie: true }, count: "match" },
];

export interface TileStat extends Tile {
  value: number;
}

export interface TeamStat {
  name: string;
  count: number;
}

const RECENT = 4;
const TOP = 5;
const collator = new Intl.Collator();

export interface CollectionStats {
  tiles: TileStat[];
  /** The newest cards by creation time, newest first. */
  recent: Card[];
  teams: TeamStat[];
  /** Same shape and rules as teams, keyed by the card's whole player string. */
  players: TeamStat[];
}

/** One distinct card per call; spellings that differ in case, accents or edge spaces are one entry, labelled by the first seen. */
function tally(map: Map<string, TeamStat>, raw: string) {
  const name = raw.trim();
  if (!name) return;
  const key = normalize(name);
  const entry = map.get(key);
  if (entry) entry.count += 1;
  else map.set(key, { name, count: 1 });
}

const top = (map: Map<string, TeamStat>) =>
  [...map.values()].sort((a, b) => b.count - a.count || collator.compare(a.name, b.name)).slice(0, TOP);

/** One pass over the cards; the match tiles and team counts use the same predicate and key as the list they open. */
export function collectionStats(cards: Card[]): CollectionStats {
  const tests = TILES.map((t) => (t.count === "match" ? matcher({ ...emptyFilters, ...t.filters }) : null));
  const values = TILES.map(() => 0);
  const recent: Card[] = [];
  const teams = new Map<string, TeamStat>();
  const players = new Map<string, TeamStat>();
  for (const card of cards) {
    TILES.forEach((tile, i) => {
      if (tile.count === "total") values[i] += card.quantity;
      else if (tile.count === "distinct") values[i] += 1;
      else if (tests[i]!(card)) values[i] += 1;
    });

    tally(teams, card.team);
    tally(players, card.player);

    if (recent.length < RECENT || card.createdAt > recent[RECENT - 1].createdAt) {
      recent.push(card);
      recent.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
      recent.length = Math.min(recent.length, RECENT);
    }
  }
  return {
    tiles: TILES.map((tile, i) => ({ ...tile, value: values[i] })),
    recent,
    teams: top(teams),
    players: top(players),
  };
}
