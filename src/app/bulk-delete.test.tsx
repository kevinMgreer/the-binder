import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useEffect, useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { FakeAuthProvider, createFakePorts } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import { emptyFilters, defaultSort, type Filters } from "../domain/query";
import { SyncEngine } from "../sync/engine";
import { CollectionScreen } from "./CollectionScreen";
import { PortsProvider } from "./ports-context";
import { AuthGate } from "./session";
import { openSheets } from "./Sheet";
import { SyncProvider } from "./sync-context";

vi.mock("./Thumb", () => ({ Thumb: () => null }));
// jsdom has no layout, so the real virtualizer renders no rows.
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count, lanes = 1 }: { count: number; lanes?: number }) => ({
    getTotalSize: () => count * 100,
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, start: index * 100, lane: index % lanes })),
    measureElement: () => {},
    measure: () => {},
    scrollToIndex: () => {},
  }),
}));
window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
afterEach(cleanup);

const cards = [
  makeCard({ id: "a", player: "Hank Aaron", set: "Chrome", team: "Braves" }),
  makeCard({ id: "b", player: "Mookie Betts", set: "Chrome", team: "Dodgers", cardNumber: "2" }),
  makeCard({ id: "c", player: "Ty Cobb", set: "Heritage", team: "Tigers", cardNumber: "3" }),
];

/** The screen alone, with the back handler App gives it. */
function Harness({ onRemoveMany }: { onRemoveMany: (c: typeof cards) => Promise<string[]> }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  useEffect(() => {
    const back = () => openSheets.at(-1)?.();
    window.addEventListener("hardware-back", back);
    return () => window.removeEventListener("hardware-back", back);
  }, []);
  return (
    <CollectionScreen
      cards={cards}
      filters={filters}
      onFiltersChange={setFilters}
      sort={defaultSort}
      onSortChange={() => {}}
      view="list"
      onViewChange={() => {}}
      update={null}
      onAdd={() => {}}
      onNavigate={() => {}}
      onSettings={() => {}}
      onOpen={() => {}}
      onSaveMany={async () => {}}
      onRemoveMany={onRemoveMany}
    />
  );
}

function renderList(onRemoveMany = vi.fn(async (): Promise<string[]> => [])) {
  const ports = { ...createFakePorts(), auth: new FakeAuthProvider({ email: "owner@example.test" }) };
  render(
    <PortsProvider ports={ports}>
      <SyncProvider engine={new SyncEngine(ports)}>
        <AuthGate autoSync={false}>
          <Harness onRemoveMany={onRemoveMany} />
        </AuthGate>
      </SyncProvider>
    </PortsProvider>,
  );
  return onRemoveMany;
}

const bar = () => screen.findByTestId("selection-bar");
const back = () => act(async () => void window.dispatchEvent(new Event("hardware-back")));
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const row = (player: string) => screen.getByText(player).closest("button")!;
const dialog = () => screen.getByRole("alertdialog", { name: "Delete cards" });

async function selectAll() {
  await screen.findByTestId("shown");
  click("Select cards");
  click("Select all");
}

test("Delete sits right before Edit and is disabled with nothing selected", async () => {
  renderList();
  await screen.findByTestId("shown");
  click("Select cards");
  const buttons = within(await bar()).getAllByRole("button");
  const names = buttons.map((b) => b.getAttribute("aria-label") ?? b.textContent);
  expect(names.indexOf("Delete")).toBe(names.indexOf("Edit") - 1);
  expect(screen.getByRole("button", { name: "Delete" }).hasAttribute("disabled")).toBe(true);
  click("Select all");
  expect(screen.getByRole("button", { name: "Delete" }).hasAttribute("disabled")).toBe(false);
});

test("Delete asks 'Delete 3 cards?' with Keep focused, and 'Delete 1 card?' for one", async () => {
  renderList();
  await selectAll();
  click("Delete");
  expect(within(dialog()).getByText("Delete 3 cards?")).toBeTruthy();
  expect(document.activeElement).toBe(within(dialog()).getByRole("button", { name: "Keep" }));
  click("Keep");
  fireEvent.click(row("Hank Aaron"));
  fireEvent.click(row("Mookie Betts"));
  click("Delete");
  expect(within(dialog()).getByText("Delete 1 card?")).toBeTruthy();
});

test.each([
  ["Keep", () => click("Keep")],
  ["a scrim click", () => fireEvent.click(dialog().parentElement!)],
  ["Escape", () => fireEvent.keyDown(dialog().parentElement!, { key: "Escape" })],
  ["hardware back", () => back()],
])("%s closes the dialog, deletes nothing, keeps the selection and focuses Delete", async (_name, close) => {
  const onRemoveMany = renderList();
  await selectAll();
  click("Delete");
  await close();
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(onRemoveMany).not.toHaveBeenCalled();
  expect((await bar()).textContent).toContain("3 selected");
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete" }));
});

test("after the dialog closes, a second back leaves selection mode", async () => {
  renderList();
  await selectAll();
  click("Delete");
  await back();
  await back();
  expect(screen.queryByTestId("selection-bar")).toBeNull();
});

test("confirming deletes only the shown selected cards, then ends selection mode", async () => {
  const onRemoveMany = renderList();
  await selectAll();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Chrome" } });
  expect((await bar()).textContent).toContain("2 selected");
  click("Delete");
  fireEvent.click(within(dialog()).getByRole("button", { name: "Delete" }));
  await waitFor(() => expect(screen.queryByTestId("selection-bar")).toBeNull());
  expect(onRemoveMany).toHaveBeenCalledTimes(1);
  expect((onRemoveMany.mock.calls[0] as unknown as [typeof cards])[0].map((c) => c.id)).toEqual(["a", "b"]);
});

test("a partial failure keeps the dialog open, says so, and keeps only the failed card selected", async () => {
  renderList(vi.fn(async () => ["c"]));
  await selectAll();
  click("Delete");
  fireEvent.click(within(dialog()).getByRole("button", { name: "Delete" }));
  await within(dialog()).findByText(/1 card could not be deleted/);
  expect((await bar()).textContent).toContain("1 selected");
  expect(within(dialog()).getByText("Delete 1 card?")).toBeTruthy();
});

test("a rejected delete shows the generic error and leaves the selection as it was", async () => {
  renderList(vi.fn(async () => Promise.reject(new Error("offline"))));
  await selectAll();
  click("Delete");
  fireEvent.click(within(dialog()).getByRole("button", { name: "Delete" }));
  await within(dialog()).findByText("Could not delete the cards. Try again.");
  expect((await bar()).textContent).toContain("3 selected");
  expect(within(dialog()).getByRole("button", { name: "Delete" }).hasAttribute("disabled")).toBe(false);
});
