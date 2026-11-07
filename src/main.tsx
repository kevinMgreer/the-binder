import { Capacitor } from "@capacitor/core";
import { createRoot } from "react-dom/client";
import { CapacitorCameraPhotoSource } from "./adapters/capacitor-camera";
import { CapacitorAppInfo } from "./adapters/capacitor-app-info";
import { ClaudeRecognizer } from "./adapters/claude-recognizer";
import { BinderDb } from "./adapters/db";
import { DexieCollectionStore } from "./adapters/dexie";
import { DexiePhotoStore } from "./adapters/dexie-photos";
import { FakeAuthProvider, createFakePorts } from "./adapters/fakes";
import { App } from "./app/App";
import { PortsProvider } from "./app/ports-context";
import { AuthGate } from "./app/session";
import { SyncProvider } from "./app/sync-context";
import { SyncEngine } from "./sync/engine";
import { GitHubReleaseFeed } from "./updates/github-release-feed";
import "./app/app.css";

const params = new URLSearchParams(location.search);
const db = new BinderDb();
const fakes = createFakePorts();
const ports = {
  ...fakes,
  collection: new DexieCollectionStore(db),
  photos: new DexiePhotoStore(db),
  photoSource: Capacitor.isNativePlatform() ? new CapacitorCameraPhotoSource() : fakes.photoSource,
  // Replaced by the native Google adapter in task 4.2.
  auth: new FakeAuthProvider(import.meta.env.DEV && params.get("auth") !== "signed-out" ? { email: "owner@example.test" } : null),
};
if (Capacitor.isNativePlatform()) {
  ports.appInfo = new CapacitorAppInfo();
  ports.releaseFeed = new GitHubReleaseFeed("kevinMgreer/the-binder");
}
const identifyUrl =import.meta.env.VITE_IDENTIFY_URL as string | undefined;
if (identifyUrl) ports.claude = new ClaudeRecognizer({ url: identifyUrl, getIdToken: () => ports.auth.getIdToken() });
const sync = new SyncEngine(ports);

if (import.meta.env.DEV) {
  Object.assign(window, { __ports: ports, __sync: sync });
  const count = Number(params.get("seed"));
  if (count > 0 && (await ports.collection.list()).length === 0) {
    const { seedCards } = await import("./dev/seed");
    await ports.collection.putMany(seedCards(count));
  }
}

createRoot(document.getElementById("root")!).render(
  <PortsProvider ports={ports}>
    <SyncProvider engine={sync}>
      <AuthGate autoSync={!import.meta.env.DEV || params.get("sync") === "auto"}>
        <App />
      </AuthGate>
    </SyncProvider>
  </PortsProvider>,
);
