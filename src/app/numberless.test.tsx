import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { makeCard } from "../domain/fixtures";
import { CardDetail } from "./CardDetail";
import { CardList } from "./CardList";
import { Dashboard } from "./Dashboard";

vi.mock("./SyncIndicator", () => ({ SyncIndicator: () => null, SyncActions: () => null }));
vi.mock("./Thumb", () => ({ Thumb: () => null }));
vi.mock("./hooks", () => ({ useThumbUrl: () => undefined }));
// jsdom has no layout, so the real virtualizer renders no rows.
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 100,
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, start: index * 100 })),
  }),
}));
afterEach(cleanup);

const bare = makeCard({ cardNumber: "", year: 2024, set: "Series 1" });

test("a numberless row shows year and set with no # and no dangling separator", () => {
  render(<CardList cards={[bare]} onOpen={() => {}} />);
  const quiet = document.querySelector(".quiet")!;
  expect(quiet.textContent).toBe("2024 Series 1");
});

test("a numberless detail line has no # and no dangling separator", () => {
  render(<CardDetail card={bare} onEdit={() => {}} onDelete={async () => {}} />);
  expect(screen.getByTestId("subtitle").textContent).toBe("2024 Series 1");
});

test("a numberless Dashboard card has an aria label without #", () => {
  const props = { onAdd() {}, onNavigate() {}, onSettings() {}, onTile() {}, onOpenCard() {} };
  render(<Dashboard cards={[bare]} update={null} {...props} />);
  expect(screen.getByTestId("recent").getAttribute("aria-label")).toBe(`${bare.player}, 2024 Series 1`);
});
