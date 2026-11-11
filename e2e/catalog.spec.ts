import { expect, test, type Page } from "@playwright/test";
import { openCollection } from "./helpers";

interface Draft {
  player?: string;
  team?: string;
  year?: string;
  set?: string;
  subset?: string;
  insert?: string;
  cardNumber?: string;
  parallel?: string;
  serial?: string;
  serialUnreadable?: boolean;
  printRun?: string;
  rookie?: boolean;
  graded?: { company: string; grade: string };
  quantity?: string;
  notes?: string;
}

const base: Draft = { player: "Ronald Acuña Jr.", year: "2024", set: "Series 1", cardNumber: "27" };

async function fill(page: Page, label: string, value?: string) {
  if (value !== undefined) await page.getByLabel(label, { exact: true }).fill(value);
}

async function fillCard(page: Page, draft: Draft) {
  await fill(page, "Player", draft.player);
  await fill(page, "Team", draft.team);
  await fill(page, "Year", draft.year);
  await fill(page, "Set", draft.set);
  await fill(page, "Subset", draft.subset);
  await fill(page, "Insert", draft.insert);
  await fill(page, "Card number", draft.cardNumber);
  await fill(page, "Parallel", draft.parallel);
  await fill(page, "Serial", draft.serial);
  if (draft.serialUnreadable) await page.getByLabel("Serial unreadable", { exact: true }).check();
  await fill(page, "Print run", draft.printRun);
  if (draft.rookie) await page.getByLabel("Rookie", { exact: true }).check();
  if (draft.graded) {
    await page.getByLabel("Graded", { exact: true }).check();
    await fill(page, "Grading company", draft.graded.company);
    await fill(page, "Grade", draft.graded.grade);
  }
  await fill(page, "Quantity", draft.quantity);
  await fill(page, "Notes", draft.notes);
}

async function tryAddCard(page: Page, draft: Draft) {
  await page.getByRole("button", { name: "Add card" }).click();
  await fillCard(page, draft);
  await page.getByRole("button", { name: "Save" }).click();
}

async function addCard(page: Page, draft: Draft) {
  await tryAddCard(page, draft);
  await expect(page.getByRole("button", { name: "Add card" })).toBeVisible();
}

async function openFilters(page: Page) {
  await page.getByRole("button", { name: /^Filter/ }).click();
}

const rows = (page: Page) => page.getByTestId("card-row");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await openCollection(page);
});

test("Minimum card: player, year, set and card number are enough", async ({ page }) => {
  await addCard(page, base);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Ronald Acuña Jr.");
});

test("Missing required field: card is not saved and the fields are highlighted", async ({ page }) => {
  await tryAddCard(page, {});
  for (const label of ["Player", "Year", "Set", "Card number"]) {
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute("aria-invalid", "true");
  }
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(rows(page)).toHaveCount(0);
});

test("Readable serial number displays as 23/2026", async ({ page }) => {
  await addCard(page, { ...base, parallel: "Gold", serial: "23", printRun: "2026" });
  await expect(rows(page).first()).toContainText("23/2026");
});

test("Unreadable serial number displays as ?/99 and matches the print run filter", async ({ page }) => {
  await addCard(page, { ...base, parallel: "Gold", serialUnreadable: true, printRun: "99" });
  await addCard(page, { ...base, cardNumber: "28", parallel: "Blue", serial: "5", printRun: "150" });
  await expect(rows(page).first()).toContainText("?/99");
  await openFilters(page);
  await page.getByLabel("Print run", { exact: true }).fill("99");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("?/99");
});

test("Serial above print run: card is not saved and the serial field shows an error", async ({ page }) => {
  await tryAddCard(page, { ...base, parallel: "Gold", serial: "100", printRun: "99" });
  await expect(page.getByLabel("Serial", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(rows(page)).toHaveCount(0);
});

test("Graded card displays PSA 9 and hides raw condition", async ({ page }) => {
  await page.getByRole("button", { name: "Add card" }).click();
  await fillCard(page, { ...base, graded: { company: "PSA", grade: "9" } });
  await expect(page.getByLabel("Condition", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(rows(page).first()).toContainText("PSA 9");
});

test("Add a duplicate offers to increase the existing quantity", async ({ page }) => {
  await addCard(page, base);
  await tryAddCard(page, base);
  await page.getByRole("dialog").getByRole("button", { name: "Increase quantity" }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("×2");
});

test("Edit a card updates the notes and the last-edited time", async ({ page }) => {
  await addCard(page, base);
  await rows(page).first().click();
  const before = await page.getByTestId("updated").getAttribute("datetime");
  await page.waitForTimeout(20);
  await page.getByRole("button", { name: "Edit" }).click();
  await fill(page, "Notes", "Great condition");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Great condition")).toBeVisible();
  expect(await page.getByTestId("updated").getAttribute("datetime")).not.toBe(before);
});

test("Delete a card removes it after confirmation", async ({ page }) => {
  await addCard(page, base);
  await rows(page).first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByTestId("shown")).toHaveText("Showing 0");
});

test("Text search ignores case and accents", async ({ page }) => {
  await addCard(page, base);
  await addCard(page, { ...base, player: "Mookie Betts", cardNumber: "50" });
  await page.getByLabel("Search", { exact: true }).fill("ACUNA");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Ronald Acuña Jr.");
});

test("Combined filters list only cards matching all of them, with a count", async ({ page }) => {
  const braves = { ...base, team: "Atlanta Braves", parallel: "Gold", serial: "1", printRun: "50" };
  await addCard(page, braves);
  await addCard(page, { ...braves, cardNumber: "28", year: "2021" });
  await addCard(page, { ...braves, cardNumber: "29", year: "2019" });
  await addCard(page, { ...braves, cardNumber: "30", team: "Boston Red Sox" });
  await addCard(page, { ...braves, cardNumber: "31", parallel: undefined, serial: undefined, printRun: undefined });
  await openFilters(page);
  await page.getByLabel("Team", { exact: true }).selectOption({ label: "Atlanta Braves" });
  await page.getByLabel("Serial-numbered", { exact: true }).check();
  await page.getByLabel("Year from", { exact: true }).fill("2020");
  await page.getByLabel("Year to", { exact: true }).fill("2026");
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByTestId("shown")).toHaveText("Showing 2");
});

test("Subset and insert", async ({ page }) => {
  await addCard(page, { ...base, set: "Topps", subset: "Future Stars", insert: "Stars of MLB" });
  await rows(page).first().click();
  const facts = page.getByTestId("facts");
  await expect(facts).toContainText("Subset");
  await expect(facts).toContainText("Future Stars");
  await expect(facts).toContainText("Insert");
  await expect(facts).toContainText("Stars of MLB");
});

test("Subset and insert are optional", async ({ page }) => {
  await addCard(page, base);
  await rows(page).first().click();
  await expect(page.getByTestId("facts")).not.toContainText("Subset");
  await expect(page.getByTestId("facts")).not.toContainText("Insert");
});

test("Old local card edited after the update", async ({ page }) => {
  await page.evaluate(async () => {
    const { makeCard } = await import("/src/domain/fixtures.ts");
    const old: Record<string, unknown> = makeCard({ player: "Old Timer" });
    delete old.subset;
    delete old.insert;
    await (window as unknown as { __ports: any }).__ports.collection.putMany([old]);
  });
  await page.reload();
  await openCollection(page);
  await rows(page).first().click();
  await page.getByRole("button", { name: "Edit" }).click();
  await fill(page, "Insert", "Stars of MLB");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("facts")).toContainText("Stars of MLB");
});

test("Filter by insert", async ({ page }) => {
  await addCard(page, { ...base, insert: "Stars of MLB" });
  await addCard(page, { ...base, cardNumber: "28", insert: "Other" });
  await addCard(page, { ...base, cardNumber: "29" });
  await openFilters(page);
  await page.getByLabel("Insert", { exact: true }).selectOption({ label: "Stars of MLB" });
  await expect(rows(page)).toHaveCount(1);
  await page.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
  await expect(page.getByRole("button", { name: /^Remove Insert filter/ })).toBeVisible();
});

test("Filter by player", async ({ page }) => {
  await addCard(page, base);
  await addCard(page, { ...base, player: "Mookie Betts", cardNumber: "28", notes: "acuna lot" });
  await openFilters(page);
  await page.getByLabel("Player", { exact: true }).fill("acuna");
  await expect(rows(page)).toHaveCount(1);
  await page.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
  await expect(page.getByRole("button", { name: /^Remove Player filter/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Filter, 1 applied", exact: true })).toBeVisible();
});

test("A player filter of only spaces shows no chip and no badge", async ({ page }) => {
  await addCard(page, base);
  await openFilters(page);
  await page.getByLabel("Player", { exact: true }).fill("   ");
  await page.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
  await expect(page.getByRole("button", { name: /^Remove Player filter/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Filter", exact: true })).toBeVisible();
});

test("Clear all clears the player filter and keeps search", async ({ page }) => {
  await addCard(page, base);
  await page.getByPlaceholder("Search").fill("series");
  await openFilters(page);
  await page.getByLabel("Player", { exact: true }).fill("acuna");
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByLabel("Player", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
  await expect(page.getByPlaceholder("Search")).toHaveValue("series");
});

test("Filter by manufacturer", async ({ page }) => {
  await page.evaluate(async () => {
    const { makeCard } = await import("/src/domain/fixtures.ts");
    const cards = [makeCard({ manufacturer: "Topps" }), makeCard({ manufacturer: "Bowman", cardNumber: "2" })];
    await (window as unknown as { __ports: any }).__ports.collection.putMany(cards);
  });
  await page.reload();
  await openCollection(page);
  await openFilters(page);
  await page.getByLabel("Manufacturer", { exact: true }).selectOption({ label: "Topps" });
  await expect(rows(page)).toHaveCount(1);
  await page.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
  await expect(page.getByRole("button", { name: /^Remove Manufacturer filter/ })).toBeVisible();
});

test("Totals count quantity and distinct cards", async ({ page }) => {
  await addCard(page, { ...base, quantity: "3" });
  await addCard(page, { ...base, cardNumber: "28" });
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cards, 4" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Distinct, 2" })).toBeVisible();
});
