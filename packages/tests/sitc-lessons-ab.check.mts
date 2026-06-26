#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I1 (lessons compounding measurement).
 * No model, no DB, no engine — pure logic + a fake-collaborator sweep.
 *
 * Run: pnpm tsx packages/tests/sitc-lessons-ab.check.mts
 *
 * Covers:
 *   A. compareLessonsAb verdicts: lessons-help / lessons-hurt / inconclusive,
 *      the "regressed score" guard, and only-on/only-off locked advantage.
 *   B. renderAbReport produces a report carrying the verdict + per-section rows.
 *   C. runSweep records iterations-to-threshold (iterationsToLock) at the correct
 *      round and reports workerInvocations.
 */
import { compareLessonsAb, renderAbReport, toArmMetrics, type ArmMetrics } from "../sitc-core/src/experiment/lessons-ab.js";
import { runSweep } from "../sitc-core/src/loop/sweep.js";
import type { SectionCollaborators } from "../sitc-core/src/loop/section-iteration.js";

let pass = 0;
let fail = 0;
const ok = (cond: boolean, label: string) => {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
};

// ── A. pure comparison ───────────────────────────────────────────────────────
console.log("A. compareLessonsAb");

const base = (over: Partial<ArmMetrics>): ArmMetrics =>
  toArmMetrics(
    over.arm ?? "lessons-on",
    {
      iterationsToLock: over.iterationsToLock ?? { hero: 1, footer: 2 },
      finalScores: over.finalScores ?? { hero: 0.9, footer: 0.88 },
      workerInvocations: over.workerInvocations ?? 5,
      rounds: over.rounds ?? 3,
      promotions: over.promotions ?? 4,
      lockedCount: over.lockedCount ?? 2,
      sectionCount: over.sectionCount ?? 2,
    },
    { runId: over.runId, template: over.template, targetUrl: over.targetUrl },
  );

// help: on converges faster (fewer rounds-to-lock), same final quality
{
  const on = base({ arm: "lessons-on", iterationsToLock: { hero: 1, footer: 2 }, workerInvocations: 5 });
  const off = base({ arm: "lessons-off", iterationsToLock: { hero: 3, footer: 5 }, workerInvocations: 9 });
  const c = compareLessonsAb(on, off);
  ok(c.verdict === "lessons-help", `faster convergence → lessons-help (got ${c.verdict})`);
  ok(c.meanItersSaved === 2.5, `mean rounds saved = 2.5 (got ${c.meanItersSaved})`);
  ok(c.invocationsSaved === 4, `invocations saved = 4 (got ${c.invocationsSaved})`);
}

// help: on locks a section off never reached, no regression
{
  const on = base({ arm: "lessons-on", iterationsToLock: { hero: 2, footer: 4 }, finalScores: { hero: 0.9, footer: 0.87 }, lockedCount: 2 });
  const off = base({ arm: "lessons-off", iterationsToLock: { hero: 2, footer: null as any }, finalScores: { hero: 0.9, footer: 0.7 }, lockedCount: 1 });
  const c = compareLessonsAb(on, off);
  ok(c.netExtraLocked === 1, `net extra locked = 1 (got ${c.netExtraLocked})`);
  ok(c.verdict === "lessons-help", `extra section locked → lessons-help (got ${c.verdict})`);
  ok(c.perSection.find((d) => d.sectionId === "footer")!.lockedAdvantage === "only-on", "footer flagged only-on");
}

// hurt: on slower to converge
{
  const on = base({ arm: "lessons-on", iterationsToLock: { hero: 5, footer: 6 } });
  const off = base({ arm: "lessons-off", iterationsToLock: { hero: 1, footer: 2 } });
  const c = compareLessonsAb(on, off);
  ok(c.verdict === "lessons-hurt", `slower convergence → lessons-hurt (got ${c.verdict})`);
}

// hurt: a section's final score regressed beyond noise even if iters look fine
{
  const on = base({ arm: "lessons-on", iterationsToLock: { hero: 1, footer: 1 }, finalScores: { hero: 0.9, footer: 0.80 } });
  const off = base({ arm: "lessons-off", iterationsToLock: { hero: 2, footer: 2 }, finalScores: { hero: 0.9, footer: 0.88 } });
  const c = compareLessonsAb(on, off);
  ok(c.verdict === "lessons-hurt", `final score regression > eps → lessons-hurt (got ${c.verdict})`);
}

// inconclusive: identical arms
{
  const on = base({ arm: "lessons-on" });
  const off = base({ arm: "lessons-off" });
  const c = compareLessonsAb(on, off);
  ok(c.verdict === "inconclusive", `identical arms → inconclusive (got ${c.verdict})`);
}

// ── B. report rendering ──────────────────────────────────────────────────────
console.log("B. renderAbReport");
{
  const on = base({ arm: "lessons-on", runId: 11, template: "template-sacrum", targetUrl: "https://x.test", iterationsToLock: { hero: 1, footer: 2 } });
  const off = base({ arm: "lessons-off", runId: 12, iterationsToLock: { hero: 3, footer: 5 } });
  const c = compareLessonsAb(on, off);
  const md = renderAbReport(on, off, c);
  ok(md.includes("Verdict: ✅ lessons-help"), "report shows verdict");
  ok(md.includes("template-sacrum") && md.includes("https://x.test"), "report shows context");
  ok((md.match(/^\| hero \|/m) ?? []).length === 1 && md.includes("| footer |"), "report has per-section rows");
}

// ── C. sweep iterations-to-threshold telemetry ───────────────────────────────
console.log("C. runSweep iterationsToLock");
{
  // fake worktree — unique sha per commit, integrate echoes the sha, everything else no-op
  let n = 0;
  const worktree: any = {
    repoRoot: "/fake",
    branchName: (id: number) => `sitc/run-${id}`,
    addWorkerWorktree: async () => ({ path: "/fake/wt", base: "base" }),
    resetSoftTo: async () => {},
    commitInWorktree: async () => `sha${++n}`,
    changedFiles: async () => ["templates/template-x/template-x.json"],
    integrate: async (_id: number, sha: string) => sha,
    removeWorktree: async () => {},
  };

  // per-section score schedule: fast locks immediately, slow needs 3 promotions
  const calls: Record<string, number> = {};
  const schedule: Record<string, number[]> = { "fast#0": [0.9], "slow#1": [0.5, 0.7, 0.9] };
  const scoreFor = (id: string) => {
    const i = calls[id] ?? 0;
    calls[id] = i + 1;
    const arr = schedule[id] ?? [0.9];
    return arr[Math.min(i, arr.length - 1)];
  };

  const collab: SectionCollaborators = {
    mutate: async () => ({ changedFiles: ["templates/template-x/template-x.json"], summary: "edit" }),
    sanity: async () => ({ ok: true } as any),
    render: async () => ({ ourImg: "/fake/img.png" }),
    score: async (ctx: any) => {
      // sectionId isn't passed to score(); infer from a stash set in render? Instead
      // key on the mutate ctx via a closure is unavailable — use a side counter map
      // keyed by call order is fragile, so derive from the targetImg path instead.
      const id = ctx.targetImg.replace("target:", "");
      const s = scoreFor(id);
      return { score: s, vlm: { score: s, critique: `crit ${id}` }, pixel: { similarity: s }, weights: { vlm: 0.7, pixel: 0.3 } } as any;
    },
    judge: async () => ({ winner: "challenger" } as any),
  };

  const res = await runSweep({
    worktree,
    runId: 1,
    collab,
    targetImgFor: (id: string) => `target:${id}`,
    initialStates: [
      { sectionId: "fast#0", strategy: "tune-json", score: 0, threshold: 0.85, attempts: 0, locked: false, frozen: false },
      { sectionId: "slow#1", strategy: "tune-json", score: 0, threshold: 0.85, attempts: 0, locked: false, frozen: false },
    ],
    maxWorkers: 3,
  });

  ok(res.stoppedBy === "settled", `sweep settled (got ${res.stoppedBy})`);
  ok(res.iterationsToLock["fast#0"] === 1, `fast locked at round 1 (got ${res.iterationsToLock["fast#0"]})`);
  ok(res.iterationsToLock["slow#1"] === 3, `slow locked at round 3 (got ${res.iterationsToLock["slow#1"]})`);
  ok(res.workerInvocations === 4, `workerInvocations = 4 (got ${res.workerInvocations})`);
  ok(res.promotions === 4, `promotions = 4 (got ${res.promotions})`);
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
