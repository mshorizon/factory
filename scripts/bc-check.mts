#!/usr/bin/env tsx
/**
 * bc-check — backward-compatibility checker for template sites.
 *
 * For every template in templates/ (dirs containing <name>/<name>.json):
 *   1. Loads prod  https://<name>.hazelgrouse.pl       (built from `main`)
 *   2. Loads dev   https://<name>.dev.hazelgrouse.pl   (served from `develop`)
 *      NOTE: the dev domain is `.dev.` — `<name>-dev.hazelgrouse.pl` hits the
 *      generic "Hazelgrouse Studio" fallback page (see features/bc-check/CONTEXT.md).
 *   3. Discovers subpages from the rendered navbar on BOTH envs.
 *   4. Screenshots every section (div[data-section-index] rendered by
 *      SectionDispatcher.astro) on both envs and pixel-diffs each pair.
 *   5. Prints a score per template/page/section and writes a JSON report
 *      that the /bc-fix skill consumes.
 *
 * Usage:
 *   pnpm bc-check                      # all templates
 *   pnpm bc-check template-law         # single template
 *   pnpm bc-check --threshold 0.95     # custom pass threshold (default 0.98)
 *
 * Output:
 *   features/bc-check/reports/latest.json           (gitignored)
 *   features/bc-check/screenshots/<t>/<env>/<page>/  (gitignored)
 *
 * Exit code: 0 = every compared template ≥ threshold and no structural diffs;
 *            1 = at least one template failed. Skipped (undeployed) templates warn only.
 */

import { chromium, type Browser, type Page } from "playwright";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { pixelScore } from "../packages/sitc-core/src/scorer/pixel.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TEMPLATES_DIR = join(ROOT, "templates");
const SHOTS_DIR = join(ROOT, "features", "bc-check", "screenshots");
const REPORT_FILE = join(ROOT, "features", "bc-check", "reports", "latest.json");

const prodBase = (t: string) => `https://${t}.hazelgrouse.pl`;
const devBase = (t: string) => `https://${t}.dev.hazelgrouse.pl`;

/** Title served by the engine when a subdomain has no business in the DB. */
const FALLBACK_TITLE = "Hazelgrouse Studio";

const FREEZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
`;

const VIEWPORT = { width: 1440, height: 900 };
const DEFAULT_THRESHOLD = 0.98;
const PIXEL_SHIFT = 20;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LoadStatus = "ok" | "fallback" | "http-error";

interface SectionShot {
  index: number;
  type: string;
  id: string;
  file: string | null;
}

interface SectionResult {
  id: string;
  type: string;
  index: number;
  similarity: number;
  bestDy: number | null;
  note?: "added-on-dev" | "removed-on-dev" | "capture-failed";
  prodShot: string | null;
  devShot: string | null;
}

interface PageResult {
  path: string;
  status: "ok" | "fail" | "missing-on-dev" | "missing-on-prod" | "error-on-both";
  score: number | null;
  structuralDiff: { prod: string[]; dev: string[]; added: string[]; removed: string[] } | null;
  sections: SectionResult[];
}

interface TemplateResult {
  template: string;
  prodBase: string;
  devBase: string;
  status: "ok" | "fail" | "skipped";
  skipReason: string | null;
  score: number | null;
  navDiff: { prodOnly: string[]; devOnly: string[] } | null;
  pages: PageResult[];
}

// ---------------------------------------------------------------------------
// Template + page discovery
// ---------------------------------------------------------------------------

function discoverTemplates(): string[] {
  return readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(TEMPLATES_DIR, d.name, `${d.name}.json`)))
    .map((d) => d.name)
    .sort();
}

async function loadPage(page: Page, url: string): Promise<LoadStatus> {
  let resp;
  try {
    resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  } catch {
    return "http-error";
  }
  if (!resp || resp.status() >= 400) return "http-error";
  if ((await page.title()).includes(FALLBACK_TITLE)) return "fallback";

  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Scroll the whole page to trigger lazy-loaded images/content, then return to top.
  // NB: no named inner functions here — tsx/esbuild keepNames would inject a `__name`
  // helper that does not exist inside the browser context.
  await page.evaluate(async () => {
    let y = 0;
    while (y < document.body.scrollHeight) {
      y += window.innerHeight;
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  return "ok";
}

/** Internal paths linked from the rendered navbar (dedup, "/" first, no anchors). */
async function getNavPaths(page: Page): Promise<string[]> {
  const hrefs = await page.$$eval("header a[href], nav a[href]", (as) =>
    as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  const origin = new URL(page.url()).origin;
  const paths = new Set<string>();
  for (const href of hrefs) {
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) continue;
    let u: URL;
    try {
      u = new URL(href, origin);
    } catch {
      continue;
    }
    if (u.origin !== origin) continue;
    const path = u.pathname.length > 1 ? u.pathname.replace(/\/$/, "") : "/";
    paths.add(path);
  }
  paths.add("/");
  return ["/", ...[...paths].filter((p) => p !== "/").sort()];
}

// ---------------------------------------------------------------------------
// Section capture + alignment
// ---------------------------------------------------------------------------

const pageSlug = (path: string) => (path === "/" ? "home" : path.replace(/^\//, "").replace(/[^a-zA-Z0-9-]/g, "_"));

async function captureSections(page: Page, outDir: string): Promise<SectionShot[]> {
  mkdirSync(outDir, { recursive: true });
  const metas = await page.$$eval("[data-section-index]", (els) =>
    els.map((el) => ({
      index: Number(el.getAttribute("data-section-index")),
      type: el.getAttribute("data-section-type") ?? "unknown",
      id: el.id || `section-${el.getAttribute("data-section-index")}`,
    })),
  );

  const shots: SectionShot[] = [];

  // The fixed navbar is compared as a pseudo-section so header regressions are caught too.
  const navbarFile = join(outDir, "navbar.png");
  try {
    await page.locator("header").first().screenshot({ path: navbarFile, animations: "disabled", timeout: 15_000 });
    shots.push({ index: -1, type: "navbar", id: "navbar", file: navbarFile });
  } catch {
    shots.push({ index: -1, type: "navbar", id: "navbar", file: null });
  }

  for (const meta of metas) {
    const file = join(outDir, `${meta.type}-${meta.index}.png`);
    try {
      await page
        .locator(`[data-section-index="${meta.index}"]`)
        .first()
        .screenshot({ path: file, animations: "disabled", timeout: 15_000 });
      shots.push({ ...meta, file });
    } catch {
      shots.push({ ...meta, file: null });
    }
  }
  return shots;
}

/** Longest common subsequence over section types — pairs matched sections, isolates added/removed. */
function alignSections(prod: SectionShot[], dev: SectionShot[]) {
  const a = prod.map((s) => s.type);
  const b = dev.map((s) => s.type);
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

  const pairs: Array<{ prod: SectionShot; dev: SectionShot }> = [];
  const prodOnly: SectionShot[] = [];
  const devOnly: SectionShot[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) pairs.push({ prod: prod[i++], dev: dev[j++] });
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) prodOnly.push(prod[i++]);
    else devOnly.push(dev[j++]);
  }
  prodOnly.push(...prod.slice(i));
  devOnly.push(...dev.slice(j));
  return { pairs, prodOnly, devOnly };
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

const rel = (p: string | null) => (p ? relative(ROOT, p) : null);

async function comparePage(browser: Browser, template: string, path: string): Promise<PageResult> {
  const slug = pageSlug(path);
  const envs = { prod: prodBase(template) + path, dev: devBase(template) + path };
  const shots: Record<"prod" | "dev", SectionShot[] | null> = { prod: null, dev: null };
  const statuses: Record<"prod" | "dev", LoadStatus> = { prod: "http-error", dev: "http-error" };

  for (const env of ["prod", "dev"] as const) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    statuses[env] = await loadPage(page, envs[env]);
    if (statuses[env] === "ok") {
      shots[env] = await captureSections(page, join(SHOTS_DIR, template, env, slug));
    }
    await context.close();
  }

  if (statuses.prod !== "ok" && statuses.dev !== "ok")
    return { path, status: "error-on-both", score: null, structuralDiff: null, sections: [] };
  if (statuses.dev !== "ok")
    return { path, status: "missing-on-dev", score: 0, structuralDiff: null, sections: [] };
  if (statuses.prod !== "ok")
    return { path, status: "missing-on-prod", score: 0, structuralDiff: null, sections: [] };

  const { pairs, prodOnly, devOnly } = alignSections(shots.prod!, shots.dev!);
  const sections: SectionResult[] = [];

  for (const { prod, dev } of pairs) {
    if (!prod.file && !dev.file) {
      // Section invisible/uncapturable on both envs — nothing rendered differently.
      sections.push({ id: prod.id, type: prod.type, index: prod.index, similarity: 1, bestDy: null, note: "capture-failed", prodShot: null, devShot: null });
      continue;
    }
    if (!prod.file || !dev.file) {
      sections.push({ id: prod.id, type: prod.type, index: prod.index, similarity: 0, bestDy: null, note: "capture-failed", prodShot: rel(prod.file), devShot: rel(dev.file) });
      continue;
    }
    const score = await pixelScore(prod.file, dev.file, { shift: PIXEL_SHIFT });
    sections.push({
      id: prod.id,
      type: prod.type,
      index: prod.index,
      similarity: score.similarity,
      bestDy: score.bestDy,
      prodShot: rel(prod.file),
      devShot: rel(dev.file),
    });
  }
  for (const s of prodOnly)
    sections.push({ id: s.id, type: s.type, index: s.index, similarity: 0, bestDy: null, note: "removed-on-dev", prodShot: rel(s.file), devShot: null });
  for (const s of devOnly)
    sections.push({ id: s.id, type: s.type, index: s.index, similarity: 0, bestDy: null, note: "added-on-dev", prodShot: null, devShot: rel(s.file) });

  const denom = Math.max(shots.prod!.length, shots.dev!.length);
  const score = denom === 0 ? 1 : sections.filter((s) => !s.note || s.note === "capture-failed").reduce((sum, s) => sum + s.similarity, 0) / denom;

  const structuralDiff =
    prodOnly.length || devOnly.length
      ? {
          prod: shots.prod!.map((s) => s.type),
          dev: shots.dev!.map((s) => s.type),
          added: devOnly.map((s) => `${s.type}-${s.index}`),
          removed: prodOnly.map((s) => `${s.type}-${s.index}`),
        }
      : null;

  return { path, status: score < 1 - 1e-9 || structuralDiff ? "fail" : "ok", score, structuralDiff, sections };
}

async function checkTemplate(browser: Browser, template: string, threshold: number): Promise<TemplateResult> {
  const base: TemplateResult = {
    template,
    prodBase: prodBase(template),
    devBase: devBase(template),
    status: "skipped",
    skipReason: null,
    score: null,
    navDiff: null,
    pages: [],
  };

  rmSync(join(SHOTS_DIR, template), { recursive: true, force: true });

  // Probe both homepages and collect nav paths in one pass per env.
  const navPaths: Record<"prod" | "dev", string[] | null> = { prod: null, dev: null };
  for (const env of ["prod", "dev"] as const) {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    const status = await loadPage(page, env === "prod" ? base.prodBase : base.devBase);
    if (status === "ok") navPaths[env] = await getNavPaths(page);
    await context.close();
    if (status !== "ok") {
      base.skipReason = `${env} not deployed (${status}) at ${env === "prod" ? base.prodBase : base.devBase}`;
      return base;
    }
  }

  const prodNav = navPaths.prod!;
  const devNav = navPaths.dev!;
  const prodOnly = prodNav.filter((p) => !devNav.includes(p));
  const devOnly = devNav.filter((p) => !prodNav.includes(p));
  base.navDiff = prodOnly.length || devOnly.length ? { prodOnly, devOnly } : null;

  const allPaths = [...prodNav, ...devOnly];
  for (const path of allPaths) {
    console.log(`    ${path}`);
    base.pages.push(await comparePage(browser, template, path));
  }

  const scored = base.pages.filter((p) => p.score !== null);
  base.score = scored.length ? scored.reduce((sum, p) => sum + (p.score ?? 0), 0) / scored.length : null;
  const anyMissing = base.pages.some((p) => p.status === "missing-on-dev" || p.status === "missing-on-prod");
  const anyStructural = base.pages.some((p) => p.structuralDiff !== null);
  base.status =
    (base.score ?? 0) >= threshold && !anyMissing && !anyStructural && !base.navDiff ? "ok" : "fail";
  return base;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const pct = (s: number | null) => (s === null ? "  n/a " : `${(s * 100).toFixed(1)}%`);

function printReport(results: TemplateResult[], threshold: number) {
  console.log("\n════════════════ bc-check report ════════════════");
  for (const t of results) {
    const icon = t.status === "ok" ? "✓" : t.status === "fail" ? "✗" : "–";
    console.log(`\n${icon} ${t.template}  ${t.status === "skipped" ? `SKIPPED (${t.skipReason})` : pct(t.score)}`);
    if (t.navDiff) {
      if (t.navDiff.prodOnly.length) console.log(`    navbar links only on prod: ${t.navDiff.prodOnly.join(", ")}`);
      if (t.navDiff.devOnly.length) console.log(`    navbar links only on dev:  ${t.navDiff.devOnly.join(", ")}`);
    }
    for (const p of t.pages) {
      if (p.status === "ok") {
        console.log(`    ${pct(p.score)}  ${p.path}`);
        continue;
      }
      console.log(`    ${pct(p.score)}  ${p.path}  [${p.status}]`);
      if (p.structuralDiff) {
        if (p.structuralDiff.removed.length) console.log(`        sections removed on dev: ${p.structuralDiff.removed.join(", ")}`);
        if (p.structuralDiff.added.length) console.log(`        sections added on dev:   ${p.structuralDiff.added.join(", ")}`);
      }
      for (const s of p.sections.filter((s) => s.similarity < 1 - 1e-9 && !s.note).sort((a, b) => a.similarity - b.similarity)) {
        console.log(`        ${pct(s.similarity)}  ${s.type}-${s.index}`);
      }
    }
  }
  const failed = results.filter((r) => r.status === "fail");
  const skipped = results.filter((r) => r.status === "skipped");
  console.log(
    `\nchecked ${results.length - skipped.length}, passed ${results.length - skipped.length - failed.length}, failed ${failed.length}, skipped ${skipped.length} (threshold ${(threshold * 100).toFixed(0)}%)`,
  );
  if (failed.length) console.log(`→ run /bc-fix to investigate and fix (report: ${rel(REPORT_FILE)})`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  let threshold = DEFAULT_THRESHOLD;
  let only: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--threshold") threshold = Number(args[++i]);
    else if (!args[i].startsWith("--")) only = args[i];
  }
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
    console.error(`Invalid --threshold (expected 0 < t ≤ 1)`);
    process.exit(2);
  }

  let templates = discoverTemplates();
  if (only) {
    if (!templates.includes(only)) {
      console.error(`Unknown template "${only}". Available: ${templates.join(", ")}`);
      process.exit(2);
    }
    templates = [only];
  }

  console.log(`bc-check: ${templates.length} template(s), threshold ${(threshold * 100).toFixed(0)}%\n`);
  const browser = await chromium.launch();
  const results: TemplateResult[] = [];
  try {
    for (const template of templates) {
      console.log(`▶ ${template}`);
      results.push(await checkTemplate(browser, template, threshold));
    }
  } finally {
    await browser.close();
  }

  printReport(results, threshold);

  mkdirSync(dirname(REPORT_FILE), { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    threshold,
    summary: {
      checked: results.filter((r) => r.status !== "skipped").length,
      passed: results.filter((r) => r.status === "ok").length,
      failed: results.filter((r) => r.status === "fail").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    },
    templates: results,
  };
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`report written to ${rel(REPORT_FILE)}`);

  process.exit(report.summary.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
