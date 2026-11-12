import { expect, test, type Page } from "@playwright/test";
import { hardwareBack, openCollection } from "./helpers";

type Win = { __ports: any };

async function setNextPhoto(page: Page, color = "#c33", width = 800, height = 600) {
  await page.evaluate(
    async ({ color, width, height }) => {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      (window as unknown as Win).__ports.photoSource.next = await canvas.convertToBlob({ type: "image/jpeg" });
    },
    { color, width, height },
  );
}

async function seedCardWithPhoto(page: Page, cache: "thumb" | "full") {
  await page.evaluate(async (cache) => {
    const ports = (window as unknown as Win).__ports;
    const { makeCard } = await import("/src/domain/fixtures.ts");
    const card = makeCard({ photos: { front: { fileId: "drive-full", thumbId: "drive-thumb" }, back: null } });
    const canvas = new OffscreenCanvas(320, 448);
    canvas.getContext("2d")!.fillRect(0, 0, 320, 448);
    const blob = await canvas.convertToBlob({ type: "image/webp" });
    await ports.collection.putSynced([card]);
    await ports.photos.cacheThumb(card.id, "front", blob);
    if (cache === "full") await ports.photos.cacheFull(card.id, "front", blob);
  }, cache);
  await page.reload();
}

const fillRequired = async (page: Page) => {
  await page.getByLabel("Player", { exact: true }).fill("Ronald Acuña Jr.");
  await page.getByLabel("Year", { exact: true }).fill("2024");
  await page.getByLabel("Set", { exact: true }).fill("Series 1");
  await page.getByLabel("Card number", { exact: true }).fill("27");
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

/** Opens a side's tile (empty or filled) and taps one of its chooser actions. */
async function choose(page: Page, side: "front" | "back", action: string) {
  await page.getByRole("button", { name: new RegExp(`^(Add|Change) ${side} photo$`) }).click();
  await page.getByRole("dialog", { name: `${side === "front" ? "Front" : "Back"} photo` }).getByRole("button", { name: action }).click();
}

test("Front then back: each tile's chooser attaches both photos", async ({ page }) => {
  await setNextPhoto(page);
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await page.getByRole("button", { name: "Add front photo" }).click();
  await expect(page.getByRole("button", { name: "Scan front" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pick front from photos" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Add back photo" }).click();
  await expect(page.getByRole("button", { name: "Scan back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pick back from photos" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await choose(page, "front", "Scan front");
  await expect(page.getByAltText("Front photo")).toBeVisible();
  await page.getByRole("button", { name: "Change front photo" }).click();
  await expect(page.getByRole("button", { name: "Retake front" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await choose(page, "back", "Scan back");
  await expect(page.getByAltText("Front photo")).toBeVisible();
  await expect(page.getByAltText("Back photo")).toBeVisible();
  await fillRequired(page);
  await page.getByRole("button", { name: "Save" }).click();
  await openCollection(page);
  await expect(page.getByTestId("card-row").first().locator("img")).toBeVisible();
});

test("Fields kept after a scan: the typed player and the back slot survive", async ({ page }) => {
  await setNextPhoto(page);
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await page.getByLabel("Player", { exact: true }).fill("Hank Aaron");
  await choose(page, "front", "Scan front");
  await expect(page.getByAltText("Front photo")).toBeVisible();
  await expect(page.getByLabel("Player", { exact: true })).toHaveValue("Hank Aaron");
  await expect(page.getByAltText("Back photo")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add back photo" })).toBeVisible();
});

test("Back closes the chooser and keeps a typed year", async ({ page }) => {
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await page.getByLabel("Year", { exact: true }).fill("2024");
  await page.getByRole("button", { name: "Add back photo" }).click();
  await expect(page.getByRole("dialog", { name: "Back photo" })).toBeVisible();
  await hardwareBack(page);
  await expect(page.getByRole("dialog", { name: "Back photo" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Add card" })).toBeVisible();
  await expect(page.getByLabel("Year", { exact: true })).toHaveValue("2024");
});

test("Scanner closed without a photo leaves the form as it was and adds nothing", async ({ page }) => {
  await page.evaluate(() => {
    (window as unknown as Win).__ports.photoSource.next = null;
  });
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await page.getByLabel("Year", { exact: true }).fill("2024");
  await choose(page, "back", "Scan back");
  await expect(page.getByRole("button", { name: "Add back photo" })).toBeEnabled();
  await expect(page.getByAltText("Back photo")).toHaveCount(0);
  await expect(page.getByLabel("Year", { exact: true })).toHaveValue("2024");
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await openCollection(page);
  await expect(page.getByTestId("shown")).toHaveText("Showing 0");
});

test("Cancel discards: a scanned front stores nothing and returns to the dashboard", async ({ page }) => {
  await setNextPhoto(page);
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await choose(page, "front", "Scan front");
  await expect(page.getByAltText("Front photo")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("alertdialog", { name: "Discard this card?" })).toBeVisible();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  const pending = await page.evaluate(async () => (await (window as unknown as Win).__ports.photos.pendingUploads()).length);
  expect(pending).toBe(0);
  await openCollection(page);
  await expect(page.getByTestId("shown")).toHaveText("Showing 0");
});

// Not a spec scenario: Android's camera app never reports a denied permission, but the app still handles one if a source raises it.
test("A denied-permission error from the photo source offers to pick from photos instead", async ({ page }) => {
  await page.evaluate(async () => {
    const { PermissionDeniedError } = await import("/src/ports/index.ts");
    (window as unknown as Win).__ports.photoSource.error = new PermissionDeniedError();
  });
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await choose(page, "front", "Scan front");
  await expect(page.getByText("Camera permission denied")).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as Win).__ports.photoSource.error = null;
  });
  await setNextPhoto(page);
  await choose(page, "front", "Pick front from photos");
  await expect(page.getByAltText("Front photo")).toBeVisible();
});

test("Pick from photos: the chosen image becomes the back photo", async ({ page }) => {
  await setNextPhoto(page, "#36c");
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await choose(page, "back", "Pick back from photos");
  await expect(page.getByAltText("Back photo")).toBeVisible();
  await expect(page.getByAltText("Front photo")).toHaveCount(0);
});

test("12 MP photo is stored at most 500 KB with a 320 px thumbnail", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { processPhoto } = await import("/src/photos/pipeline.ts");
    const canvas = new OffscreenCanvas(4000, 3000);
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 4000, 3000);
    gradient.addColorStop(0, "#1b3a6b");
    gradient.addColorStop(1, "#e8d8a8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4000, 3000);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 220px sans-serif";
    ctx.fillText("23/2026", 600, 1700);
    const pixels = ctx.getImageData(0, 0, 4000, 3000);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 12;
      pixels.data[i] += n;
      pixels.data[i + 1] += n;
      pixels.data[i + 2] += n;
    }
    ctx.putImageData(pixels, 0, 0);
    const source = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.9 });
    const { full, thumb } = await processPhoto(source);
    const [f, t] = await Promise.all([createImageBitmap(full), createImageBitmap(thumb)]);
    return {
      fullKB: full.size / 1024,
      thumbKB: thumb.size / 1024,
      type: full.type,
      fullLong: Math.max(f.width, f.height),
      thumbLong: Math.max(t.width, t.height),
    };
  });
  expect(result.type).toBe("image/webp");
  expect(result.fullKB).toBeLessThanOrEqual(500);
  expect(result.fullLong).toBe(1600);
  expect(result.thumbLong).toBe(320);
  expect(result.thumbKB).toBeLessThanOrEqual(40);
});

test("Photo size budget: a card with front and back photos adds at most 1 MB to Drive", async ({ page }) => {
  const bytes = await page.evaluate(async () => {
    const w = window as unknown as Win & { __sync: any };
    const { processPhoto } = await import("/src/photos/pipeline.ts");
    const { saveCard } = await import("/src/usecases/cards.ts");
    const { makeCard } = await import("/src/domain/fixtures.ts");
    const shot = async () => {
      const canvas = new OffscreenCanvas(4000, 3000);
      const ctx = canvas.getContext("2d")!;
      const gradient = ctx.createLinearGradient(0, 0, 4000, 3000);
      gradient.addColorStop(0, "#124");
      gradient.addColorStop(1, "#eda");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 4000, 3000);
      const pixels = ctx.getImageData(0, 0, 4000, 3000);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 16;
        pixels.data[i] += n;
        pixels.data[i + 1] += n;
        pixels.data[i + 2] += n;
      }
      ctx.putImageData(pixels, 0, 0);
      return processPhoto(await canvas.convertToBlob({ type: "image/jpeg", quality: 0.9 }));
    };
    await saveCard(w.__ports, makeCard(), { front: await shot(), back: await shot() });
    await w.__sync.syncNow();
    return w.__ports.remote.photoBytes();
  });
  expect(bytes).toBeGreaterThan(0);
  expect(bytes).toBeLessThanOrEqual(1024 * 1024);
});

test("Offline without a cached full photo shows the thumbnail and a note", async ({ page, context }) => {
  await seedCardWithPhoto(page, "thumb");
  await openCollection(page);
  await context.setOffline(true);
  await page.getByTestId("card-row").first().click();
  await page.getByRole("button", { name: "View front photo" }).click();
  await expect(page.getByAltText("Front photo")).toBeVisible();
  await expect(page.getByText("Full photo will load when online")).toBeVisible();
});

test("Double-tap zooms the full photo in and out", async ({ page }) => {
  await seedCardWithPhoto(page, "full");
  await openCollection(page);
  await page.getByTestId("card-row").first().click();
  await page.getByRole("button", { name: "View front photo" }).click();
  const zoom = page.getByTestId("zoom-front");
  await expect(zoom).toHaveAttribute("data-scale", "1");
  await zoom.dblclick();
  await expect(zoom).toHaveAttribute("data-scale", "2.5");
  await zoom.dblclick();
  await expect(zoom).toHaveAttribute("data-scale", "1");
});
