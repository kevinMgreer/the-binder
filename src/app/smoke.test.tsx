import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import { SyncEngine } from "../sync/engine";
import { App } from "./App";
import { PortsProvider } from "./ports-context";
import { SyncProvider } from "./sync-context";

test("app shell renders against the fake ports", async () => {
  const ports = createFakePorts();
  render(
    <PortsProvider ports={ports}>
      <SyncProvider engine={new SyncEngine(ports)}>
        <App />
      </SyncProvider>
    </PortsProvider>,
  );
  expect(screen.getByRole("heading", { name: "The Binder" })).toBeTruthy();
  expect((await screen.findByTestId("summary")).textContent).toBe("0 cards, 0 distinct");
  expect(screen.getByTestId("sync-status").textContent).toBe("Synced");
});
