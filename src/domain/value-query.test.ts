import { expect, test } from "vitest";
import { makeCard } from "./fixtures";
import { soldPricesUrl, valueQuery } from "./value-query";

const parallel = (over: Partial<NonNullable<ReturnType<typeof makeCard>["parallel"]>>) => ({
  name: "Gold Refractor",
  serialNumbered: true,
  serial: null,
  serialLegible: false,
  printRun: 50,
  ...over,
});

test("a plain base card is year, manufacturer, set, player and number", () => {
  expect(valueQuery(makeCard({ year: 2024 }))).toBe("2024 Topps Series 1 Ronald Acuña Jr. 27");
});

test("empty fields are left out with no stray spaces", () => {
  expect(valueQuery(makeCard({ year: 2024, manufacturer: "  ", cardNumber: "" }))).toBe("2024 Series 1 Ronald Acuña Jr.");
});

test("a numbered parallel ends with the print run", () => {
  expect(valueQuery(makeCard({ parallel: parallel({}) }))).toMatch(/ Gold Refractor \/50$/);
});

test("an unset serialNumbered with a print run still ends with the print run", () => {
  expect(valueQuery(makeCard({ parallel: parallel({ serialNumbered: undefined }) }))).toMatch(/\/50$/);
});

test("a parallel without numbering or print run has no slash", () => {
  const plain = valueQuery(makeCard({ parallel: parallel({ name: "Refractor", serialNumbered: false }) }));
  const noRun = valueQuery(makeCard({ parallel: parallel({ name: "Refractor", printRun: null }) }));
  expect(plain).toMatch(/ Refractor$/);
  expect(noRun).toMatch(/ Refractor$/);
  expect(plain + noRun).not.toContain("/");
});

test("flags add RC, Auto and Relic in that order", () => {
  const flags = { rookie: true, autograph: true, relic: true };
  expect(valueQuery(makeCard({ flags }))).toMatch(/ 27 RC Auto Relic$/);
});

test("a graded card ends with company and grade", () => {
  const grading = { kind: "graded" as const, company: "PSA", grade: "10" };
  expect(valueQuery(makeCard({ grading }))).toMatch(/ 27 PSA 10$/);
});

test("raw condition is left out", () => {
  expect(valueQuery(makeCard({ grading: { kind: "raw", condition: "Near Mint" } }))).not.toContain("Near Mint");
});

test("the link is the eBay sold and completed search for the words", () => {
  const card = makeCard({ parallel: parallel({}) });
  const url = new URL(soldPricesUrl(card));
  expect(url.origin + url.pathname).toBe("https://www.ebay.com/sch/i.html");
  expect(url.searchParams.get("_nkw")).toBe(valueQuery(card));
  expect(url.searchParams.get("LH_Sold")).toBe("1");
  expect(url.searchParams.get("LH_Complete")).toBe("1");
  expect(url.searchParams.get("_sacat")).toBe("213");
});
