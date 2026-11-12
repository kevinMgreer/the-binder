import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { loadCardsView, saveCardsView } from "./cards-view";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

test("no stored value gives list", () => {
  expect(loadCardsView()).toBe("list");
});

test("a stored grid gives grid, and a saved view is read back", () => {
  localStorage.setItem("binder.cardsView", "grid");
  expect(loadCardsView()).toBe("grid");
  saveCardsView("list");
  expect(loadCardsView()).toBe("list");
  saveCardsView("grid");
  expect(localStorage.getItem("binder.cardsView")).toBe("grid");
});

test("any other stored value gives list", () => {
  for (const value of ["", "GRID", "tiles", "null"]) {
    localStorage.setItem("binder.cardsView", value);
    expect(loadCardsView()).toBe("list");
  }
});

test("storage that throws gives list and does not throw", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("denied");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("full");
  });
  expect(loadCardsView()).toBe("list");
  expect(() => saveCardsView("grid")).not.toThrow();
});
