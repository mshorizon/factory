/**
 * Real gate toolchain (DESIGN §7.3 + §7.4).
 *
 * Concrete implementations of the injected `RegressionChecks` / `AcceptanceChecks`
 * (delivery/gates.ts) and the `SanityCheck` (loop/sanity.ts). Heavy work is real:
 *  - build/validate → spawn the actual repo scripts in the worktree
 *  - SSIM → the offset-tolerant pixel scorer over rendered image pairs
 *  - perf → Playwright Core-Web-Vitals + transfer budgets (stable, not Lighthouse's
 *    flaky single score)
 *  - a11y → real axe-core ruleset injected into the page
 *  - responsive/hygiene → in-page DOM assertions
 *
 * Everything is a thin factory so the orchestrator supplies paths/urls and the
 * gates stay pure orchestration.
 */
import { execFile } from "node:child_process";
import type { Page } from "playwright";
import axeCore from "axe-core";
import { withPage } from "../browser.js";
import { pixelScore } from "../scorer/pixel.js";
import type { AcceptanceChecks, RegressionChecks } from "./gates.js";
import type { SanityCheck } from "../loop/sanity.js";

// ─── command runner ──────────────────────────────────────────────────────────

export interface CmdResult { ok: boolean; output?: string }

function runCommand(cmd: string, args: string[], cwd: string, timeoutMs = 300_000): Promise<CmdResult> {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, timeout: timeoutMs, maxBuffer: 1024 * 1024 * 32 }, (err, stdout, stderr) => {
      if (err) {
        const tail = `${stdout}\n${stderr}`.trim().split("\n").slice(-25).join("\n");
        resolve({ ok: false, output: tail || err.message });
      } else {
        resolve({ ok: true });
      }
    });
  });
}

// ─── SANITY checks (DESIGN §5.2a) ─────────────────────────────────────────────

export interface SanityToolchainOptions {
  /** Type-check command, default `pnpm type-check`. Runs in the worktree. */
  buildCmd?: [string, string[]];
  /** Template-validate command, default `pnpm test:validate`. */
  validateCmd?: [string, string[]];
  buildTimeoutMs?: number;
}

/** Grep the changed packages/ui files for a forbidden apps/engine import. */
async function importBoundary(worktreePath: string, changedFiles: string[]): Promise<CmdResult> {
  const uiFiles = changedFiles.filter((f) => f.startsWith("packages/ui/"));
  if (!uiFiles.length) return { ok: true };
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const offenders: string[] = [];
  for (const rel of uiFiles) {
    try {
      const src = await fs.readFile(path.join(worktreePath, rel), "utf8");
      if (/from\s+["']@mshorizon\/engine|apps\/engine/.test(src)) offenders.push(rel);
    } catch { /* deleted file — ignore */ }
  }
  return offenders.length ? { ok: false, output: `forbidden apps/engine import in: ${offenders.join(", ")}` } : { ok: true };
}

export function createSanityChecks(opts: SanityToolchainOptions = {}): SanityCheck {
  const [bc, ba] = opts.buildCmd ?? ["pnpm", ["type-check"]];
  const [vc, va] = opts.validateCmd ?? ["pnpm", ["test:validate"]];
  return {
    build: (wt) => runCommand(bc, ba, wt, opts.buildTimeoutMs),
    validate: (wt) => runCommand(vc, va, wt, opts.buildTimeoutMs),
    importBoundary,
  };
}

// ─── §7.3 regression checks ───────────────────────────────────────────────────

export interface RegressionToolchainOptions extends SanityToolchainOptions {
  repoRoot: string;
  /**
   * Where build/validate run (todo I21). MUST be the run-branch CHAMPION tree —
   * running them in `repoRoot` (the operator's checkout, sitting on `develop`)
   * type-checked code the run never changed, so the final pre-merge gate was
   * vacuous. Lazy thunk (the champion worktree only exists post-sweep), memoized.
   * Default: `repoRoot` (back-compat for tests/callers without a champion tree).
   */
  cwd?: string | (() => Promise<string>);
  /**
   * Yields image pairs [challengerPng, baselinePng] for existing templates —
   * the run's render vs the `develop` baseline. Min SSIM across all pairs proves
   * unrelated templates didn't regress (§7.3). Empty list → perfect (1).
   */
  ssimPairs: () => Promise<Array<[string, string]>>;
}

export function createRegressionChecks(opts: RegressionToolchainOptions): RegressionChecks {
  const [bc, ba] = opts.buildCmd ?? ["pnpm", ["type-check"]];
  const [vc, va] = opts.validateCmd ?? ["pnpm", ["test:validate"]];
  let cwdCache: Promise<string> | undefined;
  const resolveCwd = () =>
    (cwdCache ??= Promise.resolve(typeof opts.cwd === "function" ? opts.cwd() : opts.cwd ?? opts.repoRoot));
  return {
    build: async () => runCommand(bc, ba, await resolveCwd(), opts.buildTimeoutMs),
    validate: async () => runCommand(vc, va, await resolveCwd(), opts.buildTimeoutMs),
    async existingTemplatesMinSsim() {
      const pairs = await opts.ssimPairs();
      if (!pairs.length) return 1;
      let min = 1;
      for (const [a, b] of pairs) {
        const { similarity } = await pixelScore(a, b);
        if (similarity < min) min = similarity;
      }
      return min;
    },
  };
}

// ─── §7.4 acceptance checks ───────────────────────────────────────────────────

export interface PerfBudgets {
  /** Largest Contentful Paint, ms. */
  lcpMs?: number;
  /** Cumulative Layout Shift, unitless. */
  cls?: number;
  /** Total transferred bytes. */
  transferBytes?: number;
  /** Total request count. */
  requests?: number;
}

export interface AcceptanceToolchainOptions {
  /**
   * Assembled run preview URL (desktop). May be a thunk resolved lazily at gate
   * time + memoized — needed for the I5 "build a prod preview" mode, where the URL
   * only exists after the champion worktree is built (post-sweep).
   */
  url: string | (() => Promise<string>);
  /**
   * BASELINE page (the same template rendered from `develop`) for baseline-relative
   * a11y/hygiene (todo I16). When set, those checks fail ONLY on violations not
   * already present on the baseline — a pre-existing defect (e.g. an old footer
   * iframe with bad contrast) can no longer fail every future run and permanently
   * block auto-merge. Lazily resolved + memoized like `url`; if resolution or the
   * baseline probe fails, checks degrade to ABSOLUTE mode with a note (fail-safe:
   * stricter, never looser). Absent → absolute mode (previous behavior).
   */
  baselineUrl?: string | (() => Promise<string>);
  /**
   * Additional page PATHS to gate (todo I41), e.g. ["/about", "/contact"] — the
   * inherited pages reuse the converged variants and ship in the SAME merge, but
   * a11y/hygiene/responsive previously only ever visited the home URL, so a
   * broken inherited page could auto-merge. Each path is applied to both the
   * challenger and baseline origins (query string preserved — the engine selects
   * the business via `?business=`). Perf stays home-only (CWV budgets are an
   * origin-level signal; re-measuring per page adds noise, not information).
   */
  pages?: string[];
  /** Mobile URL for the responsive check (defaults to the resolved `url`). */
  mobileUrl?: string;
  budgets?: PerfBudgets;
  /** axe impact levels that fail the gate. Default ["critical","serious"]. */
  axeFailOn?: Array<"minor" | "moderate" | "serious" | "critical">;
  desktop?: { width: number; height: number };
  mobile?: { width: number; height: number };
  /**
   * Enforce perf/transfer budgets (I5). Only meaningful against a PROD build —
   * `astro dev` ships unbundled (~18MB / hundreds of requests), so budgets there
   * are noise that would BOTH falsely fail and falsely reassure. When false, perf()
   * is skipped (passes with a note) and a11y/responsive/hygiene still run. Default true.
   */
  enforcePerf?: boolean;
}

// ─── baseline-relative diffing (todo I16) — pure, unit-tested ────────────────

export interface A11yViolation {
  impact: string;
  id: string;
  nodes: number;
}

/**
 * Fail only on axe rule ids NOT present on the baseline. Rule-id granularity (not
 * per-node) — a pre-existing violation growing by a node is tolerated; a NEW rule
 * firing is not. `baseline` null/undefined → absolute mode (fail on any violation).
 */
export function diffA11yViolations(
  challenger: A11yViolation[],
  baseline?: A11yViolation[] | null,
): { ok: boolean; detail: string } {
  const fmt = (vs: A11yViolation[]) => vs.map((v) => `${v.impact}:${v.id}(${v.nodes})`).join(", ");
  if (baseline == null) return { ok: challenger.length === 0, detail: fmt(challenger) || "axe clean" };
  const baseIds = new Set(baseline.map((v) => v.id));
  const fresh = challenger.filter((v) => !baseIds.has(v.id));
  const suppressed = challenger.length - fresh.length;
  return {
    ok: fresh.length === 0,
    detail: fresh.length
      ? `new vs baseline: ${fmt(fresh)}${suppressed ? ` (+${suppressed} pre-existing suppressed)` : ""}`
      : `axe clean vs baseline${suppressed ? ` (${suppressed} pre-existing suppressed)` : ""}`,
  };
}

export interface HygieneProbe {
  title: string;
  lang: string;
  imgsNoAlt: number;
  leaked: number;
  consoleErrors: string[];
}

/** Normalize a console-error message so the same defect matches across renders (URLs/ports/counters vary). */
export function normalizeConsoleError(msg: string): string {
  return msg.replace(/https?:\/\/[^\s"']+/g, "<url>").replace(/\d+/g, "<n>").trim().slice(0, 100);
}

/**
 * Baseline-relative hygiene: fail only on regressions the run INTRODUCED —
 * counts that grew vs the baseline, a title/lang that disappeared, console errors
 * whose normalized text isn't in the baseline. `baseline` null/undefined →
 * absolute mode (previous behavior).
 */
export function diffHygiene(challenger: HygieneProbe, baseline?: HygieneProbe | null): { ok: boolean; detail: string } {
  const fails: string[] = [];
  const rel = baseline != null;
  if (!challenger.title && (!rel || baseline.title)) fails.push("empty <title>");
  if (!challenger.lang && (!rel || baseline.lang)) fails.push("missing <html lang>");
  const grew = (c: number, b: number) => (rel ? c > b : c > 0);
  if (grew(challenger.imgsNoAlt, baseline?.imgsNoAlt ?? 0))
    fails.push(`${challenger.imgsNoAlt} img without alt${rel ? ` (baseline ${baseline.imgsNoAlt})` : ""}`);
  if (grew(challenger.leaked, baseline?.leaked ?? 0))
    fails.push(`${challenger.leaked} leaked t: keys${rel ? ` (baseline ${baseline.leaked})` : ""}`);
  const baseErr = new Set((baseline?.consoleErrors ?? []).map(normalizeConsoleError));
  const newErrs = rel
    ? challenger.consoleErrors.filter((e) => !baseErr.has(normalizeConsoleError(e)))
    : challenger.consoleErrors;
  if (newErrs.length) fails.push(`${newErrs.length} ${rel ? "new " : ""}console error(s): ${newErrs[0]}`);
  const suppressed = rel ? challenger.consoleErrors.length - newErrs.length : 0;
  return {
    ok: fails.length === 0,
    detail: fails.join("; ") || (rel ? `clean vs baseline${suppressed ? ` (${suppressed} pre-existing console error(s) suppressed)` : ""}` : "clean"),
  };
}

// Shared browser, fresh context per check (I26) — no per-check launch cost.
async function withBrowser<T>(fn: (page: Page, ctx: import("playwright").BrowserContext) => Promise<T>, viewport: { width: number; height: number }): Promise<T> {
  return withPage({ viewport }, (page, ctx) => fn(page, ctx));
}

// ─── multi-page helpers (todo I41) — pure, unit-tested ───────────────────────

/** Apply a page path to a base URL, preserving origin + query (`null` → unchanged). */
export function withPath(url: string, path: string | null): string {
  if (path == null) return url;
  const u = new URL(url);
  u.pathname = path.startsWith("/") ? path : `/${path}`;
  return u.toString();
}

export interface PageCheckResult {
  /** Page path ("/" for the main URL). */
  page: string;
  ok: boolean;
  detail: string;
}

/** Combine per-page results: any failing page fails the check; detail names the pages. */
export function aggregatePages(results: PageCheckResult[]): { ok: boolean; detail: string } {
  const failing = results.filter((r) => !r.ok);
  if (failing.length) {
    return { ok: false, detail: failing.map((r) => `${r.page}: ${r.detail}`).join(" | ") };
  }
  if (results.length === 1) return { ok: true, detail: results[0].detail };
  return { ok: true, detail: `${results.length} pages ok (${results.map((r) => r.page).join(", ")}) — ${results[0].detail}` };
}

export function createAcceptanceChecks(opts: AcceptanceToolchainOptions): AcceptanceChecks {
  const desktop = opts.desktop ?? { width: 1440, height: 900 };
  const mobile = opts.mobile ?? { width: 390, height: 844 };
  const budgets = opts.budgets ?? { lcpMs: 4000, cls: 0.1, transferBytes: 5_000_000, requests: 120 };
  const failOn = opts.axeFailOn ?? ["critical", "serious"];
  const enforcePerf = opts.enforcePerf ?? true;
  // I41 — inherited pages gated alongside the main URL (normalized to /paths).
  const pageList = (opts.pages ?? []).map((p) => (p.startsWith("/") ? p : `/${p}`));
  // Resolve (and build, in I5 build-mode) the preview URL once, shared by all checks.
  let urlCache: Promise<string> | undefined;
  const resolveUrl = () => (urlCache ??= Promise.resolve(typeof opts.url === "function" ? opts.url() : opts.url));
  // Baseline URL (I16) — null when unset OR when resolution fails (→ absolute mode).
  let baselineCache: Promise<string | null> | undefined;
  const resolveBaseline = () =>
    (baselineCache ??= opts.baselineUrl == null
      ? Promise.resolve(null)
      : Promise.resolve(typeof opts.baselineUrl === "function" ? opts.baselineUrl() : opts.baselineUrl).catch(() => null));

  const collectA11y = (url: string): Promise<A11yViolation[]> =>
    withBrowser(async (page) => {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      await page.addScriptTag({ content: axeCore.source });
      const results = await page.evaluate(async () => {
        const axe = (window as unknown as { axe: { run: (d: Document, o: unknown) => Promise<{ violations: unknown[] }> } }).axe;
        return await axe.run(document, { resultTypes: ["violations"] });
      });
      return (results.violations as any[])
        .filter((v) => failOn.includes(v.impact))
        .map((v) => ({ impact: v.impact as string, id: v.id as string, nodes: v.nodes.length as number }));
    }, desktop);

  const collectHygiene = (url: string): Promise<HygieneProbe> =>
    withBrowser(async (page) => {
      const consoleErrors: string[] = [];
      page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 120)); });
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      const probe = await page.evaluate(() => {
        const imgsNoAlt = Array.from(document.querySelectorAll("img")).filter((i) => !i.hasAttribute("alt")).length;
        const title = document.title?.trim() ?? "";
        // leaked i18n keys like "t:hero.title" rendered as visible text
        const leaked = (document.body.innerText.match(/\bt:[a-zA-Z0-9_.-]+/g) ?? []).length;
        const lang = document.documentElement.getAttribute("lang") ?? "";
        return { imgsNoAlt, title, leaked, lang };
      });
      return { ...probe, consoleErrors };
    }, desktop);

  return {
    async perf() {
      // I5 — never enforce perf/transfer budgets against a dev server: unbundled
      // numbers are inflated, so a real failure can't be distinguished from dev noise.
      if (!enforcePerf) {
        return { ok: true, detail: "perf skipped — dev target (build a prod preview: SITC_ACCEPTANCE_URL / SITC_ACCEPTANCE_BUILD=1)" };
      }
      const url = await resolveUrl();
      return withBrowser(async (page) => {
        let transfer = 0;
        let requests = 0;
        page.on("response", (r) => {
          requests++;
          const len = Number(r.headers()["content-length"] ?? 0);
          if (Number.isFinite(len)) transfer += len;
        });
        await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        // Core Web Vitals via PerformanceObserver (settle briefly for LCP/CLS).
        await page.waitForTimeout(1200);
        const vitals = await page.evaluate(() => {
          const lcp = performance.getEntriesByType("largest-contentful-paint").pop() as any;
          let cls = 0;
          for (const e of performance.getEntriesByType("layout-shift") as any[]) if (!e.hadRecentInput) cls += e.value;
          return { lcpMs: lcp ? Math.round(lcp.startTime) : null, cls: Math.round(cls * 1000) / 1000 };
        });
        const fails: string[] = [];
        if (budgets.lcpMs != null && vitals.lcpMs != null && vitals.lcpMs > budgets.lcpMs) fails.push(`LCP ${vitals.lcpMs}ms > ${budgets.lcpMs}ms`);
        if (budgets.cls != null && vitals.cls > budgets.cls) fails.push(`CLS ${vitals.cls} > ${budgets.cls}`);
        if (budgets.transferBytes != null && transfer > budgets.transferBytes) fails.push(`transfer ${transfer}B > ${budgets.transferBytes}B`);
        if (budgets.requests != null && requests > budgets.requests) fails.push(`requests ${requests} > ${budgets.requests}`);
        return { ok: fails.length === 0, detail: fails.join("; ") || `LCP ${vitals.lcpMs}ms, CLS ${vitals.cls}, ${requests} req, ${transfer}B` };
      }, desktop);
    },

    async a11y() {
      const url = await resolveUrl();
      const baseUrl = await resolveBaseline();
      const results: PageCheckResult[] = [];
      // I41 — main URL plus every inherited page; each diffed against the SAME
      // path on the baseline (I16: pre-existing violations can't fail the run).
      for (const p of [null, ...pageList]) {
        const challenger = await collectA11y(withPath(url, p));
        const baseline = baseUrl ? await collectA11y(withPath(baseUrl, p)).catch(() => null) : null;
        const r = diffA11yViolations(challenger, baseline);
        results.push({
          page: p ?? "/",
          ok: r.ok,
          detail: baseUrl && !baseline ? `${r.detail} (baseline probe failed — absolute mode)` : r.detail,
        });
      }
      return aggregatePages(results);
    },

    async responsive() {
      const url = await resolveUrl();
      const baseUrl = await resolveBaseline();
      const check = (vp: { width: number; height: number }, u: string) =>
        withBrowser(async (page) => {
          await page.goto(u, { waitUntil: "networkidle", timeout: 60_000 });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          return overflow;
        }, vp);
      const fails: string[] = [];
      let suppressed = 0;
      // I41 — every page at both viewports; I16-style baseline-relative: an
      // overflow the baseline ALREADY has (pre-existing) doesn't fail the run.
      for (const p of [null, ...pageList]) {
        const pageLabel = p ?? "/";
        for (const [label, vp] of [["mobile", mobile], ["desktop", desktop]] as const) {
          const u = p == null && label === "mobile" && opts.mobileUrl ? opts.mobileUrl : withPath(url, p);
          const c = await check(vp, u);
          if (c <= 2) continue;
          const b = baseUrl ? await check(vp, withPath(baseUrl, p)).catch(() => null) : null;
          if (b != null && c <= b) {
            suppressed++;
            continue; // pre-existing overflow, not this run's regression
          }
          fails.push(`${pageLabel} ${label} h-overflow ${c}px${b != null ? ` (baseline ${b}px)` : ""}`);
        }
      }
      return {
        ok: fails.length === 0,
        detail: fails.join("; ") || `no new horizontal overflow (${1 + pageList.length} page(s)${suppressed ? `, ${suppressed} pre-existing suppressed` : ""})`,
      };
    },

    async hygiene() {
      const url = await resolveUrl();
      const baseUrl = await resolveBaseline();
      const results: PageCheckResult[] = [];
      // I41 + I16 — every page, only regressions the run introduced fail.
      for (const p of [null, ...pageList]) {
        const challenger = await collectHygiene(withPath(url, p));
        const baseline = baseUrl ? await collectHygiene(withPath(baseUrl, p)).catch(() => null) : null;
        const r = diffHygiene(challenger, baseline);
        results.push({
          page: p ?? "/",
          ok: r.ok,
          detail: baseUrl && !baseline ? `${r.detail} (baseline probe failed — absolute mode)` : r.detail,
        });
      }
      return aggregatePages(results);
    },
  };
}
