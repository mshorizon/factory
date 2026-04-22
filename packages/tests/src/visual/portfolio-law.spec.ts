import { test, expect } from "@playwright/test";

const SUBDOMAIN = "portfolio-law";
const BASE = `http://${SUBDOMAIN}.localhost:4321`;

const PAGES = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "files", path: "/files" },
  { name: "contact", path: "/contact" },
  { name: "informations", path: "/informations" },
  { name: "rodo", path: "/rodo" },
] as const;

test.describe("portfolio-law — client regression guard", () => {
  test("all pages return 200", async ({ page }) => {
    for (const { name, path } of PAGES) {
      const response = await page.goto(`${BASE}${path}`, {
        waitUntil: "load",
        timeout: 30000,
      });
      expect(response?.status(), `${name} (${path}) should return 200`).toBe(200);
    }
  });

  for (const { name, path } of PAGES) {
    test(`${name} — full page`, async ({ page, browserName }) => {
      await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot(`${name}-${browserName}-full.png`, {
        fullPage: true,
        animations: "disabled",
        maxDiffPixelRatio: 0.03,
        timeout: 15000,
      });
    });

    test(`${name} — above fold`, async ({ page, browserName }) => {
      await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${name}-${browserName}-fold.png`, {
        fullPage: false,
        animations: "disabled",
        maxDiffPixelRatio: 0.03,
        timeout: 10000,
      });
    });
  }
});
