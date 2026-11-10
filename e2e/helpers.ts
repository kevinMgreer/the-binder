import { expect, type Page } from "@playwright/test";

/** The app opens on the dashboard; most specs exercise the collection list behind Browse collection. */
export async function openCollection(page: Page) {
  await page.getByRole("button", { name: "Browse collection" }).click();
  await expect(page.getByTestId("summary")).toBeVisible();
}
