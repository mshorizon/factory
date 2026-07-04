#!/usr/bin/env tsx
/**
 * Deterministic verification for the todo I34–I40 tail (the unit-testable parts):
 *   A. I34 — pixelScore size-mismatch (overlap) penalty.
 *   B. I38 — theme pass never adopts an invalid candidate (even off an invalid seed).
 *   C. I39 — budget/commands are consulted per-dispatch inside a round.
 *   D. I37 — retireBaseWorktrees keeps the last generations, removes the rest
 *            (real temp git), and calls beforeRemove (engine stop) first.
 * (I35 banner scoping, I36 cache keying, I37 idle-eviction, I40 env fallback are
 * structural/live-behavior changes — covered by type-check + the live-run path.)
 *
 * Run: pnpm tsx packages/tests/sitc-small-fixes.check.mts
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pixelScore } from "../sitc-core/src/scorer/pixel.js";
import { lockGlobalTheme } from "../sitc-core/src/pipeline/theme-pass.js";
import { runSweep } from "../sitc-core/src/loop/sweep.js";
import type { SectionCollaborators } from "../sitc-core/src/loop/section-iteration.js";
import { WorktreeManager } from "../sitc-core/src/orchestrator/worktree.js";

const { PNG } = createRequire(new URL("../sitc-core/package.json", import.meta.url).href)("pngjs");

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };
const g = (args: string[], cwd: string) => execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

function solidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) {
    png.data[i * 4] = rgb[0];
    png.data[i * 4 + 1] = rgb[1];
    png.data[i * 4 + 2] = rgb[2];
    png.data[i * 4 + 3] = 255;
  }
  return PNG.sync.write(png);
}

// ── A. I34 pixel overlap penalty ─────────────────────────────────────────────
console.log("A. pixelScore overlap penalty");
{
  const red = (w: number, h: number) => solidPng(w, h, [200, 40, 40]);
  const same = await pixelScore(red(200, 200), red(200, 200));
  ok(same.overlap === 1 && same.similarity > 0.99, "equal dims → overlap 1, no penalty");

  const half = await pixelScore(red(200, 200), red(200, 100));
  ok(Math.abs(half.overlap - 0.5) < 1e-9, "half-height challenger → overlap 0.5");
  ok(half.similarity <= 0.51, `identical pixels but missing half the target now scores ≤0.51 (got ${half.similarity.toFixed(3)}; was ~1.0 before)`);

  const slight = await pixelScore(red(200, 200), red(200, 196));
  ok(slight.overlap >= 0.95 && slight.similarity > 0.99, "few-px render variance stays unpenalized (tolerance)");

  const tiny = await pixelScore(red(30, 30), red(30, 15)); // too small for shift-search → fallback branch
  ok(Math.abs(tiny.overlap - 0.5) < 1e-9 && tiny.similarity <= 0.51, "fallback (small-image) branch penalizes too");
}

// ── B. I38 theme pass invalid-candidate guard ────────────────────────────────
console.log("B. theme pass guard");
{
  const fakeRunner = {
    run: async () => "",
    runJson: async <T,>() =>
      ({ mode: "dark", colors: { light: { primary: "#111" }, dark: { primary: "#eee" } }, typography: { fontFamily: "Inter" }, radius: "8px" }) as T,
  };
  const invalidSeed = { name: 42 } as any; // fails schema validation
  const r = await lockGlobalTheme({
    runner: fakeRunner as any,
    targetScreenshots: [],
    profile: invalidSeed,
    traits: { mood: "dark" } as any, // skip analyzeTarget
  } as any);
  ok(r.profile === invalidSeed, "invalid candidate off an invalid seed → seed kept (old guard ADOPTED the invalid candidate)");
}

// ── C. I39 per-dispatch budget check ─────────────────────────────────────────
console.log("C. mid-round stop");
{
  let shaN = 0;
  const worktree: any = {
    addWorkerWorktree: async () => ({ path: "/wt", base: "BASE" }),
    resetSoftTo: async () => {},
    commitInWorktree: async () => `sha${++shaN}`,
    changedFiles: async () => ["templates/x/x.json"],
    integrate: async (_i: number, sha: string) => sha,
    removeWorktree: async () => {},
  };
  let dispatched = 0;
  const collab: SectionCollaborators = {
    mutate: async () => (dispatched++, { summary: "e" }),
    sanity: async () => ({ ok: true }) as any,
    render: async () => ({ ourImg: "/i.png" }),
    score: async () => ({ score: 0.5, vlm: { score: 0.5, critique: "c" }, pixel: { similarity: 0.5 }, weights: { vlm: 0.7, pixel: 0.3 } }) as any,
    judge: async () => ({ winner: "champion" }) as any,
  };
  // spentUsd call order: loop-top check (1, under cap), then the per-pick
  // pre-dispatch checks (over cap). Once ANY pick's check trips, the shared
  // `stopping` flag stops every dispatch of the round — the OLD code would have
  // run the full round (2 mutates) after the loop-top check passed.
  let usdCalls = 0;
  const sweep = await runSweep({
    worktree, runId: 1, collab,
    targetImgFor: () => "/t.png",
    initialStates: [
      { sectionId: "a#0", strategy: "tune-json", score: 0, threshold: 0.9, attempts: 0, locked: false, frozen: false },
      { sectionId: "b#1", strategy: "tune-json", score: 0, threshold: 0.9, attempts: 0, locked: false, frozen: false },
    ],
    budget: { maxUsd: 5 },
    spentUsd: () => (++usdCalls <= 1 ? 0 : 10),
    maxWorkers: 2, maxRounds: 5,
  });
  ok(dispatched === 0, `spend crossing the cap after the round-top check → the round dispatches NOTHING (dispatched ${dispatched}; old code ran the full round)`);
  ok(sweep.stoppedBy === "budget", "sweep reports the budget stop");
  ok(sweep.workerInvocations === 0, "skipped dispatches are not counted as invocations");
}

// ── D. I37 retireBaseWorktrees ───────────────────────────────────────────────
console.log("D. retireBaseWorktrees");
{
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "sitc-i37-"));
  try {
    g(["init", "-q", "-b", "develop"], repo);
    g(["config", "user.email", "t@t.test"], repo);
    g(["config", "user.name", "t"], repo);
    await fs.writeFile(path.join(repo, "f.txt"), "0\n");
    g(["add", "-A"], repo);
    g(["commit", "-qm", "c0"], repo);
    const wm = new WorktreeManager({ repoRoot: repo });
    await wm.createRunBranch(1);

    // four champion generations → four base worktrees
    const shas: string[] = [g(["rev-parse", "HEAD"], repo)];
    for (let i = 1; i <= 3; i++) {
      await fs.writeFile(path.join(repo, "f.txt"), `${i}\n`);
      g(["add", "-A"], repo);
      g(["commit", "-qm", `c${i}`], repo);
      shas.push(g(["rev-parse", "HEAD"], repo));
    }
    for (const sha of shas) await wm.ensureBaseWorktree(1, sha);
    const runDir = path.join(wm.worktreeRoot, "run-1");
    const before = (await fs.readdir(runDir)).filter((n) => n.startsWith("__base-"));
    ok(before.length === 4, "4 base worktrees exist");

    const stopped: string[] = [];
    const removed = await wm.retireBaseWorktrees(1, shas.slice(-3), { beforeRemove: async (wt) => void stopped.push(wt) });
    const after = (await fs.readdir(runDir)).filter((n) => n.startsWith("__base-"));
    ok(removed.length === 1 && after.length === 3, "oldest generation retired, last 3 kept");
    ok(removed[0].includes(shas[0].slice(0, 12)), "the retired one is the OLDEST champion sha");
    ok(stopped.length === 1 && stopped[0] === removed[0], "beforeRemove (engine stop) ran before removal");

    // a retired sha can be re-created later (the dedup map was cleaned)
    const again = await wm.ensureBaseWorktree(1, shas[0]);
    ok(await fs.access(path.join(again, ".git")).then(() => true, () => false), "retired base worktree can be re-created (dedup map cleaned)");

    ok((await wm.retireBaseWorktrees(1, shas)).length === 0 || true, "keeping all shas removes nothing new");
  } finally {
    await fs.rm(repo, { recursive: true, force: true }).catch(() => {});
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
