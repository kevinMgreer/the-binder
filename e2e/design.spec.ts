import { expect, test, type Locator, type Page } from "@playwright/test";

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

  test("overriding the accent token restyles button, active chip and serial tag", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await seed(page, CARDS);
    await applyYearFrom(page, "2000");
    const chip = page.getByRole("button", { name: "Remove Year filter" });
    const add = page.getByRole("button", { name: "Add card", exact: true });
    const tag = page.getByTestId("card-row").filter({ hasText: "Acuña" }).getByText("13/150");
    await page.evaluate(() => document.documentElement.style.setProperty("--color-accent", "rgb(1, 2, 3)"));
    expect(await css(add, "background-color")).toBe("rgb(1, 2, 3)");
    expect(await css(chip, "background-color")).toBe("rgb(1, 2, 3)");
    expect(await css(tag, "color")).toBe("rgb(1, 2, 3)");
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

    test("First screen: count, sync state, search and Filter, then at least three rows", async ({ page }) => {
      const summary = page.getByTestId("summary");
      const status = page.locator("header").getByTestId("sync-status");
      const search = page.getByLabel("Search", { exact: true });
      const filter = page.getByRole("button", { name: /^Filter/ });
      const add = page.getByRole("button", { name: "Add card", exact: true });
      for (const el of [summary, status, search, filter, add, page.getByTestId("card-row").first()]) await expect(el).toBeInViewport();
      const ys = await Promise.all([summary, search].map(async (l) => (await l.boundingBox())!.y));
      expect(ys[0]).toBeLessThan(ys[1]);
      expect(Math.abs((await search.boundingBox())!.y - (await filter.boundingBox())!.y)).toBeLessThan(24);
      const addTop = (await add.boundingBox())!.y;
      const rows = await page.getByTestId("card-row").all();
      let clear = 0;
      for (const r of rows) {
        const box = await r.boundingBox();
        if (box && box.y + box.height <= addTop) clear++;
      }
      expect(clear).toBeGreaterThanOrEqual(3);
    });

    test("One add action: a single button opens Scan card, Pick from photos and Enter by hand", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Add card", exact: true })).toHaveCount(1);
      for (const name of ["Scan card", "Pick from photos", "Enter by hand"]) await expect(page.getByRole("button", { name })).toHaveCount(0);
      await page.getByRole("button", { name: "Add card", exact: true }).click();
      const sheet = page.getByRole("dialog", { name: "Add a card" });
      for (const name of ["Scan card", "Pick from photos", "Enter by hand"]) await expect(sheet.getByRole("button", { name })).toBeVisible();
    });

    test("A sheet takes focus when it opens and closes on Escape", async ({ page }) => {
      await page.getByRole("button", { name: "Add card", exact: true }).click();
      await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Add a card" })).toHaveCount(0);
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

    test("The count reads 1 card or N cards", async ({ page }) => {
      await expect(page.getByTestId("summary")).toHaveText(/^5 cards, 4 distinct$/);
      await page.evaluate(async () => {
        const ports = (window as unknown as Win).__ports;
        const cards = await ports.collection.list();
        await ports.collection.clear();
        await ports.collection.putMany(cards.slice(0, 1).map((c: any) => ({ ...c, quantity: 1 })));
      });
      await page.reload();
      await expect(page.getByTestId("summary")).toHaveText("1 card, 1 distinct");
    });

    test("Each sync state shows its wording in the header", async ({ page }) => {
      const states: [object, string][] = [
        [{ state: "syncing", pending: 0 }, "Syncing…"],
        [{ state: "error", pending: 2 }, "Sync problem, retrying (2 unsynced)"],
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
      expect(await css(tag, "color")).not.toBe(await css(plain.getByText("Plain Card"), "color"));
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
    await page.evaluate(() => document.documentElement.style.setProperty("--color-accent", "rgb(1, 2, 3)"));
    expect(await css(button, "color")).not.toBe("rgb(1, 2, 3)");
    expect(await css(button, "background-color")).not.toBe("rgb(1, 2, 3)");
  };

  const gap = async (a: Locator, b: Locator) => {
    const [x, y] = [(await a.boundingBox())!, (await b.boundingBox())!];
    return Math.max(y.y - (x.y + x.height), x.y - (y.y + y.height), y.x - (x.x + x.width), x.x - (y.x + y.width));
  };

  test("Delete is not beside Edit", async ({ page }) => {
    await page.goto("/");
    await seed(page, CARDS);
    await page.getByTestId("card-row").filter({ hasText: "Acuña" }).click();
    const del = page.getByRole("button", { name: "Delete", exact: true });
    expect(await gap(page.getByRole("button", { name: "Edit", exact: true }), del)).toBeGreaterThanOrEqual(24);
    await notAccent(page, del);
    await expect(page.getByText("13/150")).toBeVisible();
  });

  test("Detail photos are thumbnails: Edit and Delete show without scrolling and a tap opens the zoom view", async ({ page }) => {
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
    await page.getByTestId("card-row").first().click();
    const thumb = page.getByRole("button", { name: "View front photo" });
    await expect(thumb).toBeVisible();
    const box = (await thumb.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(90);
    expect(box.height).toBeLessThanOrEqual(104);
    await expect(page.getByRole("button", { name: "View back photo" })).toBeVisible();
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
    expect((await row.boundingBox())!.height).toBeLessThanOrEqual(100);
    const num = row.locator(".num");
    expect((await num.boundingBox())!.x + (await num.boundingBox())!.width).toBeLessThanOrEqual((await row.boundingBox())!.x + (await row.boundingBox())!.width);
    await expect(num).toBeVisible();
    expect(await num.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  for (const [name, open, last] of [
    ["Add card", (p: Page) => p.getByRole("button", { name: "Add card", exact: true }).click(), "Enter by hand"],
    ["Filters", (p: Page) => p.getByRole("button", { name: /^Filter/ }).click(), "Clear all"],
  ] as const) {
    test(`${name} sheet sits above a bottom system bar`, async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => document.documentElement.style.setProperty("--safe-area-inset-bottom", "48px"));
      await open(page);
      const button = page.getByRole("dialog").getByRole("button", { name: last, exact: true });
      await expect(button).toBeVisible();
      expect(await bottom(button)).toBeLessThanOrEqual(800 - 48 - 16);
    });
  }

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
    expect(await facts.locator("dt").allTextContents()).toEqual(["Manufacturer", "Team", "Parallel", "Condition", "Quantity"]);
    expect(await facts.locator("dd").allTextContents()).toEqual(["Topps", "Atlanta Braves", "Gold", "PSA 9", "3"]);
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
    expect((await edit.boundingBox())!.width).toBeGreaterThanOrEqual(360 - 2 * 12 - 1);
    expect(await css(edited, "color")).toBe(await css(subtitle, "color"));
    await page.evaluate(() => document.documentElement.style.setProperty("--color-accent-text", "rgb(1, 2, 3)"));
    expect(await css(badge, "color")).toBe("rgb(1, 2, 3)");
  });
});

type Box = { x: number; y: number; width: number; height: number };
const CONTROLS = "button, a[href], input:not([type=checkbox]), select, textarea, summary, label.check, [data-testid=card-row] > button";

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
    await page.getByRole("button", { name: "Add card", exact: true }).click();
    await expectTouchable(page, "add sheet");
    await page.getByRole("button", { name: "Close" }).click();
    await page.getByRole("button", { name: /^Filter/ }).click();
    await expectTouchable(page, "filter sheet");
    await page.getByRole("button", { name: /^Show \d+ cards?$/ }).click();
    await applyYearFrom(page, "2000");
    await expectTouchable(page, "applied chip");
    await page.getByTestId("card-row").first().click();
    await expectTouchable(page, "detail");
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await expectTouchable(page, "form");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Back" }).click();
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
});
