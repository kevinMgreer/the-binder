import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { FakeAuthProvider, createFakePorts } from "../adapters/fakes";
import type { Card } from "../domain/card";
import { makeCard } from "../domain/fixtures";
import { SyncEngine } from "../sync/engine";
import { App } from "./App";
import { CardDetail } from "./CardDetail";
import { CardForm } from "./CardForm";
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
afterEach(cleanup);

const cards = [
  makeCard({ id: "a", player: "Hank Aaron", set: "Chrome", team: "Braves" }),
  makeCard({ id: "b", player: "Mookie Betts", set: "Chrome", team: "Dodgers", cardNumber: "2" }),
  makeCard({ id: "w", player: "Ty Cobb", set: "Heritage", team: "Tigers", cardNumber: "3", wanted: true, notes: "n", quantity: 2 }),
];

async function renderApp(to: "Dashboard" | "Cards", seed = cards) {
  const ports = { ...createFakePorts(), auth: new FakeAuthProvider({ email: "owner@example.test" }) };
  await ports.collection.putMany(seed);
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
  if (to === "Cards") {
    fireEvent.click(within(screen.getByRole("navigation", { name: "Main" })).getByRole("button", { name: "Cards" }));
    await screen.findByTestId("shown");
  }
  return ports;
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const shown = () => screen.getByTestId("shown").textContent;
const show = (label: string) => {
  click(/^Filter and sort/);
  fireEvent.click(within(screen.getByRole("radiogroup", { name: "Show" })).getByLabelText(label));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Filter and sort" })).getByRole("button", { name: /^Show \d+ cards?$/ }));
};

test("the form saves a wanted card with no photo, and an edit that leaves the box alone keeps it", async () => {
  const onSave = vi.fn(async (_c: Card) => {});
  const view = (card?: Card) => (
    <PortsProvider ports={createFakePorts()}>
      <CardForm card={card} cards={[]} onSave={onSave} onCancel={() => {}} />
    </PortsProvider>
  );
  render(view());
  const type = (l: string, v: string) => fireEvent.change(screen.getByLabelText(l), { target: { value: v } });
  type("Player", "Hank Aaron");
  type("Year", "2025");
  type("Set", "Topps");
  type("Card number", "46");
  fireEvent.click(screen.getByLabelText("Wanted (I don't have it yet)"));
  click("Save");
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  const saved = onSave.mock.calls[0][0];
  expect(saved.wanted).toBe(true);
  cleanup();
  render(view(saved));
  type("Notes", "x");
  click("Save");
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  expect(onSave.mock.calls[1][0].wanted).toBe(true);
});

test("unticking Wanted saves the card with no wanted key", async () => {
  const onSave = vi.fn(async (_c: Card) => {});
  render(
    <PortsProvider ports={createFakePorts()}>
      <CardForm card={makeCard({ wanted: true })} cards={[]} onSave={onSave} onCancel={() => {}} />
    </PortsProvider>,
  );
  fireEvent.click(screen.getByLabelText("Wanted (I don't have it yet)"));
  click("Save");
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  expect("wanted" in JSON.parse(JSON.stringify(onSave.mock.calls[0][0]))).toBe(false);
});

test("a wanted card's detail shows the tag and Mark as owned; an owned card's shows neither", () => {
  const onMarkOwned = vi.fn();
  const detail = (card: Card) => (
    <PortsProvider ports={createFakePorts()}>
      <CardDetail card={card} onEdit={() => {}} onDelete={async () => {}} onMarkOwned={onMarkOwned} />
    </PortsProvider>
  );
  render(detail(cards[2]));
  expect(screen.getByText("Wanted").className).toContain("tag");
  click("Mark as owned");
  expect(onMarkOwned).toHaveBeenCalledTimes(1);
  cleanup();
  render(detail(cards[0]));
  expect(screen.queryByText("Wanted")).toBeNull();
  expect(screen.queryByRole("button", { name: "Mark as owned" })).toBeNull();
});

test("Mark as owned saves the card without wanted, same notes and quantity, a new updatedAt", async () => {
  const ports = await renderApp("Cards");
  show("Wanted");
  fireEvent.click(screen.getByText("Ty Cobb"));
  click("Mark as owned");
  await waitFor(async () => expect((await ports.collection.list()).find((c) => c.id === "w")?.wanted).toBeUndefined());
  const stored = (await ports.collection.list()).find((c) => c.id === "w")!;
  expect(stored).toMatchObject({ notes: "n", quantity: 2 });
  expect(stored.updatedAt).not.toBe(cards[2].updatedAt);
});

test("the list shows owned cards with no chip; Show Wanted and All add a chip; removing it returns to owned", async () => {
  await renderApp("Cards");
  expect(shown()).toBe("Showing 2");
  expect(screen.queryByText("Wanted")).toBeNull();
  expect(screen.getByRole("button", { name: "Filter and sort" })).toBeTruthy();
  show("Wanted");
  expect(shown()).toBe("Showing 1");
  expect(screen.getByRole("button", { name: "Filter and sort, 1 applied" })).toBeTruthy();
  expect(screen.getByTestId("card-row").textContent).toContain("Wanted");
  show("All");
  expect(shown()).toBe("Showing 3");
  fireEvent.click(screen.getByText("Owned and wanted").closest("button")!);
  expect(shown()).toBe("Showing 2");
  show("Wanted");
  click("Filter and sort, 1 applied");
  click("Clear all");
  expect(shown()).toBe("Showing 2");
});

test("grid tiles of wanted cards show the tag and say wanted in their name", async () => {
  await renderApp("Cards");
  show("Wanted");
  click("Grid view");
  expect(screen.getByTestId("card-tile").textContent).toContain("Wanted");
  expect(screen.getByRole("button", { name: /Ty Cobb.*wanted/ })).toBeTruthy();
});

test("Select all under the default takes owned cards only, and bulk edit has no Wanted field and keeps marks", async () => {
  await renderApp("Cards");
  click("Select cards");
  click("Select all");
  expect(screen.getByTestId("selection-bar").textContent).toContain("2 selected");
  click("Edit");
  const sheet = screen.getByRole("dialog", { name: "Edit 2 cards" });
  expect(within(sheet).queryByText(/wanted/i)).toBeNull();
  cleanup();
  const all = await renderApp("Cards");
  show("All");
  click("Select cards");
  click("Select all");
  click("Edit");
  const both = screen.getByRole("dialog", { name: "Edit 3 cards" });
  fireEvent.click(within(both).getByRole("button", { name: /^Set/ }));
  fireEvent.change(within(both).getByLabelText("Set"), { target: { value: "Gold" } });
  fireEvent.click(within(both).getByRole("button", { name: "Change 3 cards" }));
  fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Change" }));
  await waitFor(() => expect(screen.queryByTestId("selection-bar")).toBeNull());
  const stored = await all.collection.list();
  expect(stored.map((c) => c.set)).toEqual(["Gold", "Gold", "Gold"]);
  expect(stored.find((c) => c.id === "w")?.wanted).toBe(true);
});

test("the dashboard shows N wanted only when N > 0 and opens the list with a Wanted chip", async () => {
  await renderApp("Dashboard");
  click("Wanted, 1");
  await screen.findByTestId("shown");
  expect(shown()).toBe("Showing 1");
  expect(screen.getByRole("button", { name: "Filter and sort, 1 applied" })).toBeTruthy();
});

test("the dashboard has no wanted line without wanted cards", async () => {
  await renderApp("Dashboard", [cards[0]]);
  expect(screen.queryByText(/wanted/)).toBeNull();
});
