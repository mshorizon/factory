import { test, expect } from "@playwright/test";
import { getAllSubdomains } from "@mshorizon/db";

/**
 * Visual Regression Tests
 *
 * Dynamically generates tests for all businesses in the database.
 * Each test navigates to the business subdomain and takes a full-page screenshot.
 *
 * Prerequisites:
 * - PM2 dev server running on port 4321: `pm2 start astro-dev`
 * - Database seeded: `cd packages/db && pnpm run db:seed`
 */

// Fetch subdomains once before all tests
const subdomains = await getAllSubdomains();
console.log(`Found ${subdomains.length} business(es) to test:`, subdomains);

test.describe("Visual Regression Tests", () => {
  test("should have businesses in database", async () => {
    expect(subdomains.length).toBeGreaterThan(0);
  });

  // Generate individual test for each business - full page
  for (const subdomain of subdomains) {
    test(`${subdomain} - full page screenshot`, async ({ page, browserName }) => {
      const url = `http://${subdomain}.localhost:4321`;

      await page.goto(url, {
        waitUntil: "load",
        timeout: 30000
      });

      // Wait for any animations or lazy-loaded content
      await page.waitForTimeout(1000);

      // Take full-page screenshot and compare
      await expect(page).toHaveScreenshot(`${subdomain}-${browserName}-full-page.png`, {
        fullPage: true,
        animations: "disabled",
        maxDiffPixelRatio: 0.03, // 3% tolerance for minor rendering differences
        timeout: 10000, // Increase screenshot timeout
      });
    });
  }

  // Generate individual test for each business - above the fold
  for (const subdomain of subdomains) {
    test(`${subdomain} - above the fold`, async ({ page, browserName }) => {
      const url = `http://${subdomain}.localhost:4321`;

      await page.goto(url, {
        waitUntil: "load",
        timeout: 30000
      });

      await page.waitForTimeout(500);

      // Capture just the viewport (above-the-fold content)
      await expect(page).toHaveScreenshot(`${subdomain}-${browserName}-hero.png`, {
        fullPage: false,
        animations: "disabled",
        maxDiffPixelRatio: 0.03, // 3% tolerance for minor rendering differences
        timeout: 10000, // Increase screenshot timeout
      });
    });
  }

  // Generate individual test for each business - admin panel (skip for now due to instability)
  // Uncomment when admin panel content is stable
  /*
  for (const subdomain of subdomains) {
    test(`${subdomain} - admin panel`, async ({ page, browserName }) => {
      const url = `http://${subdomain}.localhost:4321/admin`;

      const response = await page.goto(url, {
        waitUntil: "load",
        timeout: 30000
      });

      // Skip if admin panel doesn't exist
      if (response?.status() === 404) {
        test.skip();
      }

      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot(`${subdomain}-admin-${browserName}.png`, {
        fullPage: true,
        animations: "disabled",
        maxDiffPixelRatio: 0.05, // Higher tolerance for dynamic content
        timeout: 15000,
      });
    });
  }
  */
});
