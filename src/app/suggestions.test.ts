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
  ).toEqual({ player: "Ronald Acuña Jr.", year: "2024", cardNumber: "27", parallel: "Gold", serial: "23", printRun: "2026" });
});

test("an unreadable serial ticks the unreadable box and keeps the print run", () => {
  const patch = suggestionPatch({ parallel: { name: "Blue", serial: null, serialLegible: false, printRun: 99 } });
  expect(patch).toEqual({ parallel: "Blue", printRun: "99", serialUnreadable: true });
});

test("an empty suggestion changes nothing", () => {
  expect(suggestionPatch({})).toEqual({});
});

test("a doubtful parallel flags all of its fields", () => {
  expect(flaggedKeys({ lowConfidence: ["player", "parallel"] })).toEqual(["player", "parallel", "serial", "printRun"]);
  expect(flaggedKeys({})).toEqual([]);
});
