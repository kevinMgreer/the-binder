import { createRoot } from "react-dom/client";
import { DexieCollectionStore } from "./adapters/dexie";
import { createFakePorts } from "./adapters/fakes";
import { App } from "./app/App";
import { PortsProvider } from "./app/ports-context";
import "./app/app.css";

const ports = { ...createFakePorts(), collection: new DexieCollectionStore() };

if (import.meta.env.DEV) {
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
