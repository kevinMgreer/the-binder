import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { attachLifecycle } from "../sync/lifecycle";
import { usePorts } from "./ports-context";
import { useSync } from "./sync-context";

interface Session {
  email: string;
  signOut: () => Promise<void>;
  signInAgain: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("AuthGate is missing");
  return session;
}

type State = "checking" | "signed-out" | { email: string };

export function AuthGate({ autoSync, children }: { autoSync: boolean; children: ReactNode }) {
  const { auth, collection, photos } = usePorts();
  const sync = useSync();
  const [state, setState] = useState<State>("checking");
  const [declined, setDeclined] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    auth
      .currentUser()
      .then((user) => setState(user ?? "signed-out"))
      .catch(() => setState("signed-out"));
  }, [auth]);

  const signedIn = typeof state === "object";

  useEffect(() => {
    if (!signedIn) return;
    void sync.refreshStatus();
    if (!autoSync) return;
    // Let the first screen render before the first sync competes for the CPU.
    let detach: (() => void) | undefined;
    const timer = setTimeout(() => (detach = attachLifecycle(sync)), 1000);
    return () => {
      clearTimeout(timer);
      detach?.();
    };
  }, [signedIn, autoSync, sync]);

  async function signIn() {
    setFailure(null);
    try {
      const user = await auth.signIn();
      setDeclined(!user);
      if (user) setState(user);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Sign-in failed");
    }
  }

  async function signOut() {
    sync.stop();
    await sync.whenIdle();
    await auth.signOut();
    await collection.clear();
    await photos.clear();
    setState("signed-out");
  }

  async function signInAgain() {
    if (await auth.signIn()) await sync.syncNow();
  }

  if (state === "checking") return null;

  if (state === "signed-out") {
    return (
      <main>
        <h1>The Binder</h1>
        <button className="primary" onClick={signIn}>
          Sign in with Google
        </button>
        {declined && <p role="alert">Drive access is required to store your collection.</p>}
        {failure && <p role="alert">{failure}</p>}
      </main>
    );
  }

  return <SessionContext.Provider value={{ email: state.email, signOut, signInAgain }}>{children}</SessionContext.Provider>;
}
