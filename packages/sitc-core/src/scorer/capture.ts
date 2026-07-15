/**
 * Frozen, de-noised target capture (DESIGN §4.3).
 *
 * Turns a live, messy URL into a STABLE goal: dismiss cookie/consent banners,
 * disable animations, wait for network idle + fonts, trigger lazy-load, then
 * full-page screenshot per breakpoint. Runs ONCE at run start; the loop never
 * re-fetches the URL.
 */
import type { Page } from "playwright";
import { withPage } from "../browser.js";
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

/** Containers a consent/cookie button may legitimately live in (todo I35). */
const BANNER_CONTAINERS =
  '[role="dialog"], [role="alertdialog"], [aria-modal="true"], ' +
  '[class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i], ' +
  '[class*="gdpr" i], [id*="gdpr" i], [class*="privacy" i], [id*="privacy" i]';

/**
 * todo I35 — the old version clicked the FIRST button anywhere matching
 * /ok|accept|agree/i, so a page CTA like "OK, book now" could be clicked and a
 * navigation would poison the one-shot capture the whole run converges toward.
 * Now: (1) only buttons inside banner-ish containers (dialogs / cookie / consent
 * / gdpr) or fixed-position overlays are candidates; (2) after every click the
 * URL is asserted unchanged — a navigation is undone by going back to the
 * capture URL.
 */
async function dismissBanners(page: Page): Promise<void> {
  const captureUrl = page.url();
  const recoverIfNavigated = async () => {
    if (page.url() !== captureUrl) {
      await page.goto(captureUrl, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
    }
  };
  // Pass 1 — named banner containers.
  for (const re of ACCEPT_LABELS) {
    try {
      const btn = page.locator(BANNER_CONTAINERS).getByRole("button", { name: re }).first();
      if (await btn.isVisible({ timeout: 400 }).catch(() => false)) {
        await btn.click({ timeout: 800 }).catch(() => {});
        await recoverIfNavigated();
      }
    } catch {
      /* ignore */
    }
  }
  // Pass 2 — unnamed overlays: a visible matching button whose ancestor is a
  // fixed/sticky layer (cookie bars without cookie-ish class names).
  try {
    await page.evaluate((labels: string[]) => {
      const res = labels.map((s) => new RegExp(s, "i"));
      const isOverlayChild = (el: Element): boolean => {
        for (let n: Element | null = el; n; n = n.parentElement) {
          const pos = getComputedStyle(n).position;
          if (pos === "fixed" || pos === "sticky") return true;
        }
        return false;
      };
      for (const btn of Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]'))) {
        const label = (btn.textContent ?? "").trim();
        if (!label || label.length > 40) continue;
        if (!res.some((r) => r.test(label))) continue;
        if (!isOverlayChild(btn)) continue;
        btn.click();
        return; // one click per pass — re-render settles before anything else
      }
    }, ACCEPT_LABELS.map((r) => r.source));
    await recoverIfNavigated();
  } catch {
    /* ignore */
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

/**
 * Ground-truth styling measured from the target's computed CSS (not VLM-guessed).
 * Used to set exact theme token VALUES and to tell the worker the right token
 * CHOICE per section (the "dark vs light icon badge" class of precision miss).
 */
export interface StyleProfile {
  bg: string; // dominant section/background color
  text: string; // dominant body text color
  accent: string; // dominant non-gray color (brand/gold) from text/border/icon/bg
  headingFont: string;
  bodyFont: string;
  radius: string; // common non-zero border-radius (cards/buttons)
  card?: { bg: string; border: string };
  button?: { bg: string; text: string };
}

/**
 * Reference imagery a target section uses (tasks I11; §18-F). We record the SHAPE
 * and ROLE — aspect ratio, dimensions, foreground-vs-background, alt — NOT the bytes:
 * the loop reproduces a design LANGUAGE with our own/licensed assets, it doesn't copy
 * the target's photos (README §1.1 IP posture). The worker uses this to pick a
 * closer-shaped placeholder/R2/Unsplash asset (a 16:9 hero vs a 1:1 thumbnail scores
 * very differently even with identical structure), closing the "broken/placeholder
 * image" manual gap (CONCLUSIONS #4).
 */
export interface BandImage {
  kind: "img" | "background";
  /** Source URL — kept for the operator/manifest, NOT used to copy bytes. */
  src: string;
  width: number;
  height: number;
  /** width / height, 2dp. */
  aspectRatio: number;
  alt: string;
}

interface BandBase {
  yStart: number;
  yEnd: number;
  style: StyleProfile;
  /** Prominent imagery in this band (area-ranked, top few). I11. */
  images: BandImage[];
}

export interface CaptureResult {
  url: string;
  /** breakpoint label → screenshot path (the immutable goal). */
  screenshots: Record<string, string>;
  /**
   * Target section boundaries read from the DOM at desktop width (px, document
   * coords matching the full-page screenshot), each with measured ground-truth
   * style. FAR more accurate than VLM pixel/color guesses. Empty if extraction
   * found nothing usable (caller falls back to VLM segmentation). DESIGN §4.3.
   */
  domBands: BandBase[];
  /** Whole-page ground-truth style (feeds the global theme pass). */
  globalStyle: StyleProfile | null;
  /** Navbar y-range (the fixed/sticky top header, excluded from domBands) + its style. */
  navbarBand: BandBase | null;
}

/**
 * Summarize a band's reference imagery into a worker hint (I11). Buckets by aspect
 * ratio + flags a full-bleed background, so the worker can choose a matching-shape
 * asset. Pure.
 */
export function summarizeBandImages(images: BandImage[]): string {
  if (!images.length) return "no prominent imagery";
  const bucket = (ar: number) => (ar >= 1.7 ? "wide ~16:9" : ar >= 1.2 ? "landscape ~4:3" : ar >= 0.85 ? "square ~1:1" : "portrait ~3:4");
  const bg = images.find((i) => i.kind === "background");
  const fg = images.filter((i) => i.kind === "img");
  const counts = new Map<string, number>();
  for (const im of fg) {
    const k = bucket(im.aspectRatio);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const parts: string[] = [];
  if (bg) parts.push(`full-bleed background image (${bucket(bg.aspectRatio)})`);
  for (const [k, n] of counts) parts.push(`${n} ${k} image${n > 1 ? "s" : ""}`);
  return parts.length ? parts.join("; ") : "no prominent imagery";
}

/**
 * Read the page's section blocks (y-ranges) AND their measured computed styles.
 * Pure DOM measurement. No nested named functions are used in page.evaluate —
 * tsx/esbuild instruments them with a `__name` helper absent in the browser
 * (we shim it to identity as a belt-and-suspenders).
 */
async function extractDomBands(
  page: Page,
): Promise<{
  bands: BandBase[];
  global: StyleProfile | null;
  navbar: BandBase | null;
}> {
  return page.evaluate(() => {
    (globalThis as unknown as { __name?: (f: unknown) => unknown }).__name ??= (f) => f;
    const vw = window.innerWidth;
    const pageH = document.documentElement.scrollHeight;
    const MIN_H = 160;

    const secsOf = (el: Element): Element[] => {
      const out: Element[] = [];
      for (const c of Array.from(el.children)) {
        const cs = getComputedStyle(c);
        if (cs.position === "fixed" || cs.position === "sticky" || cs.display === "none") continue;
        const r = c.getBoundingClientRect();
        // 0.75 (not 0.85): centered max-width containers (e.g. a 1200px .wrap at a
        // 1440–1512px viewport ≈ 79–83%) are the layout root on many designs — the
        // stricter cut made secsOf find 0 sections and forced the VLM fallback.
        if (r.width >= vw * 0.75 && r.height >= MIN_H) out.push(c);
      }
      return out;
    };

    // ── color helpers ──────────────────────────────────────────────────────
    const parse = (s: string): [number, number, number, number] | null => {
      const m = s && s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(",").map((x) => parseFloat(x));
      return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]];
    };
    const isGray = (c: [number, number, number, number]) => Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 18;
    const top = (m: Map<string, number>): string => {
      let best = "",
        bestV = -1;
      for (const [k, v] of m) if (v > bestV) (best = k), (bestV = v);
      return best;
    };

    // ── measure a subtree's style profile ──────────────────────────────────
    const styleOf = (rootEl: Element) => {
      const nodes = Array.from(rootEl.querySelectorAll("*")).slice(0, 800);
      const bg = new Map<string, number>(),
        textC = new Map<string, number>(),
        accent = new Map<string, number>(),
        radius = new Map<string, number>(),
        hFont = new Map<string, number>(),
        bFont = new Map<string, number>();
      let card: { bg: string; border: string } | undefined;
      let button: { bg: string; text: string } | undefined;
      const add = (m: Map<string, number>, k: string, w = 1) => k && m.set(k, (m.get(k) ?? 0) + w);
      for (const el of nodes) {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const area = r.width * r.height;
        const bgc = parse(cs.backgroundColor);
        if (bgc && bgc[3] > 0.05) add(bg, `rgb(${bgc[0]}, ${bgc[1]}, ${bgc[2]})`, area);
        const tc = parse(cs.color);
        const txtLen = (el.textContent || "").trim().length;
        if (tc && txtLen > 0 && el.children.length === 0) add(textC, `rgb(${tc[0]}, ${tc[1]}, ${tc[2]})`, txtLen);
        // accent = any non-gray color appearing on text/border/bg/svg
        for (const src of [cs.color, cs.borderTopColor, cs.backgroundColor, cs.fill, cs.stroke]) {
          const c = parse(src);
          if (c && c[3] > 0.1 && !isGray(c)) add(accent, `rgb(${c[0]}, ${c[1]}, ${c[2]})`, 1);
        }
        if (cs.borderRadius && cs.borderRadius !== "0px") add(radius, cs.borderRadius.split(" ")[0]);
        const tag = el.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) add(hFont, cs.fontFamily, txtLen || 1);
        if (tag === "p") add(bFont, cs.fontFamily, txtLen || 1);
        if (!card && bgc && bgc[3] > 0.05 && cs.borderRadius !== "0px" && r.height > 80 && r.width < vw * 0.6) {
          card = { bg: `rgb(${bgc[0]}, ${bgc[1]}, ${bgc[2]})`, border: cs.borderTopColor };
        }
        if (!button && (tag === "button" || tag === "a") && bgc && bgc[3] > 0.1 && tc) {
          button = { bg: `rgb(${bgc[0]}, ${bgc[1]}, ${bgc[2]})`, text: `rgb(${tc[0]}, ${tc[1]}, ${tc[2]})` };
        }
      }
      return {
        bg: top(bg) || "rgb(255, 255, 255)",
        text: top(textC) || "rgb(0, 0, 0)",
        accent: top(accent) || top(textC) || "rgb(0, 0, 0)",
        headingFont: (top(hFont) || "").split(",")[0].replace(/['"]/g, "").trim(),
        bodyFont: (top(bFont) || "").split(",")[0].replace(/['"]/g, "").trim(),
        radius: top(radius) || "0px",
        card,
        button,
      };
    };

    // ── reference imagery in a subtree (shape/role only — I11) ───────────────
    const imagesOf = (rootEl: Element) => {
      const out: Array<{ kind: "img" | "background"; src: string; width: number; height: number; aspectRatio: number; alt: string; area: number }> = [];
      for (const im of Array.from(rootEl.querySelectorAll("img"))) {
        const node = im as HTMLImageElement;
        const r = node.getBoundingClientRect();
        if (r.width < 24 || r.height < 24) continue;
        const w = node.naturalWidth || r.width;
        const h = node.naturalHeight || r.height;
        if (w <= 0 || h <= 0) continue;
        out.push({ kind: "img", src: node.currentSrc || node.src || "", width: Math.round(w), height: Math.round(h), aspectRatio: Math.round((w / h) * 100) / 100, alt: node.getAttribute("alt") || "", area: r.width * r.height });
      }
      for (const el of Array.from(rootEl.querySelectorAll("*")).slice(0, 400)) {
        const bi = getComputedStyle(el).backgroundImage;
        if (!bi || bi === "none" || !/url\(/.test(bi)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 48 || r.height < 48) continue;
        const m = bi.match(/url\(["']?([^"')]+)["']?\)/);
        out.push({ kind: "background", src: m ? m[1] : "", width: Math.round(r.width), height: Math.round(r.height), aspectRatio: Math.round((r.width / r.height) * 100) / 100, alt: "", area: r.width * r.height });
      }
      out.sort((a, b) => b.area - a.area);
      return out.slice(0, 4).map(({ area, ...rest }) => rest);
    };

    // 1. descend through single dominant wrappers to the first level with ≥2 sections
    let root: Element = document.body;
    for (let d = 0; d < 8; d++) {
      const s = secsOf(root);
      if (s.length === 1) root = s[0];
      else break;
    }
    // 2. iterative explode: a dominant wrapper (>45% page, ≥2 section children) is
    //    replaced by its children; everything else is a final band.
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

    const bands = finals
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { yStart: Math.round(r.top + window.scrollY), yEnd: Math.round(r.bottom + window.scrollY), style: styleOf(el), images: imagesOf(el) };
      })
      .filter((b) => b.yEnd - b.yStart >= 80)
      .sort((a, b) => a.yStart - b.yStart);

    // Navbar = the fixed/sticky (or <header>/<nav>) chrome anchored at the top,
    // which is excluded from the section bands. Union the top-anchored chrome.
    let navTop: Element | null = null;
    let navBottom = 0;
    for (const el of Array.from(document.querySelectorAll("header, nav, [class*='nav' i], [class*='header' i]"))) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const anchored = (cs.position === "fixed" || cs.position === "sticky") && r.top <= 6;
      if ((anchored || el.tagName === "HEADER" || el.tagName === "NAV") && r.width >= vw * 0.6 && r.height >= 24 && r.top <= 80) {
        navTop = navTop ?? el;
        navBottom = Math.max(navBottom, Math.round(r.bottom));
      }
    }
    const navbar = navTop && navBottom > 0 ? { yStart: 0, yEnd: navBottom, style: styleOf(navTop), images: imagesOf(navTop) } : null;

    return { bands, global: styleOf(document.body), navbar };
  });
}

export async function captureTarget(opts: CaptureTargetOptions): Promise<CaptureResult> {
  const bps = opts.breakpoints ?? [DESKTOP_SCORE, MOBILE_GUARD];
  await fs.mkdir(opts.outDir, { recursive: true });
  const screenshots: Record<string, string> = {};
  let domBands: BandBase[] = [];
  let globalStyle: StyleProfile | null = null;
  let navbarBand: BandBase | null = null;
  // Shared browser, fresh context per breakpoint (I26).
  for (const bp of bps) {
    await withPage({ viewport: { width: bp.width, height: bp.height }, reducedMotion: "reduce" }, async (pg) => {
      await pg.goto(opts.url, { waitUntil: "networkidle", timeout: 60000 });
      await dismissBanners(pg);
      await pg.addStyleTag({ content: FREEZE_CSS });
      await pg.evaluate(() => (document as Document).fonts?.ready);
      await autoScroll(pg);
      await pg.waitForTimeout(500);
      // DOM section boundaries + ground-truth style at the SCORING breakpoint only.
      if (bp.role === "score") {
        await pg.evaluate(() => window.scrollTo(0, 0));
        const ext = await extractDomBands(pg).catch(() => ({ bands: [], global: null, navbar: null }));
        domBands = ext.bands;
        globalStyle = ext.global;
        navbarBand = ext.navbar;
      }
      const file = path.join(opts.outDir, `target-${bp.label}.png`);
      await pg.screenshot({ path: file, fullPage: true, animations: "disabled" });
      screenshots[bp.label] = file;
    });
  }
  return { url: opts.url, screenshots, domBands, globalStyle, navbarBand };
}
