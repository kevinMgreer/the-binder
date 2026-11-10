import { expect, test, type Page } from "@playwright/test";
import { openCollection } from "./helpers";

type Win = { __ports: any };

async function setNextPhoto(page: Page) {
  await page.evaluate(async () => {
    const canvas = new OffscreenCanvas(800, 600);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#357";
    ctx.fillRect(0, 0, 800, 600);
    (window as unknown as Win).__ports.photoSource.next = await canvas.convertToBlob({ type: "image/jpeg" });
  });
}

async function configure(page: Page, which: "ocr" | "claude", result: object) {
  await page.evaluate(({ which, result }) => {
    (window as unknown as Win).__ports[which].result = result;
  }, { which, result });
}

async function scanFront(page: Page) {
  await setNextPhoto(page);
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await page.getByRole("button", { name: "Scan front" }).click();
  await expect(page.getByAltText("Front photo")).toBeVisible();
}

const calls = (page: Page, which: "ocr" | "claude") =>
  page.evaluate((which) => (window as unknown as Win).__ports[which].calls as number, which);
const field = (page: Page, label: string) => page.getByLabel(label, { exact: true });
const hint = (page: Page, id: string) => page.getByTestId(`hint-f-${id}`);

const goldParallel = {
  player: "Ronald Acuña Jr.",
  team: "Atlanta Braves",
  year: 2024,
  manufacturer: "Topps",
  set: "Series 1",
  cardNumber: "27",
  parallel: { name: "Gold", serial: 23, serialLegible: true, printRun: 2026 },
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Scan a base card: year, number and set are pre-filled and marked as suggestions", async ({ page }) => {
  await configure(page, "ocr", { year: 2024, cardNumber: "27", set: "Series 1" });
  await scanFront(page);
  await expect(field(page, "Year")).toHaveValue("2024");
  await expect(field(page, "Card number")).toHaveValue("27");
  await expect(field(page, "Set")).toHaveValue("Series 1");
  for (const id of ["year", "card-number", "set"]) await expect(hint(page, id)).toContainText("Suggested");
  await expect(field(page, "Player")).toHaveValue("");
  await expect(hint(page, "player")).toHaveCount(0);
});

test("Nothing recognized: the form opens empty with a message offering Identify with Claude", async ({ page }) => {
  await configure(page, "ocr", {});
  await scanFront(page);
  await expect(page.getByRole("status")).toContainText("Identify with Claude");
  await expect(field(page, "Year")).toHaveValue("");
  await expect(field(page, "Player")).toHaveValue("");
});

test("On-device recognition still runs offline", async ({ page, context }) => {
  await configure(page, "ocr", { year: 2024, cardNumber: "27" });
  // In the APK the image worker ships inside the app; the dev server must serve it before going offline.
  await page.evaluate(async () => {
    const { processPhoto } = await import("/src/photos/pipeline.ts");
    const canvas = new OffscreenCanvas(10, 10);
    canvas.getContext("2d")!.fillRect(0, 0, 10, 10);
    await processPhoto(await canvas.convertToBlob({ type: "image/png" }));
  });
  await context.setOffline(true);
  await scanFront(page);
  await expect(field(page, "Year")).toHaveValue("2024");
  expect(await calls(page, "ocr")).toBeGreaterThan(0);
});

test("Identify with Claude pre-fills player, team, set, number and the serial-numbered parallel", async ({ page }) => {
  await configure(page, "ocr", {});
  await configure(page, "claude", goldParallel);
  await scanFront(page);
  await page.getByRole("button", { name: "Identify with Claude" }).click();
  await expect(field(page, "Player")).toHaveValue("Ronald Acuña Jr.");
  await expect(field(page, "Team")).toHaveValue("Atlanta Braves");
  await expect(field(page, "Year")).toHaveValue("2024");
  await expect(field(page, "Set")).toHaveValue("Series 1");
  await expect(field(page, "Card number")).toHaveValue("27");
  await expect(field(page, "Parallel")).toHaveValue("Gold");
  await expect(field(page, "Serial")).toHaveValue("23");
  await expect(field(page, "Print run")).toHaveValue("2026");
  await expect(hint(page, "player")).toContainText("Suggested");
  expect(await calls(page, "claude")).toBe(1);
});

test("Claude is never called unless the user taps Identify with Claude", async ({ page }) => {
  await configure(page, "ocr", { year: 2024 });
  await scanFront(page);
  await field(page, "Player").fill("Ronald Acuña Jr.");
  await field(page, "Set").fill("Series 1");
  await field(page, "Card number").fill("27");
  await page.getByRole("button", { name: "Save" }).click();
  await openCollection(page);
  await expect(page.getByTestId("card-row")).toHaveCount(1);
  expect(await calls(page, "claude")).toBe(0);
});

test("Identify with Claude while offline says it needs a connection and sends nothing", async ({ page, context }) => {
  await configure(page, "claude", goldParallel);
  await scanFront(page);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Identify with Claude" }).click();
  await expect(page.getByRole("status")).toContainText("needs an internet connection");
  expect(await calls(page, "claude")).toBe(0);
});

test("Identification triggers unchanged: a scan fills suggestions on device and calls Claude only on the button", async ({ page }) => {
  await configure(page, "ocr", { year: 2024, cardNumber: "27", set: "Series 1" });
  await scanFront(page);
  await expect(field(page, "Year")).toHaveValue("2024");
  await expect(hint(page, "year")).toBeVisible();
  await expect(page.getByRole("button", { name: "Identify with Claude" })).toBeVisible();
  expect(await calls(page, "claude")).toBe(0);
  await page.getByRole("button", { name: "Identify with Claude" }).click();
  await expect.poll(() => calls(page, "claude")).toBe(1);
});

test("An uncertain field is visibly flagged for review", async ({ page }) => {
  await configure(page, "claude", { ...goldParallel, lowConfidence: ["player"] });
  await scanFront(page);
  await page.getByRole("button", { name: "Identify with Claude" }).click();
  await expect(hint(page, "player")).toContainText("Check this");
  await expect(hint(page, "set")).not.toContainText("Check this");
});

test("The user's own value wins over a suggestion, and the card records where it came from", async ({ page }) => {
  await configure(page, "claude", goldParallel);
  await scanFront(page);
  await page.getByRole("button", { name: "Identify with Claude" }).click();
  await expect(field(page, "Player")).toHaveValue("Ronald Acuña Jr.");
  await field(page, "Player").fill("Ronald Acuna");
  await expect(hint(page, "player")).toHaveCount(0);
  await page.getByRole("button", { name: "Save" }).click();
  await openCollection(page);
  await expect(page.getByTestId("card-row").first()).toContainText("Ronald Acuna");
  const source = await page.evaluate(async () => (await (window as unknown as Win).__ports.collection.list())[0].source);
  expect(source).toBe("claude");
});

test("Cards record on-device recognition or manual entry as their source", async ({ page }) => {
  await configure(page, "ocr", { year: 2024, cardNumber: "27", set: "Series 1" });
  await scanFront(page);
  await field(page, "Player").fill("Ronald Acuña Jr.");
  await page.getByRole("button", { name: "Save" }).click();
  await openCollection(page);
  await expect(page.getByTestId("card-row")).toHaveCount(1);

  await page.getByRole("button", { name: "Add card" }).click();
  await field(page, "Player").fill("Mookie Betts");
  await field(page, "Year").fill("2023");
  await field(page, "Set").fill("Series 2");
  await field(page, "Card number").fill("5");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("card-row")).toHaveCount(2);

  const sources = await page.evaluate(async () =>
    Object.fromEntries((await (window as unknown as Win).__ports.collection.list()).map((c: any) => [c.player, c.source])),
  );
  expect(sources).toEqual({ "Ronald Acuña Jr.": "ocr", "Mookie Betts": "manual" });
});

test("Daily limit reached: says so and keeps on-device recognition and manual entry available", async ({ page }) => {
  await configure(page, "ocr", { year: 2024 });
  await scanFront(page);
  await page.evaluate(async () => {
    const { DailyLimitError } = await import("/src/ports/index.ts");
    (window as unknown as Win).__ports.claude.error = new DailyLimitError();
  });
  await page.getByRole("button", { name: "Identify with Claude" }).click();
  await expect(page.getByRole("status")).toContainText("daily limit");
  await expect(page.getByRole("status")).toContainText("on-device recognition");
  await expect(field(page, "Player")).toBeEnabled();
  await expect(field(page, "Year")).toHaveValue("2024");
});
