import { expect, test } from "@playwright/test";

// Runs alone, after the other tests, so CPU contention does not distort the timing (see playwright.config.ts).
const rows = (page: import("@playwright/test").Page) => page.getByTestId("card-row");

test("Large collection: first screen within 1 s with 4x CPU throttling", async ({ page, context }) => {
  // Measured on a production bundle: the unbundled dev server adds module-loading time the shipped app does not have.
  await page.goto("http://localhost:4173/?seed=5000");
  await expect(page.getByTestId("summary")).toHaveText("5000 cards, 5000 distinct");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.reload();
  await expect(rows(page).first()).toBeVisible();
  const firstRender = await page.evaluate(() => performance.getEntriesByName("collection-first-render")[0].startTime);
  test.info().annotations.push({ type: "first-render-ms", description: String(Math.round(firstRender)) });
  expect(firstRender).toBeLessThan(1000);
});
