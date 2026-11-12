import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { createRoot } from "react-dom/client";
import { CapacitorCameraPhotoSource } from "./adapters/capacitor-camera";
import { CapacitorAppInfo } from "./adapters/capacitor-app-info";
import { capacitorNativeAuth } from "./adapters/capacitor-native-auth";
import { capacitorScanner } from "./adapters/capacitor-scanner";
import { ScannerPhotoSource } from "./adapters/document-scanner-photo-source";
import { ClaudeRecognizer } from "./adapters/claude-recognizer";
import { MlKitRecognizer, capacitorTextReader } from "./adapters/mlkit-recognizer";
import { BinderDb } from "./adapters/db";
import { DexieCollectionStore } from "./adapters/dexie";
import { DriveRemoteStore } from "./adapters/drive-remote-store";
import { DexiePhotoStore } from "./adapters/dexie-photos";
import { FakeAuthProvider, createFakePorts } from "./adapters/fakes";
import { NativeGoogleAuthProvider } from "./adapters/native-auth";
import { App } from "./app/App";
import { PortsProvider } from "./app/ports-context";
import { AuthGate } from "./app/session";
import { SyncProvider } from "./app/sync-context";
import type { Ports } from "./ports";
import { SyncEngine } from "./sync/engine";
import { GitHubReleaseFeed } from "./updates/github-release-feed";
import "./app/fonts.css";
import "./app/tokens.css";
import "./app/app.css";

const params = new URLSearchParams(location.search);
// Test hooks (fake sign-in, seed data, window handles) exist only in dev and in the e2e build mode used by performance tests.
const testHooks = import.meta.env.DEV || import.meta.env.MODE === "e2e";
const db = new BinderDb();
const fakes = createFakePorts();
const ports: Ports = {
  ...fakes,
  collection: new DexieCollectionStore(db),
  photos: new DexiePhotoStore(db),
  photoSource: Capacitor.isNativePlatform()
    ? new ScannerPhotoSource(capacitorScanner, new CapacitorCameraPhotoSource())
    : fakes.photoSource,
  auth: new FakeAuthProvider(testHooks && params.get("auth") !== "signed-out" ? { email: "owner@example.test" } : null),
};
if (Capacitor.isNativePlatform()) {
  const { id } = await CapacitorApp.getInfo();
  ports.remote = new DriveRemoteStore({
    root: id.endsWith(".debug") ? "dev" : "release",
    getAccessToken: () => ports.auth.getAccessToken(),
    onUnauthorized: () => ports.auth.dropAccessToken(),
  });
  ports.auth = new NativeGoogleAuthProvider(capacitorNativeAuth, {
    webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string,
  });
  ports.ocr = new MlKitRecognizer(capacitorTextReader());
  ports.appInfo = new CapacitorAppInfo();
  ports.releaseFeed = new GitHubReleaseFeed("kevinMgreer/the-binder");
}
const identifyUrl = import.meta.env.VITE_IDENTIFY_URL as string | undefined;
if (identifyUrl) ports.claude = new ClaudeRecognizer({ url: identifyUrl, getIdToken: () => ports.auth.getIdToken() });
const sync = new SyncEngine(ports);

if (testHooks) {
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
      <AuthGate autoSync={!testHooks || params.get("sync") === "auto"}>
        <App />
      </AuthGate>
    </SyncProvider>
  </PortsProvider>,
);
