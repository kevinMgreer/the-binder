import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { FakeAuthProvider, createFakePorts } from "../adapters/fakes";
import { SyncEngine } from "../sync/engine";
import { App } from "./App";
import { PortsProvider } from "./ports-context";
import { AuthGate } from "./session";
import { SyncProvider } from "./sync-context";

afterEach(cleanup);

function renderApp(email: string | null) {
  const ports = { ...createFakePorts(), auth: new FakeAuthProvider(email ? { email } : null) };
  render(
    <PortsProvider ports={ports}>
      <SyncProvider engine={new SyncEngine(ports)}>
        <AuthGate autoSync={false}>
          <App />
        </AuthGate>
      </SyncProvider>
    </PortsProvider>,
  );
}

test("signed-in app shell renders against the fake ports", async () => {
  renderApp("owner@example.test");
  expect((await screen.findByTestId("summary")).textContent).toBe("0 cards, 0 distinct");
  expect(screen.getByTestId("sync-status").textContent).toBe("Synced");
});

test("signed-out app shows only the sign-in screen", async () => {
  renderApp(null);
  expect(await screen.findByRole("button", { name: "Sign in with Google" })).toBeTruthy();
  expect(screen.queryByTestId("summary")).toBeNull();
});
