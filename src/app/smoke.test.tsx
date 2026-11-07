import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import { App } from "./App";
import { PortsProvider } from "./ports-context";

test("app shell renders against the fake ports", async () => {
  render(
    <PortsProvider ports={createFakePorts()}>
      <App />
    </PortsProvider>,
  );
  expect(screen.getByRole("heading", { name: "The Binder" })).toBeTruthy();
  expect((await screen.findByTestId("summary")).textContent).toBe("0 cards, 0 distinct");
});
