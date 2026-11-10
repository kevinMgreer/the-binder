import { describe, expect, test } from "vitest";
import { parseCardText } from "./card-text";

const NOW = new Date("2026-06-01T00:00:00Z");
const parse = (text: string) => parseCardText(text, NOW);

// Synthetic card-back text shaped like ML Kit output (one line per block line). Real phone fixtures are pending (desk T-24).
const BASE_BACK = `RONALD ACUÑA JR.
ATLANTA BRAVES · OF
BATS: R THROWS: R
YEAR AVG HR RBI
2023 .337 41 106
No. 27
© 2024 THE TOPPS COMPANY, INC.
SERIES 1
PRINTED IN U.S.A.`;

describe("parseCardText", () => {
  test("reads year, card number and set from a base card back", () => {
    expect(parse(BASE_BACK)).toEqual({ year: 2024, manufacturer: "Topps", set: "Series 1", cardNumber: "27" });
  });

  test("prefers the copyright year over the stat years", () => {
    expect(parse("2019 .280\n2023 .337\n© 2024 Panini America").year).toBe(2024);
  });

  test("without a copyright mark it takes the first plausible year", () => {
    expect(parse("Donruss Optic\n2022").year).toBe(2022);
    expect(parse("1899\n3024").year).toBeUndefined();
    expect(parse("2031").year).toBeUndefined();
  });

  test.each([
    ["CARD NO. US123", "US123"],
    ["#T87-12", "T87-12"],
    ["BDP-45", "BDP-45"],
    ["No 7", "7"],
  ])("card number from %s", (line, expected) => {
    expect(parse(`NAME\n${line}\n© 2022 Bowman`).cardNumber).toBe(expected);
  });

  test("a stat row is not a card number", () => {
    expect(parse("YEAR AVG HR\n2023 .337 41").cardNumber).toBeUndefined();
  });

  test("a standalone short number line is the card number, a year is not", () => {
    expect(parse("2024\n27\n© Topps").cardNumber).toBe("27");
    expect(parse("2024\n© Topps").cardNumber).toBeUndefined();
  });

  test("a serial stamp becomes a legible parallel with its print run", () => {
    expect(parse("© 2024 Topps\nNo. 27\n23/99").parallel).toEqual({ name: "", serial: 23, serialLegible: true, printRun: 99 });
  });

  test("an unreadable serial keeps the print run and marks it unreadable", () => {
    expect(parse("© 2024 Topps\n?/99").parallel).toEqual({ name: "", serial: null, serialLegible: false, printRun: 99 });
  });

  test("a bare print run with no serial is an unreadable serial", () => {
    expect(parse("© 2024 Topps\n/99").parallel).toEqual({ name: "", serial: null, serialLegible: false, printRun: 99 });
  });

  test("a serial above its print run is ignored", () => {
    expect(parse("© 2024 Topps\n150/99").parallel).toBeUndefined();
  });

  test("stat lines with slashes are not serials", () => {
    expect(parse("W/L 12/7 ERA 3.10").parallel).toBeUndefined();
  });

  test("known manufacturer and set names match case-insensitively on word boundaries", () => {
    expect(parse("upper deck\nsynthetic young guns")).toMatchObject({ manufacturer: "Upper Deck" });
    expect(parse("TOPPS HERITAGE")).toMatchObject({ manufacturer: "Topps", set: "Heritage" });
    expect(parse("Bowman Chrome Prospects")).toMatchObject({ manufacturer: "Bowman", set: "Chrome" });
    expect(parse("Scoreboard operator")).toEqual({});
  });

  test("text with nothing usable gives an empty suggestion", () => {
    expect(parse("")).toEqual({});
    expect(parse("PRINTED IN U.S.A.\nSTATS")).toEqual({});
  });
});
