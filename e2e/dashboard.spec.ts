import { expect, test, type Page } from "@playwright/test";

type Seed = Record<string, unknown>;

const GOLD = { name: "Gold", serial: null, serialLegible: true, printRun: null };
const AUTO = { rookie: false, autograph: true, relic: false };

async function seed(page: Page, cards: Seed[]) {
  await page.evaluate(async (list) => {
    const { makeCard } = await import("/src/domain/fixtures.ts");
    await (window as unknown as { __ports: any }).__ports.collection.putMany(list.map((o) => makeCard(o)));
  }, cards);
  await page.reload();
}

const tile = (page: Page, label: string) => page.getByRole("button", { name: new RegExp(`^${label}, \\d`) });
const back = (page: Page) => page.getByRole("button", { name: "Back", exact: true });
const browse = (page: Page) => page.getByRole("button", { name: "Browse collection" });
const chips = (page: Page) => page.locator(".chip");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Launch: dashboard with the sync state and seven tiles in order", async ({ page }) => {
  await expect(page.getByTestId("sync-status")).toBeVisible();
  const names = await page.getByTestId("tile").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  expect(names).toEqual([
    "Cards, 0", "Distinct, 0", "Autos, 0", "Relics, 0", "Serial-numbered, 0", "Topps Gold, 0", "Atlanta Braves, 0",
  ]);
  await expect(page.getByTestId("card-row")).toHaveCount(0);
});

test("Tap Topps Gold: list with both chips and a count equal to the tile", async ({ page }) => {
  await seed(page, [
    { cardNumber: "1", manufacturer: "Topps", parallel: GOLD },
    { cardNumber: "2", manufacturer: "topps", parallel: { ...GOLD, name: "gold" } },
    { cardNumber: "3", manufacturer: "Topps", parallel: GOLD, quantity: 2 },
    { cardNumber: "4", manufacturer: "Topps", parallel: { ...GOLD, name: "Gold Refractor" } },
    { cardNumber: "5", manufacturer: "Bowman", parallel: GOLD },
  ]);
  await expect(tile(page, "Topps Gold")).toHaveAccessibleName("Topps Gold, 3");
  await tile(page, "Topps Gold").click();
  await expect(page.getByRole("button", { name: /^Remove Manufacturer filter/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Remove Parallel filter/ })).toBeVisible();
  await expect(page.getByTestId("shown")).toHaveText("Showing 3");
});

test("Tap Autos after another filter leaves only the Autograph chip", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", flags: AUTO }, { cardNumber: "2", team: "Boston Red Sox" }]);
  await tile(page, "Atlanta Braves").click();
  await expect(chips(page)).toHaveCount(1);
  await back(page).click();
  await tile(page, "Autos").click();
  await expect(chips(page)).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^Remove Autograph filter/ })).toBeVisible();
});

test("Remove the tile's filter shows every card", async ({ page }) => {
  await seed(page, [{ cardNumber: "1" }, { cardNumber: "2", team: "Boston Red Sox" }]);
  await tile(page, "Atlanta Braves").click();
  await expect(page.getByTestId("shown")).toHaveText("Showing 1");
  await page.getByRole("button", { name: /^Remove Team filter/ }).click();
  await expect(page.getByTestId("shown")).toHaveText("Showing 2");
});

test("Browse the whole collection clears filters and search", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", flags: { rookie: false, autograph: false, relic: true } }, { cardNumber: "2" }]);
  await tile(page, "Relics").click();
  await page.getByLabel("Search", { exact: true }).fill("Acu");
  await back(page).click();
  await browse(page).click();
  await expect(chips(page)).toHaveCount(0);
  await expect(page.getByLabel("Search", { exact: true })).toHaveValue("");
  await expect(page.getByTestId("shown")).toHaveText("Showing 2");
});

test("Add from the dashboard returns to the dashboard with the count up by the quantity", async ({ page }) => {
  await seed(page, [{ cardNumber: "1" }]);
  await expect(tile(page, "Cards")).toHaveAccessibleName("Cards, 1");
  await page.getByRole("button", { name: "Add card" }).click();
  await page.getByRole("button", { name: "Enter by hand" }).click();
  await page.getByLabel("Player", { exact: true }).fill("Hank Aaron");
  await page.getByLabel("Year", { exact: true }).fill("1957");
  await page.getByLabel("Set", { exact: true }).fill("Topps");
  await page.getByLabel("Card number", { exact: true }).fill("20");
  await page.getByLabel("Quantity", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(tile(page, "Cards")).toHaveAccessibleName("Cards, 4");
  await expect(tile(page, "Distinct")).toHaveAccessibleName("Distinct, 2");
});

test("Empty collection and a zero tile open the no-match list", async ({ page }) => {
  await seed(page, [{ cardNumber: "1" }]);
  await expect(tile(page, "Autos")).toHaveAccessibleName("Autos, 0");
  await tile(page, "Autos").click();
  await expect(page.getByTestId("no-match")).toBeVisible();
});

test("Deleting an autographed card lowers Autos by one", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", flags: AUTO }, { cardNumber: "2", flags: AUTO }]);
  await expect(tile(page, "Autos")).toHaveAccessibleName("Autos, 2");
  await browse(page).click();
  await page.getByTestId("card-row").first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await back(page).click();
  await expect(tile(page, "Autos")).toHaveAccessibleName("Autos, 1");
});

test("Back to the dashboard from the list", async ({ page }) => {
  await browse(page).click();
  await back(page).click();
  await expect(browse(page)).toBeVisible();
});

test("Filters survive opening a card and going back", async ({ page }) => {
  // The browser has no hardware back; deleting a card is the other way from its detail view to the list.
  await seed(page, [{ cardNumber: "1", flags: AUTO }, { cardNumber: "2", flags: AUTO }, { cardNumber: "3" }]);
  await tile(page, "Autos").click();
  await page.getByTestId("card-row").first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByRole("button", { name: /^Remove Autograph filter/ })).toBeVisible();
  await expect(page.getByTestId("shown")).toHaveText("Showing 1");
});

test("Screen reader name holds the label and the number", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", flags: AUTO }]);
  await expect(page.getByRole("button", { name: "Autos, 1" })).toBeVisible();
});
