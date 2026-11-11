import { expect, test } from "vitest";
import { serialLabel } from "./format";
import { makeCard } from "./fixtures";
import { applyFilters, emptyFilters, findDuplicate, lastNameKey, sortCards, type SortBy } from "./query";

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

test.each([
  ["Ronald Acuña Jr.", "Acuña"],
  ["Ken Griffey, Jr.", "Griffey"],
  ["Cal Ripken III", "Ripken"],
  ["Ichiro", "Ichiro"],
  ["Mike Trout / Shohei Ohtani", "Trout"],
  ["Aaron Judge & Juan Soto", "Judge"],
  ["Mookie Betts and Freddie Freeman", "Betts"],
  ["Jr.", "Jr."],
])("last name key of %s is %s", (player, key) => {
  expect(lastNameKey(makeCard({ player }))).toBe(key);
});

test("a team card keys on the whole player text", () => {
  expect(lastNameKey(makeCard({ player: "Atlanta Braves Team Card", team: "Atlanta Braves" }))).toBe("Atlanta Braves Team Card");
});

test("a sort name wins, and a blank one falls back to the derived key", () => {
  expect(lastNameKey(makeCard({ player: "Elly De La Cruz", sortName: "De La Cruz" }))).toBe("De La Cruz");
  expect(lastNameKey(makeCard({ player: "Mookie Betts", sortName: "  " }))).toBe("Betts");
  expect("sortName" in makeCard()).toBe(false);
  expect(lastNameKey(makeCard({ player: "Mookie Betts" }))).toBe("Betts");
});

const acuna = makeCard({ player: "Ronald Acuña Jr.", year: 2024, team: "Los Angeles Dodgers", set: "Topps Chrome" });
const betts = makeCard({ player: "Mookie Betts", year: 2021, team: "Atlanta Braves", set: "Bowman" });
const freeman = makeCard({ player: "Freddie Freeman", year: 2019, team: "Texas Rangers", set: "Topps Chrome" });

test("sortCards defaults to last name ascending, ignoring accents", () => {
  expect(sortCards([freeman, betts, acuna])).toEqual([acuna, betts, freeman]);
});

test("ties in the sort key fall back to year", () => {
  const old = makeCard({ player: "Ronald Acuña Jr.", year: 2019 });
  expect(sortCards([acuna, old])).toEqual([old, acuna]);
});

test.each<[SortBy, typeof acuna[]]>([
  ["lastName", [acuna, betts, freeman]],
  ["year", [freeman, betts, acuna]],
  ["team", [betts, acuna, freeman]],
  ["set", [betts, freeman, acuna]],
])("sort by %s, and descending is the exact reverse", (by, expected) => {
  const cards = [freeman, acuna, betts];
  expect(sortCards(cards, { by, descending: false })).toEqual(expected);
  expect(sortCards(cards, { by, descending: true })).toEqual([...sortCards(cards, { by, descending: false })].reverse());
});

test("year descending lists newest first", () => {
  expect(sortCards([freeman, acuna, betts], { by: "year", descending: true })).toEqual([acuna, betts, freeman]);
});

test("a plain surname sorts before a sort name that comes later", () => {
  const darvish = makeCard({ player: "Yu Darvish" });
  const cruz = makeCard({ player: "Elly De La Cruz", sortName: "De La Cruz" });
  expect(sortCards([cruz, darvish])).toEqual([darvish, cruz]);
});

test("duplicate match uses player, year, set, number, parallel and grade, and ignores tombstones", () => {
  const existing = makeCard();
  expect(findDuplicate([existing], makeCard({ player: "ronald acuna jr." }))).toBe(existing);
  expect(findDuplicate([existing], makeCard({ cardNumber: "28" }))).toBeUndefined();
  expect(findDuplicate([existing], makeCard({ grading: { kind: "graded", company: "PSA", grade: "9" } }))).toBeUndefined();
  expect(findDuplicate([{ ...existing, deletedAt: "2026-01-02T00:00:00.000Z" }], makeCard())).toBeUndefined();
});
