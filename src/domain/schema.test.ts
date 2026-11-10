import { expect, test } from "vitest";
import { makeCard } from "./fixtures";
import { validateCard } from "./schema";

const parallel = (serial: number | null, printRun: number | null, serialLegible = true) => ({
  name: "Gold",
  serial,
  serialLegible,
  printRun,
});

test("a minimum card is valid", () => {
  expect(validateCard(makeCard({ team: "", manufacturer: "" }))).toEqual({});
});

test("missing required fields are reported", () => {
  const errors = validateCard(makeCard({ player: " ", set: "", cardNumber: "", year: Number.NaN }));
  expect(Object.keys(errors).sort()).toEqual(["cardNumber", "player", "set", "year"]);
});

test("serial above print run is an error on the serial field", () => {
  expect(Object.keys(validateCard(makeCard({ parallel: parallel(100, 99) })))).toEqual(["serial"]);
});

test("serial equal to print run, and unreadable serial with a print run, are valid", () => {
  expect(validateCard(makeCard({ parallel: parallel(99, 99) }))).toEqual({});
  expect(validateCard(makeCard({ parallel: parallel(null, 99, false) }))).toEqual({});
});

test("subset and insert are optional", () => {
  expect(validateCard(makeCard())).toEqual({});
  expect(validateCard(makeCard({ subset: "Future Stars", insert: "Stars of MLB" }))).toEqual({});
});

test("graded needs a company and a grade", () => {
  expect(Object.keys(validateCard(makeCard({ grading: { kind: "graded", company: "PSA", grade: "" } })))).toEqual(["grading"]);
  expect(validateCard(makeCard({ grading: { kind: "graded", company: "PSA", grade: "9" } }))).toEqual({});
});
