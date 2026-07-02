// Capture a single harness-rendered section to a named PNG (for building the
// Spike 2 judge-triple library).
// Run: node sitc-capture.mjs <business> <page> <index> <outName>
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SITC_BASE || "http://localhost:4321";
const [, , business, pageSlug = "home", index = "0", outName] = process.argv;
const OUT = path.resolve("../../screenshots/sitc-spike/lib");
fs.mkdirSync(OUT, { recursive: true });
const url = `${BASE}/sitc-harness/section?business=${business}&page=${pageSlug}&index=${index}`;
const name = outName || `${business}-${pageSlug}-${index}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
const el = page.locator(`[data-section-index="0"]`).first();
await el.waitFor({ state: "visible", timeout: 30000 });
await el.scrollIntoViewIfNeeded();
await page.addStyleTag({ content: `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}` });
await page.waitForTimeout(700);
await page.evaluate(() => {
  for (const n of Array.from(document.querySelectorAll("body *"))) {
    const p = getComputedStyle(n).position;
    if (p === "fixed" || p === "sticky") n.style.display = "none";
  }
});
await page.waitForTimeout(150);
await el.screenshot({ path: path.join(OUT, `${name}.png`), animations: "disabled" });
await browser.close();
console.log(`saved ${name}.png`);
