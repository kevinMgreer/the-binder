import { expect, test } from "@playwright/test";
import { openCollection } from "./helpers";

test.use({ viewport: { width: 360, height: 800 } });

test("Deleting three selected cards: one-row bar, 48px trash, confirm removes the rows", async ({ page }) => {
  await page.goto("/?seed=5000");
  await openCollection(page);
  await page.getByRole("button", { name: "Select cards" }).click();
  const rows = page.getByTestId("card-row");
  const names = await rows.evaluateAll((els) => els.slice(0, 3).map((e) => e.textContent ?? ""));
  for (const i of [0, 1, 2]) await rows.nth(i).getByRole("button").click();

  const bar = page.getByTestId("selection-bar");
  await expect(bar).toContainText("3 selected");
  expect((await bar.boundingBox())!.height).toBeLessThanOrEqual(56);
  const trash = page.getByRole("button", { name: "Delete", exact: true });
  const box = (await trash.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(48);
  expect(box.height).toBeGreaterThanOrEqual(48);
  await page.screenshot({ path: "scratch/bulk-delete-selection.png" });

  await trash.click();
  const dialog = page.getByRole("alertdialog", { name: "Delete cards" });
  await expect(dialog).toContainText("Delete 3 cards?");
  await page.screenshot({ path: "scratch/bulk-delete-dialog.png" });

  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(bar).toHaveCount(0);
  for (const name of names) await expect(page.getByTestId("card-row").filter({ hasText: name })).toHaveCount(0);
});
