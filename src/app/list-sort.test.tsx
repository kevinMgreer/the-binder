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
const orderText = () => screen.getByTestId("order");
const filterButton = () => screen.getByRole("button", { name: /^Filter and sort/ });
const openSheet = () => {
  fireEvent.click(filterButton());
  return screen.getByRole("dialog", { name: "Filter and sort" });
};
const order = () => within(screen.getByRole("list")).getAllByRole("button").map((b) => b.textContent);
const choose = (...names: string[]) => {
  const sheet = within(openSheet());
  for (const name of names) fireEvent.click(sheet.getByRole("radio", { name }));
  fireEvent.click(sheet.getByRole("button", { name: "Close" }));
};
const visible = (el: HTMLElement) => el.querySelector("[aria-hidden]")!.textContent;
const spoken = (el: HTMLElement) => el.querySelector(".visually-hidden")!.textContent;

test("the order text shares the Showing line and the list starts in last name order", async () => {
  await renderList();
  expect(visible(orderText())).toBe(" · Last name ↑");
  expect(spoken(orderText())).toBe(", sorted by Last name, ascending");
  expect(screen.getByTestId("shown").parentElement!.contains(orderText())).toBe(true);
  expect(order()).toEqual(["Ronald Acuña Jr.", "Mookie Betts", "Freddie Freeman"]);
});

test("choosing Year and Descending reorders the rows before the sheet closes", async () => {
  await renderList();
  const sheet = within(openSheet());
  fireEvent.click(sheet.getByRole("radio", { name: "Year" }));
  fireEvent.click(sheet.getByRole("radio", { name: "Descending" }));
  expect(order()).toEqual(["Ronald Acuña Jr.", "Freddie Freeman", "Mookie Betts"]);
  fireEvent.click(sheet.getByRole("button", { name: "Close" }));
  expect(visible(orderText())).toBe(" · Year ↓");
  expect(spoken(orderText())).toBe(", sorted by Year, descending");
});

test("the order applies to the filtered rows and leaves Showing N alone", async () => {
  await renderList();
  const sheet = within(openSheet());
  fireEvent.change(sheet.getByRole("combobox", { name: "Team" }), { target: { value: "Atlanta Braves" } });
  fireEvent.click(sheet.getByRole("button", { name: "Close" }));
  const before = screen.getByTestId("shown").textContent;
  choose("Year");
  expect(order()).toEqual(["Freddie Freeman", "Ronald Acuña Jr."]);
  expect(screen.getByTestId("shown").textContent).toBe(before);
  expect(before).toBe("Showing 2");
  expect(within(openSheet()).getByRole("button", { name: "Show 2 cards" })).toBeTruthy();
});

test("the order survives opening a card and the dashboard", async () => {
  await renderList();
  choose("Year");
  fireEvent.click(screen.getByRole("button", { name: "Mookie Betts" }));
  await screen.findByRole("button", { name: "Edit" });
  window.dispatchEvent(new Event("hardware-back"));
  await screen.findByTestId("shown");
  expect(visible(orderText())).toBe(" · Year ↑");
  fireEvent.click(within(screen.getByRole("navigation", { name: "Main" })).getByRole("button", { name: "Dashboard" }));
  await openCards();
  expect(visible(orderText())).toBe(" · Year ↑");
});

test("Sort comes first in the sheet, with Ascending and Descending in one pair row", async () => {
  await renderList();
  const dialog = openSheet();
  const headings = within(dialog).getAllByRole("heading").map((h) => h.textContent);
  expect(headings.slice(headings.indexOf("Sort by"), headings.indexOf("Sort by") + 3)).toEqual(["Sort by", "Direction", "Year"]);
  expect(headings.indexOf("Sort by")).toBeGreaterThan(-1);
  expect(within(dialog).getByRole("radiogroup", { name: "Sort by" })).toBeTruthy();
  expect(within(dialog).getByRole("radiogroup", { name: "Direction" })).toBeTruthy();
  expect((within(dialog).getByRole("radio", { name: "Last name" }) as HTMLInputElement).checked).toBe(true);
  const asc = within(dialog).getByRole("radio", { name: "Ascending" }) as HTMLInputElement;
  expect(asc.checked).toBe(true);
  expect(asc.closest(".pair")).not.toBeNull();
  expect(asc.closest(".pair")).toBe(within(dialog).getByRole("radio", { name: "Descending" }).closest(".pair"));
  expect(dialog.classList.contains("compact")).toBe(false);
});

test("Close, back and Show N cards keep the choice", async () => {
  await renderList();
  fireEvent.click(within(openSheet()).getByRole("radio", { name: "Team" }));
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(visible(orderText())).toBe(" · Team ↑");
  openSheet();
  window.dispatchEvent(new Event("hardware-back"));
  await screen.findByTestId("shown");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(visible(orderText())).toBe(" · Team ↑");
  fireEvent.click(within(openSheet()).getByRole("button", { name: "Show 3 cards" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(visible(orderText())).toBe(" · Team ↑");
});

test("there is one sort control, and the order text is not a button or link", async () => {
  await renderList();
  expect(screen.queryByRole("button", { name: /^Sort/ })).toBeNull();
  expect(orderText().closest("button, a")).toBeNull();
  expect(within(orderText()).queryAllByRole("button")).toHaveLength(0);
  expect(within(orderText()).queryAllByRole("link")).toHaveLength(0);
});

test("the order is not a filter; Clear all keeps the order and the search", async () => {
  await renderList();
  choose("Year", "Descending");
  expect(filterButton().getAttribute("aria-label")).toBe("Filter and sort");
  expect(document.querySelector(".chips")).toBeNull();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "a" } });
  const sheet = within(openSheet());
  fireEvent.change(sheet.getByRole("combobox", { name: "Team" }), { target: { value: "Atlanta Braves" } });
  expect(sheet.getByRole("radio", { name: "Year" })).toBeTruthy();
  fireEvent.click(sheet.getByRole("button", { name: "Clear all" }));
  fireEvent.click(sheet.getByRole("button", { name: /^Show \d+ cards?$/ }));
  expect(document.querySelector(".chips")).toBeNull();
  expect(filterButton().getAttribute("aria-label")).toBe("Filter and sort");
  expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("a");
  expect(visible(orderText())).toBe(" · Year ↓");
});

test("a fresh render starts at Last name ascending", async () => {
  await renderList();
  choose("Team", "Descending");
  cleanup();
  await renderList();
  expect(visible(orderText())).toBe(" · Last name ↑");
});
