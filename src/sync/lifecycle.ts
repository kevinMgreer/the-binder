import type { SyncEngine } from "./engine";

/** Syncs only while the app is in the foreground, and again when the connection returns. */
export function attachLifecycle(
  engine: Pick<SyncEngine, "start" | "stop" | "syncNow">,
  doc: Document = document,
  win: Window = window,
): () => void {
  const onVisibility = () => (doc.visibilityState === "visible" ? engine.start() : engine.stop());
  const onOnline = () => void engine.syncNow();

  if (doc.visibilityState === "visible") engine.start();
  doc.addEventListener("visibilitychange", onVisibility);
  win.addEventListener("online", onOnline);

  return () => {
    engine.stop();
    doc.removeEventListener("visibilitychange", onVisibility);
    win.removeEventListener("online", onOnline);
  };
}
