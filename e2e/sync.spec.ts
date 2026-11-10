import { expect, test, type Page } from "@playwright/test";
import { openCollection } from "./helpers";

type Win = { __ports: any; __sync: any };

async function addCard(page: Page, player: string, cardNumber: string) {
  await page.getByRole("button", { name: "Add card" }).click();
  await page.getByRole("button", { name: "Enter by hand" }).click();
  await page.getByLabel("Player", { exact: true }).fill(player);
  await page.getByLabel("Year", { exact: true }).fill("2024");
  await page.getByLabel("Set", { exact: true }).fill("Series 1");
  await page.getByLabel("Card number", { exact: true }).fill(cardNumber);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Add card" })).toBeVisible();
}

const status = (page: Page) => page.getByTestId("sync-status");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Unsynced indicator shows the pending count and clears once saved", async ({ page }) => {
  await expect(status(page)).toHaveText("Synced");
  await addCard(page, "Ronald Acuña Jr.", "27");
  await addCard(page, "Mookie Betts", "50");
  await expect(status(page)).toHaveText("Unsynced: 2");
  await page.evaluate(() => (window as unknown as Win).__sync.start());
  await expect(status(page)).toHaveText("Synced");
});

test("Drive problem is shown and cleared after an automatic retry", async ({ page }) => {
  await addCard(page, "Ronald Acuña Jr.", "27");
  await page.evaluate(() => {
    const w = window as unknown as Win;
    w.__ports.remote.failures.push(new Error("503 outage"));
    w.__sync.start();
  });
  await expect(status(page)).toContainText("Sync problem");
  await expect(status(page)).toHaveText("Synced", { timeout: 10_000 });
});

test("A deleted data file asks what to do and does nothing until the user chooses", async ({ page }) => {
  await page.evaluate(() => (window as unknown as Win).__sync.start());
  await addCard(page, "Ronald Acuña Jr.", "27");
  await expect(status(page)).toHaveText("Synced", { timeout: 10_000 });
  await page.evaluate(async () => {
    const w = window as unknown as Win;
    w.__ports.remote.deleteCollection();
    await w.__sync.syncNow();
  });
  const dialog = page.getByRole("dialog", { name: "Data file missing" });
  await expect(dialog).toBeVisible();
  const stillMissing = await page.evaluate(async () => (await (window as unknown as Win).__ports.remote.readCollection()) === null);
  expect(stillMissing).toBe(true);

  await dialog.getByRole("button", { name: "Start an empty collection" }).click();
  await expect(dialog).toHaveCount(0);
  await openCollection(page);
  await expect(page.getByTestId("card-row")).toHaveCount(0);
  await expect(page.getByTestId("summary")).toHaveText("0 cards, 0 distinct");
});

test("Sync starts by itself after sign-in and saves a new card without any action", async ({ page }) => {
  await page.goto("/?sync=auto");
  await addCard(page, "Ronald Acuña Jr.", "27");
  await expect(status(page)).toHaveText("Synced", { timeout: 15_000 });
  await expect
    .poll(() =>
      page.evaluate(async () => (await (window as unknown as Win).__ports.remote.readCollection())?.file.cards.length ?? 0),
    )
    .toBe(1);
});

test("Restoring a deleted data file recreates it from this device", async ({ page }) => {
  await page.evaluate(() => (window as unknown as Win).__sync.start());
  await addCard(page, "Ronald Acuña Jr.", "27");
  await expect(status(page)).toHaveText("Synced", { timeout: 10_000 });
  await page.evaluate(async () => {
    const w = window as unknown as Win;
    w.__ports.remote.deleteCollection();
    await w.__sync.syncNow();
  });
  await page.getByRole("button", { name: "Restore Drive from this device" }).click();
  await openCollection(page);
  await expect(page.getByTestId("card-row")).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(async () => (await (window as unknown as Win).__ports.remote.readCollection())?.file.cards.length ?? 0),
    )
    .toBe(1);
});
