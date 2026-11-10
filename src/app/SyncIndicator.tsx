import { useSession } from "./session";
import { useSync, useSyncStatus } from "./sync-context";

/** The sync state in words, for the title row. */
export function SyncIndicator() {
  const { state, pending } = useSyncStatus();

  const label = {
    syncing: "Syncing…",
    error: `Sync problem, retrying${pending > 0 ? ` (${pending} unsynced)` : ""}`,
    paused: "Sync paused",
    "needs-decision": "Waiting for your choice",
    idle: pending > 0 ? `Unsynced: ${pending}` : "Synced",
  }[state];

  return (
    <span className="sync" role="status" data-state={state} data-testid="sync-status">
      {label}
    </span>
  );
}

/** What the user can do about a sync state; shown beneath the title row while it lasts. */
export function SyncActions() {
  const sync = useSync();
  const session = useSession();
  const { state } = useSyncStatus();

  return (
    <>
      {state === "paused" && <button onClick={session.signInAgain}>Sign in again</button>}
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
