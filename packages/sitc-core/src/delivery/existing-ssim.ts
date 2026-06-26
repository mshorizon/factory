/**
 * Real existing-template SSIM regression source (DESIGN §7.3 secondary check; tasks I6).
 *
 * THE GAP THIS CLOSES: the runner shipped `ssimPairs: () => []` → SSIM always 1, so
 * the backward-compat *visual* gate was effectively OFF. A worker's `new-variant` /
 * `extend-variant` edits shared `packages/ui` code that other templates also render;
 * an accidental behavior change there would silently regress every business. Auto-merge
 * of unreviewed additive code is only defensible if THIS check is real.
 *
 * HOW: render every existing template (≠ the run's own) twice —
 *   • baseline   = a worktree pinned at `develop`            (old shared components)
 *   • challenger = a worktree pinned at the run-branch tip   (new shared components)
 * — feeding the SAME template JSON (identical on both branches for a non-run template,
 * since the worker only edits its own template), so the only delta is shared code.
 * `existingTemplatesMinSsim` (delivery/checks.ts) SSIMs each pair; a drop < 0.99 fails
 * the gate → no auto-merge.
 *
 * The orchestration is dependency-injected (pure, fully unit-tested); `createRealExistingSsim`
 * wires the real WorktreeManager + EngineManager + renderSection. The two pinned worktrees
 * reuse I2's immutable `ensureBaseWorktree`, so the champion tree is often already warm.
 */
import { execFile } from "node:child_process";
import path from "node:path";
import { promises as fs } from "node:fs";
import type { Breakpoint } from "../types.js";
import type { WorktreeManager } from "../orchestrator/worktree.js";
import type { EngineManager } from "../orchestrator/engine-manager.js";
import { renderSection, harnessUrl, DESKTOP_SCORE } from "../steps/render.js";

function git(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, maxBuffer: 1024 * 1024 * 16 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`git ${args.join(" ")} failed: ${stderr || err.message}`));
      resolve(stdout.trim());
    });
  });
}

export interface ExistingTemplate {
  name: string;
  /** Number of home-page sections (so we know which indices to render). */
  sectionCount: number;
}

/**
 * Discover templates under `<repoRoot>/templates/<name>/<name>.json`, excluding the
 * run's own template, with each one's home-section count. Sorted for determinism.
 */
export async function listExistingTemplates(repoRoot: string, excludeTemplate: string): Promise<ExistingTemplate[]> {
  const dir = path.join(repoRoot, "templates");
  let names: string[] = [];
  try {
    names = (await fs.readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
  const out: ExistingTemplate[] = [];
  for (const name of names.sort()) {
    if (name === excludeTemplate) continue;
    const jsonPath = path.join(dir, name, `${name}.json`);
    try {
      const profile = JSON.parse(await fs.readFile(jsonPath, "utf8"));
      const sectionCount = Array.isArray(profile?.pages?.home?.sections) ? profile.pages.home.sections.length : 0;
      if (sectionCount > 0) out.push({ name, sectionCount });
    } catch {
      /* no JSON / unparseable — not a renderable template, skip */
    }
  }
  return out;
}

// ─── pure orchestration (injected deps → testable without engines) ────────────

export interface ExistingSsimDeps {
  /** Resolve a worktree dir pinned at a commit-ish (default: ensureBaseWorktree). */
  resolveTree: (sha: string) => Promise<string>;
  developSha: () => Promise<string>;
  championSha: () => Promise<string>;
  /** Render ONE section of `template` from `tree`; returns the screenshot path. */
  renderTreeSection: (a: { tree: string; role: "baseline" | "challenger"; template: string; index: number }) => Promise<string>;
  listTemplates: () => Promise<ExistingTemplate[]>;
  log?: (m: string) => void;
}

export interface ExistingSsimOptions {
  /** Cap templates rendered (sample). Default: all discovered. */
  maxTemplates?: number;
  /** Cap sections per template. Default: all. */
  maxSectionsPerTemplate?: number;
}

/**
 * Build the `ssimPairs` thunk the regression gate consumes. Returns [] (→ SSIM 1)
 * when the run branch is identical to develop (no shared-code delta to check).
 */
export function createExistingTemplatesSsim(deps: ExistingSsimDeps, opts: ExistingSsimOptions = {}): () => Promise<Array<[string, string]>> {
  const log = deps.log ?? (() => {});
  return async () => {
    const [devSha, champSha] = await Promise.all([deps.developSha(), deps.championSha()]);
    if (devSha === champSha) {
      log("run branch == develop — no shared-code change to regression-check");
      return [];
    }
    const [baseTree, challTree] = await Promise.all([deps.resolveTree(devSha), deps.resolveTree(champSha)]);

    let templates = await deps.listTemplates();
    const cap = opts.maxTemplates ?? templates.length;
    if (templates.length > cap) {
      log(`sampling ${cap}/${templates.length} existing templates (SITC_REGRESSION_MAX_TEMPLATES)`);
      templates = templates.slice(0, cap);
    }

    const pairs: Array<[string, string]> = [];
    for (const t of templates) {
      const secCap = Math.min(t.sectionCount, opts.maxSectionsPerTemplate ?? t.sectionCount);
      for (let index = 0; index < secCap; index++) {
        // Sequential (regression runs once at run end, not the hot path) to bound
        // load on the contended VPS. Render challenger then baseline for the pair.
        const challenger = await deps.renderTreeSection({ tree: challTree, role: "challenger", template: t.name, index });
        const baseline = await deps.renderTreeSection({ tree: baseTree, role: "baseline", template: t.name, index });
        pairs.push([challenger, baseline]);
      }
    }
    log(`regression SSIM: ${pairs.length} section pair(s) across ${templates.length} existing template(s)`);
    return pairs;
  };
}

// ─── real wiring (used by the runner) ─────────────────────────────────────────

export interface RealExistingSsimOptions extends ExistingSsimOptions {
  repoRoot: string;
  runId: number | string;
  worktree: WorktreeManager;
  engines: EngineManager;
  /** The run's own template — excluded (its change is intended). */
  excludeTemplate: string;
  /** Where pair screenshots are written. */
  outDir: string;
  developRef?: string;
  breakpoint?: Breakpoint;
  renderTimeoutMs?: number;
  log?: (m: string) => void;
}

/** Wire the pure orchestration to the real WorktreeManager + EngineManager + renderSection. */
export function createRealExistingSsim(o: RealExistingSsimOptions): () => Promise<Array<[string, string]>> {
  const developRef = o.developRef ?? "develop";
  const bp = o.breakpoint ?? DESKTOP_SCORE;
  return createExistingTemplatesSsim(
    {
      log: o.log,
      developSha: () => git(["rev-parse", developRef], o.repoRoot),
      championSha: () => o.worktree.champion(o.runId),
      resolveTree: (sha) => o.worktree.ensureBaseWorktree(o.runId, sha),
      listTemplates: () => listExistingTemplates(o.repoRoot, o.excludeTemplate),
      renderTreeSection: async ({ tree, role, template, index }) => {
        const tpl = path.join(tree, "templates", template, `${template}.json`);
        const warmupUrl = harnessUrl({ baseUrl: "http://127.0.0.1", business: template, index, profilePath: tpl });
        const baseUrl = await o.engines.ensure(tree, { warmupUrl });
        const r = await renderSection({ baseUrl, business: template, index, profilePath: tpl, breakpoint: bp, waitForMs: o.renderTimeoutMs ?? 120_000 });
        await fs.mkdir(o.outDir, { recursive: true });
        const out = path.join(o.outDir, `${role}-${template}-${index}.png`);
        await fs.writeFile(out, r.png);
        return out;
      },
    },
    { maxTemplates: o.maxTemplates, maxSectionsPerTemplate: o.maxSectionsPerTemplate },
  );
}
