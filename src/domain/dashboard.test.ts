import { expect, test } from "vitest";
import { TILES, collectionStats } from "./dashboard";
import { makeCard } from "./fixtures";
import { applyFilters, emptyFilters } from "./query";

const values = (stats: ReturnType<typeof collectionStats>) => Object.fromEntries(stats.map((s) => [s.label, s.value]));
const zero = Object.fromEntries(TILES.map((t) => [t.label, 0]));

const gold = (name: string) => ({ name, serial: null, serialLegible: true, printRun: null });

test("tiles come in the specified order", () => {
  expect(TILES.map((t) => t.label)).toEqual([
    "Cards", "Distinct", "Autos", "Relics", "Serial-numbered", "Topps Gold", "Atlanta Braves",
  ]);
});

test("Counts", () => {
  const cards = [
    makeCard({ flags: { rookie: false, autograph: true, relic: false }, parallel: gold("Gold"), quantity: 2 }),
    makeCard({
      team: "Boston Red Sox",
      manufacturer: "Panini",
      flags: { rookie: false, autograph: false, relic: true },
      parallel: { name: "Blue", serial: null, serialLegible: false, printRun: 99 },
    }),
    makeCard({ team: "", manufacturer: "" }),
  ];
  expect(values(collectionStats(cards))).toEqual({
    Cards: 4, Distinct: 3, Autos: 1, Relics: 1, "Serial-numbered": 1, "Topps Gold": 1, "Atlanta Braves": 1,
  });
});

test("Topps Gold is exact", () => {
  const cards = [
    makeCard({ manufacturer: "topps", parallel: gold("gold") }),
    makeCard({ manufacturer: "Topps", parallel: gold("Gold Refractor") }),
    makeCard({ manufacturer: "Bowman", parallel: gold("Gold") }),
  ];
  expect(values(collectionStats(cards))["Topps Gold"]).toBe(1);
});

test("an empty list gives zeros", () => {
  expect(values(collectionStats([]))).toEqual(zero);
});

test("every tile but Cards equals the list its filters open, and Cards is the quantity sum", () => {
  const cards = Array.from({ length: 500 }, (_, i) =>
    makeCard({
      cardNumber: String(i),
      quantity: 1 + (i % 3),
      team: i % 4 === 0 ? "atlanta braves" : "Team",
      manufacturer: i % 5 === 0 ? "Topps" : "Bowman",
      flags: { rookie: false, autograph: i % 7 === 0, relic: i % 11 === 0 },
      parallel: i % 6 === 0 ? { name: i % 12 === 0 ? "Gold" : "Gold Foil", serial: i % 2 === 0 ? 1 : null, serialLegible: true, printRun: 50 } : null,
    }),
  );
  const stats = collectionStats(cards);
  expect(stats[0].value).toBe(cards.reduce((n, c) => n + c.quantity, 0));
  for (const tile of stats.slice(1)) {
    const expected = tile.label === "Distinct" ? 500 : applyFilters(cards, { ...emptyFilters, ...tile.filters }).length;
    expect(tile.value, tile.label).toBe(expected);
  }
});
