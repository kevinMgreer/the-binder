import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { SyncEngine, SyncStatus } from "../sync/engine";

const SyncContext = createContext<SyncEngine | null>(null);

export function SyncProvider({ engine, children }: { engine: SyncEngine; children: ReactNode }) {
  return <SyncContext.Provider value={engine}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncEngine {
  const engine = useContext(SyncContext);
  if (!engine) throw new Error("SyncProvider is missing");
  return engine;
}

export function useSyncStatus(): SyncStatus {
  const engine = useSync();
  return useSyncExternalStore(
    (onChange) => engine.subscribe(onChange),
    () => engine.getStatus(),
  );
}
