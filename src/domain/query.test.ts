import { expect, test } from "vitest";
import { serialLabel } from "./format";
import { makeCard } from "./fixtures";
import { applyFilters, emptyFilters, findDuplicate, sortCards } from "./query";

test("serial label shows readable and unreadable serials", () => {
  expect(serialLabel({ name: "Gold", serial: 23, serialLegible: true, printRun: 2026 })).toBe("23/2026");
  expect(serialLabel({ name: "Gold", serial: null, serialLegible: false, printRun: 99 })).toBe("?/99");
  expect(serialLabel(null)).toBeNull();
});

test("default sort is year, then set, then numeric card number", () => {
  const a = makeCard({ year: 2020, set: "B", cardNumber: "2" });
  const b = makeCard({ year: 2020, set: "B", cardNumber: "10" });
  const c = makeCard({ year: 2019, set: "Z", cardNumber: "1" });
  const d = makeCard({ year: 2020, set: "A", cardNumber: "5" });
  expect(sortCards([a, b, c, d])).toEqual([c, d, a, b]);
});

test("search ignores case and accents and covers notes", () => {
  const cards = [makeCard({ player: "Ronald Acuña Jr." }), makeCard({ player: "Mookie Betts", notes: "from ACUNA lot" })];
  expect(applyFilters(cards, { ...emptyFilters, search: "ACUNA" })).toHaveLength(2);
  expect(applyFilters(cards, { ...emptyFilters, search: "mookie" })).toHaveLength(1);
});

test("filters combine, and print run matches unreadable serials", () => {
  const unreadable = makeCard({ parallel: { name: "Gold", serial: null, serialLegible: false, printRun: 99 } });
  const other = makeCard({ parallel: { name: "Blue", serial: 5, serialLegible: true, printRun: 150 } });
  expect(applyFilters([unreadable, other], { ...emptyFilters, printRun: 99 })).toEqual([unreadable]);
  expect(applyFilters([unreadable, other], { ...emptyFilters, serialNumbered: true, yearFrom: 2025 })).toEqual([]);
});

test("search finds a card by subset and by insert", () => {
  const a = makeCard({ subset: "Future Stars" });
  const b = makeCard({ insert: "Future Stars" });
  const c = makeCard();
  expect(applyFilters([a, b, c], { ...emptyFilters, search: "future stars" })).toEqual([a, b]);
});

test("player filter matches the player only, ignoring case and accents", () => {
  const a = makeCard({ player: "Ronald Acuña Jr." });
  const b = makeCard({ player: "Mookie Betts", team: "Acuna Aces", notes: "acuna lot" });
  expect(applyFilters([a, b], { ...emptyFilters, player: "acuna" })).toEqual([a]);
  expect(applyFilters([a, b], { ...emptyFilters, player: "   " })).toEqual([a, b]);
});

test("team filter ignores case and surrounding spaces", () => {
  const a = makeCard({ team: "atlanta braves" });
  const b = makeCard({ team: " Atlanta Braves " });
  const c = makeCard({ team: "Boston Red Sox" });
  expect(applyFilters([a, b, c], { ...emptyFilters, team: "Atlanta Braves" })).toEqual([a, b]);
});

test("manufacturer and parallel filters are exact after normalizing", () => {
  const gold = makeCard({ manufacturer: "topps", parallel: { name: "gold", serial: null, serialLegible: true, printRun: null } });
  const refractor = makeCard({ manufacturer: "Topps", parallel: { name: "Gold Refractor", serial: null, serialLegible: true, printRun: null } });
  const bowman = makeCard({ manufacturer: "Bowman", parallel: { name: "Gold", serial: null, serialLegible: true, printRun: null } });
  expect(applyFilters([gold, refractor, bowman], { ...emptyFilters, manufacturer: "Topps", parallel: "Gold" })).toEqual([gold]);
});

test("insert filter matches only that insert", () => {
  const a = makeCard({ insert: "Stars of MLB" });
  const b = makeCard({ insert: "Other" });
  const c = makeCard();
  expect(applyFilters([a, b, c], { ...emptyFilters, insert: "Stars of MLB" })).toEqual([a]);
  expect(applyFilters([a, b, c], { ...emptyFilters, subset: "Stars of MLB" })).toEqual([]);
});

test("a card with no number sorts before a numbered card of the same set", () => {
  const numbered = makeCard({ cardNumber: "5" });
  const bare = makeCard({ cardNumber: "" });
  expect(sortCards([numbered, bare])).toEqual([bare, numbered]);
});

test("two numberless cards with the same other fields are duplicates", () => {
  const existing = makeCard({ cardNumber: "" });
  expect(findDuplicate([existing], makeCard({ cardNumber: "" }))).toBe(existing);
});

test("print run 99 without the serial-numbered mark matches the print run filter, not serial-numbered", () => {
  const plain = makeCard({ parallel: { name: "Gold", serial: null, serialLegible: true, printRun: 99, serialNumbered: false } });
  expect(applyFilters([plain], { ...emptyFilters, printRun: 99 })).toEqual([plain]);
  expect(applyFilters([plain], { ...emptyFilters, serialNumbered: true })).toEqual([]);
});

test("duplicate match uses player, year, set, number, parallel and grade, and ignores tombstones", () => {
  const existing = makeCard();
  expect(findDuplicate([existing], makeCard({ player: "ronald acuna jr." }))).toBe(existing);
  expect(findDuplicate([existing], makeCard({ cardNumber: "28" }))).toBeUndefined();
  expect(findDuplicate([existing], makeCard({ grading: { kind: "graded", company: "PSA", grade: "9" } }))).toBeUndefined();
  expect(findDuplicate([{ ...existing, deletedAt: "2026-01-02T00:00:00.000Z" }], makeCard())).toBeUndefined();
});
