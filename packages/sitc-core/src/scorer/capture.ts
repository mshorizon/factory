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
  /**
   * Target section boundaries read from the DOM at desktop width (px, document
   * coords matching the full-page screenshot). FAR more accurate than VLM pixel
   * guesses — the VLM under-segments a multi-section page into a few coarse
   * bands whose y-ranges straddle real section boundaries, mis-aligning every
   * section. Empty if extraction found nothing usable (caller falls back to VLM
   * segmentation). DESIGN §4.3.
   */
  domBands: { yStart: number; yEnd: number }[];
}

/**
 * Read the page's top-level section blocks as y-ranges. Descends through
 * single-child / wrapper elements to the real section list, then takes
 * full-width, tall, in-flow children. Pure DOM measurement, no labels
 * (alignment is positional anyway).
 */
async function extractDomBands(page: Page): Promise<{ yStart: number; yEnd: number }[]> {
  // NOTE: no nested named functions inside page.evaluate — tsx/esbuild instruments
  // them with a `__name` helper that doesn't exist in the browser context (throws
  // "__name is not defined"). Everything below is inlined / a flat queue.
  return page.evaluate(() => {
    // esbuild (via tsx) instruments named functions with a `__name(fn,name)` call;
    // that helper isn't defined in the browser eval context, so shim it to identity.
    (globalThis as unknown as { __name?: (f: unknown) => unknown }).__name ??= (f) => f;
    const vw = window.innerWidth;
    const pageH = document.documentElement.scrollHeight;
    const MIN_H = 160;

    // full-width, in-flow, tall children of `el` (inlined; used in the loop below)
    const secsOf = (el: Element): Element[] => {
      const out: Element[] = [];
      for (const c of Array.from(el.children)) {
        const cs = getComputedStyle(c);
        if (cs.position === "fixed" || cs.position === "sticky" || cs.display === "none") continue;
        const r = c.getBoundingClientRect();
        if (r.width >= vw * 0.85 && r.height >= MIN_H) out.push(c);
      }
      return out;
    };

    // 1. descend through single dominant wrappers to the first level with ≥2 sections
    let root: Element = document.body;
    for (let d = 0; d < 8; d++) {
      const s = secsOf(root);
      if (s.length === 1) root = s[0];
      else break;
    }

    // 2. iterative explode: a node that is a dominant wrapper (>45% page height with
    //    ≥2 section children) is replaced by its children; everything else is a final
    //    band. FIFO queue, no recursion. Normal sections (<45% page) are kept whole.
    const finals: Element[] = [];
    const queue: Element[] = secsOf(root).length >= 2 ? [...secsOf(root)] : [];
    let guard = 0;
    while (queue.length && guard++ < 1000) {
      const el = queue.shift() as Element;
      const sub = secsOf(el);
      if (el.getBoundingClientRect().height > 0.45 * pageH && sub.length >= 2) {
        for (const s of sub) queue.push(s);
      } else finals.push(el);
    }

    return finals
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { yStart: Math.round(r.top + window.scrollY), yEnd: Math.round(r.bottom + window.scrollY) };
      })
      .filter((b) => b.yEnd - b.yStart >= 80)
      .sort((a, b) => a.yStart - b.yStart);
  });
}

export async function captureTarget(opts: CaptureTargetOptions): Promise<CaptureResult> {
  const bps = opts.breakpoints ?? [DESKTOP_SCORE, MOBILE_GUARD];
  await fs.mkdir(opts.outDir, { recursive: true });
  const browser = await chromium.launch();
  const screenshots: Record<string, string> = {};
  let domBands: { yStart: number; yEnd: number }[] = [];
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
      // DOM section boundaries at the SCORING breakpoint only (scroll reset to 0).
      if (bp.role === "score") {
        await pg.evaluate(() => window.scrollTo(0, 0));
        domBands = await extractDomBands(pg).catch(() => []);
      }
      const file = path.join(opts.outDir, `target-${bp.label}.png`);
      await pg.screenshot({ path: file, fullPage: true, animations: "disabled" });
      screenshots[bp.label] = file;
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  return { url: opts.url, screenshots, domBands };
}
