import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config({ path: resolve(__dirname, ".env") });

/**
 * Playwright configuration for visual regression testing.
 * Tests run against localhost:4321 (PM2 dev server).
 */
export default defineConfig({
  testDir: "./src/visual",

  // Snapshots stored alongside test files
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",

  // Fail fast on CI, retry locally
  // Run sequentially to avoid overwhelming dev server (memory issues)
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Sequential execution to prevent OOM crashes

  // Reporter config
  reporter: process.env.CI ? "github" : "html",

  use: {
    // Base URL for all tests
    baseURL: process.env.BASE_URL || "http://localhost:4321",

    // Collect trace on first retry
    trace: "on-first-retry",

    // Screenshot settings for visual regression
    screenshot: "only-on-failure",

    // Viewport - test desktop primarily
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 13"],
      },
    },
  ],

  // Dev server NOT managed by Playwright - we use PM2
  // Ensure `pm2 start astro-dev` is running before tests
  webServer: undefined,
});
