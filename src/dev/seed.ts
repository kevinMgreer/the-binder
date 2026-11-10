import type { Card } from "../domain/card";
import { makeCard } from "../domain/fixtures";

/** Quantity stays 1, so the Cards tile reads the seed count. Every tile of the dashboard has matches. */
export function seedCards(count: number): Card[] {
  return Array.from({ length: count }, (_, i) =>
    makeCard({
      player: `Player ${i}`,
      team: i % 30 === 0 ? "Atlanta Braves" : `Team ${i % 30}`,
      manufacturer: i % 4 === 0 ? "Topps" : "Bowman",
      year: 1990 + (i % 36),
      set: `Set ${i % 40}`,
      subset: i % 9 === 0 ? "Future Stars" : undefined,
      insert: i % 13 === 0 ? "Stars of MLB" : undefined,
      cardNumber: String(i + 1),
      parallel: i % 10 === 0 ? { name: "Gold", serial: i % 20 === 0 ? 1 : null, serialLegible: true, printRun: 50 } : null,
      flags: { rookie: false, autograph: i % 7 === 0, relic: i % 11 === 0 },
    }),
  );
}
