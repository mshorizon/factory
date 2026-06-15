/**
 * render — screenshot ONE section via the isolation harness (DESIGN §4.4).
 *
 * Promoted from the Phase −1 spike (which validated isolated ≈ in-page design
 * fidelity). Renders through the engine's real `/sitc-harness/section` route,
 * forces entrance animations to their final state, and strips fixed/sticky
 * chrome so the screenshot is just the section node.
 */
import { chromium } from "playwright";
import type { Breakpoint, RenderResult } from "../types.js";

/** The dev-only route added to apps/engine (see DESIGN §4.4). */
export const HARNESS_ROUTE = "/sitc-harness/section";

export const DESKTOP_SCORE: Breakpoint = { label: "desktop", width: 1440, height: 900, role: "score" };
export const MOBILE_GUARD: Breakpoint = { label: "mobile", width: 390, height: 844, role: "guard" };

export interface RenderSectionOptions {
  /** Engine origin, e.g. "http://localhost:4321". */
  baseUrl: string;
  business: string;
  page?: string;
  index?: number;
  breakpoint?: Breakpoint;
  /** Settle time (ms) for scroll-reveal entrance after forcing animations to 0. */
  settleMs?: number;
}

const FREEZE_CSS =
  "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}";

export async function renderSection(opts: RenderSectionOptions): Promise<RenderResult> {
  const bp = opts.breakpoint ?? DESKTOP_SCORE;
  const page = opts.page ?? "home";
  const index = opts.index ?? 0;
  const url = `${opts.baseUrl}${HARNESS_ROUTE}?business=${encodeURIComponent(opts.business)}&page=${encodeURIComponent(page)}&index=${index}`;

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const pg = await ctx.newPage();
    await pg.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await pg.evaluate(() => (document as Document).fonts?.ready);
    const el = pg.locator(`[data-section-index="0"]`).first();
    await el.waitFor({ state: "visible", timeout: 30000 });
    await el.scrollIntoViewIfNeeded();
    await pg.addStyleTag({ content: FREEZE_CSS });
    await pg.waitForTimeout(opts.settleMs ?? 700);
    // Strip fixed/sticky chrome (out of flow → does not shift the section).
    await pg.evaluate(() => {
      for (const n of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
        const pos = getComputedStyle(n).position;
        if (pos === "fixed" || pos === "sticky") n.style.display = "none";
      }
    });
    await pg.waitForTimeout(120);
    const box = await el.boundingBox();
    const png = await el.screenshot({ animations: "disabled" });
    return {
      png,
      box: { width: Math.round(box?.width ?? bp.width), height: Math.round(box?.height ?? 0) },
      url,
      breakpoint: bp.label,
    };
  } finally {
    await browser.close();
  }
}
