import { expect, test } from "vitest";
import { serialLabel } from "./format";
import { makeCard } from "./fixtures";
import { applyFilters, emptyFilters, findDuplicate, sortCards, summarize } from "./query";

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

test("summary counts quantity and distinct cards", () => {
  expect(summarize([makeCard({ quantity: 3 }), makeCard()])).toEqual({ total: 4, distinct: 2 });
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

test("duplicate match uses player, year, set, number, parallel and grade, and ignores tombstones", () => {
  const existing = makeCard();
  expect(findDuplicate([existing], makeCard({ player: "ronald acuna jr." }))).toBe(existing);
  expect(findDuplicate([existing], makeCard({ cardNumber: "28" }))).toBeUndefined();
  expect(findDuplicate([existing], makeCard({ grading: { kind: "graded", company: "PSA", grade: "9" } }))).toBeUndefined();
  expect(findDuplicate([{ ...existing, deletedAt: "2026-01-02T00:00:00.000Z" }], makeCard())).toBeUndefined();
});
