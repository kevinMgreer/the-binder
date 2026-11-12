import { expect, test, type Page } from "@playwright/test";
import { hardwareBack } from "./helpers";

type Seed = Record<string, unknown>;

const GOLD = { name: "Gold", serial: null, serialLegible: true, printRun: null };
const AUTO = { rookie: false, autograph: true, relic: false };
const ROOKIE = { rookie: true, autograph: false, relic: false };
const RELIC = { rookie: false, autograph: false, relic: true };

async function seed(page: Page, cards: Seed[]) {
  await page.evaluate(async (list) => {
    const { makeCard } = await import("/src/domain/fixtures.ts");
    await (window as unknown as { __ports: any }).__ports.collection.putMany(list.map((o) => makeCard(o)));
  }, cards);
  await page.reload();
}

const tile = (page: Page, label: string) => page.getByRole("button", { name: new RegExp(`^${label}, \\d`) });
const team = (page: Page, name: string) => page.getByRole("button", { name: new RegExp(`^${name}, \\d`, "i") });
const back = hardwareBack;
const cardsTab = (page: Page) => page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Cards", exact: true });
const onDashboard = (page: Page) => expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
const chips = (page: Page) => page.locator(".chip");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Launch: dashboard with the sync state and six tiles in order", async ({ page }) => {
  await expect(page.getByTestId("sync-status")).toBeVisible();
  const names = await page.getByTestId("tile").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  expect(names).toEqual(["Cards, 0", "Distinct, 0", "Autos, 0", "Relics, 0", "Serial-numbered, 0", "Rookies, 0"]);
  await expect(page.getByTestId("card-row")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Recently added" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Top teams" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Top players" })).toHaveCount(0);
});

test("Tap Rookies: list with a Rookie chip and a count equal to the tile", async ({ page }) => {
  await seed(page, [
    { cardNumber: "1", flags: ROOKIE },
    { cardNumber: "2", flags: ROOKIE, quantity: 2 },
    { cardNumber: "3", flags: ROOKIE },
    { cardNumber: "4" },
  ]);
  await expect(tile(page, "Rookies")).toHaveAccessibleName("Rookies, 3");
  await tile(page, "Rookies").click();
  await expect(page.getByRole("button", { name: /^Remove Rookie filter/ })).toBeVisible();
  await expect(page.getByTestId("shown")).toHaveText("Showing 3");
});

test("Tap Autos after another filter leaves only the Autograph chip", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", flags: AUTO }, { cardNumber: "2", team: "Boston Red Sox" }]);
  await team(page, "Boston Red Sox").click();
  await expect(chips(page)).toHaveCount(1);
  await back(page);
  await tile(page, "Autos").click();
  await expect(chips(page)).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^Remove Autograph filter/ })).toBeVisible();
});

test("Remove the Relic chip shows every card", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", flags: RELIC }, { cardNumber: "2" }]);
  await tile(page, "Relics").click();
  await expect(page.getByTestId("shown")).toHaveText("Showing 1");
  await page.getByRole("button", { name: /^Remove Relic filter/ }).click();
  await expect(page.getByTestId("shown")).toHaveText("Showing 2");
});

test("No team or parallel tiles", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", manufacturer: "Topps", parallel: GOLD }]);
  await expect(page.getByTestId("tile").filter({ hasText: /Topps Gold|Atlanta Braves/ })).toHaveCount(0);
});

test("Top teams: tap an entry opens the list filtered to it, earlier Autograph chip cleared", async ({ page }) => {
  await seed(page, [
    { cardNumber: "1", flags: AUTO },
    { cardNumber: "2" },
    { cardNumber: "3", team: "atlanta braves" },
    { cardNumber: "4", team: "Boston Red Sox" },
    { cardNumber: "5", team: "" },
  ]);
  await tile(page, "Autos").click();
  await expect(page.getByRole("button", { name: /^Remove Autograph filter/ })).toBeVisible();
  await back(page);
  await expect(team(page, "Atlanta Braves")).toHaveAccessibleName(/^atlanta braves, 3$/i);
  await expect(page.getByTestId("team")).toHaveCount(2);
  await team(page, "Atlanta Braves").click();
  await expect(chips(page)).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^Remove Team filter/ })).toBeVisible();
  await expect(page.getByTestId("shown")).toHaveText("Showing 3");
});

test("Top players: order, distinct count, tap opens the list with a Player chip; Recently added is last", async ({ page }) => {
  await seed(page, [
    { cardNumber: "1", player: "Aaron Judge", flags: AUTO },
    { cardNumber: "2", player: "Aaron Judge", quantity: 3 },
    { cardNumber: "3", player: "Mookie Betts" },
    { cardNumber: "4", player: "Shohei Ohtani", team: "Los Angeles Angels" },
  ]);
  const rows = page.getByTestId("player");
  await expect(rows).toHaveCount(3);
  expect(await rows.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")))).toEqual(["Aaron Judge, 2", "Mookie Betts, 1", "Shohei Ohtani, 1"]);
  const tops = await page.locator("h2").allTextContents();
  expect(tops).toEqual(["Top teams", "Top players", "Recently added"]);
  for (const box of await rows.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) expect(box).toBeGreaterThanOrEqual(48);
  await tile(page, "Autos").click();
  await back(page);
  await rows.first().click();
  await expect(chips(page)).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^Remove Player filter/ })).toBeVisible();
  await expect(page.getByTestId("shown")).toHaveText("Showing 2");
});

test("Top players: six tiles stay visible at phone size", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seed(page, [{ cardNumber: "1", player: "Aaron Judge" }]);
  for (const t of await page.getByTestId("tile").all()) await expect(t).toBeInViewport();
});

test("Recently added: newest four first, editing does not reorder, open and back", async ({ page }) => {
  const day = (n: number) => `2026-02-0${n}T00:00:00.000Z`;
  await seed(page, [1, 2, 3, 4, 5, 6].map((n) => ({ cardNumber: String(n), player: `Player ${n}`, createdAt: day(n), updatedAt: n === 1 ? "2026-03-01T00:00:00.000Z" : day(n) })));
  const names = () => page.getByTestId("recent").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")!.split(",")[0]));
  await expect(page.getByTestId("recent")).toHaveCount(4);
  expect(await names()).toEqual(["Player 6", "Player 5", "Player 4", "Player 3"]);
  await page.getByTestId("recent").first().click();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await back(page);
  await onDashboard(page);
  await expect(page.getByTestId("recent")).toHaveCount(4);
});

test("No Browse collection button; a tile and the Cards tab both reach the list", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", flags: { rookie: false, autograph: false, relic: true } }, { cardNumber: "2" }]);
  await expect(page.getByRole("button", { name: "Browse collection" })).toHaveCount(0);
  await tile(page, "Relics").click();
  await expect(page.getByTestId("shown")).toHaveText("Showing 1");
  await back(page);
  await cardsTab(page).click();
  await expect(page.getByTestId("shown")).toBeVisible();
});

test("Add from the dashboard returns to the dashboard with the count up by the quantity", async ({ page }) => {
  await seed(page, [{ cardNumber: "1" }]);
  await expect(tile(page, "Cards")).toHaveAccessibleName("Cards, 1");
  await page.getByRole("button", { name: "Add card" }).click();
  await page.getByLabel("Player", { exact: true }).fill("Hank Aaron");
  await page.getByLabel("Year", { exact: true }).fill("1957");
  await page.getByLabel("Set", { exact: true }).fill("Topps");
  await page.getByLabel("Card number", { exact: true }).fill("20");
  await page.getByLabel("Quantity", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(tile(page, "Cards")).toHaveAccessibleName("Cards, 4");
  await expect(tile(page, "Distinct")).toHaveAccessibleName("Distinct, 2");
  await expect(page.getByTestId("recent").first()).toHaveAccessibleName(/^Hank Aaron,/);
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
  await cardsTab(page).click();
  await page.getByTestId("card-row").first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("alertdialog", { name: "Delete card" }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByTestId("shown")).toBeVisible();
  await back(page);
  await expect(tile(page, "Autos")).toHaveAccessibleName("Autos, 1");
});

test("Back to the dashboard from the list, which has no Back button", async ({ page }) => {
  await cardsTab(page).click();
  await expect(page.getByRole("button", { name: "Back", exact: true })).toHaveCount(0);
  await back(page);
  await onDashboard(page);
});

test("Filters survive opening a card and going back", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", flags: AUTO }, { cardNumber: "2", flags: AUTO }, { cardNumber: "3" }]);
  await tile(page, "Autos").click();
  await page.getByTestId("card-row").first().click();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await back(page);
  await expect(page.getByRole("button", { name: /^Remove Autograph filter/ })).toBeVisible();
  await expect(page.getByTestId("shown")).toHaveText("Showing 2");
});

test("Screen reader name holds the label and the number", async ({ page }) => {
  await seed(page, [{ cardNumber: "1", flags: AUTO }]);
  await expect(page.getByRole("button", { name: "Autos, 1" })).toBeVisible();
});
