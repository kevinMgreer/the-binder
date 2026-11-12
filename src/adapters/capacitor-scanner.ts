import { Capacitor, registerPlugin } from "@capacitor/core";
import { ScannerUnavailableError, type DocumentScanner } from "./document-scanner-photo-source";

interface BinderScannerPlugin {
  scan(options: { hint: string }): Promise<{ uri: string | null }>;
}

/** The binding takes its plugin, URL converter and fetch so it can be tested without a device. */
export function createCapacitorScanner(
  plugin: BinderScannerPlugin,
  toUrl: (uri: string) => string,
  fetchFn: typeof fetch,
): DocumentScanner {
  return {
    async scan(hint) {
      try {
        const { uri } = await plugin.scan({ hint });
        if (!uri) return null;
        return await (await fetchFn(toUrl(uri))).blob();
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "UNAVAILABLE") throw new ScannerUnavailableError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
  };
}

export const capacitorScanner = createCapacitorScanner(
  registerPlugin<BinderScannerPlugin>("BinderScanner"),
  (uri) => Capacitor.convertFileSrc(uri),
  (...args) => fetch(...args),
);
