#!/usr/bin/env node
/**
 * Takes viewport screenshots of all template live demo sites.
 * Run after modifying templates to update the screenshots on the /templates page.
 *
 * Usage:
 *   node scripts/update-template-screenshots.mjs
 *   node scripts/update-template-screenshots.mjs template-law  # single template
 *
 * Output: apps/engine/public/screenshots/{name}.png
 */

import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "apps", "engine", "public", "screenshots");

const TEMPLATES = [
  {
    name: "template-law",
    url: "https://template-law.hazelgrouse.pl",
    label: "Template Law",
  },
  {
    name: "template-specialist",
    url: "https://template-specialist.hazelgrouse.pl",
    label: "Template Specialist",
  },
  {
    name: "template-tech",
    url: "https://template-tech.hazelgrouse.pl",
    label: "Template Tech",
  },
  {
    name: "template-art",
    url: "https://template-art.hazelgrouse.pl",
    label: "Template Art",
  },
];

async function takeScreenshot(browser, template) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log(`  → ${template.label}: ${template.url}`);

  try {
    await page.goto(template.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1000);

    const outputPath = join(OUTPUT_DIR, `${template.name}.png`);
    await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`  ✓ Saved: ${outputPath}`);
  } catch (err) {
    console.error(`  ✗ Failed (${template.name}): ${err.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const targetName = process.argv[2];
  const targets = targetName
    ? TEMPLATES.filter((t) => t.name === targetName)
    : TEMPLATES;

  if (targetName && targets.length === 0) {
    console.error(`Unknown template: ${targetName}`);
    console.error(`Available: ${TEMPLATES.map((t) => t.name).join(", ")}`);
    process.exit(1);
  }

  console.log(`Taking screenshots for ${targets.length} template(s)...\n`);

  const browser = await chromium.launch();
  for (const template of targets) {
    await takeScreenshot(browser, template);
  }
  await browser.close();

  console.log("\nDone. Sync to DB and restart dev server to see changes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
