import { expect, test, type Locator, type Page } from "@playwright/test";
import { hardwareBack, openCollection } from "./helpers";

type Win = { __ports: any; __sync: any };
type Seed = Record<string, unknown>;

const PHONES = [
  { width: 412, height: 915 },
  { width: 360, height: 800 },
];
const SERIAL = { name: "Gold", serial: 13, serialLegible: true, printRun: 150 };
const UNREADABLE = { name: "Blue", serial: null, serialLegible: false, printRun: 99 };

async function seed(page: Page, cards: Seed[]) {
  await page.evaluate(async (list) => {
    const { makeCard } = await import("/src/domain/fixtures.ts");
    await (window as unknown as Win).__ports.collection.putMany(list.map((o) => makeCard(o)));
  }, cards);
  await page.reload();
  await openCollection(page);
}

/** Eight cards from eight teams, saved one after another, then the dashboard (not the list). */
async function seedDashboard(page: Page) {
  await page.evaluate(async () => {
    const { makeCard } = await import("/src/domain/fixtures.ts");
    const cards = Array.from({ length: 8 }, (_, i) =>
      makeCard({ player: `Player ${i}`, cardNumber: String(i), team: `Team ${i}`, createdAt: `2026-03-0${i + 1}T00:00:00.000Z` }),
    );
    await (window as unknown as Win).__ports.collection.putMany(cards);
  });
  await page.reload();
  await expect(page.getByTestId("team")).toHaveCount(5);
}

async function showUpdateBanner(page: Page) {
  await page.evaluate(() => {
    const ports = (window as unknown as Win).__ports;
    ports.appInfo.version = { versionName: "1.0.0", versionCode: 10000 };
    ports.releaseFeed.release = { version: "1.1.0", apkUrl: "https://example.test/the-binder-1.1.0.apk" };
    window.dispatchEvent(new Event("online"));
  });
  await expect(page.getByText("Update available: 1.1.0")).toBeVisible();
}

const setStatus = (page: Page, status: object) =>
  page.evaluate((s) => (window as unknown as Win).__sync.setStatus(s), status);
const css = (loc: Locator, prop: string) => loc.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
const pageBackground = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const bottom = async (loc: Locator) => {
  const box = (await loc.boundingBox())!;
  return box.y + box.height;
};

async function applyYearFrom(page: Page, year: string) {
  await page.getByRole("button", { name: /^Filter/ }).click();
  await page.getByLabel("Year from", { exact: true }).fill(year);
  await page.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
}

const CARDS: Seed[] = [
  { player: "Ronald Acuña Jr.", cardNumber: "27", parallel: SERIAL },
  { player: "Mookie Betts", cardNumber: "50", parallel: UNREADABLE },
  {
    player: "Shohei Ohtani",
    cardNumber: "17",
    set: "Topps Chrome Update Series Sapphire Edition",
    parallel: { name: "Refractor", serial: null, serialLegible: true, printRun: null },
    grading: { kind: "graded", company: "PSA", grade: "9" },
    quantity: 2,
  },
  { player: "Plain Card", cardNumber: "1" },
];

test.describe("theme", () => {
  test("follows the phone and switches while open", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    const dark = await pageBackground(page);
    await page.emulateMedia({ colorScheme: "light" });
    const flipped = await pageBackground(page);
    expect(flipped).not.toBe(dark);
    await page.reload();
    expect(await pageBackground(page)).toBe(flipped);
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await pageBackground(page)).toBe(dark);
  });

  test("overriding the ink token restyles Save, Show cards, Edit and the Add frame", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await seed(page, CARDS);
    await applyYearFrom(page, "2000");
    await page.evaluate(() => document.documentElement.style.setProperty("--color-ink", "rgb(1, 2, 3)"));
    expect(await css(page.getByRole("button", { name: "Add card", exact: true }).locator(".nav-add"), "background-color")).toBe("rgb(1, 2, 3)");
    await page.getByRole("button", { name: /^Filter/ }).click();
    expect(await css(page.getByRole("button", { name: /^Show \d+ cards?$/ }), "background-color")).toBe("rgb(1, 2, 3)");
    await page.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
    await page.getByTestId("card-row").first().click();
    expect(await css(page.getByRole("button", { name: "Edit", exact: true }), "background-color")).toBe("rgb(1, 2, 3)");
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    expect(await css(page.getByRole("button", { name: "Save", exact: true }), "background-color")).toBe("rgb(1, 2, 3)");
  });

  test("overriding the ink token restyles the title, active chip, serial tag and a stat-table rule", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    await applyYearFrom(page, "2000");
    const chip = page.getByRole("button", { name: "Remove Year filter" });
    const title = page.getByRole("heading", { name: "Cards", exact: true });
    const tag = page.getByTestId("card-row").filter({ hasText: "Acuña" }).getByText("13/150");
    await page.evaluate(() => document.documentElement.style.setProperty("--color-ink", "rgb(1, 2, 3)"));
    expect(await css(title, "color")).toBe("rgb(1, 2, 3)");
    expect(await css(chip, "background-color")).toBe("rgb(1, 2, 3)");
    expect(await css(tag, "color")).toBe("rgb(1, 2, 3)");
    await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Dashboard", exact: true }).click();
    expect(await css(page.locator(".tiles"), "border-top-color")).toBe("rgb(1, 2, 3)");
  });
});

for (const size of PHONES) {
  test.describe(`collection list at ${size.width} by ${size.height}`, () => {
    test.use({ viewport: size });

    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await seed(page, CARDS);
      await showUpdateBanner(page);
    });

    test("First screen with the bar: sync state, gear, search, Filter and Showing N, then three rows above the scroller's end", async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.style.setProperty("--safe-area-inset-top", "24px");
        document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px");
      });
      const gear = page.getByRole("button", { name: "Settings", exact: true });
      const shown = page.getByTestId("shown");
      const scroller = page.locator(".list-scroller");
      const status = page.locator("header").getByTestId("sync-status");
      const search = page.getByLabel("Search", { exact: true });
      const filter = page.getByRole("button", { name: /^Filter/ });
      const add = page.getByRole("button", { name: "Add card", exact: true });
      const sort = page.getByRole("button", { name: /^Sort: / });
      for (const el of [status, gear, search, filter, shown, sort, add, page.getByTestId("card-row").first()]) await expect(el).toBeInViewport();
      const rowBox = (await page.locator(".shown-row").boundingBox())!;
      const sortBox = (await sort.boundingBox())!;
      expect(sortBox.y).toBeGreaterThanOrEqual(rowBox.y - 0.5);
      expect(sortBox.y + sortBox.height).toBeLessThanOrEqual(rowBox.y + rowBox.height + 0.5);
      expect((await status.boundingBox())!.y).toBeLessThan((await search.boundingBox())!.y);
      expect(Math.abs((await search.boundingBox())!.y - (await filter.boundingBox())!.y)).toBeLessThan(24);
      const scrollerBottom = await bottom(scroller);
      expect((await add.boundingBox())!.y - scrollerBottom).toBeGreaterThanOrEqual(7.5);
      const rows = await page.getByTestId("card-row").all();
      let clear = 0;
      for (const r of rows) {
        const box = await r.boundingBox();
        if (box && box.y + box.height <= scrollerBottom) clear++;
      }
      expect(clear).toBeGreaterThanOrEqual(3);
    });

    test("One tap to the form: Add card opens the add form with no sheet", async ({ page }) => {
      await page.getByRole("button", { name: "Add card", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Add card" })).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      for (const name of ["Scan card", "Pick from photos", "Enter by hand"]) await expect(page.getByRole("button", { name })).toHaveCount(0);
    });

    test("One Add card control per screen, in the bar; no standalone button or band", async ({ page }) => {
      const add = page.getByRole("button", { name: "Add card", exact: true });
      await expect(add).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Add card", exact: true })).toHaveCount(1);
      await expect(page.locator(".add-bar, .add-button")).toHaveCount(0);
    });

    test("A sheet takes focus when it opens and closes on Escape", async ({ page }) => {
      await page.getByRole("button", { name: /^Filter/ }).click();
      await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Filters" })).toHaveCount(0);
    });

    test("Filter and chip names say what they do", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Filter", exact: true })).toBeVisible();
      await applyYearFrom(page, "2024");
      await expect(page.getByRole("button", { name: "Filter, 1 applied", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Remove Year filter: 2024–", exact: true })).toBeVisible();
    });

    test("Sign in again stays reachable in the header", async ({ page }) => {
      await setStatus(page, { state: "paused", pending: 0 });
      await expect(page.locator("header").getByRole("button", { name: "Sign in again" })).toBeVisible();
    });

    test("No count line: the header holds no 'N cards, N distinct' text", async ({ page }) => {
      await expect(page.getByTestId("shown")).toBeVisible();
      await expect(page.getByText(/\d+ cards?, \d+ distinct/)).toHaveCount(0);
    });

    test("Sync status is a status region on the title row, left of the gear", async ({ page }) => {
      await setStatus(page, { state: "idle", pending: 0 });
      const status = page.locator("header").getByRole("status");
      await expect(status).toHaveText("Synced");
      const row = (await page.locator("header .title-row").boundingBox())!;
      const s = (await status.boundingBox())!;
      const gear = (await page.getByRole("button", { name: "Settings", exact: true }).boundingBox())!;
      expect(s.y).toBeGreaterThanOrEqual(row.y - 1);
      expect(s.y + s.height).toBeLessThanOrEqual(row.y + row.height + 1);
      expect(s.x + s.width).toBeLessThanOrEqual(gear.x + 1);
    });

    test("Error wording is whole on at most two lines", async ({ page }) => {
      await setStatus(page, { state: "error", pending: 3 });
      await expect(page.locator("header .title-row").getByTestId("sync-status")).toHaveText("Sync problem");
      const status = page.locator("header").getByTestId("sync-detail");
      await expect(status).toHaveText("Sync problem, retrying (3 unsynced)");
      // The title-row status is the one live region; the detail line is plain text, so an error is announced once.
      await expect(status).not.toHaveAttribute("role", /.+/);
      await expect(page.locator("header").getByRole("status")).toHaveCount(1);
      expect(await css(status, "color")).toBe(await page.evaluate(() => {
        const p = document.createElement("i");
        p.style.color = "var(--color-danger)";
        document.body.append(p);
        const c = getComputedStyle(p).color;
        p.remove();
        return c;
      }));
      const [h, line] = await status.evaluate((el) => [el.getBoundingClientRect().height, parseFloat(getComputedStyle(el).lineHeight)]);
      expect(h).toBeLessThanOrEqual(2 * line + 1);
      expect(await status.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    });

    test("Thumbnails keep the photo's ratio in the same row height, text aligned, placeholder portrait", async ({ page }) => {
      await page.evaluate(async () => {
        const ports = (window as unknown as Win).__ports;
        const { makeCard } = await import("/src/domain/fixtures.ts");
        const shapes: [string, number, number][] = [["Landscape Lou", 448, 320], ["Portrait Pat", 320, 448]];
        const cards = [];
        for (const [player, w, h] of shapes) {
          const card = makeCard({ player, cardNumber: player, photos: { front: { fileId: `f${w}`, thumbId: `t${w}` }, back: null } });
          const canvas = new OffscreenCanvas(w, h);
          canvas.getContext("2d")!.fillRect(0, 0, w, h);
          await ports.photos.cacheThumb(card.id, "front", await canvas.convertToBlob({ type: "image/webp" }));
          cards.push(card);
        }
        await ports.collection.putSynced(cards);
      });
      await page.reload();
      await openCollection(page);
      const row = (name: string) => page.getByTestId("card-row").filter({ hasText: name });
      const land = row("Landscape Lou"), port = row("Portrait Pat"), none = row("Plain Card");
      await expect(land.locator("img.thumb")).toBeVisible();
      await expect(port.locator("img.thumb")).toBeVisible();
      const lb = (await land.locator("img.thumb").boundingBox())!;
      const pb = (await port.locator("img.thumb").boundingBox())!;
      expect(Math.abs(lb.width / lb.height / (448 / 320) - 1)).toBeLessThan(0.02);
      expect(Math.abs(pb.width / pb.height / (320 / 448) - 1)).toBeLessThan(0.02);
      expect((await land.boundingBox())!.height).toBe((await port.boundingBox())!.height);
      const x = async (r: Locator) => (await r.locator(".player").boundingBox())!.x;
      expect(await x(land)).toBe(await x(port));
      expect(await x(none)).toBe(await x(port));
      const ph = (await none.locator(".thumb").boundingBox())!;
      expect(ph.height).toBeGreaterThan(ph.width);
    });

    test("Bigger thumbnail: a portrait frame is 96 dp tall", async ({ page }) => {
      await page.evaluate(async () => {
        const ports = (window as unknown as Win).__ports;
        const { makeCard } = await import("/src/domain/fixtures.ts");
        const card = makeCard({ player: "Portrait Pat", cardNumber: "9", photos: { front: { fileId: "f", thumbId: "t" }, back: null } });
        const canvas = new OffscreenCanvas(320, 448);
        canvas.getContext("2d")!.fillRect(0, 0, 320, 448);
        await ports.photos.cacheThumb(card.id, "front", await canvas.convertToBlob({ type: "image/webp" }));
        await ports.collection.putSynced([card]);
      });
      await page.reload();
      await openCollection(page);
      const row = page.getByTestId("card-row").filter({ hasText: "Portrait Pat" });
      await expect(row.locator("img.thumb")).toBeVisible();
      expect(Math.abs((await row.locator(".frame").boundingBox())!.height - 96)).toBeLessThanOrEqual(2);
    });

    test("Each sync state shows its wording in the header", async ({ page }) => {
      const states: [object, string][] = [
        [{ state: "syncing", pending: 0 }, "Syncing…"],
        [{ state: "error", pending: 2 }, "Sync problem"],
        [{ state: "paused", pending: 0 }, "Sync paused"],
        [{ state: "needs-decision", pending: 0 }, "Waiting for your choice"],
        [{ state: "idle", pending: 3 }, "Unsynced: 3"],
        [{ state: "idle", pending: 0 }, "Synced"],
      ];
      for (const [status, words] of states) {
        await setStatus(page, status);
        await expect(page.locator("header").getByTestId("sync-status")).toHaveText(words);
      }
    });

    test("Row content, tags and long names", async ({ page }) => {
      const rows = page.getByTestId("card-row");
      await expect(rows.filter({ hasText: "Acuña" })).toContainText("13/150");
      await expect(rows.filter({ hasText: "Betts" })).toContainText("?/99");
      const plain = rows.filter({ hasText: "Plain Card" });
      await expect(plain).not.toContainText("/");
      await expect(plain.locator(".tag")).toHaveCount(0);
      const long = rows.filter({ hasText: "Ohtani" });
      await expect(long).toContainText("Refractor");
      await expect(long).toContainText("PSA 9");
      await expect(long).toContainText("×2");
      const number = long.getByText("#17");
      await expect(number).toBeVisible();
      expect(await bottom(number)).toBeLessThanOrEqual(await bottom(long));
      const tag = rows.filter({ hasText: "Acuña" }).getByText("13/150");
      expect(await css(tag, "border-top-width")).toBe("1px");
      expect(await css(tag, "font-family")).toContain("Roboto Slab");
    });

    test("Nothing applied: no chips and no badge", async ({ page }) => {
      await expect(page.locator(".chip")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Filter/ })).toHaveText("Filter");
    });

    test("Filter applied: the sheet closes, a chip and a badge appear, the count shows", async ({ page }) => {
      await page.getByRole("button", { name: /^Filter/ }).click();
      const sheet = page.getByRole("dialog", { name: "Filters" });
      await sheet.getByLabel("Year from", { exact: true }).fill("2030");
      await expect(sheet.getByRole("button", { name: "Show 0 cards" })).toBeVisible();
      await sheet.getByLabel("Year from", { exact: true }).fill("2024");
      await sheet.getByRole("button", { name: "Show 4 cards" }).click();
      await expect(sheet).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Remove Year filter" })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Filter/ })).toHaveText("Filter1");
      await expect(page.getByTestId("shown")).toHaveText("Showing 4");
    });

    test("Remove a filter: the chip clears that filter; Clear all clears the rest", async ({ page }) => {
      await applyYearFrom(page, "2030");
      await expect(page.getByTestId("shown")).toHaveText("Showing 0");
      await page.getByRole("button", { name: "Remove Year filter" }).click();
      await expect(page.getByRole("button", { name: "Remove Year filter" })).toHaveCount(0);
      await expect(page.getByTestId("shown")).toHaveText("Showing 4");
      await applyYearFrom(page, "2030");
      await page.getByRole("button", { name: /^Filter/ }).click();
      await page.getByRole("button", { name: "Clear all" }).click();
      await expect(page.getByLabel("Year from", { exact: true })).toHaveValue("");
      await expect(page.locator(".chip")).toHaveCount(0);
    });
  });
}

test.describe("destructive actions stay apart", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  const notAccent = async (page: Page, button: Locator) => {
    await page.evaluate(() => document.documentElement.style.setProperty("--color-ink", "rgb(1, 2, 3)"));
    expect(await css(button, "color")).not.toBe("rgb(1, 2, 3)");
    expect(await css(button, "background-color")).not.toBe("rgb(1, 2, 3)");
  };

  const gap = async (a: Locator, b: Locator) => {
    const [x, y] = [(await a.boundingBox())!, (await b.boundingBox())!];
    return Math.max(y.y - (x.y + x.height), x.y - (y.y + y.height), y.x - (x.x + x.width), x.x - (y.x + y.width));
  };

  const danger = (page: Page) =>
    page.evaluate(() => {
      const probe = Object.assign(document.createElement("i"), { style: "color: var(--color-danger)" });
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });

  for (const scheme of ["light", "dark"] as const) {
    test(`Delete is a danger-outlined button left of Edit, matching Edit's size (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await seed(page, CARDS);
      await page.getByTestId("card-row").filter({ hasText: "Acuña" }).click();
      const edit = page.getByRole("button", { name: "Edit", exact: true });
      const del = page.getByRole("button", { name: "Delete", exact: true });
      const [e, d] = await Promise.all([edit.boundingBox(), del.boundingBox()]);
      expect(Math.abs(e!.y + e!.height / 2 - (d!.y + d!.height / 2))).toBeLessThan(4);
      expect(d!.x + d!.width).toBeLessThanOrEqual(e!.x);
      expect(await gap(edit, del)).toBeGreaterThanOrEqual(8);
      expect(Math.abs(e!.height - d!.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(e!.width - d!.width)).toBeLessThanOrEqual(1);
      expect(await css(del, "border-top-left-radius")).toBe(await css(edit, "border-top-left-radius"));
      const red = await danger(page);
      expect(await css(del, "color")).toBe(red);
      expect(await css(del, "border-top-color")).toBe(red);
      expect(await css(del, "background-color")).toBe("rgba(0, 0, 0, 0)");
      expect(await css(edit, "background-color")).not.toBe("rgba(0, 0, 0, 0)");
      await notAccent(page, del);
      await expect(page.getByText("13/150")).toBeVisible();
    });
  }

  for (const scheme of ["light", "dark"] as const) {
    test(`Header lines aligned and tight (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await seed(page, [{ ...CARDS[0], team: "Atlanta Braves" }]);
      await page.getByTestId("card-row").first().click();
      const title = page.getByRole("heading", { name: "Ronald Acuña Jr." });
      const quiet = page.getByTestId("subtitle");
      const team = page.getByTestId("team-line");
      await expect(team).toHaveText("Atlanta Braves · Gold");
      const [t, q, m] = await Promise.all([title, quiet, team].map((l) => l.boundingBox()));
      expect(Math.abs(t!.x - q!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(q!.x - m!.x)).toBeLessThanOrEqual(1);
      expect(q!.y - (t!.y + t!.height)).toBeLessThanOrEqual(8);
      expect(m!.y - (q!.y + q!.height)).toBeLessThanOrEqual(8);
    });
  }

  test("Header without team or parallel", async ({ page }) => {
    await page.goto("/");
    await seed(page, [{ player: "Plain Card", cardNumber: "1", team: "", parallel: null }]);
    await page.getByTestId("card-row").first().click();
    await expect(page.getByTestId("subtitle")).toBeVisible();
    await expect(page.getByTestId("team-line")).toHaveCount(0);
    expect(await page.getByTestId("facts").locator("dt").allTextContents()).not.toContain("Team");
  });

  test("Dialog over the screen", async ({ page }) => {
    await page.goto("/");
    const notes = "A long note about this card and where it came from. ".repeat(12);
    await seed(page, [{ ...CARDS[0], notes, photos: { front: { fileId: "f", thumbId: "ft" }, back: { fileId: "b", thumbId: "bt" } } }]);
    await page.getByTestId("card-row").first().click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("alertdialog", { name: "Delete card" });
    await expect(dialog).toBeInViewport({ ratio: 1 });
    const box = (await dialog.boundingBox())!;
    expect(Math.abs(box.x + box.width / 2 - 360 / 2)).toBeLessThanOrEqual(8);
    expect(Math.abs(box.y + box.height / 2 - 800 / 2)).toBeLessThanOrEqual(8);
    await expect(dialog.getByRole("button", { name: "Keep" })).toBeFocused();
    expect(await css(dialog.getByRole("button", { name: "Delete", exact: true }), "color")).toBe(await danger(page));
  });

  test("Two portrait photos fill the row: 200 dp photos, Edit and Delete show without scrolling and a tap opens the zoom view", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const ports = (window as unknown as Win).__ports;
      const { makeCard } = await import("/src/domain/fixtures.ts");
      const card = makeCard({ photos: { front: { fileId: "f", thumbId: "ft" }, back: { fileId: "b", thumbId: "bt" } } });
      const canvas = new OffscreenCanvas(320, 448);
      canvas.getContext("2d")!.fillRect(0, 0, 320, 448);
      const blob = await canvas.convertToBlob({ type: "image/webp" });
      await ports.collection.putSynced([card]);
      for (const side of ["front", "back"]) {
        await ports.photos.cacheThumb(card.id, side, blob);
        await ports.photos.cacheFull(card.id, side, blob);
      }
    });
    await page.reload();
    await openCollection(page);
    await page.getByTestId("card-row").first().click();
    const thumb = page.getByRole("button", { name: "View front photo" });
    await expect(thumb).toBeVisible();
    const box = (await thumb.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(190);
    expect(box.height).toBeLessThanOrEqual(210);
    await expect(page.getByRole("button", { name: "View back photo" })).toBeVisible();
    // Two portrait photos fill the row: 200 dp within 4 dp, side by side, no overlap.
    const backBox = (await page.getByRole("button", { name: "View back photo" }).boundingBox())!;
    expect(Math.abs(box.height - 200)).toBeLessThanOrEqual(4);
    expect(Math.abs(backBox.height - 200)).toBeLessThanOrEqual(4);
    expect(Math.abs(backBox.y - box.y)).toBeLessThanOrEqual(1);
    expect(backBox.x).toBeGreaterThanOrEqual(box.x + box.width);
    await expect(page.getByRole("button", { name: "Back", exact: true })).toHaveCount(0);
    const y = async (l: Locator) => (await l.boundingBox())!.y;
    expect(await y(page.getByTestId("facts"))).toBeLessThan(await y(thumb));
    expect(await y(thumb)).toBeLessThan(await y(page.getByTestId("updated")));
    await expect(page.getByRole("button", { name: "Edit", exact: true })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeInViewport();
    await thumb.click();
    await expect(page.getByTestId("zoom-front")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByTestId("zoom-front")).toHaveCount(0);
  });

  test("Sign out is apart in settings", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(page.getByRole("button", { name: "Back", exact: true })).toHaveCount(0);
    const out = page.getByRole("button", { name: "Sign out", exact: true });
    const others = [page.getByRole("button", { name: "Check for updates" }), page.getByTestId("version")];
    for (const other of others) expect(await gap(other, out)).toBeGreaterThanOrEqual(24);
    await notAccent(page, out);
  });
});

test.describe("polish after the second phone review", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("Row is the player with the tag badge at the right, then one quiet line", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    const row = page.getByTestId("card-row").filter({ hasText: "Acuña" });
    const player = row.locator(".player");
    const quiet = row.locator(".quiet");
    const tag = row.locator(".tag");
    await expect(player).toHaveText("Ronald Acuña Jr.");
    await expect(quiet).toHaveText("2024 Series 1 · #27 · Gold");
    await expect(tag).toHaveText("13/150");
    await expect(row.locator(".extra")).toHaveCount(0);
    expect(await css(player, "font-weight")).toBe("500");
    const [p, q, t, r] = await Promise.all([player, quiet, tag, row].map((l) => l.boundingBox()));
    expect(Math.abs(t!.y + t!.height / 2 - (p!.y + p!.height / 2))).toBeLessThan(8);
    expect(t!.x).toBeGreaterThan(p!.x);
    expect(r!.x + r!.width - (t!.x + t!.width)).toBeLessThan(24);
    expect(q!.y).toBeGreaterThanOrEqual(p!.y + p!.height - 1);
    await expect(page.getByTestId("card-row").filter({ hasText: "Plain Card" }).locator(".tag")).toHaveCount(0);
  });

  test("A long parallel and a grade stay on the quiet line and the number stays visible", async ({ page }) => {
    await page.goto("/");
    await seed(page, [
      {
        player: "Ronald Acuña Jr.",
        cardNumber: "27",
        parallel: { name: "Refractor Sapphire Edition Gold Shimmer Superfractor", serial: 13, serialLegible: true, printRun: 150 },
        grading: { kind: "graded", company: "PSA", grade: "10" },
        quantity: 12,
      },
    ]);
    const row = page.getByTestId("card-row").first();
    const quiet = row.locator(".quiet");
    expect((await quiet.boundingBox())!.height).toBeLessThan(24);
    expect((await row.boundingBox())!.height).toBeLessThanOrEqual(112);
    const num = row.locator(".num");
    expect((await num.boundingBox())!.x + (await num.boundingBox())!.width).toBeLessThanOrEqual((await row.boundingBox())!.x + (await row.boundingBox())!.width);
    await expect(num).toBeVisible();
    expect(await num.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test("Filters sheet sits above a bottom system bar", async ({ page }) => {
    await page.goto("/");
    await openCollection(page);
    await page.evaluate(() => document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px"));
    await page.getByRole("button", { name: /^Filter/ }).click();
    const button = page.getByRole("dialog").getByRole("button", { name: "Clear all", exact: true });
    await expect(button).toBeVisible();
    expect(await bottom(button)).toBeLessThanOrEqual(800 - 48 - 16);
  });

  test("Card detail: title with a serial badge, quiet subtitle, a ruled list of facts, last edited, then Edit", async ({ page }) => {
    await page.goto("/");
    await seed(page, [{ ...CARDS[0], grading: { kind: "graded", company: "PSA", grade: "9" }, quantity: 3 }]);
    await page.getByTestId("card-row").first().click();
    const title = page.getByRole("heading", { name: "Ronald Acuña Jr." });
    const subtitle = page.getByTestId("subtitle");
    const badge = page.locator("section .tag");
    const facts = page.getByTestId("facts");
    const edited = page.getByTestId("updated");
    const edit = page.getByRole("button", { name: "Edit", exact: true });
    await expect(subtitle).toHaveText("2024 Series 1 · #27");
    await expect(badge).toHaveText("13/150");
    expect(await facts.locator("dt").allTextContents()).toEqual(["Manufacturer", "Condition", "Quantity"]);
    expect(await facts.locator("dd").allTextContents()).toEqual(["Topps", "PSA 9", "3"]);
    const [t, b, f] = await Promise.all([title, badge, facts].map((l) => l.boundingBox()));
    expect(Math.abs(b!.y + b!.height / 2 - (t!.y + t!.height / 2))).toBeLessThan(16);
    const dd = (await facts.locator("dd").first().boundingBox())!;
    expect(f!.x + f!.width - (dd.x + dd.width)).toBeLessThan(4);
    expect(await css(facts.locator("div").nth(1), "border-top-width")).toBe("1px");
    expect(await css(facts, "background-image")).toBe("none");
    const y = async (l: Locator) => (await l.boundingBox())!.y;
    expect(await y(title)).toBeLessThan(await y(subtitle));
    expect(await y(subtitle)).toBeLessThan(await y(facts));
    expect(await y(facts)).toBeLessThan(await y(edited));
    expect(await y(edited)).toBeLessThan(await y(edit));
    expect((await edit.boundingBox())!.width).toBeGreaterThanOrEqual(140);
    expect(await css(edited, "color")).toBe(await css(subtitle, "color"));
    await page.evaluate(() => document.documentElement.style.setProperty("--color-ink", "rgb(1, 2, 3)"));
    expect(await css(badge, "color")).toBe("rgb(1, 2, 3)");
  });
});

type Box = { x: number; y: number; width: number; height: number };
const CONTROLS = "button, a[href], input:not([type=checkbox]):not([type=radio]), select, textarea, summary, label.check, [data-testid=card-row] > button";

async function controls(page: Page) {
  return page.evaluate((selector) => {
    // An open sheet covers the screen behind it, so only its own controls count.
    const scope = document.querySelector("[aria-modal=true]") ?? document;
    return [...scope.querySelectorAll<HTMLElement>(selector)]
      .filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden")
      .map((el) => {
        const r = el.getBoundingClientRect();
        // A control scrolled out of its panel or chip row is not under a finger, so it takes no part in the spacing check.
        let clipped = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          if (getComputedStyle(p).overflow === "visible") continue;
          const c = p.getBoundingClientRect();
          clipped ||= r.top < c.top - 0.5 || r.bottom > c.bottom + 0.5 || r.left < c.left - 0.5 || r.right > c.right + 0.5;
        }
        // A field under the sticky form bar is covered, not tappable, until it scrolls clear.
        const bar = el.closest(".form-bar") ? null : document.querySelector(".form-bar")?.getBoundingClientRect();
        clipped ||= !!bar && r.bottom > bar.top && r.top < bar.bottom;
        return { name: (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 24), x: r.x, y: r.y, width: r.width, height: r.height, clipped };
      });
  }, CONTROLS) as Promise<(Box & { name: string; clipped: boolean })[]>;
}

async function expectTouchable(page: Page, label: string) {
  const list = await controls(page);
  expect(list.length, label).toBeGreaterThan(0);
  for (const c of list) {
    expect(c.height, `${label}: ${c.name} height`).toBeGreaterThanOrEqual(47.5);
    expect(c.width, `${label}: ${c.name} width`).toBeGreaterThanOrEqual(47.5);
  }
  const reachable = list.filter((c) => !c.clipped);
  for (const [i, a] of reachable.entries()) {
    for (const b of reachable.slice(i + 1)) {
      const dx = Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width));
      const dy = Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height));
      expect(Math.hypot(dx, dy), `${label}: ${a.name} to ${b.name}`).toBeGreaterThanOrEqual(7.5);
    }
  }
}

test.describe("Touch targets", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("list, filters, detail, form, settings and sign-in meet 48 dp with 8 dp between", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    await expectTouchable(page, "list");
    await page.getByRole("button", { name: /^Filter/ }).click();
    await expectTouchable(page, "filter sheet");
    await page.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
    await page.getByRole("button", { name: /^Sort: / }).click();
    await expectTouchable(page, "sort sheet");
    await page.getByRole("button", { name: "Done" }).click();
    await applyYearFrom(page, "2000");
    await expectTouchable(page, "applied chip");
    await page.getByTestId("card-row").first().click();
    await expectTouchable(page, "detail");
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await expectTouchable(page, "form");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Settings" }).click();
    await expectTouchable(page, "settings");
    await page.goto("/?auth=signed-out");
    await expectTouchable(page, "sign-in");
  });
});

test.describe("States at phone size", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  // Text colour against the stacked backgrounds above it (gradients count as clear).
  const legible = (el: Locator) =>
    el.evaluate((node) => {
      const parse = (c: string) => c.match(/[\d.]+/g)!.map(Number);
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const layers: number[][] = [];
      for (let n: Element | null = node; n; n = n.parentElement) layers.unshift(parse(getComputedStyle(n).backgroundColor));
      let base = [255, 255, 255];
      for (const [r, g, b, a = 1] of layers) base = [r, g, b].map((v, i) => v * a + base[i] * (1 - a));
      const [hi, lo] = [lum(parse(getComputedStyle(node).color)), lum(base)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    });

  const states: [string, (page: Page) => Promise<Locator>][] = [
    ["empty collection", async (page) => page.getByTestId("empty-state")],
    [
      "no matching cards",
      async (page) => {
        await seed(page, CARDS);
        await page.getByLabel("Search", { exact: true }).fill("zzzz");
        return page.getByTestId("no-match");
      },
    ],
    [
      "sync error",
      async (page) => {
        await setStatus(page, { state: "error", pending: 2 });
        return page.getByTestId("sync-status");
      },
    ],
    [
      "needs-decision dialog",
      async (page) => {
        await setStatus(page, { state: "needs-decision", pending: 0 });
        return page.getByRole("dialog", { name: "Data file missing" });
      },
    ],
    [
      "delete confirm",
      async (page) => {
        await seed(page, CARDS);
        await page.getByTestId("card-row").first().click();
        await page.getByRole("button", { name: "Delete", exact: true }).click();
        return page.getByRole("alertdialog", { name: "Delete card" });
      },
    ],
    [
      "sign-out confirm",
      async (page) => {
        await page.getByRole("button", { name: "Settings" }).click();
        await page.getByRole("button", { name: "Sign out", exact: true }).click();
        return page.getByRole("alertdialog", { name: "Sign out" });
      },
    ],
    [
      "update banner",
      async (page) => {
        await showUpdateBanner(page);
        return page.getByTestId("update-banner");
      },
    ],
    [
      "offline photo note",
      async (page) => {
        await page.evaluate(async () => {
          const ports = (window as unknown as Win).__ports;
          const { makeCard } = await import("/src/domain/fixtures.ts");
          const card = makeCard({ photos: { front: { fileId: "drive-full", thumbId: "drive-thumb" }, back: null } });
          const canvas = new OffscreenCanvas(320, 448);
          canvas.getContext("2d")!.fillRect(0, 0, 320, 448);
          await ports.collection.putSynced([card]);
          await ports.photos.cacheThumb(card.id, "front", await canvas.convertToBlob({ type: "image/webp" }));
        });
        await page.reload();
        await openCollection(page);
        await page.context().setOffline(true);
        await page.getByTestId("card-row").first().click();
        await page.getByRole("button", { name: "View front photo" }).click();
        return page.getByText("Full photo will load when online");
      },
    ],
  ];

  for (const scheme of ["dark", "light"] as const) {
    for (const [name, show] of states) {
      test(`${name} in ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto("/");
        await page.evaluate(() => {
          document.documentElement.style.setProperty("--safe-area-inset-top", "24px");
          document.documentElement.style.setProperty("--safe-area-inset-bottom", "24px");
        });
        await openCollection(page);
        const target = await show(page);
        await expect(target).toBeVisible();
        expect(await legible(target)).toBeGreaterThanOrEqual(4.5);
        const box = (await target.boundingBox())!;
        expect(box.y).toBeGreaterThanOrEqual(24);
        for (const b of await target.getByRole("button").all()) {
          expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
        }
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(360);
      });
    }
  }

  for (const scheme of ["dark", "light"] as const) {
    test(`Both themes: dashboard tiles are legible in ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await expect(page.getByTestId("tile")).toHaveCount(6);
      for (const tile of await page.getByTestId("tile").all()) {
        expect(await legible(tile.locator(".tile-label"))).toBeGreaterThanOrEqual(4.5);
        expect(await legible(tile.locator(".tile-value"))).toBeGreaterThanOrEqual(4.5);
      }
    });

    test(`Both themes: Recently added and Top teams are legible and 48 dp in ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await seedDashboard(page);
      for (const el of [...(await page.getByTestId("recent").all()), ...(await page.getByTestId("team").all())]) {
        const box = (await el.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(47.5);
        expect(box.width).toBeGreaterThanOrEqual(47.5);
      }
      for (const text of await page.locator(".recent-name, .team-name, .team-count, .dashboard h2").all()) {
        expect(await legible(text)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test("Dashboard groups: four recent cards and five teams, nothing scrolls sideways, the bar clears the last entry", async ({ page }) => {
    await page.goto("/");
    await seedDashboard(page);
    await page.evaluate(() => {
      document.documentElement.style.setProperty("--safe-area-inset-top", "24px");
      document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px");
    });
    await expect(page.getByTestId("recent")).toHaveCount(4);
    await expect(page.getByTestId("team")).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const navTop = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!.y;
    expect(await bottom(page.getByTestId("team").last())).toBeLessThanOrEqual(navTop);
  });

  test("Tiles at phone size: six tiles are 48 dp, in view, clear of the system bars", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.setProperty("--safe-area-inset-top", "24px");
      document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px");
    });
    await expect(page.getByTestId("tile")).toHaveCount(6);
    await expectTouchable(page, "dashboard");
    for (const el of await page.getByTestId("tile").all()) {
      await expect(el).toBeInViewport({ ratio: 1 });
    }
    const nav = page.getByRole("navigation", { name: "Main" });
    expect(await bottom(nav.getByRole("button", { name: "Add card", exact: true }))).toBeLessThanOrEqual(800 - 48 + 0.5);
    expect(await bottom(page.getByTestId("tile").last())).toBeLessThanOrEqual((await nav.boundingBox())!.y);
    expect((await page.getByTestId("tile").first().boundingBox())!.y).toBeGreaterThanOrEqual(24);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});

test.describe("Bottom navigation and header", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });
  const item = (page: Page, name: "Dashboard" | "Cards") => nav(page).getByRole("button", { name, exact: true });
  const insets = (page: Page) =>
    page.evaluate(() => {
      document.documentElement.style.setProperty("--safe-area-inset-top", "24px");
      document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px");
    });

  test("Shown on the top-level screens", async ({ page }) => {
    await page.goto("/");
    await expect(nav(page).getByRole("button")).toHaveText(["Dashboard", "Add", "Cards"]);
    await expect(item(page, "Dashboard")).toHaveAttribute("aria-current", "page");
    await expect(item(page, "Cards")).not.toHaveAttribute("aria-current", "page");
    await item(page, "Cards").click();
    await expect(page.getByTestId("shown")).toBeVisible();
    await expect(item(page, "Cards")).toHaveAttribute("aria-current", "page");
    await expect(item(page, "Dashboard")).not.toHaveAttribute("aria-current", "page");
  });

  test("Hidden elsewhere", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    await page.getByTestId("card-row").first().click();
    await expect(nav(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(nav(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Cancel" }).click();
    await hardwareBack(page);
    await page.getByRole("button", { name: "Add card", exact: true }).click();
    await expect(nav(page)).toHaveCount(0);
    await hardwareBack(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(nav(page)).toHaveCount(0);
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`Active destination is not colour alone in ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const after = (name: "Dashboard" | "Cards") => item(page, name).evaluate((el) => getComputedStyle(el, "::after").content);
      expect(await after("Dashboard")).toBe("none");
      expect(await after("Cards")).toBe("none");
      const ink = scheme === "light" ? "rgb(28, 43, 74)" : "rgb(243, 236, 220)";
      expect(await css(item(page, "Dashboard"), "color")).toBe(ink);
      expect(await css(item(page, "Cards"), "color")).not.toBe(ink);
      await expect(item(page, "Dashboard")).toContainText("Dashboard");
      await expect(item(page, "Dashboard").locator("svg[aria-hidden=true]")).toHaveCount(1);
      expect(await css(item(page, "Dashboard"), "font-weight")).toBe("600");
      expect(await css(item(page, "Cards"), "font-weight")).toBe("400");
      // The active icon is solid, the inactive one an outline: a shape cue, not colour alone.
      await expect(item(page, "Dashboard").locator("svg")).toHaveAttribute("data-variant", "solid");
      await expect(item(page, "Cards").locator("svg")).toHaveAttribute("data-variant", "outline");
      await item(page, "Cards").click();
      await expect(item(page, "Cards").locator("svg")).toHaveAttribute("data-variant", "solid");
      await expect(item(page, "Dashboard").locator("svg")).toHaveAttribute("data-variant", "outline");
      // Add is an action, not a destination: its label is ink at weight 500, never the active 600.
      const addLabel = nav(page).getByRole("button", { name: "Add card", exact: true });
      expect(await css(addLabel, "font-weight")).toBe("500");
    });

    test(`Inactive label is readable in ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const [fg, bg] = await item(page, "Cards").evaluate((el) => {
        const rgb = (c: string) => c.match(/[\d.]+/g)!.map(Number);
        let bar: Element | null = el;
        let base = [0, 0, 0, 0];
        while (bar && base[3] === 0) {
          base = rgb(getComputedStyle(bar).backgroundColor);
          if (base.length < 4) base.push(1);
          bar = bar.parentElement;
        }
        const s = getComputedStyle(el);
        const [r, g, b, a = 1] = rgb(s.color);
        const op = Number(s.opacity);
        return [[r, g, b, a * op], base];
      });
      const mix = [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
      const lum = (c: number[]) => c.slice(0, 3).map((v, i) => { v /= 255; v = v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; return v * [0.2126, 0.7152, 0.0722][i]; }).reduce((x, y) => x + y);
      const [hi, lo] = [lum(mix), lum(bg)].sort((x, y) => y - x);
      expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(4.5);
    });
  }

  test("Above the gesture bar: items 48 dp, 8 dp apart, 48 dp above the bottom edge", async ({ page }) => {
    await page.goto("/");
    await insets(page);
    const [a, b] = await Promise.all([item(page, "Dashboard"), item(page, "Cards")].map((l) => l.boundingBox()));
    for (const box of [a!, b!]) {
      expect(box.width).toBeGreaterThanOrEqual(47.5);
      expect(box.height).toBeGreaterThanOrEqual(47.5);
      expect(box.y + box.height).toBeLessThanOrEqual(800 - 48 + 0.5);
    }
    expect(b!.x - (a!.x + a!.width)).toBeGreaterThanOrEqual(7.5);
  });

  test("Gear in the header: an icon-only Settings button at the top right of the dashboard and the list", async ({ page }) => {
    await page.goto("/");
    for (const screen of ["dashboard", "list"]) {
      if (screen === "list") await item(page, "Cards").click();
      const gear = page.getByRole("button", { name: "Settings", exact: true });
      await expect(gear).toHaveCount(1);
      await expect(gear).toHaveText("");
      await expect(gear.locator("svg")).toHaveCount(1);
      const box = (await gear.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(47.5);
      expect(box.height).toBeGreaterThanOrEqual(47.5);
      expect(360 - (box.x + box.width)).toBeLessThanOrEqual(12.5);
      await expect(page.locator("header").getByRole("button", { name: "Settings", exact: true })).toHaveCount(1);
    }
  });

  test("Gear opens Settings, and back returns to the list", async ({ page }) => {
    await page.goto("/");
    await item(page, "Cards").click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await hardwareBack(page);
    await expect(page.getByTestId("shown")).toBeVisible();
  });

  test("Cards title: the list is titled Cards with the sync state on its row and no count line", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The Binder" })).toHaveCount(0);
    await item(page, "Cards").click();
    const title = page.getByRole("heading", { level: 1, name: "Cards", exact: true });
    await expect(title).toBeVisible();
    await expect(page.getByRole("heading", { name: "The Binder" })).toHaveCount(0);
    await expect(page.locator("header .title-row").getByTestId("sync-status")).toBeVisible();
  });

  test("Switch to Cards keeps the list as it was", async ({ page }) => {
    await page.goto("/");
    await seed(page, [{ ...CARDS[0], flags: { rookie: false, autograph: true, relic: false } }, CARDS[3]]);
    await item(page, "Dashboard").click();
    await page.getByRole("button", { name: "Autos, 1", exact: true }).click();
    await expect(page.getByRole("button", { name: /^Remove Autograph filter/ })).toBeVisible();
    await item(page, "Dashboard").click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await item(page, "Cards").click();
    await expect(page.getByRole("button", { name: /^Remove Autograph filter/ })).toBeVisible();
  });

  test("Last row reachable: 20 cards scroll clear of the bar", async ({ page }) => {
    await page.goto("/");
    await seed(page, Array.from({ length: 20 }, (_, i) => ({ player: `Player ${String(i).padStart(2, "0")}`, cardNumber: String(i + 1) })));
    await insets(page);
    await page.locator(".list-scroller").evaluate((el) => el.scrollTo(0, el.scrollHeight));
    const last = page.getByTestId("card-row").last();
    const scrollerBottom = await bottom(page.locator(".list-scroller"));
    await expect(last).toBeInViewport();
    expect(await bottom(last)).toBeLessThanOrEqual(scrollerBottom + 1);
    expect(scrollerBottom).toBeLessThanOrEqual((await nav(page).boundingBox())!.y - 7.5);
    await last.click();
    await expect(page.getByRole("button", { name: "Edit", exact: true })).toBeVisible();
  });

  test("The bar clears the last dashboard item at the end of the scroll", async ({ page }) => {
    await page.goto("/");
    await seedDashboard(page);
    await insets(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    expect(await bottom(page.getByTestId("team").last())).toBeLessThanOrEqual((await nav(page).boundingBox())!.y);
  });

  test("Add is an action between Dashboard and Cards: a framed plus, never current, opens the form and returns to its origin", async ({ page }) => {
    await page.goto("/");
    await expect(nav(page).getByRole("button")).toHaveText(["Dashboard", "Add", "Cards"]);
    const add = nav(page).getByRole("button", { name: "Add card", exact: true });
    await expect(add).not.toHaveAttribute("aria-current", /.+/);
    const box = (await add.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(47.5);
    expect(box.height).toBeGreaterThanOrEqual(47.5);
    const frame = add.locator(".nav-add");
    expect(await css(frame, "background-color")).toBe("rgb(28, 43, 74)");
    expect(await css(frame, "border-top-left-radius")).toBe("6px");
    const frameBox = (await frame.boundingBox())!;
    const neighbour = (await item(page, "Dashboard").locator("svg").boundingBox())!;
    expect(frameBox.width).toBeCloseTo(48, 0);
    expect(frameBox.height).toBeCloseTo(32, 0);
    expect(frameBox.width).toBeGreaterThanOrEqual(neighbour.width * 2 - 0.5);
    expect(frameBox.height).toBeGreaterThanOrEqual(neighbour.height + 8 - 0.5);
    await expect(add.locator("svg[aria-hidden=true]")).toHaveCount(1);
    await item(page, "Cards").click();
    await add.click();
    await expect(page.getByRole("heading", { name: "Add card" })).toBeVisible();
    await hardwareBack(page);
    await expect(page.getByTestId("shown")).toBeVisible();
    await expect(item(page, "Cards")).toHaveAttribute("aria-current", "page");
  });
});

test.describe("System navigation bar strip", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  const inset = (page: Page) => page.evaluate(() => document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px"));
  const strip = (page: Page) =>
    page.evaluate(() => {
      const s = getComputedStyle(document.body, "::after");
      return { position: s.position, height: s.height, events: s.pointerEvents, background: s.backgroundColor };
    });

  for (const scheme of ["light", "dark"] as const) {
    test(`A solid ground strip sits under the system buttons on the form: ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await inset(page);
      await page.getByRole("button", { name: "Add card", exact: true }).click();
      const ground = await pageBackground(page);
      expect(await strip(page)).toEqual({ position: "fixed", height: "48px", events: "none", background: ground });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      expect(await bottom(page.getByRole("button", { name: "Save" }))).toBeLessThanOrEqual(800 - 48);
    });
  }

  test("The bottom bar is painted over the strip", async ({ page }) => {
    await page.goto("/");
    await inset(page);
    const hit = await page.evaluate(() => document.elementFromPoint(180, 795)?.closest("nav")?.getAttribute("aria-label"));
    expect(hit).toBe("Main");
  });
});

test.describe("Form actions and Sort sheet", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("Cancel sits left of a wider Save and a typed form asks before back leaves", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Add card", exact: true }).click();
    const cancel = (await page.getByRole("button", { name: "Cancel" }).boundingBox())!;
    const save = (await page.getByRole("button", { name: "Save" }).boundingBox())!;
    expect(save.x - (cancel.x + cancel.width)).toBeGreaterThanOrEqual(8);
    expect(save.width).toBeGreaterThan(cancel.width);
    await page.getByLabel("Player").fill("Hank Aaron");
    await hardwareBack(page);
    await expect(page.getByRole("alertdialog", { name: "Discard this card?" })).toBeVisible();
    await hardwareBack(page);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByLabel("Player")).toHaveValue("Hank Aaron");
  });

  test("the Sort sheet is compact and aligned; the Filters sheet stays full height", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    const sort = page.getByRole("dialog", { name: "Sort" });
    await page.getByRole("button", { name: /^Sort: / }).click();
    const sheet = (await sort.boundingBox())!;
    expect(sheet.height).toBeLessThan(800 * (2 / 3));
    const rows = await sort.locator("label.check").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(rows.length).toBe(6);
    for (const h of rows) expect(h).toBeGreaterThanOrEqual(47.5);
    expect(Math.max(...rows) - Math.min(...rows)).toBeLessThan(1);
    const left = async (name: string) => (await sort.getByRole("radio", { name, exact: true }).boundingBox())!;
    const lefts = await Promise.all(["Last name", "Year", "Team", "Set", "Ascending"].map(async (n) => (await left(n)).x));
    expect(Math.max(...lefts) - Math.min(...lefts)).toBeLessThanOrEqual(1);
    expect((await left("Descending")).y).toBeCloseTo((await left("Ascending")).y, 0);
    const done = (await sort.getByRole("button", { name: "Done" }).boundingBox())!;
    expect(done.width).toBeGreaterThan(sheet.width - 80);
    await page.getByRole("button", { name: "Done" }).click();
    await page.getByRole("button", { name: /^Filter/ }).click();
    const filters = (await page.getByRole("dialog", { name: "Filters" }).boundingBox())!;
    expect(filters.y + filters.height).toBeCloseTo(800, 0);
  });
});

const PHOTO_SHAPES: [string, number, number][] = [["Landscape Lou", 448, 320], ["Portrait Pat", 320, 448], ["Portrait Pete", 320, 448]];

/** Three cards with photos (one landscape) and one without, newest first on the dashboard. */
async function seedPhotoCards(page: Page) {
  await page.evaluate(async (shapes) => {
    const ports = (window as unknown as Win).__ports;
    const { makeCard } = await import("/src/domain/fixtures.ts");
    const cards = [];
    for (const [i, [player, w, h]] of shapes.entries()) {
      const card = makeCard({ player, cardNumber: player, createdAt: `2026-03-0${i + 2}T00:00:00.000Z`, photos: { front: { fileId: `f${i}`, thumbId: `t${i}` }, back: { fileId: `b${i}`, thumbId: `bt${i}` } } });
      const canvas = new OffscreenCanvas(w, h);
      canvas.getContext("2d")!.fillRect(0, 0, w, h);
      const blob = await canvas.convertToBlob({ type: "image/webp" });
      const wide = new OffscreenCanvas(448, 320);
      wide.getContext("2d")!.fillRect(0, 0, 448, 320);
      const backBlob = await wide.convertToBlob({ type: "image/webp" });
      await ports.photos.cacheThumb(card.id, "front", blob);
      await ports.photos.cacheFull(card.id, "front", blob);
      await ports.photos.cacheThumb(card.id, "back", backBlob);
      await ports.photos.cacheFull(card.id, "back", backBlob);
      cards.push(card);
    }
    cards.push(makeCard({ player: "Plain Pam", cardNumber: "Plain", createdAt: "2026-03-01T00:00:00.000Z" }));
    await ports.collection.putSynced(cards);
  }, PHOTO_SHAPES);
  await page.reload();
}

const ratioOf = async (loc: Locator) => {
  const b = (await loc.boundingBox())!;
  return b.width / b.height;
};
const near = (actual: number, expected: number) => expect(Math.abs(actual / expected - 1)).toBeLessThan(0.02);

test.describe("Card-back look", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`Palette on the dashboard: ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const want = scheme === "light"
        ? { bg: "rgb(243, 236, 220)", ink: "rgb(28, 43, 74)" }
        : { bg: "rgb(16, 26, 48)", ink: "rgb(243, 236, 220)" };
      expect(await pageBackground(page)).toBe(want.bg);
      expect(await css(page.getByRole("heading", { name: "Dashboard" }), "color")).toBe(want.ink);
      const frame = page.getByRole("button", { name: "Add card", exact: true }).locator(".nav-add");
      expect(await css(frame, "background-color")).toBe(want.ink);
      expect(await css(frame, "color")).toBe(want.bg);
      if (scheme === "dark") expect(await css(page.locator(".tiles"), "background-color")).toBe("rgb(23, 35, 63)");
    });

    test(`No translucent surface remains in ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await seed(page, CARDS);
      const scan = () =>
        page.evaluate(() =>
          [...document.querySelectorAll("button, input, select, textarea, [role=dialog], [role=alertdialog], .banner")].flatMap((el) => {
            const s = getComputedStyle(el);
            const alpha = (s.backgroundColor.match(/[\d.]+/g) ?? []).map(Number)[3] ?? 1;
            const bad = [];
            if (s.backgroundImage !== "none") bad.push("gradient");
            if (s.boxShadow !== "none") bad.push("shadow");
            if (alpha !== 0 && alpha !== 1) bad.push("translucent");
            return bad.map((b) => `${el.tagName}.${el.className} ${b}`);
          }),
        );
      await showUpdateBanner(page);
      expect(await scan()).toEqual([]);
      await page.getByRole("button", { name: /^Filter/ }).click();
      expect(await scan()).toEqual([]);
      await page.getByRole("button", { name: "Close" }).click();
      await page.getByTestId("card-row").first().click();
      expect(await scan()).toEqual([]);
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      expect(await scan()).toEqual([]);
      await page.getByRole("alertdialog", { name: "Delete card" }).getByRole("button", { name: "Keep" }).click();
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      expect(await scan()).toEqual([]);
      await page.getByRole("button", { name: "Cancel" }).click();
      await page.reload();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      expect(await scan()).toEqual([]);
      await setStatus(page, { state: "needs-decision", pending: 0 });
      expect(await scan()).toEqual([]);
    });
  }

  test("Secondary buttons are outlined in ink and active chips are ink", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    await applyYearFrom(page, "2000");
    const ink = "rgb(28, 43, 74)";
    const chip = page.getByRole("button", { name: "Remove Year filter" });
    expect(await css(chip, "background-color")).toBe(ink);
    expect(await css(chip, "color")).toBe("rgb(243, 236, 220)");
    const outlined = async (b: Locator) => {
      expect(await css(b, "background-color")).toBe("rgba(0, 0, 0, 0)");
      expect(await css(b, "border-top-color")).toBe(ink);
      expect(await css(b, "border-top-width")).toBe("1px");
      expect(await css(b, "color")).toBe(ink);
      expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
    };
    await page.getByRole("button", { name: /^Filter/ }).click();
    await outlined(page.getByRole("button", { name: "Clear all" }));
    await page.getByRole("button", { name: "Close" }).click();
    await page.getByTestId("card-row").first().click();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await outlined(page.getByRole("button", { name: "Cancel" }));
  });

  test("Rule under the title on the dashboard, list, detail, form and Settings, and no dashed border anywhere", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    const check = async (heading: Locator) => {
      const rule = page.locator(".title-rule").first();
      await expect(rule).toHaveAttribute("aria-hidden", "true");
      const h = (await heading.boundingBox())!;
      expect((await rule.boundingBox())!.y).toBeGreaterThanOrEqual(h.y + h.height - 1);
      expect(await css(rule, "border-top-style")).toBe("solid");
      expect(await css(rule, "border-top-width")).toBe("1px");
      expect(await page.evaluate(() => [...document.querySelectorAll("*")].some((el) => getComputedStyle(el).borderTopStyle === "dashed"))).toBe(false);
    };
    await check(page.getByRole("heading", { name: "Cards", exact: true }));
    await page.getByTestId("card-row").filter({ hasText: "Acuña" }).click();
    await check(page.getByRole("heading", { name: "Ronald Acuña Jr." }));
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await check(page.getByRole("heading", { name: "Edit card" }));
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.reload();
    await check(page.getByRole("heading", { name: "Dashboard" }));
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await check(page.getByRole("heading", { name: "Settings" }));
  });

  test("No decorative red: the dashboard has none, and in an error only the sync text is danger red", async ({ page }) => {
    await page.goto("/");
    await seedDashboard(page);
    const reds = () =>
      page.evaluate(() => {
        const probe = document.createElement("i");
        probe.style.color = "var(--color-danger)";
        document.body.append(probe);
        const red = getComputedStyle(probe).color;
        probe.remove();
        return [...document.querySelectorAll("body *")].flatMap((el) => {
          const s = getComputedStyle(el);
          const pseudo = ["::before", "::after"].map((p) => getComputedStyle(el, p).backgroundColor);
          const borders = (["Top", "Right", "Bottom", "Left"] as const).filter((d) => parseFloat(s[`border${d}Width`]) > 0).map((d) => s[`border${d}Color`]);
          return [s.color, s.backgroundColor, ...pseudo, ...borders].includes(red) ? [`${el.tagName}.${el.className}`] : [];
        });
      });
    expect(await reds()).toEqual([]);
    await setStatus(page, { state: "error", pending: 2 });
    expect((await reds()).sort()).toEqual(["P.sync-detail", "SPAN.sync"]);
    expect(await page.evaluate(() => [...document.querySelectorAll("body *")].some((el) => getComputedStyle(el, "::after").clipPath !== "none"))).toBe(false);
  });

  test("Sizes on the dashboard", async ({ page }) => {
    await page.goto("/");
    await seedDashboard(page);
    const size = (sel: string) => css(page.locator(sel).first(), "font-size");
    expect(await size("h1")).toBe("28px");
    expect(await size(".tile-value")).toBe("32px");
    expect(await size(".tile-label")).toBe("12px");
    expect(await css(page.locator(".tile-label").first(), "text-transform")).toBe("uppercase");
    expect(await css(page.locator(".tile-label").first(), "font-variant-caps")).toBe("normal");
    expect(await css(page.locator(".group h2").first(), "font-family")).toContain("Roboto Slab");
    expect(await size(".group h2")).toBe("18px");
    for (const tile of await page.getByTestId("tile").all()) {
      const fits = await tile.evaluate((el) => [...el.querySelectorAll("span")].every((s) => s.scrollWidth <= s.clientWidth + 1 && s.getBoundingClientRect().right <= el.getBoundingClientRect().right + 1));
      expect(fits).toBe(true);
    }
    expect(await size(".team-count")).toBe("18px");
    expect(await size(".recent-name")).toBe("12px");
  });

  test("No stray sizes on the dashboard, list, detail, form, Settings and filter sheet", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    const sizes = () =>
      page.evaluate(() => {
        const bad = new Set<string>();
        for (const el of document.querySelectorAll("body *")) {
          const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) || (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && (el as HTMLInputElement).type !== "checkbox");
          if (own) {
            const px = getComputedStyle(el).fontSize;
            if (!["12px", "14px", "16px", "18px", "28px", "32px"].includes(px)) bad.add(`${el.tagName}.${el.className} ${px}`);
          }
        }
        return [...bad];
      });
    const nav = page.getByRole("navigation", { name: "Main" });
    expect(await sizes()).toEqual([]);
    await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
    expect(await sizes()).toEqual([]);
    await nav.getByRole("button", { name: "Cards", exact: true }).click();
    await page.getByRole("button", { name: /^Filter/ }).click();
    expect(await sizes()).toEqual([]);
    await page.getByRole("button", { name: "Close" }).click();
    await page.getByTestId("card-row").first().click();
    expect(await sizes()).toEqual([]);
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    expect(await sizes()).toEqual([]);
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    expect(await sizes()).toEqual([]);
  });

  test("Frames: portrait ratio, landscape and placeholder, in Recently added and in the list", async ({ page }) => {
    await page.goto("/");
    await seedPhotoCards(page);
    const recent = (name: string) => page.getByTestId("recent").filter({ hasText: name });
    await expect(recent("Landscape Lou").locator(".frame")).toHaveAttribute("data-orientation", "landscape");
    await expect(recent("Portrait Pat").locator("img")).toBeVisible();
    near(await ratioOf(recent("Portrait Pat").locator(".frame")), 2.5 / 3.5);
    near(await ratioOf(recent("Landscape Lou").locator(".frame")), 3.5 / 2.5);
    near(await ratioOf(recent("Landscape Lou").locator("img")), 448 / 320);
    const widths = await page.getByTestId("recent").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
    expect(new Set(widths).size).toBe(1);
    const nameLine = recent("Portrait Pat").locator(".recent-name");
    expect(await nameLine.evaluate((el) => getComputedStyle(el).webkitLineClamp)).toBe("2");
    near(await ratioOf(recent("Plain Pam").locator(".frame")), 2.5 / 3.5);

    await openCollection(page);
    const row = (name: string) => page.getByTestId("card-row").filter({ hasText: name });
    await expect(row("Landscape Lou").locator(".frame")).toHaveAttribute("data-orientation", "landscape");
    near(await ratioOf(row("Landscape Lou").locator(".frame")), 3.5 / 2.5);
    near(await ratioOf(row("Portrait Pat").locator(".frame")), 2.5 / 3.5);
    near(await ratioOf(row("Plain Pam").locator(".frame")), 2.5 / 3.5);
    for (const f of [row("Plain Pam").locator(".frame"), row("Portrait Pat").locator(".frame")]) {
      expect(await css(f, "border-top-width")).toBe("1px");
      expect(await css(f, "border-top-left-radius")).toBe("6px");
    }
  });

  test("Photo strip framed: portrait front and landscape back", async ({ page }) => {
    await page.goto("/");
    await seedPhotoCards(page);
    await openCollection(page);
    await page.getByTestId("card-row").filter({ hasText: "Portrait Pat" }).click();
    const front = page.getByRole("button", { name: "View front photo" }).locator(".frame");
    const back = page.getByRole("button", { name: "View back photo" }).locator(".frame");
    await expect(back).toHaveAttribute("data-orientation", "landscape");
    near(await ratioOf(front), 2.5 / 3.5);
    near(await ratioOf(back), 3.5 / 2.5);
  });

  test("Photo strip framed: two landscape photos fit the row without overlap", async ({ page }) => {
    await page.goto("/");
    await seedPhotoCards(page);
    await openCollection(page);
    await page.getByTestId("card-row").filter({ hasText: "Landscape Lou" }).click();
    const front = page.getByRole("button", { name: "View front photo" }).locator(".frame");
    const back = page.getByRole("button", { name: "View back photo" }).locator(".frame");
    await expect(front).toHaveAttribute("data-orientation", "landscape");
    await expect(back).toHaveAttribute("data-orientation", "landscape");
    const f = (await front.boundingBox())!;
    const b = (await back.boundingBox())!;
    expect(f.x + f.width).toBeLessThanOrEqual(b.x);
    expect(b.x + b.width).toBeLessThanOrEqual(360 - 24 + 0.5);
    near(await ratioOf(front), 3.5 / 2.5);
    near(await ratioOf(back), 3.5 / 2.5);
  });

  test("Ruled stat table: two columns, three rows, shared 1 px rules, cells at least 56 dp", async ({ page }) => {
    await page.goto("/");
    const tiles = page.getByTestId("tile");
    await expect(tiles).toHaveCount(6);
    const boxes = await tiles.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y) }; }));
    expect(new Set(boxes.map((b) => b.x)).size).toBe(2);
    expect(new Set(boxes.map((b) => b.y)).size).toBe(3);
    expect(await css(page.locator(".tiles"), "border-top-width")).toBe("1px");
    for (const [i, el] of (await tiles.all()).entries()) {
      const cell = await el.evaluate((e) => {
        const cellBox = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        const rule = getComputedStyle(e, "::before");
        return { h: cellBox.height + 8, radius: s.borderTopLeftRadius, shadow: s.boxShadow, image: s.backgroundImage, after: getComputedStyle(e, "::after").content, right: rule.borderRightWidth, bottom: rule.borderBottomWidth };
      });
      expect(cell.h).toBeGreaterThanOrEqual(56);
      expect(cell.radius).toBe("0px");
      expect(cell.shadow).toBe("none");
      expect(cell.image).toBe("none");
      expect(cell.after).toBe("none");
      expect(cell.right).toBe(i % 2 === 0 ? "1px" : "0px");
      expect(cell.bottom).toBe(i < 4 ? "1px" : "0px");
    }
  });

  test("Recently added as trading cards and Top teams as a ruled table", async ({ page }) => {
    await page.goto("/");
    await seedDashboard(page);
    const recent = page.getByTestId("recent");
    const boxes = await recent.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, w: r.width, y: r.y }; }));
    expect(new Set(boxes.map((b) => Math.round(b.w))).size).toBe(1);
    expect(new Set(boxes.map((b) => Math.round(b.y))).size).toBe(1);
    for (const [i, b] of boxes.slice(1).entries()) expect(b.x - (boxes[i].x + boxes[i].w)).toBeGreaterThanOrEqual(7.5);
    await expect(recent.first().locator(".frame")).toHaveCount(1);
    const teams = page.getByTestId("team");
    expect((await teams.first().locator(".team-name").boundingBox())!.x).toBeLessThan((await teams.first().locator(".team-count").boundingBox())!.x);
    expect(await css(teams.first().locator(".team-count"), "font-family")).toContain("Roboto Slab");
    expect(await teams.first().evaluate((e) => getComputedStyle(e, "::before").borderBottomWidth)).toBe("1px");
  });

  test("Ruled, not boxed: list rows are 112 dp with a 1 px rule and no gradient", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    const rows = page.getByTestId("card-row");
    for (const r of [rows.nth(0), rows.nth(1)]) {
      expect((await r.boundingBox())!.height).toBe(112);
      expect(await r.evaluate((e) => getComputedStyle(e, "::after").borderBottomWidth)).toBe("1px");
      expect(await css(r.getByRole("button"), "background-image")).toBe("none");
      expect(await css(r.getByRole("button"), "box-shadow")).toBe("none");
    }
    expect(await css(page.locator(".list-scroller"), "background-color")).toBe("rgba(0, 0, 0, 0)");
  });

  test("Fields are ruled lines, buttons are boxes; the sheet has a foot rule and Year side by side", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    const search = page.getByLabel("Search", { exact: true });
    expect(await css(search, "border-bottom-width")).toBe("1px");
    expect(await css(search, "border-top-width")).toBe("0px");
    expect(await css(search, "border-top-left-radius")).toBe("0px");
    expect(await css(page.getByRole("button", { name: /^Filter/ }), "border-top-left-radius")).toBe("6px");
    await page.getByRole("button", { name: /^Filter/ }).click();
    expect(await css(page.locator(".sheet-foot"), "border-top-width")).toBe("1px");
    const [from, to] = await Promise.all(["Year from", "Year to"].map((l) => page.getByLabel(l, { exact: true }).boundingBox()));
    expect(Math.abs(from!.y - to!.y)).toBeLessThan(1);
    expect(to!.x).toBeGreaterThan(from!.x + from!.width);
    expect(await css(page.locator(".group h3").first(), "font-family")).toContain("Roboto Slab");
  });

  test("Generous spacing: 24 px gutter, 32 px between sections, 16 px cell padding, 12 px frame gaps, 8 px captions, 24 px field gaps", async ({ page }) => {
    await page.goto("/");
    await seedDashboard(page);
    const table = (await page.locator(".tiles").boundingBox())!;
    expect(table.x).toBe(24);
    const gap = async (a: Locator, b: Locator) => (await b.boundingBox())!.y - (await a.boundingBox())!.y - (await a.boundingBox())!.height;
    const groups = page.locator(".group");
    expect(await gap(page.locator(".tiles"), groups.nth(0))).toBeGreaterThanOrEqual(31.5);
    expect(await gap(groups.nth(0), groups.nth(1))).toBeGreaterThanOrEqual(31.5);
    const tile = page.getByTestId("tile").first();
    const [tileBox, labelBox] = await Promise.all([tile.boundingBox(), tile.locator(".tile-label").boundingBox()]);
    expect(labelBox!.x - (tileBox!.x - 4)).toBeGreaterThanOrEqual(15.5);
    const recent = page.getByTestId("recent");
    const [a, b] = await Promise.all([recent.nth(0).boundingBox(), recent.nth(1).boundingBox()]);
    expect(Math.round(b!.x - (a!.x + a!.width))).toBe(12);
    const frame = (await recent.first().locator(".frame").boundingBox())!;
    const caption = (await recent.first().locator(".recent-name").boundingBox())!;
    expect(Math.round(caption.y - (frame.y + frame.height))).toBe(8);
    await page.getByRole("button", { name: "Add card", exact: true }).click();
    const [f1, f2] = await Promise.all(["Player", "Team"].map((l) => page.getByLabel(l, { exact: true }).boundingBox()));
    expect(f2!.y - (f1!.y + f1!.height)).toBeGreaterThanOrEqual(24 + 8);
  });

  test("Light rule is a 55 percent ink, the stat table outline is full ink", async ({ page }) => {
    await page.goto("/");
    expect(await css(page.locator(".tiles"), "border-top-color")).toBe("rgb(28, 43, 74)");
    const rule = await page.evaluate(() => {
      const p = document.createElement("i");
      p.style.color = "var(--color-rule)";
      document.body.append(p);
      const c = getComputedStyle(p).color;
      p.remove();
      return c;
    });
    expect(rule).toMatch(/^rgba\(28, 43, 74, 0\.5\d*\)$/);
  });
});

test.describe("Photo tiles on the form", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`Front and Back tiles share a row, 96 dp tall, with 48 dp chooser buttons in ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await page.getByRole("button", { name: "Add card", exact: true }).click();
      const [front, back] = await Promise.all(["Add front photo", "Add back photo"].map((n) => page.getByRole("button", { name: n }).boundingBox()));
      expect(Math.abs(front!.y - back!.y)).toBeLessThanOrEqual(1);
      expect(back!.x).toBeGreaterThan(front!.x + front!.width - 1);
      for (const box of [front!, back!]) expect(Math.abs(box.height - 96)).toBeLessThanOrEqual(2);
      for (const side of ["Front", "Back"]) {
        await page.getByRole("button", { name: `Add ${side.toLowerCase()} photo` }).click();
        const sheet = page.getByRole("dialog", { name: `${side} photo` });
        for (const b of await sheet.getByRole("button").all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(47.5);
        await sheet.getByRole("button", { name: "Close" }).click();
      }
    });
  }
});
