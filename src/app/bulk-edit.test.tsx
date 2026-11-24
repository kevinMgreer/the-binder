import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { FakeAuthProvider, createFakePorts } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import { SyncEngine } from "../sync/engine";
import { App } from "./App";
import { PortsProvider } from "./ports-context";
import { AuthGate } from "./session";
import { SyncProvider } from "./sync-context";

vi.mock("@capacitor/app", () => ({ App: { addListener: async () => ({ remove: async () => {} }), exitApp: () => {} } }));
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
// jsdom has no PointerEvent, so fireEvent would drop clientX and clientY.
window.PointerEvent ??= class extends MouseEvent {} as typeof PointerEvent;
afterEach(cleanup);

const cards = [
  makeCard({ id: "a", player: "Hank Aaron", set: "Chrome", team: "Braves" }),
  makeCard({ id: "b", player: "Mookie Betts", set: "Chrome", team: "Dodgers", cardNumber: "2" }),
  makeCard({ id: "c", player: "Ty Cobb", set: "Heritage", team: "Tigers", cardNumber: "3" }),
];

async function renderList() {
  const ports = { ...createFakePorts(), auth: new FakeAuthProvider({ email: "owner@example.test" }) };
  await ports.collection.putMany(cards);
  render(
    <PortsProvider ports={ports}>
      <SyncProvider engine={new SyncEngine(ports)}>
        <AuthGate autoSync={false}>
          <App />
        </AuthGate>
      </SyncProvider>
    </PortsProvider>,
  );
  await screen.findByRole("heading", { name: "Dashboard" });
  fireEvent.click(within(screen.getByRole("navigation", { name: "Main" })).getByRole("button", { name: "Cards" }));
  await screen.findByTestId("shown");
  return ports;
}

const row = (player: string) => screen.getByText(player).closest("button")!;
const bar = () => screen.getByTestId("selection-bar");
const back = () => act(async () => void window.dispatchEvent(new Event("hardware-back")));
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const onList = () => screen.getByTestId("shown");
/** Fields start collapsed as "Keep as is" rows; a tap opens one. */
const field = (sheet: HTMLElement, name: string) => {
  fireEvent.click(within(sheet).getByRole("button", { name: new RegExp(`^${name}`) }));
  return within(sheet).getByLabelText(name);
};

async function longPress(el: Element) {
  fireEvent.pointerDown(el);
  await new Promise((r) => setTimeout(r, 520));
  fireEvent.pointerUp(el);
  fireEvent.click(el);
  // The timer's setState runs outside act; under load its commit and effects (the back-stack push) can lag.
  await act(async () => {});
  await screen.findByTestId("selection-bar");
}

test("a long press starts selection with that card selected", async () => {
  await renderList();
  await longPress(row("Ty Cobb"));
  expect(bar().textContent).toContain("1 selected");
  expect(row("Ty Cobb").getAttribute("aria-pressed")).toBe("true");
  expect(row("Hank Aaron").getAttribute("aria-pressed")).toBe("false");
});

test("a pointer that moves past 10 px before the delay does not select", async () => {
  await renderList();
  fireEvent.pointerDown(row("Ty Cobb"), { clientX: 0, clientY: 0 });
  fireEvent.pointerMove(row("Ty Cobb"), { clientX: 0, clientY: 30 });
  await new Promise((r) => setTimeout(r, 520));
  expect(screen.queryByTestId("selection-bar")).toBeNull();
});

test("a tap toggles in selection mode and opens no card", async () => {
  await renderList();
  click("Select cards");
  fireEvent.click(row("Hank Aaron"));
  fireEvent.click(row("Ty Cobb"));
  expect(bar().textContent).toContain("2 selected");
  fireEvent.click(row("Ty Cobb"));
  expect(bar().textContent).toContain("1 selected");
  expect(screen.queryByRole("button", { name: "Edit" })).toBeTruthy(); // the bar's Edit, not a card's detail
  expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
});

test("Select all takes the cards the search shows", async () => {
  await renderList();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Chrome" } });
  click("Select cards");
  click("Select all");
  expect(bar().textContent).toContain("2 selected");
});

test("Cancel leaves selection mode and clears it", async () => {
  await renderList();
  await longPress(row("Ty Cobb"));
  click("Cancel");
  expect(screen.queryByTestId("selection-bar")).toBeNull();
  click("Select cards");
  expect(bar().textContent).toContain("0 selected");
});

test("back leaves selection mode first, a second back reaches the dashboard", async () => {
  await renderList();
  await longPress(row("Ty Cobb"));
  await back();
  expect(screen.queryByTestId("selection-bar")).toBeNull();
  expect(onList()).toBeTruthy();
  await back();
  await screen.findByRole("heading", { name: "Dashboard" });
});

test("switching list and grid keeps the selection", async () => {
  await renderList();
  await longPress(row("Ty Cobb"));
  click("Grid view");
  expect(screen.getAllByTestId("card-tile")).toHaveLength(3);
  expect(bar().textContent).toContain("1 selected");
  expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
});

test("the Edit sheet starts at Keep as is with Save disabled; Set alone is written after confirming", async () => {
  const ports = await renderList();
  click("Select cards");
  click("Select all");
  expect(screen.getByRole("button", { name: "Edit" }).hasAttribute("disabled")).toBe(false);
  click("Edit");
  const sheet = screen.getByRole("dialog", { name: "Edit 3 cards" });
  expect(within(sheet).getByRole("button", { name: "Change 3 cards" }).hasAttribute("disabled")).toBe(true);
  expect(within(sheet).queryByLabelText("Team")).toBeNull();
  fireEvent.change(field(sheet, "Set"), { target: { value: "Gold" } });
  fireEvent.click(within(sheet).getByRole("button", { name: "Change 3 cards" }));
  fireEvent.click(within(screen.getByRole("alertdialog", { name: "Change 3 cards?" })).getByRole("button", { name: "Change" }));
  await waitFor(() => expect(screen.queryByTestId("selection-bar")).toBeNull());
  const stored = await ports.collection.list();
  expect(stored.map((c) => c.set)).toEqual(["Gold", "Gold", "Gold"]);
  expect(stored.map((c) => c.team).sort()).toEqual(["Braves", "Dodgers", "Tigers"]);
});

test("a Year that is not a whole number from 1800 disables Change and says why", async () => {
  await renderList();
  click("Select cards");
  click("Select all");
  click("Edit");
  const sheet = screen.getByRole("dialog", { name: "Edit 3 cards" });
  const year = field(sheet, "Year");
  const change = within(sheet).getByRole("button", { name: "Change 3 cards" });
  fireEvent.change(year, { target: { value: "202" } });
  expect(change.hasAttribute("disabled")).toBe(true);
  const hint = within(sheet).getByText("Enter a year");
  expect(year.getAttribute("aria-describedby")).toBe(hint.id);
  fireEvent.change(year, { target: { value: "2023" } });
  expect(change.hasAttribute("disabled")).toBe(false);
  expect(within(sheet).queryByText("Enter a year")).toBeNull();
});

test("Set plus an unfinished Graded keeps Change disabled", async () => {
  await renderList();
  click("Select cards");
  click("Select all");
  click("Edit");
  const sheet = screen.getByRole("dialog", { name: "Edit 3 cards" });
  fireEvent.change(field(sheet, "Set"), { target: { value: "Gold" } });
  fireEvent.change(field(sheet, "Grading"), { target: { value: "graded" } });
  expect(within(sheet).getByRole("button", { name: "Change 3 cards" }).hasAttribute("disabled")).toBe(true);
});

test("a failed save shows the error and lets Change be tried again", async () => {
  const ports = await renderList();
  vi.spyOn(ports.collection, "putMany").mockRejectedValue(new Error("offline"));
  click("Select cards");
  click("Select all");
  click("Edit");
  const sheet = screen.getByRole("dialog", { name: "Edit 3 cards" });
  fireEvent.change(field(sheet, "Set"), { target: { value: "Gold" } });
  fireEvent.click(within(sheet).getByRole("button", { name: "Change 3 cards" }));
  const confirm = screen.getByRole("alertdialog", { name: "Change 3 cards?" });
  fireEvent.click(within(confirm).getByRole("button", { name: "Change" }));
  await within(confirm).findByText("Could not save the change. Try again.");
  expect(within(confirm).getByRole("button", { name: "Change" }).hasAttribute("disabled")).toBe(false);
});

test("Edit is disabled while nothing is selected", async () => {
  await renderList();
  click("Select cards");
  expect(screen.getByRole("button", { name: "Edit" }).hasAttribute("disabled")).toBe(true);
});
