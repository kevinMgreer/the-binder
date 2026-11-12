import { expect, test, type Page } from "@playwright/test";
import { openCollection } from "./helpers";

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
