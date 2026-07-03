/**
 * Shared Playwright browser (todo I26).
 *
 * THE COST THIS REMOVES: renderSection, measureHorizontalOverflow, captureTarget,
 * and every acceptance check each did `chromium.launch()`/`close()` per call — a
 * run takes hundreds of screenshots, and machine contention is the dominant local
 * failure mode (CONCLUSIONS #6), so ~1–2s + a process fork per screenshot was
 * self-inflicted load.
 *
 * One browser per process; every caller gets a FRESH context (full isolation:
 * cookies/cache/viewport per call) that is always closed. The browser survives a
 * crash by relaunching on next use. `closeSharedBrowser()` belongs in the driver's
 * cleanup; an unclosed browser dies with the process either way.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

let shared: Promise<Browser> | null = null;

export async function sharedBrowser(): Promise<Browser> {
  if (shared) {
    const alive = await shared.catch(() => null);
    if (alive?.isConnected()) return alive;
    shared = null; // crashed / closed — relaunch below
  }
  shared = chromium.launch();
  return shared;
}

export interface WithPageOptions {
  viewport: { width: number; height: number };
  deviceScaleFactor?: number;
  reducedMotion?: "reduce" | "no-preference";
}

/** Run `fn` on a fresh page in a fresh context of the shared browser; the context always closes. */
export async function withPage<T>(opts: WithPageOptions, fn: (page: Page, ctx: BrowserContext) => Promise<T>): Promise<T> {
  const browser = await sharedBrowser();
  const ctx = await browser.newContext({
    viewport: opts.viewport,
    deviceScaleFactor: opts.deviceScaleFactor ?? 1,
    ...(opts.reducedMotion ? { reducedMotion: opts.reducedMotion } : {}),
  });
  try {
    const page = await ctx.newPage();
    return await fn(page, ctx);
  } finally {
    await ctx.close().catch(() => {});
  }
}

export async function closeSharedBrowser(): Promise<void> {
  const b = shared ? await shared.catch(() => null) : null;
  shared = null;
  if (b) await b.close().catch(() => {});
}
