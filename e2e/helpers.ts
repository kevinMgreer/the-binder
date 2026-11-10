import { expect, type Page } from "@playwright/test";

/** The app opens on the dashboard; most specs exercise the collection list behind Browse collection. */
export async function openCollection(page: Page) {
  await page.getByRole("button", { name: "Browse collection" }).click();
  await expect(page.getByTestId("summary")).toBeVisible();
}

/** The browser has no Android back button; test builds route this event to the same handler. */
export const hardwareBack = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event("hardware-back")));
