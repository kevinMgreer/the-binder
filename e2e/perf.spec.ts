import { expect, test, type Page } from "@playwright/test";

// Runs alone, after the other tests, so CPU contention does not distort the timing (see playwright.config.ts).
// Measured on a production bundle (the perf project's baseURL): the unbundled dev server adds module-loading time the shipped app does not have.
const rows = (page: Page) => page.getByTestId("card-row");
const cardsTile = (page: Page) => page.getByTestId("tile").first();

async function throttledReload(page: Page, context: import("@playwright/test").BrowserContext) {
  await page.goto("/?seed=5000");
  await expect(cardsTile(page)).toHaveAttribute("aria-label", /^Cards, 5\D?000$/);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  // The page marks the moment the tile reads 5,000, so the time does not include Playwright's polling.
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      const label = document.querySelector("[data-testid=tile]")?.getAttribute("aria-label") ?? "";
      if (/^Cards, 5\D?000$/.test(label)) {
        performance.mark("cards-ready");
        observer.disconnect();
      }
    });
    observer.observe(document, { subtree: true, childList: true, attributes: true });
  });
  await page.reload();
}

test("Large collection: the dashboard shows 5,000 cards within 1 s with 4x CPU throttling", async ({ page, context }) => {
  await throttledReload(page, context);
  // Not the first render, which shows zeros before the cards are read.
  await expect(cardsTile(page)).toHaveAttribute("aria-label", /^Cards, 5\D?000$/);
  const ready = await page.evaluate(() => performance.getEntriesByName("cards-ready")[0].startTime);
  test.info().annotations.push({ type: "dashboard-ms", description: String(Math.round(ready)) });
  expect(ready).toBeLessThan(1000);
});

test("Large collection: the list shows its first rows within 1 s of tapping the Cards tab", async ({ page, context }) => {
  await throttledReload(page, context);
  await expect(cardsTile(page)).toHaveAttribute("aria-label", /^Cards, 5\D?000$/);
  await page.evaluate(() =>
    document.addEventListener(
      "click",
      (e) => {
        if ((e.target as Element).closest("nav button")?.textContent === "Cards") performance.mark("browse-tap");
      },
      true,
    ),
  );
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Cards", exact: true }).click();
  await expect(rows(page).first()).toBeVisible();
  const ms = await page.evaluate(
    () => performance.getEntriesByName("collection-first-render")[0].startTime - performance.getEntriesByName("browse-tap")[0].startTime,
  );
  test.info().annotations.push({ type: "list-ms", description: String(Math.round(ms)) });
  expect(ms).toBeLessThan(1000);
});
