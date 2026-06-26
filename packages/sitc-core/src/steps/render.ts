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
  /**
   * Render the run's EVOLVING profile from a working file instead of the DB
   * (DESIGN §13.2 "working file" path). Absolute path to a template JSON inside
   * the worktree the worker just edited. The dev-only harness reads it directly,
   * so the inner loop needs no DB round-trip. `business` is still used to resolve
   * image refs. Ignored unless the engine harness has filesystem mode enabled.
   */
  profilePath?: string;
  /** Max wait for the section node to be visible (ms). Default 30s; raise for cold engines. */
  waitForMs?: number;
  /** Render a global-chrome unit (navbar/footer) in isolation instead of a page section. */
  chrome?: "navbar" | "footer";
}

/** Build the harness URL for a section — shared by render + engine warm-up so they hit the SAME route. */
export function harnessUrl(opts: { baseUrl: string; business: string; page?: string; index?: number; profilePath?: string; chrome?: "navbar" | "footer" }): string {
  const page = opts.page ?? "home";
  const index = opts.index ?? 0;
  const profileQ = opts.profilePath ? `&profilePath=${encodeURIComponent(opts.profilePath)}` : "";
  const chromeQ = opts.chrome ? `&chrome=${opts.chrome}` : "";
  return `${opts.baseUrl}${HARNESS_ROUTE}?business=${encodeURIComponent(opts.business)}&page=${encodeURIComponent(page)}&index=${index}${profileQ}${chromeQ}`;
}

const FREEZE_CSS =
  "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}";

export async function renderSection(opts: RenderSectionOptions): Promise<RenderResult> {
  const bp = opts.breakpoint ?? DESKTOP_SCORE;
  const page = opts.page ?? "home";
  const index = opts.index ?? 0;
  const url = harnessUrl(opts);

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const pg = await ctx.newPage();
    const resp = await pg.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    // FAIL FAST on a broken edit: a runtime error in the worker's component makes
    // Astro SSR return 500. Surface it immediately (→ revert + feeds the worker's
    // next critique) instead of hanging until the visibility timeout.
    if (resp && resp.status() >= 400) {
      // Raw SSR body carries Astro's error message + stack (the rendered DOM is
      // empty at domcontentloaded). Strip tags to a readable snippet for the critique.
      const raw = await resp.text().catch(() => "");
      const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      throw new Error(`render HTTP ${resp.status()} (index ${index}): ${text.slice(0, 400)}`);
    }
    await pg.evaluate(() => (document as Document).fonts?.ready);
    // Wait for the section node OR a Vite/Astro error overlay — whichever appears first.
    const outcome = await pg
      .waitForFunction(
        () =>
          document.querySelector('[data-section-index="0"]')
            ? "ok"
            : document.querySelector("vite-error-overlay")
              ? "error"
              : false,
        { timeout: opts.waitForMs ?? 30000 },
      )
      .then((h) => h.jsonValue() as Promise<string>);
    if (outcome === "error") {
      const msg = await pg.evaluate(() => document.querySelector("vite-error-overlay")?.shadowRoot?.textContent ?? "").catch(() => "");
      throw new Error(`render error overlay (index ${index}): ${String(msg).replace(/\s+/g, " ").trim().slice(0, 300)}`);
    }
    if (opts.chrome) {
      // Chrome mode: the navbar IS fixed/sticky — convert it to static FIRST (before
      // the visibility wait) so the wrapper has real in-flow height; otherwise the
      // 0-height wrapper never becomes "visible" and the wait times out.
      await pg.evaluate(() => {
        for (const n of Array.from(document.querySelectorAll<HTMLElement>("[data-sitc-chrome] *"))) {
          const pos = getComputedStyle(n).position;
          if (pos === "fixed" || pos === "sticky") n.style.position = "static";
        }
      });
    }
    const el = pg.locator(`[data-section-index="0"]`).first();
    await el.waitFor({ state: "visible", timeout: opts.waitForMs ?? 30000 });
    await el.scrollIntoViewIfNeeded();
    await pg.addStyleTag({ content: FREEZE_CSS });
    // Force scroll-reveal / entrance content to its FINAL visible state. Sections
    // use framer-motion (initial opacity:0 + translate, often staggered); CSS
    // freezing doesn't touch those JS-set inline styles, so content stays invisible
    // in the screenshot and the scorer judges a blank section. Reveal it.
    await pg.evaluate(() => {
      for (const n of Array.from(document.querySelectorAll<HTMLElement>("[data-section-index] *"))) {
        const s = n.style;
        if (s.opacity && parseFloat(s.opacity) < 1) s.opacity = "1";
        if (s.transform && s.transform !== "none") s.transform = "none";
        if (s.visibility === "hidden") s.visibility = "visible";
      }
    });
    await pg.waitForTimeout(opts.settleMs ?? 700);
    if (!opts.chrome) {
      // Strip fixed/sticky chrome (out of flow → does not shift the section).
      await pg.evaluate(() => {
        for (const n of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
          const pos = getComputedStyle(n).position;
          if (pos === "fixed" || pos === "sticky") n.style.display = "none";
        }
      });
    }
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

/**
 * Measure horizontal overflow (px) of the section at a given breakpoint — the cheap
 * signal behind the mobile guard (I12). Loads the harness page at the viewport and
 * returns `scrollWidth − clientWidth` (clamped ≥ 0); a positive value means the
 * section spills sideways (broken responsive layout). Defaults to mobile.
 */
export async function measureHorizontalOverflow(opts: {
  baseUrl: string;
  business: string;
  page?: string;
  index?: number;
  profilePath?: string;
  chrome?: "navbar" | "footer";
  breakpoint?: Breakpoint;
  waitForMs?: number;
}): Promise<number> {
  const bp = opts.breakpoint ?? MOBILE_GUARD;
  const url = harnessUrl(opts);
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: bp.width, height: bp.height }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const pg = await ctx.newPage();
    const resp = await pg.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (resp && resp.status() >= 400) throw new Error(`overflow probe HTTP ${resp.status()}`);
    await pg.locator(`[data-section-index="0"]`).first().waitFor({ state: "attached", timeout: opts.waitForMs ?? 30000 });
    const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    return Math.max(0, overflow);
  } finally {
    await browser.close();
  }
}
