import { expect, test } from "vitest";
import { toPatch } from "./BulkEditSheet";

const blank = { team: "", year: "", manufacturer: "", set: "", subset: "", insert: "", parallel: "", rookie: "" as "" | "yes" | "no", autograph: "" as "" | "yes" | "no", relic: "" as "" | "yes" | "no", grading: "", condition: "", company: "", grade: "" };

test("an untouched draft has no keys", () => {
  expect(toPatch(blank)).toEqual({});
});

test("Rookie Yes and No both become booleans", () => {
  expect(toPatch({ ...blank, rookie: "yes" })).toEqual({ rookie: true });
  expect(toPatch({ ...blank, rookie: "no" })).toEqual({ rookie: false });
});

test("Raw replaces graded with the chosen condition", () => {
  expect(toPatch({ ...blank, grading: "raw", condition: "Mint" })).toEqual({ grading: { kind: "raw", condition: "Mint" } });
});

test("Graded needs company and grade", () => {
  expect(toPatch({ ...blank, grading: "graded", company: " PSA ", grade: "10" })).toEqual({ grading: { kind: "graded", company: "PSA", grade: "10" } });
  expect(toPatch({ ...blank, grading: "graded", company: "PSA" })).toEqual({});
  expect(toPatch({ ...blank, grading: "graded", grade: "10" })).toEqual({});
});

test("Year is kept only as a whole number from 1800", () => {
  expect(toPatch({ ...blank, year: "1987" })).toEqual({ year: 1987 });
  for (const bad of ["19.5", "1799", "-5", "0", "abc", "1e2"]) expect(toPatch({ ...blank, year: bad })).toEqual({});
});
