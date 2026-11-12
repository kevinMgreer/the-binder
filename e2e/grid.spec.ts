import { expect, test, type Locator, type Page } from "@playwright/test";
import { hardwareBack, openCollection } from "./helpers";

type Win = { __ports: any };
/** `photo` is the width and height of a front photo to store for the card. */
type Item = Record<string, unknown> & { photo?: [number, number] };

async function seed(page: Page, items: Item[]) {
  await page.evaluate(async (list) => {
    const ports = (window as unknown as Win).__ports;
    const { makeCard } = await import("/src/domain/fixtures.ts");
    const cards = [];
    for (const { photo, ...fields } of list) {
      const card = makeCard(photo ? { ...fields, photos: { front: { fileId: "f", thumbId: "t" }, back: null } } : fields);
      if (photo) {
        const canvas = new OffscreenCanvas(photo[0], photo[1]);
        canvas.getContext("2d")!.fillRect(0, 0, photo[0], photo[1]);
        const blob = await canvas.convertToBlob({ type: "image/webp" });
        await ports.photos.cacheThumb(card.id, "front", blob);
        await ports.photos.cacheFull(card.id, "front", blob);
      }
      cards.push(card);
    }
    await ports.collection.putSynced(cards);
  }, items);
  await page.reload();
  await openCollection(page);
}

const names = (n: number): Item[] => Array.from({ length: n }, (_, i) => ({ player: `Player ${String.fromCharCode(65 + i)}`, cardNumber: String(i + 1) }));
const tiles = (page: Page) => page.getByTestId("card-tile");
const gridView = (page: Page) => page.getByRole("button", { name: "Grid view", exact: true });
const listView = (page: Page) => page.getByRole("button", { name: "List view", exact: true });
const order = (page: Page) => page.getByTestId("order");
const chooseOrder = async (page: Page, by: string, direction: string) => {
  await page.getByRole("button", { name: /^Filter and sort/ }).click();
  const sheet = page.getByRole("dialog", { name: "Filter and sort" });
  await sheet.getByRole("radio", { name: by, exact: true }).check();
  await sheet.getByRole("radio", { name: direction }).check();
  return sheet;
};
const box = async (loc: Locator) => (await loc.boundingBox())!;
const ratioOf = async (loc: Locator) => {
  const b = await box(loc);
  return b.width / b.height;
};
const near = (actual: number, expected: number) => expect(Math.abs(actual / expected - 1)).toBeLessThan(0.02);
const gridNames = (page: Page) => page.locator(".grid-name").allTextContents();

test.use({ viewport: { width: 360, height: 800 } });

test("Toggle shares the Showing line: 5,000 cards, count and order on one line, 8 dp before the toggle, nothing past the content edge", async ({ page }) => {
  await page.goto("/?seed=5000");
  await openCollection(page);
  const row = await box(page.locator(".shown-row"));
  // The text's own extent, not the paragraph's box: a word wider than its box spills out of it.
  const text = await page.locator("p.shown").evaluate((p) => {
    const range = document.createRange();
    range.selectNodeContents(p.querySelector("[data-testid=shown]")!);
    const count = range.getBoundingClientRect();
    range.selectNodeContents(p.querySelector("[aria-hidden]")!);
    const rects = [...range.getClientRects()];
    const x = count.left;
    return { x, width: Math.max(...rects.map((r) => r.right)) - x, lines: new Set([...rects].map((r) => Math.round(r.top))).size + (Math.abs(count.top - rects[0].top) > 2 ? 1 : 0) };
  });
  const toggle = await box(gridView(page));
  await expect(page.locator("p.shown")).toContainText("Showing 5000 · Last name ↑");
  await expect(page.getByRole("button", { name: /^Sort/ })).toHaveCount(0);
  expect(text.lines).toBe(1);
  expect(toggle.y).toBeGreaterThanOrEqual(row.y - 0.5);
  expect(toggle.y + toggle.height).toBeLessThanOrEqual(row.y + row.height + 0.5);
  expect(toggle.x - (text.x + text.width)).toBeGreaterThanOrEqual(7.5);
  expect(toggle.x + toggle.width).toBeLessThanOrEqual(360 - 24 + 0.5);
  console.log("showing-row widths", JSON.stringify({ text: text.width, toggle: toggle.width, content: 312 }));
});

test("Toggle targets: the view button is at least 48 dp in both views", async ({ page }) => {
  await page.goto("/");
  await seed(page, names(2));
  for (const flip of [gridView, listView]) {
    const { width, height } = await box(flip(page));
    expect(width).toBeGreaterThanOrEqual(47.5);
    expect(height).toBeGreaterThanOrEqual(47.5);
    await flip(page).click();
  }
});

test("Default is List, and Grid view switches to tiles in the same order and count", async ({ page }) => {
  await page.goto("/");
  await seed(page, names(4));
  await expect(gridView(page)).toBeVisible();
  await expect(listView(page)).toHaveCount(0);
  await expect(page.getByTestId("card-row")).toHaveCount(4);
  await expect(tiles(page)).toHaveCount(0);
  await gridView(page).click();
  await expect(listView(page)).toBeVisible();
  await expect(gridView(page)).toHaveCount(0);
  await expect(page.getByTestId("card-row")).toHaveCount(0);
  expect(await gridNames(page)).toEqual(["Player A", "Player B", "Player C", "Player D"]);
  await expect(page.getByTestId("shown")).toHaveText("Showing 4");
  await listView(page).click();
  await expect(page.getByTestId("card-row")).toHaveCount(4);
});

test("Filters, search and sort apply in Grid view", async ({ page }) => {
  await page.goto("/");
  await seed(page, [
    { player: "Ronald Acuña Jr.", team: "Atlanta Braves", year: 2019 },
    { player: "Ronald Acuña Jr.", team: "Atlanta Braves", year: 2024 },
    { player: "Freddie Freeman", team: "Atlanta Braves", year: 2021 },
    { player: "Ronald Acuña Jr.", team: "Texas Rangers", year: 2022 },
  ]);
  await gridView(page).click();
  await page.getByLabel("Search", { exact: true }).fill("acu");
  const sheet = await chooseOrder(page, "Year", "Descending");
  await page.getByLabel("Team", { exact: true }).selectOption("Atlanta Braves");
  await sheet.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
  await expect(page.getByRole("button", { name: "Remove Team filter: Atlanta Braves" })).toBeVisible();
  await expect(tiles(page)).toHaveCount(2);
  await expect(page.locator(".grid-year")).toHaveText(["2024", "2019"]);
  await expect(page.getByTestId("shown")).toHaveText("Showing 2");
});

test("Empty and no-match in Grid view keep the toggle", async ({ page }) => {
  await page.goto("/");
  await openCollection(page);
  await gridView(page).click();
  await expect(page.getByTestId("empty-state")).toHaveText("Your binder is empty. Scan a card or add one by hand.");
  await expect(listView(page)).toBeVisible();
  await page.evaluate(async () => {
    const { makeCard } = await import("/src/domain/fixtures.ts");
    await (window as unknown as Win).__ports.collection.putSynced([makeCard()]);
  });
  await page.reload();
  await openCollection(page);
  await expect(listView(page)).toBeVisible();
  await page.getByLabel("Search", { exact: true }).fill("zzz");
  await expect(page.getByTestId("no-match")).toHaveText("No cards match. Clear the search or a filter.");
  await expect(listView(page)).toBeVisible();
});

test("Kept while the app runs: Grid survives a card, back and the dashboard", async ({ page }) => {
  await page.goto("/");
  await seed(page, names(3));
  await gridView(page).click();
  await tiles(page).first().click();
  await hardwareBack(page);
  await expect(listView(page)).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Dashboard", exact: true }).click();
  await openCollection(page);
  await expect(listView(page)).toBeVisible();
  await expect(tiles(page)).toHaveCount(3);
});

test("Three columns on a phone: a shared top edge, equal widths, inside the gutters", async ({ page }) => {
  await page.goto("/");
  await seed(page, names(7));
  await gridView(page).click();
  const boxes = await Promise.all((await tiles(page).all()).map(box));
  expect(boxes).toHaveLength(7);
  for (const b of boxes.slice(1, 3)) expect(Math.abs(b.y - boxes[0].y)).toBeLessThan(0.5);
  for (const b of boxes) expect(Math.abs(b.width - boxes[0].width)).toBeLessThan(1);
  expect(boxes[3].y).toBeGreaterThan(boxes[0].y + 50);
  expect(Math.abs(boxes[3].x - boxes[0].x)).toBeLessThan(0.5);
  expect(boxes[0].x).toBeGreaterThanOrEqual(23.5);
  for (const b of boxes) expect(b.x + b.width).toBeLessThanOrEqual(360 - 24 + 0.5);
});

test.describe("on a wider screen", () => {
  test.use({ viewport: { width: 600, height: 800 } });

  test("Four columns: the fifth tile starts the second row", async ({ page }) => {
    await page.goto("/");
    await seed(page, names(9));
    await gridView(page).click();
    const boxes = await Promise.all((await tiles(page).all()).map(box));
    for (const b of boxes.slice(1, 4)) expect(Math.abs(b.y - boxes[0].y)).toBeLessThan(0.5);
    expect(boxes[4].y).toBeGreaterThan(boxes[0].y + 50);
    expect(Math.abs(boxes[4].x - boxes[0].x)).toBeLessThan(0.5);
  });
});

test("Tile content, frames, placeholder, long name and tap", async ({ page }) => {
  await page.goto("/");
  await seed(page, [
    { player: "Mookie Betts", year: 2024, set: "Topps Chrome", cardNumber: "27", quantity: 3, photo: [320, 448] },
    { player: "Landscape Lou", year: 2020, set: "Heritage", cardNumber: "5", photo: [448, 320] },
    { player: "Plain Pam", year: 2018, set: "Donruss", cardNumber: "" },
    { player: "Alexander Hamilton-Montgomery-Wellington III", year: 2017, set: "Stadium Club", cardNumber: "9" },
  ]);
  await gridView(page).click();
  const tile = (name: string) => tiles(page).filter({ hasText: name });
  const betts = tile("Mookie Betts");
  await expect(betts.locator("img")).toBeVisible();
  near(await ratioOf(betts.locator(".frame")), 2.5 / 3.5);
  await expect(betts.locator(".grid-name")).toHaveText("Mookie Betts");
  await expect(betts.locator(".grid-year")).toHaveText("2024");
  await expect(betts.locator(".badge")).toHaveText("×3");
  await expect(betts.getByRole("button", { name: "Mookie Betts, 2024 Topps Chrome, number 27, 3 copies" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Plain Pam, 2018 Donruss", exact: true })).toBeVisible();
  await expect(tile("Plain Pam").locator(".badge")).toHaveCount(0);

  const lou = tile("Landscape Lou");
  await expect(lou.locator(".frame")).toHaveAttribute("data-orientation", "landscape");
  near(await ratioOf(lou.locator(".frame")), 3.5 / 2.5);
  near(await ratioOf(lou.locator("img")), 448 / 320);
  expect(Math.abs((await box(lou)).height - (await box(betts)).height)).toBeLessThan(1);

  const pam = tile("Plain Pam");
  near(await ratioOf(pam.locator(".frame")), 2.5 / 3.5);
  await expect(pam.locator(".grid-name")).toHaveText("Plain Pam");

  const long = tile("Alexander").locator(".grid-name");
  const overflow = await long.evaluate((el) => ({ clipped: el.scrollWidth > el.clientWidth, ellipsis: getComputedStyle(el).textOverflow, height: el.getBoundingClientRect().height }));
  expect(overflow.clipped).toBe(true);
  expect(overflow.ellipsis).toBe("ellipsis");
  expect(overflow.height).toBeCloseTo((await box(pam.locator(".grid-name"))).height, 0);
  expect(Math.abs((await box(tile("Alexander"))).height - (await box(betts)).height)).toBeLessThan(1);

  await expect(page.getByRole("list").getByRole("listitem")).toHaveCount(4);
  expect(await tiles(page).evaluateAll((els) => els.every((el) => el.parentElement!.getAttribute("role") === "list"))).toBe(true);

  await betts.getByRole("button").click();
  await expect(page.getByRole("heading", { name: "Mookie Betts" })).toBeVisible();
});

for (const scheme of ["light", "dark"] as const) {
  test(`Both themes: ${scheme} tiles have no gradient, shadow or translucency, and legible captions`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await seed(page, [{ player: "Mookie Betts", quantity: 2, photo: [320, 448] }, { player: "Plain Pam" }]);
    await gridView(page).click();
    await expect(tiles(page)).toHaveCount(2);
    const found = await page.evaluate(() => {
      const channels = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
      const lum = (c: string) => {
        const [r, g, b] = channels(c).slice(0, 3).map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const contrast = (a: string, b: string) => {
        const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
      };
      const ground = getComputedStyle(document.body).backgroundColor;
      const bad: string[] = [];
      for (const el of document.querySelectorAll("[data-testid=card-tile], [data-testid=card-tile] button, [data-testid=card-tile] .frame")) {
        const s = getComputedStyle(el);
        if (s.backgroundImage !== "none") bad.push(`${el.className} gradient`);
        if (s.boxShadow !== "none") bad.push(`${el.className} shadow`);
        const alpha = channels(s.backgroundColor)[3] ?? 1;
        if (alpha !== 0 && alpha !== 1) bad.push(`${el.className} translucent`);
      }
      for (const el of document.querySelectorAll(".grid-name, .grid-year")) {
        if (contrast(getComputedStyle(el).color, ground) < 4.5) bad.push(`${el.className} contrast`);
      }
      return bad;
    });
    expect(found).toEqual([]);
  });
}

test("Last tile reachable: a grid of 20 cards scrolls its last tile and caption clear of the bar", async ({ page }) => {
  await page.goto("/");
  await seed(page, names(20));
  await gridView(page).click();
  await page.locator(".list-scroller").evaluate((el) => (el.scrollTop = el.scrollHeight));
  const last = tiles(page).filter({ hasText: "Player T" });
  await expect(last).toBeVisible();
  const nav = await box(page.getByRole("navigation", { name: "Main" }));
  const b = await box(last);
  expect(b.y + b.height).toBeLessThanOrEqual(nav.y + 0.5);
  await last.getByRole("button").click();
  await expect(page.getByRole("heading", { name: "Player T" })).toBeVisible();
});

test("Only nearby tiles exist: under 100 of 5,000, at the top and in the middle", async ({ page }) => {
  await page.goto("/?seed=5000");
  await openCollection(page);
  await gridView(page).click();
  await expect(tiles(page).first()).toBeVisible();
  expect(await tiles(page).count()).toBeLessThan(100);
  await page.locator(".list-scroller").evaluate((el) => (el.scrollTop = el.scrollHeight / 2));
  await expect.poll(() => tiles(page).first().getAttribute("data-index").then(Number)).toBeGreaterThan(1500);
  expect(await tiles(page).count()).toBeLessThan(100);
  // Each rendered tile shows the card at its index in the default order.
  const mismatches = await page.evaluate(async () => {
    const ports = (window as unknown as Win).__ports;
    const { sortCards } = await import("/src/domain/query.ts");
    const sorted = sortCards(await ports.collection.list());
    return [...document.querySelectorAll("[data-testid=card-tile]")].filter((li) => {
      const card = sorted[Number(li.getAttribute("data-index"))];
      return li.querySelector(".grid-name")!.textContent !== card.player;
    }).length;
  });
  expect(mismatches).toBe(0);
  const inView = await page.evaluate(() => {
    const s = document.querySelector(".list-scroller")!.getBoundingClientRect();
    return [...document.querySelectorAll("[data-testid=card-tile]")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > s.top && r.top < s.bottom;
    }).length;
  });
  expect(inView).toBeGreaterThanOrEqual(6);
});

test("Kept after a relaunch, Sort still resets", async ({ page }) => {
  await page.goto("/");
  await seed(page, names(3));
  await gridView(page).click();
  const sheet = await chooseOrder(page, "Team", "Descending");
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(order(page)).toContainText("· Team ↓");
  await page.reload();
  await openCollection(page);
  await expect(listView(page)).toBeVisible();
  await expect(tiles(page)).toHaveCount(3);
  await expect(order(page)).toContainText("· Last name ↑");
});

test("Storage unavailable: List at first, Grid on a tap, no error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get: () => { throw new Error("denied"); } }));
  await page.goto("/");
  await seed(page, names(3));
  await expect(gridView(page)).toBeVisible();
  await expect(page.getByTestId("card-row")).toHaveCount(3);
  await gridView(page).click();
  await expect(tiles(page)).toHaveCount(3);
  expect(errors).toEqual([]);
});

const many = (n: number): Item[] => Array.from({ length: n }, (_, i) => ({ player: `Player ${String(i + 1).padStart(3, "0")}`, cardNumber: String(i + 1) }));

/** Scrolls down, opens a card far from the top, presses back; returns its name. */
async function openFarAndBack(page: Page, item: Locator) {
  await page.locator(".list-scroller").evaluate((el) => (el.scrollTop = el.scrollHeight * 0.7));
  await expect.poll(() => item.first().getAttribute("data-index").then(Number)).toBeGreaterThan(50);
  const target = item.nth(Math.floor((await item.count()) / 2));
  const name = (await target.locator(".grid-name, .player").first().textContent())!;
  await item.filter({ hasText: name }).getByRole("button").click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await hardwareBack(page);
  return name;
}

async function expectBackOn(page: Page, item: Locator, name: string) {
  const back = item.filter({ hasText: name });
  await expect(back).toHaveCount(1);
  const s = await box(page.locator(".list-scroller"));
  const b = await box(back);
  expect(b.y).toBeGreaterThanOrEqual(s.y - 0.5);
  expect(b.y + b.height).toBeLessThanOrEqual(s.y + s.height + 0.5);
  await expect.poll(() => back.evaluate((el) => el.contains(document.activeElement))).toBe(true);
}

test("Back to a tile far down the grid", async ({ page }) => {
  await page.goto("/");
  await seed(page, many(200));
  await gridView(page).click();
  const name = await openFarAndBack(page, tiles(page));
  await expect(listView(page)).toBeVisible();
  await expectBackOn(page, tiles(page), name);
});

test("Back to a row far down the list", async ({ page }) => {
  await page.goto("/");
  await seed(page, many(200));
  const name = await openFarAndBack(page, page.getByTestId("card-row"));
  await expect(gridView(page)).toBeVisible();
  await expectBackOn(page, page.getByTestId("card-row"), name);
});

test("Deleted card: back to the top of the grid without it", async ({ page }) => {
  await page.goto("/");
  await seed(page, many(40));
  await gridView(page).click();
  await page.locator(".list-scroller").evaluate((el) => (el.scrollTop = el.scrollHeight * 0.7));
  const target = tiles(page).nth(Math.floor((await tiles(page).count()) / 2));
  const name = (await target.locator(".grid-name").textContent())!;
  await target.getByRole("button").click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("alertdialog", { name: "Delete card" }).getByRole("button", { name: "Delete" }).click();
  await expect(listView(page)).toBeVisible();
  await expect(page.getByTestId("shown")).toHaveText("Showing 39");
  await expect(tiles(page).filter({ hasText: name })).toHaveCount(0);
  expect(await page.locator(".list-scroller").evaluate((el) => el.scrollTop)).toBe(0);
  await expect(tiles(page).first()).toContainText("Player 001");
  expect(await page.evaluate(() => !!document.activeElement?.closest("[data-testid=card-tile]"))).toBe(false);
});

for (const [start, item] of [["list", (p: Page) => p.getByTestId("card-row")], ["grid", tiles]] as const) {
  test(`After back, the view button starts the other view at the top and keeps focus (${start})`, async ({ page }) => {
    await page.goto("/");
    await seed(page, many(200));
    if (start === "grid") await gridView(page).click();
    const name = await openFarAndBack(page, item(page));
    await expectBackOn(page, item(page), name);
    await (start === "grid" ? listView(page) : gridView(page)).click();
    await expect(start === "grid" ? page.getByTestId("card-row").first() : tiles(page).first()).toContainText("Player 001");
    expect(await page.locator(".list-scroller").evaluate((el) => el.scrollTop)).toBe(0);
    await expect(start === "grid" ? gridView(page) : listView(page)).toBeFocused();
  });
}

test("After back, clearing a no-match search keeps focus in the search field", async ({ page }) => {
  await page.goto("/");
  await seed(page, many(200));
  const name = await openFarAndBack(page, page.getByTestId("card-row"));
  await expectBackOn(page, page.getByTestId("card-row"), name);
  const search = page.getByLabel("Search", { exact: true });
  await search.fill("zzz");
  await expect(page.getByTestId("no-match")).toBeVisible();
  await search.fill("");
  await expect(page.getByTestId("card-row").first()).toBeVisible();
  await expect(search).toBeFocused();
});
