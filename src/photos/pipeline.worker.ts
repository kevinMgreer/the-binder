import { compress } from "./compress";

self.onmessage = async (e: MessageEvent<{ id: number; source: Blob }>) => {
  const { id, source } = e.data;
  try {
    self.postMessage({ id, result: await compress(source) });
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
