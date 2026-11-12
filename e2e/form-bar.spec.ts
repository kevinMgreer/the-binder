import { expect, test, type Page } from "@playwright/test";
import { hardwareBack, openCollection } from "./helpers";

const css = (page: Page, sel: string, prop: string) => page.locator(sel).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

async function openForm(page: Page, scheme: "light" | "dark", edit: boolean) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto("/");
  await page.evaluate(() => document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px"));
  if (edit) {
    await page.evaluate(async () => {
      const { makeCard } = await import("/src/domain/fixtures.ts");
      await (window as any).__ports.collection.putMany([makeCard({ player: "Ronald Acuña Jr.", notes: "n" })]);
    });
    await page.reload();
    await page.evaluate(() => document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px"));
    await openCollection(page);
    await page.getByTestId("card-row").first().click();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
  } else {
    await page.getByRole("button", { name: "Add card", exact: true }).click();
  }
}

async function openDiscard(page: Page, scheme: "light" | "dark" = "light") {
  await openForm(page, scheme, false);
  await page.getByLabel("Player", { exact: true }).fill("Hank Aaron");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("button", { name: "Cancel" }).click();
  return page.getByRole("alertdialog", { name: "Discard this card?" });
}

async function openDuplicate(page: Page, scheme: "light" | "dark" = "light") {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto("/");
  await page.evaluate(async () => {
    const { makeCard } = await import("/src/domain/fixtures.ts");
    await (window as any).__ports.collection.clear();
    await (window as any).__ports.collection.putMany([makeCard()]);
  });
  await page.reload();
  await page.evaluate(() => document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px"));
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  for (const [label, value] of [["Player", "Ronald Acuña Jr."], ["Year", "2024"], ["Set", "Series 1"], ["Card number", "27"]]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("button", { name: "Save", exact: true }).click();
  return page.getByRole("alertdialog", { name: "Duplicate card" });
}

/** Centred in the area above the 48 px bottom inset, which the dialog respects like the Delete dialog. */
const centre = async (page: Page, dialog: ReturnType<Page["locator"]>) => {
  const box = (await dialog.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(Math.abs(box.x + box.width / 2 - vp.width / 2)).toBeLessThanOrEqual(8);
  expect(Math.abs(box.y + box.height / 2 - (vp.height - 48) / 2)).toBeLessThanOrEqual(8);
};

const underBar = (page: Page, name: "Save" | "Cancel") =>
  page.getByRole("button", { name, exact: true }).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return !!document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest(".form-bar");
  });

const rowCount = (page: Page) => page.evaluate(() => (window as any).__ports.collection.list().then((l: unknown[]) => l.length));

test.describe("Form prompts are modal dialogs", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`Discard prompt centred over the bar: ${scheme}`, async ({ page }) => {
      const dialog = await openDiscard(page, scheme);
      await expect(dialog).toBeInViewport({ ratio: 1 });
      await centre(page, dialog);
      expect(await underBar(page, "Save")).toBe(false);
      const danger = await page.evaluate(() => {
        const probe = Object.assign(document.createElement("div"), { style: "color: var(--color-danger)" });
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      expect(await dialog.getByRole("button", { name: "Discard" }).evaluate((el) => getComputedStyle(el).color)).toBe(danger);
      await expect(dialog.getByRole("button", { name: "Keep editing" })).toBeFocused();
    });

    test(`Duplicate prompt centred over the bar: ${scheme}`, async ({ page }) => {
      const dialog = await openDuplicate(page, scheme);
      await expect(dialog).toBeInViewport({ ratio: 1 });
      await centre(page, dialog);
      await expect(dialog).toHaveAccessibleDescription("This card is already in your collection (1 owned).");
      await expect(dialog.getByRole("button", { name: "Increase quantity" })).toBeFocused();
      expect(await underBar(page, "Save")).toBe(false);
    });
  }

  test("A scrim tap on the Save point keeps editing", async ({ page }) => {
    const dialog = await openDiscard(page);
    const save = (await page.getByRole("button", { name: "Save", exact: true }).boundingBox())!;
    await page.mouse.click(save.x + save.width / 2, save.y + save.height / 2);
    await expect(dialog).toHaveCount(0);
    await expect(page.getByLabel("Player", { exact: true })).toHaveValue("Hank Aaron");
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  });

  test("Escape keeps editing", async ({ page }) => {
    const dialog = await openDiscard(page);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  });

  test("The form behind is out of reach", async ({ page }) => {
    const dialog = await openDiscard(page);
    await page.getByLabel("Player", { exact: true }).evaluate((el) => (el as HTMLElement).focus());
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.locator(".form-bar").getByRole("button", { name: "Save", exact: true }).evaluate((el) => (el as HTMLElement).focus());
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  });

  test("The bar does nothing under the discard prompt", async ({ page }) => {
    for (const name of ["Save", "Cancel"] as const) {
      const dialog = await openDiscard(page);
      const box = (await page.getByRole("button", { name, exact: true }).boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect(dialog).toHaveCount(0);
      expect(await rowCount(page)).toBe(0);
      await expect(page.getByLabel("Player", { exact: true })).toBeVisible();
    }
  });

  test("The bar does nothing under the duplicate prompt", async ({ page }) => {
    for (const name of ["Save", "Cancel"] as const) {
      const dialog = await openDuplicate(page);
      const box = (await page.getByRole("button", { name, exact: true }).boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect(dialog).toHaveCount(0);
      expect(await rowCount(page)).toBe(1);
      await expect(page.getByLabel("Player", { exact: true })).toBeVisible();
    }
  });

  test("Blocked message kept under the dialog", async ({ page }) => {
    await openForm(page, "light", false);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByLabel("Year", { exact: true }).fill("2024");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Keep editing" }).click();
    await expect(page.locator(".form-bar").getByTestId("save-blocked")).toContainText("Player");
  });

  test("Back to form keeps the entries and focuses Save", async ({ page }) => {
    await openDuplicate(page);
    await page.getByRole("button", { name: "Back to form" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByLabel("Player", { exact: true })).toHaveValue("Ronald Acuña Jr.");
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeFocused();
  });

  test("Android back closes the duplicate prompt and keeps the form", async ({ page }) => {
    await openDuplicate(page);
    await hardwareBack(page);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByLabel("Player", { exact: true })).toHaveValue("Ronald Acuña Jr.");
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeFocused();
    expect(await rowCount(page)).toBe(1);
  });

  test.describe("short screen", () => {
    test.use({ viewport: { width: 360, height: 450 } });

    test("Both prompts are fully visible after scrolling to the end", async ({ page }) => {
      const discard = await openDiscard(page);
      await expect(discard).toBeInViewport({ ratio: 1 });
      const duplicate = await openDuplicate(page);
      await expect(duplicate).toBeInViewport({ ratio: 1 });
    });
  });
});

test.describe("Sticky form bar", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`Save visible at the top of a long form: ${scheme}`, async ({ page }) => {
      await openForm(page, scheme, false);
      const cancel = page.getByRole("button", { name: "Cancel" });
      const save = page.getByRole("button", { name: "Save", exact: true });
      await expect(cancel).toBeInViewport({ ratio: 1 });
      await expect(save).toBeInViewport({ ratio: 1 });
      const bar = (await page.locator(".form-bar").boundingBox())!;
      expect(bar.y + bar.height).toBeLessThanOrEqual(800 - 48 + 0.5);
      const panel = await page.evaluate(() => {
        const probe = Object.assign(document.createElement("div"), { style: "background: var(--color-panel)" });
        document.body.append(probe);
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
      });
      expect(await css(page, ".form-bar", "background-color")).toBe(panel);
      expect(await css(page, ".form-bar", "border-top-width")).toBe("1px");
      expect((await cancel.boundingBox())!.x).toBeLessThan((await save.boundingBox())!.x);
    });

    test(`Last field clears the bar: ${scheme}`, async ({ page }) => {
      await openForm(page, scheme, true);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const notes = (await page.getByLabel("Notes", { exact: true }).boundingBox())!;
      const bar = (await page.locator(".form-bar").boundingBox())!;
      expect(notes.y + notes.height).toBeLessThanOrEqual(bar.y);
    });

    test(`Blocked message next to Save: ${scheme}`, async ({ page }) => {
      await openForm(page, scheme, false);
      await page.getByRole("button", { name: "Save", exact: true }).click();
      const player = page.getByLabel("Player", { exact: true });
      await expect(player).toBeFocused();
      const bar = (await page.locator(".form-bar").boundingBox())!;
      const p = (await player.boundingBox())!;
      expect(p.y + p.height).toBeLessThanOrEqual(bar.y);
      const msg = page.locator(".form-bar").getByTestId("save-blocked");
      await expect(msg).toContainText("Player");
      await expect(msg).toContainText("Set");
      await expect(msg).toBeInViewport({ ratio: 1 });
      expect((await msg.boundingBox())!.y + (await msg.boundingBox())!.height).toBeLessThanOrEqual((await page.getByRole("button", { name: "Save", exact: true }).boundingBox())!.y);
    });
  }
});
