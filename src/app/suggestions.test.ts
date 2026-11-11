import { expect, test } from "vitest";
import { flaggedKeys, suggestionPatch } from "./suggestions";

test("a suggestion becomes form values as text", () => {
  expect(
    suggestionPatch({
      player: "Ronald Acuña Jr.",
      year: 2024,
      cardNumber: "27",
      parallel: { name: "Gold", serial: 23, serialLegible: true, printRun: 2026 },
    }),
  ).toEqual({ player: "Ronald Acuña Jr.", year: "2024", cardNumber: "27", parallel: "Gold", serialNumbered: true, serial: "23", printRun: "2026" });
});

test("an unreadable serial ticks the unreadable box and keeps the print run", () => {
  const patch = suggestionPatch({ parallel: { name: "Blue", serial: null, serialLegible: false, printRun: 99 } });
  expect(patch).toEqual({ parallel: "Blue", printRun: "99", serialNumbered: true, serialUnreadable: true });
});

test("a serial found without a parallel name suggests the numbers only", () => {
  const patch = suggestionPatch({ parallel: { name: "", serial: 23, serialLegible: true, printRun: 99 } });
  expect(patch).toEqual({ serialNumbered: true, serial: "23", printRun: "99" });
});

test("a print run alone does not mark the card serial-numbered", () => {
  expect(suggestionPatch({ parallel: { name: "", serial: null, serialLegible: true, printRun: 99 } })).toEqual({ printRun: "99" });
});

test("an empty suggestion changes nothing", () => {
  expect(suggestionPatch({})).toEqual({});
});

test("a doubtful parallel flags all of its fields", () => {
  expect(flaggedKeys({ lowConfidence: ["player", "parallel"] })).toEqual(["player", "parallel", "serial", "printRun"]);
  expect(flaggedKeys({})).toEqual([]);
});
