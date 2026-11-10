import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 15_000,
  // CI runners are slower: a 2 s wait on sync status flaked there (auth.spec.ts) while passing locally.
  expect: { timeout: process.env.CI ? 6_000 : 2_000 },
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
  projects: [
    { name: "mobile", testIgnore: /perf\.spec/, use: { ...devices["Pixel 7"] } },
    // Timing test: runs by itself once everything else has finished.
    { name: "perf", testMatch: /perf\.spec/, dependencies: ["mobile"], fullyParallel: false, use: { ...devices["Pixel 7"], baseURL: "http://localhost:4173" } },
  ],
});
