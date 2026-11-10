import type { Card } from "./card";
import { emptyFilters, matcher, type Filters } from "./query";

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
  { label: "Topps Gold", filters: { manufacturer: "Topps", parallel: "Gold" }, count: "match" },
  { label: "Atlanta Braves", filters: { team: "Atlanta Braves" }, count: "match" },
];

export interface TileStat extends Tile {
  value: number;
}

/** One pass over the cards; the match tiles use the same predicate as the list they open. */
export function collectionStats(cards: Card[]): TileStat[] {
  const tests = TILES.map((t) => (t.count === "match" ? matcher({ ...emptyFilters, ...t.filters }) : null));
  const values = TILES.map(() => 0);
  for (const card of cards) {
    TILES.forEach((tile, i) => {
      if (tile.count === "total") values[i] += card.quantity;
      else if (tile.count === "distinct") values[i] += 1;
      else if (tests[i]!(card)) values[i] += 1;
    });
  }
  return TILES.map((tile, i) => ({ ...tile, value: values[i] }));
}
