import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.github.kevinmgreer.thebinder",
  appName: "The Binder",
  webDir: "dist",
  server: {
    // Never change androidScheme or hostname: IndexedDB is keyed to this WebView origin,
    // so changing either in a later release would orphan every user's local data after an update.
    androidScheme: "https",
    hostname: "localhost",
  },
};

export default config;
