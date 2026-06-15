/**
 * Frozen, de-noised target capture (DESIGN §4.3).
 *
 * Turns a live, messy URL into a STABLE goal: dismiss cookie/consent banners,
 * disable animations, wait for network idle + fonts, trigger lazy-load, then
 * full-page screenshot per breakpoint. Runs ONCE at run start; the loop never
 * re-fetches the URL.
 */
import { chromium, type Page } from "playwright";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Breakpoint } from "../types.js";
import { DESKTOP_SCORE, MOBILE_GUARD } from "../steps/render.js";

const FREEZE_CSS =
  "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}";

const ACCEPT_LABELS = [
  /accept all/i, /accept/i, /allow all/i, /agree/i, /got it/i, /ok/i,
  /akceptuj wszystkie/i, /akceptuj/i, /zgadzam/i, /zezwól/i, /rozumiem/i,
];

async function dismissBanners(page: Page): Promise<void> {
  for (const re of ACCEPT_LABELS) {
    try {
      const btn = page.getByRole("button", { name: re }).first();
      if (await btn.isVisible({ timeout: 400 }).catch(() => false)) {
        await btn.click({ timeout: 800 }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }
}

async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let y = 0;
      const step = 600;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        y += step;
        if (y >= document.body.scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 60);
    });
  });
}

export interface CaptureTargetOptions {
  url: string;
  outDir: string;
  breakpoints?: Breakpoint[];
}

export interface CaptureResult {
  url: string;
  /** breakpoint label → screenshot path (the immutable goal). */
  screenshots: Record<string, string>;
}

export async function captureTarget(opts: CaptureTargetOptions): Promise<CaptureResult> {
  const bps = opts.breakpoints ?? [DESKTOP_SCORE, MOBILE_GUARD];
  await fs.mkdir(opts.outDir, { recursive: true });
  const browser = await chromium.launch();
  const screenshots: Record<string, string> = {};
  try {
    for (const bp of bps) {
      const ctx = await browser.newContext({
        viewport: { width: bp.width, height: bp.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      const pg = await ctx.newPage();
      await pg.goto(opts.url, { waitUntil: "networkidle", timeout: 60000 });
      await dismissBanners(pg);
      await pg.addStyleTag({ content: FREEZE_CSS });
      await pg.evaluate(() => (document as Document).fonts?.ready);
      await autoScroll(pg);
      await pg.waitForTimeout(500);
      const file = path.join(opts.outDir, `target-${bp.label}.png`);
      await pg.screenshot({ path: file, fullPage: true, animations: "disabled" });
      screenshots[bp.label] = file;
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  return { url: opts.url, screenshots };
}
