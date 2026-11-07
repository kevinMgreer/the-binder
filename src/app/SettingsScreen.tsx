import { useEffect, useState } from "react";
import { usePorts } from "./ports-context";
import { useSession } from "./session";
import { useSyncStatus } from "./sync-context";
import { UpdateLink } from "./UpdateLink";
import type { CheckResult, UpdateInfo } from "./useUpdates";

interface Props {
  onBack: () => void;
  update: UpdateInfo | null;
  onCheckForUpdates: () => Promise<CheckResult>;
}

export function SettingsScreen({ onBack, update, onCheckForUpdates }: Props) {
  const session = useSession();
  const { appInfo } = usePorts();
  const { pending } = useSyncStatus();
  const [confirming, setConfirming] = useState(false);
  const [version, setVersion] = useState<string>();
  const [checkResult, setCheckResult] = useState<CheckResult>();

  useEffect(() => {
    void appInfo.getVersion().then((v) => setVersion(`Version ${v.versionName} (${v.versionCode})`));
  }, [appInfo]);

  async function checkNow() {
    setCheckResult(undefined);
    setCheckResult(await onCheckForUpdates());
  }

  return (
    <section>
      <button onClick={onBack}>Back</button>
      <h2>Settings</h2>
      <p>Signed in as {session.email}</p>

      <p data-testid="version">{version}</p>
      <button onClick={checkNow}>Check for updates</button>
      {checkResult === "current" && <p role="status">You're up to date.</p>}
      {checkResult === "failed" && <p role="status">Could not check for updates.</p>}
      {update && <UpdateLink update={update} />}

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
