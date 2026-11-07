import type { CapturedPhoto } from "../ports";

interface Reply {
  id: number;
  result?: CapturedPhoto;
  error?: string;
}

let worker: Worker | undefined;
let nextId = 0;
const waiting = new Map<number, { resolve: (p: CapturedPhoto) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./pipeline.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<Reply>) => {
      const job = waiting.get(e.data.id);
      waiting.delete(e.data.id);
      if (e.data.result) job?.resolve(e.data.result);
      else job?.reject(new Error(e.data.error ?? "Photo processing failed"));
    };
  }
  return worker;
}

export function processPhoto(source: Blob): Promise<CapturedPhoto> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    getWorker().postMessage({ id, source });
  });
}
