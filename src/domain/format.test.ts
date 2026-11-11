import { expect, test } from "vitest";
import { makeCard } from "./fixtures";
import { isSerialNumbered, serialLabel } from "./format";

const parallel = (over: Partial<NonNullable<ReturnType<typeof makeCard>["parallel"]>>) => ({
  name: "Gold",
  serial: null,
  serialLegible: true,
  printRun: null,
  ...over,
});

test("a print run without the serial-numbered mark has no label and is not serial-numbered", () => {
  const p = parallel({ serialNumbered: false, printRun: 99 });
  expect(serialLabel(p)).toBeNull();
  expect(isSerialNumbered(makeCard({ parallel: p }))).toBe(false);
});

test("marked serial-numbered with an unreadable serial shows ?/run", () => {
  const p = parallel({ serialNumbered: true, serialLegible: false, printRun: 99 });
  expect(serialLabel(p)).toBe("?/99");
  expect(isSerialNumbered(makeCard({ parallel: p }))).toBe(true);
});

test("an old parallel without the field counts as serial-numbered when it has a serial or print run", () => {
  const old = parallel({ printRun: 99 });
  expect(serialLabel(old)).toBe("?/99");
  expect(isSerialNumbered(makeCard({ parallel: old }))).toBe(true);
  expect(isSerialNumbered(makeCard({ parallel: parallel({}) }))).toBe(false);
});
