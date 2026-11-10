import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { FakeAuthProvider, createFakePorts } from "../adapters/fakes";
import { SyncEngine } from "../sync/engine";
import { App } from "./App";
import { PortsProvider } from "./ports-context";
import { AuthGate } from "./session";
import { SyncProvider } from "./sync-context";

afterEach(cleanup);

function renderApp(email: string | null, auth = new FakeAuthProvider(email ? { email } : null)) {
  const ports = { ...createFakePorts(), auth };
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
  expect(await screen.findByRole("button", { name: "Cards, 0" })).toBeTruthy();
  expect(screen.getByTestId("sync-status").textContent).toBe("Synced");
});

test("Dashboard title: the heading is Dashboard and the app name is not a heading", async () => {
  renderApp("owner@example.test");
  expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "The Binder" })).toBeNull();
});

test("a failing sign-in shows its message instead of doing nothing", async () => {
  const auth = new FakeAuthProvider(null);
  auth.signIn = () => Promise.reject(new Error("Google web client ID is not configured"));
  renderApp(null, auth);
  fireEvent.click(await screen.findByRole("button", { name: "Sign in with Google" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Google web client ID is not configured");
});

test("signed-out app shows only the sign-in screen", async () => {
  renderApp(null);
  expect(await screen.findByRole("button", { name: "Sign in with Google" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Dashboard" })).toBeNull();
});
