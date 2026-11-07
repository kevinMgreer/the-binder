import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 15_000,
  expect: { timeout: 2_000 },
  webServer: [
    { command: "npm run dev -- --port 5173", url: "http://localhost:5173", reuseExistingServer: true },
    // Production bundle with test hooks, used by the performance test.
    {
      command: "npm run build:e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort",
      url: "http://localhost:4173",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  use: { baseURL: "http://localhost:5173" },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
});
