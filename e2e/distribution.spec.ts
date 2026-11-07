import { expect, test, type Page } from "@playwright/test";

type Win = { __ports: any };

async function configure(page: Page, installed: string, latest: string | Error) {
  await page.evaluate(
    ({ installed, latest }) => {
      const ports = (window as unknown as Win).__ports;
      const [major, minor, patch] = installed.split(".").map(Number);
      ports.appInfo.version = { versionName: installed, versionCode: major * 10000 + minor * 100 + patch };
      if (typeof latest === "string") {
        ports.releaseFeed.error = null;
        ports.releaseFeed.release = {
          version: latest,
          apkUrl: `https://github.com/kevinMgreer/the-binder/releases/download/v${latest}/the-binder-${latest}.apk`,
        };
      } else {
        ports.releaseFeed.error = new Error("offline");
      }
    },
    { installed, latest: latest instanceof Error ? latest : latest },
  );
}

const startCheck = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event("online")));
const openSettings = (page: Page) => page.getByRole("button", { name: "Settings" }).click();

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Settings shows the installed version name and version code", async ({ page }) => {
  await configure(page, "1.2.3", "1.2.3");
  await openSettings(page);
  await expect(page.getByTestId("version")).toHaveText("Version 1.2.3 (10203)");
});

test("A newer release is announced with a link to its APK, and nothing is installed by the app", async ({ page }) => {
  await configure(page, "1.2.3", "1.3.0");
  await startCheck(page);
  await expect(page.getByText("Update available: 1.3.0")).toBeVisible();
  const link = page.getByRole("link", { name: "Download 1.3.0" });
  await expect(link).toHaveAttribute("href", "https://github.com/kevinMgreer/the-binder/releases/download/v1.3.0/the-binder-1.3.0.apk");
});

test("Check for updates says the app is up to date when it is the latest release", async ({ page }) => {
  await configure(page, "1.2.3", "1.2.3");
  await openSettings(page);
  await page.getByRole("button", { name: "Check for updates" }).click();
  await expect(page.getByText("You're up to date")).toBeVisible();
});

test("A manual check also offers the newer release", async ({ page }) => {
  await configure(page, "1.2.3", "1.10.0");
  await openSettings(page);
  await page.getByRole("button", { name: "Check for updates" }).click();
  await expect(page.getByRole("link", { name: "Download 1.10.0" })).toBeVisible();
});

test("A failed check is silent on its own and reported on a manual check, and the app keeps working", async ({ page }) => {
  await configure(page, "1.2.3", new Error("offline"));
  await startCheck(page);
  await expect(page.getByText(/update/i)).toHaveCount(0);
  await expect(page.getByTestId("summary")).toBeVisible();

  await openSettings(page);
  await page.getByRole("button", { name: "Check for updates" }).click();
  await expect(page.getByText("Could not check for updates")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByTestId("summary")).toBeVisible();
});
