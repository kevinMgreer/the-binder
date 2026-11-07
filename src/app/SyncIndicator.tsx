import { useSync, useSyncStatus } from "./sync-context";

export function SyncIndicator() {
  const sync = useSync();
  const { state, pending } = useSyncStatus();

  const label = {
    syncing: "Syncing…",
    error: `Sync problem, retrying${pending > 0 ? ` (${pending} unsynced)` : ""}`,
    paused: "Sync paused",
    "needs-decision": "Waiting for your choice",
    idle: pending > 0 ? `Unsynced: ${pending}` : "Synced",
  }[state];

  return (
    <>
      <span data-testid="sync-status">{label}</span>
      {state === "needs-decision" && (
        <div role="dialog" aria-modal="true" aria-label="Data file missing">
          <p>The collection file was deleted from Google Drive. Restore it from this device, or start an empty collection?</p>
          <button onClick={() => sync.resolveMissingFile("restore")}>Restore Drive from this device</button>
          <button onClick={() => sync.resolveMissingFile("empty")}>Start an empty collection</button>
        </div>
      )}
    </>
  );
}
