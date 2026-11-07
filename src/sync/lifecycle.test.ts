import { expect, test, vi } from "vitest";
import { attachLifecycle } from "./lifecycle";

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  document.dispatchEvent(new Event("visibilitychange"));
}

test("syncs while in the foreground, stops in the background, and syncs when back online", () => {
  const engine = { start: vi.fn(), stop: vi.fn(), syncNow: vi.fn(async () => {}) };
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  const detach = attachLifecycle(engine);
  expect(engine.start).toHaveBeenCalledTimes(1);

  setVisibility("hidden");
  expect(engine.stop).toHaveBeenCalledTimes(1);

  setVisibility("visible");
  expect(engine.start).toHaveBeenCalledTimes(2);

  window.dispatchEvent(new Event("online"));
  expect(engine.syncNow).toHaveBeenCalledTimes(1);

  detach();
  setVisibility("hidden");
  window.dispatchEvent(new Event("online"));
  expect(engine.syncNow).toHaveBeenCalledTimes(1);
});
