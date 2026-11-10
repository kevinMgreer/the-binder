import { expect, type Page } from "@playwright/test";

/** The app opens on the dashboard; most specs exercise the collection list behind the Cards tab. */
export async function openCollection(page: Page) {
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Cards", exact: true }).click();
  await expect(page.getByTestId("summary")).toBeVisible();
}

/** The browser has no Android back button; test builds route this event to the same handler. */
export const hardwareBack = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event("hardware-back")));
