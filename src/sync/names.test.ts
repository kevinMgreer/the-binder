import { expect, test } from "vitest";
import { makeCard } from "../domain/fixtures";
import { photoFileName, thumbFileName } from "./names";

test("photo file name has year, manufacturer, card number, player, side and a short id", () => {
  const card = makeCard({ id: "1234abcd-0000-0000-0000-000000000000", year: 2024, manufacturer: "Topps", cardNumber: "27", player: "Ronald Acuña Jr." });
  expect(photoFileName(card, "front")).toBe("2024-topps-27-ronald-acuna-jr-front-1234abcd.webp");
  expect(photoFileName(card, "back")).toBe("2024-topps-27-ronald-acuna-jr-back-1234abcd.webp");
});

test("a card with no number gives a file name without a gap", () => {
  const card = makeCard({ id: "1234abcd-0", year: 2024, manufacturer: "Topps", cardNumber: "", player: "Ronald Acuña Jr." });
  expect(photoFileName(card, "front")).toBe("2024-topps-ronald-acuna-jr-front-1234abcd.webp");
});

test("a missing manufacturer falls back to the set name", () => {
  const card = makeCard({ id: "1234abcd-0", manufacturer: "", set: "Series 1" });
  expect(photoFileName(card, "front")).toContain("-series-1-");
});

test("thumbnail file name is the card id and side", () => {
  expect(thumbFileName(makeCard({ id: "abc" }), "back")).toBe("abc-back.webp");
});
