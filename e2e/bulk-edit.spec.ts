import { expect, test } from "@playwright/test";
import { openCollection } from "./helpers";

test.use({ viewport: { width: 360, height: 800 } });

test("Select all on 5,000 cards counts them all and renders only the rows near the screen", async ({ page }) => {
  await page.goto("/?seed=5000");
  await openCollection(page);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.getByRole("button", { name: "Select all" }).click();
  const bar = page.getByTestId("selection-bar");
  await expect(bar).toContainText("5000 selected");
  expect(await page.getByTestId("card-row").count()).toBeLessThan(100);
  // One line: the bar is as tall as its 48px buttons.
  expect((await bar.boundingBox())!.height).toBeLessThanOrEqual(56);
});

test("Changing the set of three cards shows it on their rows", async ({ page }) => {
  await page.goto("/?seed=5000");
  await openCollection(page);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const rows = page.getByTestId("card-row");
  for (const i of [0, 1, 2]) await rows.nth(i).getByRole("button").click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Edit 3 cards" });
  await sheet.getByLabel("Set", { exact: true }).fill("Bulk Gold");
  await sheet.getByRole("button", { name: "Change 3 cards" }).click();
  await page.getByRole("alertdialog", { name: "Change 3 cards?" }).getByRole("button", { name: "Change" }).click();
  await expect(page.getByTestId("selection-bar")).toHaveCount(0);
  await expect(rows.filter({ hasText: "Bulk Gold" })).toHaveCount(3);
});
