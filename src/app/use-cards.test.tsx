import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import { SyncEngine } from "../sync/engine";
import { PortsProvider } from "./ports-context";
import { SyncProvider } from "./sync-context";
import { useCards } from "./useCards";

test("saveMany changes 3 cards with one notifyChange", async () => {
  const ports = createFakePorts();
  await ports.collection.putMany(["a", "b", "c", "d"].map((id) => makeCard({ id })));
  const engine = new SyncEngine(ports);
  const notify = vi.spyOn(engine, "notifyChange").mockImplementation(() => {});
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PortsProvider ports={ports}>
      <SyncProvider engine={engine}>{children}</SyncProvider>
    </PortsProvider>
  );
  const { result } = renderHook(() => useCards(), { wrapper });
  await act(async () => {
    await result.current.saveMany(["a", "b", "c"], { set: "Heritage" });
  });
  expect(notify).toHaveBeenCalledTimes(1);
  expect(result.current.cards.filter((c) => c.set === "Heritage")).toHaveLength(3);
});
