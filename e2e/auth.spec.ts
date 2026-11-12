import { expect, test, type Page } from "@playwright/test";
import { openCollection } from "./helpers";

type Win = { __ports: any; __sync: any };

const signInButton = (page: Page) => page.getByRole("button", { name: "Sign in with Google" });

async function localRecordCounts(page: Page) {
  return page.evaluate(
    () =>
      new Promise<Record<string, number>>((resolve, reject) => {
        const open = indexedDB.open("the-binder");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const names = [...db.objectStoreNames];
          const tx = db.transaction(names, "readonly");
          const counts: Record<string, number> = {};
          for (const name of names) {
            const count = tx.objectStore(name).count();
            count.onsuccess = () => (counts[name] = count.result);
          }
          tx.oncomplete = () => {
            db.close();
            resolve(counts);
          };
        };
      }),
  );
}

async function addCardWithPhoto(page: Page) {
  await page.evaluate(async () => {
    const w = window as unknown as Win;
    const { saveCard } = await import("/src/usecases/cards.ts");
    const { makeCard } = await import("/src/domain/fixtures.ts");
    const canvas = new OffscreenCanvas(100, 100);
    canvas.getContext("2d")!.fillRect(0, 0, 100, 100);
    const blob = await canvas.convertToBlob({ type: "image/webp" });
    await saveCard(w.__ports, makeCard(), { front: { full: blob, thumb: blob } });
  });
  await page.reload();
}

test("First launch shows the sign-in screen and no collection", async ({ page }) => {
  await page.goto("/?auth=signed-out");
  await expect(signInButton(page)).toBeVisible();
  await expect(page.getByTestId("shown")).toHaveCount(0);
  await expect(page.getByTestId("card-row")).toHaveCount(0);
});

test("App name on sign-in only: the sign-in heading is The Binder, the dashboard's is not", async ({ page }) => {
  await page.goto("/?auth=signed-out");
  await expect(page.getByRole("heading", { name: "The Binder" })).toBeVisible();
  await signInButton(page).click();
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Binder" })).toHaveCount(0);
});

test("Successful sign-in shows the collection", async ({ page }) => {
  await page.goto("/?auth=signed-out");
  await signInButton(page).click();
  await openCollection(page);
  await expect(page.getByTestId("shown")).toHaveText("Showing 0");
});

test("Declining Drive access stays on the sign-in screen with an explanation", async ({ page }) => {
  await page.goto("/?auth=signed-out");
  await page.evaluate(() => {
    (window as unknown as Win).__ports.auth.consent = false;
  });
  await signInButton(page).click();
  await expect(page.getByText("Drive access is required to store your collection")).toBeVisible();
  await expect(signInButton(page)).toBeVisible();
  await expect(page.getByTestId("shown")).toHaveCount(0);
});

test("When silent renewal is refused sync pauses, local changes stay, and Sign in again resumes", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const w = window as unknown as Win;
    const { AuthExpiredError } = await import("/src/ports/index.ts");
    w.__ports.remote.failures.push(new AuthExpiredError("Sign in again"));
  });
  await page.getByRole("button", { name: "Add card" }).click();
  await page.getByLabel("Player", { exact: true }).fill("Ronald Acuña Jr.");
  await page.getByLabel("Year", { exact: true }).fill("2024");
  await page.getByLabel("Set", { exact: true }).fill("Series 1");
  await page.getByLabel("Card number", { exact: true }).fill("27");
  await page.getByRole("button", { name: "Save" }).click();
  await page.evaluate(() => (window as unknown as Win).__sync.syncNow());

  await expect(page.getByTestId("sync-status")).toHaveText("Sync paused");
  await openCollection(page);
  await expect(page.getByTestId("card-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Sign in again" }).click();
  await expect(page.getByTestId("sync-status")).toHaveText("Synced");
  await expect(page.getByTestId("card-row")).toHaveCount(1);
});

test("Sign out with unsynced changes warns first and signs out only after confirming", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => (window as unknown as Win).__sync.stop());
  await addCardWithPhoto(page);
  await page.evaluate(() => (window as unknown as Win).__sync.stop());

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Sign out" });
  await expect(dialog).toContainText("unsynced changes will be lost");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(signInButton(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("alertdialog", { name: "Sign out" }).getByRole("button", { name: "Confirm sign out" }).click();
  await expect(signInButton(page)).toBeVisible();
});

test("A remembered user with Google unreachable still sees the collection and can add a card", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const w = window as unknown as Win;
    const { AuthExpiredError } = await import("/src/ports/index.ts");
    w.__ports.auth.getAccessToken = () => Promise.reject(new AuthExpiredError("Sign in again"));
  });
  await expect(signInButton(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Add card" }).click();
  await page.getByLabel("Player", { exact: true }).fill("Ronald Acuña Jr.");
  await page.getByLabel("Year", { exact: true }).fill("2024");
  await page.getByLabel("Set", { exact: true }).fill("Series 1");
  await page.getByLabel("Card number", { exact: true }).fill("27");
  await page.getByRole("button", { name: "Save" }).click();
  await openCollection(page);
  await expect(page.getByTestId("card-row")).toHaveCount(1);
  await expect(signInButton(page)).toHaveCount(0);
});

test("Sign out leaves no card data or photos in local storage", async ({ page }) => {
  await page.goto("/");
  await addCardWithPhoto(page);
  const before = await localRecordCounts(page);
  expect(before.cards).toBeGreaterThan(0);
  expect(before.thumbs).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("button", { name: "Confirm sign out" }).click();
  await expect(signInButton(page)).toBeVisible();

  const after = await localRecordCounts(page);
  for (const [store, count] of Object.entries(after)) expect(count, store).toBe(0);
});
