import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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

const pressBack = () => act(async () => native.handlers.at(-1)?.());

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
  await screen.findByTestId("summary");
}

test("back from the add form shows the list and keeps the app open", async () => {
  await renderSignedIn();
  fireEvent.click(screen.getByRole("button", { name: "Add card" }));
  expect(screen.getByRole("heading", { name: "Add card" })).toBeTruthy();
  await pressBack();
  expect(await screen.findByTestId("summary")).toBeTruthy();
  expect(native.exitApp).not.toHaveBeenCalled();
});

test("back from the list closes the app", async () => {
  await renderSignedIn();
  await pressBack();
  expect(native.exitApp).toHaveBeenCalledTimes(1);
});

test("back from the edit form shows that card's detail view", async () => {
  const card = makeCard({ player: "Hank Aaron" });
  await renderSignedIn([card]);
  fireEvent.click(await screen.findByRole("button", { name: /Hank Aaron/ }));
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByRole("heading", { name: "Edit card" })).toBeTruthy();
  await pressBack();
  expect(await screen.findByRole("button", { name: "Edit" })).toBeTruthy();
  expect(native.exitApp).not.toHaveBeenCalled();
});
