import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { makeCard } from "../domain/fixtures";
import { CardGrid } from "./CardGrid";

vi.mock("./Thumb", () => ({ Thumb: () => null }));
// jsdom has no layout, so the real virtualizer renders no tiles.
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count, lanes }: { count: number; lanes: number }) => ({
    getTotalSize: () => count * 100,
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, start: index * 100, lane: index % lanes })),
    measureElement: () => {},
    measure: () => {},
  }),
}));
window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
afterEach(cleanup);

const betts = makeCard({ player: "Mookie Betts", year: 2024, set: "Topps Chrome", cardNumber: "27", quantity: 3 });
const acuna = makeCard({ player: "Ronald Acuña Jr.", year: 2019, set: "Bowman", cardNumber: "", quantity: 1 });

test("a tile is named player, year and set, number and copies; a bare card has neither", () => {
  render(<CardGrid cards={[betts, acuna]} onOpen={() => {}} />);
  expect(screen.getByRole("button", { name: "Mookie Betts, 2024 Topps Chrome, number 27, 3 copies" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Ronald Acuña Jr., 2019 Bowman" })).toBeTruthy();
});

test("the caption is the player, then the year with the quantity badge", () => {
  render(<CardGrid cards={[betts, acuna]} onOpen={() => {}} />);
  const [first, second] = screen.getAllByTestId("card-tile");
  expect(first.querySelector(".grid-name")!.textContent).toBe("Mookie Betts");
  expect(first.querySelector(".grid-year")!.textContent).toBe("2024");
  expect(first.querySelector(".badge")!.textContent).toBe("×3");
  expect(second.querySelector(".badge")).toBeNull();
});

test("tapping a tile opens its card", () => {
  const onOpen = vi.fn();
  render(<CardGrid cards={[betts]} onOpen={onOpen} />);
  fireEvent.click(screen.getByTestId("card-tile").querySelector("button")!);
  expect(onOpen).toHaveBeenCalledWith(betts);
});
