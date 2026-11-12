import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { FakeAuthProvider, createFakePorts } from "../adapters/fakes";
import type { Card } from "../domain/card";
import { makeCard } from "../domain/fixtures";
import { SyncEngine } from "../sync/engine";
import { App } from "./App";
import { PortsProvider } from "./ports-context";
import { AuthGate } from "./session";
import { SyncProvider } from "./sync-context";

vi.mock("@capacitor/app", () => ({ App: { addListener: async () => ({ remove: async () => {} }), exitApp: () => {} } }));
// jsdom has no layout, so the virtualized list renders no rows; a plain list is enough for order.
vi.mock("./CardList", () => ({
  CardList: ({ cards, onOpen }: { cards: Card[]; onOpen: (c: Card) => void }) => (
    <ul>
      {cards.map((c) => (
        <li key={c.id}>
          <button onClick={() => onOpen(c)}>{c.player}</button>
        </li>
      ))}
    </ul>
  ),
}));
afterEach(cleanup);

const cards = [
  makeCard({ id: "b", player: "Mookie Betts", year: 2019, team: "Los Angeles Dodgers", cardNumber: "1" }),
  makeCard({ id: "a", player: "Ronald Acuña Jr.", year: 2024, team: "Atlanta Braves", cardNumber: "2" }),
  makeCard({ id: "f", player: "Freddie Freeman", year: 2021, team: "Atlanta Braves", cardNumber: "3" }),
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
  await openCards();
}

const openCards = async () => {
  await screen.findByRole("heading", { name: "Dashboard" });
  fireEvent.click(within(screen.getByRole("navigation", { name: "Main" })).getByRole("button", { name: "Cards" }));
  await screen.findByTestId("shown");
};
const sortButton = () => screen.getByRole("button", { name: /^Sort: / });
const order = () => within(screen.getByRole("list")).getAllByRole("button").map((b) => b.textContent);
const choose = (...names: string[]) => {
  fireEvent.click(sortButton());
  const sheet = within(screen.getByRole("dialog", { name: "Sort" }));
  for (const name of names) fireEvent.click(sheet.getByRole("radio", { name }));
  fireEvent.click(sheet.getByRole("button", { name: "Close" }));
};

test("the Sort button shares the Showing line and the list starts in last name order", async () => {
  await renderList();
  expect(sortButton().textContent).toBe("Sort: Last name ↑");
  expect(sortButton().getAttribute("aria-label")).toBe("Sort: Last name, ascending");
  expect(screen.getByTestId("shown").parentElement!.contains(sortButton())).toBe(true);
  expect(order()).toEqual(["Ronald Acuña Jr.", "Mookie Betts", "Freddie Freeman"]);
});

test("choosing Year and Descending reorders the rows at once", async () => {
  await renderList();
  choose("Year", "Descending");
  expect(order()).toEqual(["Ronald Acuña Jr.", "Freddie Freeman", "Mookie Betts"]);
  expect(sortButton().textContent).toBe("Sort: Year ↓");
  expect(sortButton().getAttribute("aria-label")).toBe("Sort: Year, descending");
});

test("the order applies to the filtered rows and leaves Showing N alone", async () => {
  await renderList();
  fireEvent.click(screen.getByRole("button", { name: "Filter" }));
  const sheet = within(screen.getByRole("dialog", { name: "Filters" }));
  fireEvent.change(sheet.getByLabelText("Team"), { target: { value: "Atlanta Braves" } });
  fireEvent.click(sheet.getByRole("button", { name: "Close" }));
  const before = screen.getByTestId("shown").textContent;
  choose("Year");
  expect(order()).toEqual(["Freddie Freeman", "Ronald Acuña Jr."]);
  expect(screen.getByTestId("shown").textContent).toBe(before);
});

test("the order survives opening a card and the dashboard", async () => {
  await renderList();
  choose("Year");
  fireEvent.click(screen.getByRole("button", { name: "Mookie Betts" }));
  await screen.findByRole("button", { name: "Edit" });
  window.dispatchEvent(new Event("hardware-back"));
  await screen.findByTestId("shown");
  expect(sortButton().textContent).toBe("Sort: Year ↑");
  fireEvent.click(within(screen.getByRole("navigation", { name: "Main" })).getByRole("button", { name: "Dashboard" }));
  await openCards();
  expect(sortButton().textContent).toBe("Sort: Year ↑");
});

test("the Sort sheet is compact with a primary Done footer; Done closes it and keeps the choice", async () => {
  await renderList();
  fireEvent.click(sortButton());
  const dialog = screen.getByRole("dialog", { name: "Sort" });
  expect(dialog.classList.contains("compact")).toBe(true);
  const done = within(dialog).getByRole("button", { name: "Done" });
  expect(done.classList.contains("primary")).toBe(true);
  fireEvent.click(within(dialog).getByRole("radio", { name: "Team" }));
  fireEvent.click(done);
  expect(screen.queryByRole("dialog", { name: "Sort" })).toBeNull();
  expect(sortButton().textContent).toBe("Sort: Team ↑");
});

test("Ascending and Descending share one pair row; the Filters sheet is not compact", async () => {
  await renderList();
  fireEvent.click(sortButton());
  const asc = screen.getByRole("radio", { name: "Ascending" });
  expect(asc.closest(".pair")).not.toBeNull();
  expect(asc.closest(".pair")).toBe(screen.getByRole("radio", { name: "Descending" }).closest(".pair"));
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  fireEvent.click(screen.getByRole("button", { name: "Filter" }));
  expect(screen.getByRole("dialog", { name: "Filters" }).classList.contains("compact")).toBe(false);
});

test("a fresh render starts at Last name ascending", async () => {
  await renderList();
  choose("Team", "Descending");
  cleanup();
  await renderList();
  expect(sortButton().textContent).toBe("Sort: Last name ↑");
});
