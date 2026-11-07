import { Capacitor } from "@capacitor/core";
import { createRoot } from "react-dom/client";
import { CapacitorCameraPhotoSource } from "./adapters/capacitor-camera";
import { BinderDb } from "./adapters/db";
import { DexieCollectionStore } from "./adapters/dexie";
import { DexiePhotoStore } from "./adapters/dexie-photos";
import { createFakePorts } from "./adapters/fakes";
import { App } from "./app/App";
import { PortsProvider } from "./app/ports-context";
import "./app/app.css";

const db = new BinderDb();
const fakes = createFakePorts();
const ports = {
  ...fakes,
  collection: new DexieCollectionStore(db),
  photos: new DexiePhotoStore(db),
  photoSource: Capacitor.isNativePlatform() ? new CapacitorCameraPhotoSource() : fakes.photoSource,
};

if (import.meta.env.DEV) {
  (window as unknown as { __ports: unknown }).__ports = ports;
  const count = Number(new URLSearchParams(location.search).get("seed"));
  if (count > 0 && (await ports.collection.list()).length === 0) {
    const { seedCards } = await import("./dev/seed");
    await ports.collection.putMany(seedCards(count));
  }
}

createRoot(document.getElementById("root")!).render(
  <PortsProvider ports={ports}>
    <App />
  </PortsProvider>,
);
