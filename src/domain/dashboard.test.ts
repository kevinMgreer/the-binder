import { expect, test } from "vitest";
import { TILES, collectionStats } from "./dashboard";
import { makeCard } from "./fixtures";
import { applyFilters, emptyFilters } from "./query";

const values = (stats: ReturnType<typeof collectionStats>) => Object.fromEntries(stats.tiles.map((s) => [s.label, s.value]));
const zero = Object.fromEntries(TILES.map((t) => [t.label, 0]));
const at = (n: number) => `2026-02-${String(n).padStart(2, "0")}T00:00:00.000Z`;

test("tiles come in the specified order", () => {
  expect(TILES.map((t) => t.label)).toEqual(["Cards", "Distinct", "Autos", "Relics", "Serial-numbered", "Rookies"]);
});

test("Counts", () => {
  const cards = [
    makeCard({ flags: { rookie: true, autograph: true, relic: false }, parallel: { name: "Gold", serial: null, serialLegible: true, printRun: null }, quantity: 2 }),
    makeCard({
      team: "Boston Red Sox",
      flags: { rookie: false, autograph: false, relic: true },
      parallel: { name: "Blue", serial: null, serialLegible: false, printRun: 99 },
    }),
    makeCard({ team: "" }),
  ];
  expect(values(collectionStats(cards))).toEqual({ Cards: 4, Distinct: 3, Autos: 1, Relics: 1, "Serial-numbered": 1, Rookies: 1 });
});

test("the Serial-numbered tile skips a print run that is not serial-numbered", () => {
  const plain = makeCard({ parallel: { name: "Gold", serial: null, serialLegible: true, printRun: 99, serialNumbered: false } });
  expect(values(collectionStats([plain]))["Serial-numbered"]).toBe(0);
});

test("an empty list gives zeros and no groups", () => {
  const stats = collectionStats([]);
  expect(values(stats)).toEqual(zero);
  expect(stats.recent).toEqual([]);
  expect(stats.teams).toEqual([]);
});

test("every tile but Cards equals the list its filters open, and Cards is the quantity sum", () => {
  const cards = Array.from({ length: 500 }, (_, i) =>
    makeCard({
      cardNumber: String(i),
      quantity: 1 + (i % 3),
      flags: { rookie: i % 5 === 0, autograph: i % 7 === 0, relic: i % 11 === 0 },
      parallel: i % 6 === 0 ? { name: "Gold", serial: i % 2 === 0 ? 1 : null, serialLegible: true, printRun: 50 } : null,
    }),
  );
  const { tiles } = collectionStats(cards);
  expect(tiles[0].value).toBe(cards.reduce((n, c) => n + c.quantity, 0));
  for (const tile of tiles.slice(1)) {
    const expected = tile.label === "Distinct" ? 500 : applyFilters(cards, { ...emptyFilters, ...tile.filters }).length;
    expect(tile.value, tile.label).toBe(expected);
  }
});

test("Recently added is the newest four by creation, edits ignored", () => {
  const cards = [1, 2, 3, 4, 5, 6].map((n) => makeCard({ player: `P${n}`, cardNumber: String(n), createdAt: at(n), updatedAt: at(n) }));
  cards[0] = { ...cards[0], updatedAt: at(28) };
  expect(collectionStats(cards).recent.map((c) => c.player)).toEqual(["P6", "P5", "P4", "P3"]);
  expect(collectionStats(cards.slice(0, 2)).recent.map((c) => c.player)).toEqual(["P2", "P1"]);
});

test("Top teams merge spellings, count distinct cards, order ties by name, cap at five, skip no-team cards", () => {
  const mk = (team: string, n: number) => Array.from({ length: n }, (_, i) => makeCard({ team, cardNumber: `${team}${i}`, quantity: 3 }));
  const cards = [
    ...mk("Atlanta Braves", 2), ...mk(" atlanta braves ", 1), ...mk("New York Mets", 2), ...mk("Chicago Cubs", 2),
    ...mk("T4", 1), ...mk("T5", 1), ...mk("T6", 1), ...mk("T7", 1), ...mk("", 4),
  ];
  const { teams } = collectionStats(cards);
  expect(teams.map((t) => [t.name, t.count])).toEqual([
    ["Atlanta Braves", 3], ["Chicago Cubs", 2], ["New York Mets", 2], ["T4", 1], ["T5", 1],
  ]);
  for (const t of teams) expect(t.count).toBe(applyFilters(cards, { ...emptyFilters, team: t.name }).length);
});
