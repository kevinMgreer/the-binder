import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { FakeAuthProvider, createFakePorts } from "../adapters/fakes";
import type { Card } from "../domain/card";
import { makeCard } from "../domain/fixtures";
import { SyncEngine } from "../sync/engine";
import { App } from "./App";
import { PortsProvider } from "./ports-context";
import { AuthGate } from "./session";
import { SyncProvider } from "./sync-context";

const native = vi.hoisted(() => {
  const handlers: Array<() => void> = [];
  return {
    handlers,
    exitApp: vi.fn(),
    addListener: vi.fn(async (event: string, handler: () => void) => {
      if (event === "backButton") handlers.push(handler);
      // indexOf is -1 once removed; splice(-1, 1) would then drop an unrelated, newer handler.
      return { remove: async () => void (handlers.includes(handler) && handlers.splice(handlers.indexOf(handler), 1)) };
    }),
  };
});
vi.mock("@capacitor/app", () => ({ App: { addListener: native.addListener, exitApp: native.exitApp } }));
// jsdom has no layout, so the virtualized list renders no rows; a plain list is enough for navigation.
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

beforeEach(() => {
  native.handlers.length = 0;
  native.exitApp.mockClear();
});
afterEach(cleanup);

// The app registers its listener asynchronously; under load it may not be there yet.
const pressBack = async () => {
  await vi.waitFor(() => expect(native.handlers.length).toBeGreaterThan(0));
  await act(async () => native.handlers.at(-1)?.());
};

async function renderSignedIn(cards = [makeCard()]) {
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
  await onDashboard();
}

const onDashboard = () => screen.findByRole("button", { name: "Browse collection" });
const onList = () => screen.findByTestId("summary");
const openList = async () => {
  fireEvent.click(await onDashboard());
  await onList();
};
const openAddForm = () => {
  fireEvent.click(screen.getByRole("button", { name: "Add card" }));
  expect(screen.getByRole("heading", { name: "Add card" })).toBeTruthy();
};
const bar = () => within(screen.getByRole("navigation", { name: "Main" }));
const tap = (name: "Dashboard" | "Cards") => fireEvent.click(bar().getByRole("button", { name }));

test("back from the dashboard closes the app", async () => {
  await renderSignedIn();
  await pressBack();
  expect(native.exitApp).toHaveBeenCalledTimes(1);
});

test("back from the list shows the dashboard and keeps the app open", async () => {
  await renderSignedIn();
  await openList();
  await pressBack();
  await onDashboard();
  expect(native.exitApp).not.toHaveBeenCalled();
});

test("the list has no Back button; hardware back is the way to the dashboard", async () => {
  await renderSignedIn();
  await openList();
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  await pressBack();
  await onDashboard();
});

test("back from the add form opened on the dashboard shows the dashboard", async () => {
  await renderSignedIn();
  openAddForm();
  await pressBack();
  await onDashboard();
  expect(native.exitApp).not.toHaveBeenCalled();
});

test("back from the add form opened on the list shows the list", async () => {
  await renderSignedIn();
  await openList();
  openAddForm();
  await pressBack();
  await onList();
  expect(native.exitApp).not.toHaveBeenCalled();
});

test("back closes an open sheet first and keeps the app open", async () => {
  await renderSignedIn();
  await openList();
  fireEvent.click(screen.getByRole("button", { name: "Filter" }));
  expect(screen.getByRole("dialog", { name: "Filters" })).toBeTruthy();
  await pressBack();
  expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull();
  await onList();
  expect(native.exitApp).not.toHaveBeenCalled();
});

test("Back from Cards: the bar's Cards then back shows the dashboard", async () => {
  await renderSignedIn();
  tap("Cards");
  await onList();
  await pressBack();
  await onDashboard();
  expect(native.exitApp).not.toHaveBeenCalled();
});

test("Back from Dashboard after switching closes the app", async () => {
  await renderSignedIn();
  tap("Cards");
  await onList();
  tap("Dashboard");
  await onDashboard();
  await pressBack();
  expect(native.exitApp).toHaveBeenCalledTimes(1);
});

test("Back from card detail shows the list with Cards active", async () => {
  await renderSignedIn([makeCard({ player: "Hank Aaron" })]);
  tap("Cards");
  fireEvent.click(await screen.findByRole("button", { name: /Hank Aaron/ }));
  expect(await screen.findByRole("button", { name: "Edit" })).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
  await pressBack();
  await onList();
  expect(bar().getByRole("button", { name: "Cards" }).getAttribute("aria-current")).toBe("page");
});

test("back from a card's detail view shows the list, and the detail view has no Back button", async () => {
  await renderSignedIn([makeCard({ player: "Hank Aaron" })]);
  await openList();
  fireEvent.click(await screen.findByRole("button", { name: /Hank Aaron/ }));
  expect(await screen.findByRole("button", { name: "Edit" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  await pressBack();
  await onList();
  expect(native.exitApp).not.toHaveBeenCalled();
});

test("a filter survives opening a card and going back", async () => {
  const cards = [makeCard({ player: "Hank Aaron", flags: { rookie: false, autograph: true, relic: false } }), makeCard({ player: "Plain Joe", cardNumber: "2" })];
  await renderSignedIn(cards);
  fireEvent.click(screen.getByRole("button", { name: "Autos, 1" }));
  await onList();
  expect(screen.queryByRole("button", { name: "Plain Joe" })).toBeNull();
  fireEvent.click(await screen.findByRole("button", { name: /Hank Aaron/ }));
  expect(await screen.findByRole("button", { name: "Edit" })).toBeTruthy();
  await pressBack();
  await onList();
  expect(screen.getByRole("button", { name: /^Remove Autograph filter/ })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Plain Joe" })).toBeNull();
});

test("back from settings opened on the dashboard shows the dashboard", async () => {
  await renderSignedIn();
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  expect(await screen.findByRole("heading", { name: "Settings" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  await pressBack();
  await onDashboard();
  expect(native.exitApp).not.toHaveBeenCalled();
});

test("back from settings opened on the list shows the list", async () => {
  await renderSignedIn();
  await openList();
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  expect(await screen.findByRole("heading", { name: "Settings" })).toBeTruthy();
  await pressBack();
  await onList();
  expect(native.exitApp).not.toHaveBeenCalled();
});

test("back from the edit form shows that card's detail view", async () => {
  const card = makeCard({ player: "Hank Aaron" });
  await renderSignedIn([card]);
  await openList();
  fireEvent.click(await screen.findByRole("button", { name: /Hank Aaron/ }));
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByRole("heading", { name: "Edit card" })).toBeTruthy();
  await pressBack();
  expect(await screen.findByRole("button", { name: "Edit" })).toBeTruthy();
  expect(native.exitApp).not.toHaveBeenCalled();
});
