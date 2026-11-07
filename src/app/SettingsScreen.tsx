import { useState } from "react";
import { useSession } from "./session";
import { useSyncStatus } from "./sync-context";

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const session = useSession();
  const { pending } = useSyncStatus();
  const [confirming, setConfirming] = useState(false);

  return (
    <section>
      <button onClick={onBack}>Back</button>
      <h2>Settings</h2>
      <p>Signed in as {session.email}</p>
      <button onClick={() => setConfirming(true)}>Sign out</button>
      {confirming && (
        <div role="alertdialog" aria-label="Sign out">
          <p>Sign out removes the local copy of your collection from this device. It stays in your Google Drive.</p>
          {pending > 0 && (
            <p>
              {pending} unsynced {pending === 1 ? "change is" : "changes are"} not yet saved to Drive. Any unsynced changes will be lost.
            </p>
          )}
          <button onClick={session.signOut}>Confirm sign out</button>
          <button onClick={() => setConfirming(false)}>Cancel</button>
        </div>
      )}
    </section>
  );
}
