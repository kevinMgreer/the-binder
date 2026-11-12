import { expect, test } from "@playwright/test";
import { openCollection } from "./helpers";

test("Fonts ship inside the app: no request leaves it, both faces load and are used", async ({ page }) => {
  const foreign: string[] = [];
  const fontRequests: string[] = [];
  const origin = "http://localhost:5173";
  await page.route(
    (url) => url.origin !== origin,
    (route) => {
      foreign.push(route.request().url());
      return route.abort();
    },
  );
  page.on("request", (r) => r.resourceType() === "font" && fontRequests.push(r.url()));

  await page.goto("/");
  await page.evaluate(async () => {
    const { makeCard } = await import("/src/domain/fixtures.ts");
    await (window as unknown as { __ports: any }).__ports.collection.putMany([makeCard({ player: "Ronald Acuña Jr.", cardNumber: "27" })]);
  });
  await page.reload();

  const family = (sel: string, prop = "font-family") => page.locator(sel).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
  const title = page.getByRole("heading", { name: "Dashboard" });
  await expect(title).toBeVisible();
  expect(await family("h1")).toContain("Roboto Slab");
  expect(await family(".tile-value")).toContain("Roboto Slab");
  expect(await family(".tile-value", "font-variant-numeric")).toContain("tabular-nums");
  expect(await family(".tile-label")).toContain("Inter");

  await openCollection(page);
  await page.getByTestId("card-row").first().click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("hardware-back")));
  await page.getByRole("button", { name: /^Filter/ }).click();
  await expect(page.getByRole("dialog", { name: "Filter and sort" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.dispatchEvent(new Event("hardware-back")));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  expect(await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded = (name: string) => [...document.fonts].some((f) => f.family.replace(/"/g, "") === name && f.status === "loaded");
    return [document.fonts.check('700 28px "Roboto Slab"'), document.fonts.check("400 14px Inter"), loaded("Roboto Slab"), loaded("Inter")];
  })).toEqual([true, true, true, true]);
  expect(foreign).toEqual([]);
  expect(fontRequests.filter((u) => !u.startsWith(origin))).toEqual([]);
});
