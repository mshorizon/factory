#!/usr/bin/env tsx
/**
 * Deterministic verification for todo I23/I24/I25/I27 (Tier-2 cost cuts).
 * Fakes only — no model, no engines, no git. (I26 shared-browser + I28 timeout are
 * structural runner/browser changes verified by type-check + the live-render suites.)
 *
 * Run: pnpm tsx packages/tests/sitc-cost-cuts.check.mts
 *
 * Covers:
 *   A. preScoreAndLock — locks ≥threshold units before any mutate; seeds champion
 *      images + critiques; per-unit error degrade; skips locked/frozen.
 *   B. Seeded champion (I23) — the FIRST challenger must WIN pairwise (no more
 *      auto-promotion of a possibly-worse first render).
 *   C. Critique carry on promote (I24) — a promoted-but-unlocked section's next
 *      mutate receives the new champion's critique, not "".
 *   D. Pixel-identity pre-gate (I25) — identical challenger reverts BEFORE the VLM
 *      score and judge are called; sub-threshold similarity proceeds as before.
 *   E. Dollar cap (I27) — budgetExceeded honors maxUsd; the sweep stops on live
 *      spend before dispatching anything.
 */
import { preScoreAndLock } from "../sitc-core/src/loop/prescore.js";
import { runSweep } from "../sitc-core/src/loop/sweep.js";
import { runSectionIteration, type SectionCollaborators } from "../sitc-core/src/loop/section-iteration.js";
import { budgetExceeded } from "../sitc-core/src/delivery/budget.js";
import type { SectionState } from "../sitc-core/src/loop/scheduler.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

const hybrid = (score: number, critique: string) =>
  ({ score, vlm: { score, critique }, pixel: { similarity: score }, weights: { vlm: 0.7, pixel: 0.3 } }) as any;

const state = (id: string, over: Partial<SectionState> = {}): SectionState =>
  ({ sectionId: id, strategy: "tune-json", score: 0, threshold: 0.85, attempts: 0, locked: false, frozen: false, ...over });

let shaN = 0;
const fakeWorktree = (): any => ({
  addWorkerWorktree: async () => ({ path: "/wt", base: "BASE" }),
  resetSoftTo: async () => {},
  commitInWorktree: async () => `sha${++shaN}`,
  changedFiles: async () => ["templates/x/x.json"],
  integrate: async (_i: number, sha: string) => sha,
  removeWorktree: async () => {},
});

// ── A. preScoreAndLock ───────────────────────────────────────────────────────
console.log("A. preScoreAndLock");
{
  const scored: Record<string, number> = { "hero#0": 0.91, "about#1": 0.6, "services#2": 0.87 };
  const states = [state("hero#0"), state("about#1"), state("services#2"), state("footer", { locked: true })];
  let renders = 0;
  const r = await preScoreAndLock(states, {
    renderChampion: async (id) => (renders++, `/img/${id}.png`),
    score: async ({ ourImg }) => hybrid(scored[ourImg.replace("/img/", "").replace(".png", "")], `gap for ${ourImg}`),
    targetImgFor: () => "/target.png",
  });
  ok(r.locked.length === 2 && r.locked.includes("hero#0") && r.locked.includes("services#2"), "units ≥ threshold locked with zero mutate spend");
  ok(states.find((s) => s.sectionId === "hero#0")!.locked && states.find((s) => s.sectionId === "hero#0")!.score === 0.91, "locked unit carries its REAL score (fixes misleading 0s in metrics)");
  ok(!states.find((s) => s.sectionId === "about#1")!.locked && states.find((s) => s.sectionId === "about#1")!.score === 0.6, "below-threshold unit stays in play with its prescore");
  ok(r.championImg["about#1"] === "/img/about#1.png", "champion image seeded for in-play units");
  ok((r.critiques["about#1"] ?? "").includes("gap"), "champion critique seeded (first mutate starts steered)");
  ok(renders === 3, "already-locked units are not re-rendered");
}
{
  // per-unit degrade: a render error leaves the unit exactly as seeded
  const states = [state("a#0"), state("b#1")];
  const r = await preScoreAndLock(states, {
    renderChampion: async (id) => { if (id === "a#0") throw new Error("engine down"); return "/img/b.png"; },
    score: async () => hybrid(0.9, "fine"),
    targetImgFor: () => "/t.png",
  });
  ok(!states[0].locked && states[0].score === 0 && !("a#0" in r.championImg), "failed unit untouched (sweep treats it as before)");
  ok(states[1].locked, "other units unaffected by one failure");
}

// ── B. seeded champion → first challenger must WIN ───────────────────────────
console.log("B. no auto-promotion against a seeded champion");
{
  let judged = 0;
  const collab: SectionCollaborators = {
    mutate: async () => ({ summary: "edit" }),
    sanity: async () => ({ ok: true }) as any,
    render: async () => ({ ourImg: "/challenger.png" }),
    score: async () => hybrid(0.7, "meh"),
    judge: async () => (judged++, { winner: "champion" }) as any,
  };
  const res = await runSectionIteration({
    worktree: fakeWorktree(), runId: 1, workerId: "w", sectionId: "a#0", strategy: "tune-json",
    targetImg: "/t.png", championImg: "/prescored-champ.png", collab,
  });
  ok(judged === 1 && res.outcome === "reverted", "worse first challenger vs prescored champion → judged + reverted (previously auto-promoted)");
}

// ── C. critique carries across a promotion (I24) ─────────────────────────────
console.log("C. critique carry on promote");
{
  const critiquesSeen: (string | undefined)[] = [];
  let round = 0;
  const collab: SectionCollaborators = {
    mutate: async (ctx) => (critiquesSeen.push(ctx.critique), { summary: "edit" }),
    sanity: async () => ({ ok: true }) as any,
    render: async () => ({ ourImg: `/img-${++round}.png` }),
    // promotes each round (auto first, then judge wins), but never reaches 0.85
    score: async () => hybrid(0.5 + round * 0.01, `remaining gap after round ${round}`),
    judge: async () => ({ winner: "challenger" }) as any,
  };
  await runSweep({
    worktree: fakeWorktree(), runId: 1, collab,
    targetImgFor: () => "/t.png",
    initialStates: [state("a#0")],
    maxWorkers: 1, maxRounds: 2,
  });
  ok(critiquesSeen.length === 2, "two mutate calls dispatched");
  ok(!!critiquesSeen[1] && critiquesSeen[1]!.includes("remaining gap"), `promoted champion's critique feeds the next attempt (got "${critiquesSeen[1]}")`);
}
{
  // seeded initial critique reaches the FIRST mutate
  let first: string | undefined;
  const collab: SectionCollaborators = {
    mutate: async (ctx) => (first ??= ctx.critique, { summary: "" }), // no-op (empty commit → null sha? commit returns sha anyway)
    sanity: async () => ({ ok: true }) as any,
    render: async () => ({ ourImg: "/i.png" }),
    score: async () => hybrid(0.9, "done"),
    judge: async () => ({ winner: "challenger" }) as any,
  };
  await runSweep({
    worktree: fakeWorktree(), runId: 1, collab,
    targetImgFor: () => "/t.png",
    initialStates: [state("a#0")],
    initialCritiques: { "a#0": "prescore: colors are close but radius too sharp" },
    maxWorkers: 1, maxRounds: 1,
  });
  ok(!!first && first.includes("radius too sharp"), "prescore critique steers the first mutate");
}

// ── D. pixel-identity pre-gate (I25) ─────────────────────────────────────────
console.log("D. pixel-identity pre-gate");
{
  let scoreCalls = 0, judgeCalls = 0;
  const mk = (sim: number): SectionCollaborators => ({
    mutate: async () => ({ summary: "null edit" }),
    sanity: async () => ({ ok: true }) as any,
    render: async () => ({ ourImg: "/same.png" }),
    score: async () => (scoreCalls++, hybrid(0.7, "x")),
    judge: async () => (judgeCalls++, { winner: "challenger" }) as any,
    pixelSimilarity: async () => sim,
  });
  const identical = await runSectionIteration({
    worktree: fakeWorktree(), runId: 1, workerId: "w", sectionId: "a#0", strategy: "tune-json",
    targetImg: "/t.png", championImg: "/champ.png", collab: mk(0.999),
  });
  ok(identical.outcome === "reverted", "identical challenger → reverted");
  ok(scoreCalls === 0 && judgeCalls === 0, "VLM score AND judge skipped (3 model calls saved)");
  ok((identical.critique ?? "").includes("pixel-identical"), "critique explains the null edit to the worker");

  const different = await runSectionIteration({
    worktree: fakeWorktree(), runId: 1, workerId: "w", sectionId: "a#0", strategy: "tune-json",
    targetImg: "/t.png", championImg: "/champ.png", collab: mk(0.5),
  });
  ok(different.outcome === "promoted" && scoreCalls === 1 && judgeCalls === 1, "different challenger proceeds through score + judge");

  // no champion → gate skipped (first render must be scored)
  scoreCalls = 0;
  await runSectionIteration({
    worktree: fakeWorktree(), runId: 1, workerId: "w", sectionId: "a#0", strategy: "tune-json",
    targetImg: "/t.png", championImg: null, collab: mk(1.0),
  });
  ok(scoreCalls === 1, "no champion → identity gate skipped, score runs");
}

// ── E. dollar cap (I27) ──────────────────────────────────────────────────────
console.log("E. maxUsd budget cap");
{
  ok(budgetExceeded({ iterations: 1, workerInvocations: 1, elapsedMs: 0, usd: 12.5 }, { maxUsd: 10 }).hit.includes("usd"), "spend ≥ maxUsd → hit");
  ok(!budgetExceeded({ iterations: 1, workerInvocations: 1, elapsedMs: 0, usd: 9.99 }, { maxUsd: 10 }).exceeded, "under the cap → fine");
  ok(!budgetExceeded({ iterations: 1, workerInvocations: 1, elapsedMs: 0 }, { maxUsd: 10 }).exceeded, "no usd signal → cap not evaluated");

  let dispatched = 0;
  const collab: SectionCollaborators = {
    mutate: async () => (dispatched++, { summary: "e" }),
    sanity: async () => ({ ok: true }) as any,
    render: async () => ({ ourImg: "/i.png" }),
    score: async () => hybrid(0.5, "x"),
    judge: async () => ({ winner: "champion" }) as any,
  };
  const sweep = await runSweep({
    worktree: fakeWorktree(), runId: 1, collab,
    targetImgFor: () => "/t.png",
    initialStates: [state("a#0")],
    budget: { maxUsd: 5 },
    spentUsd: () => 7.5, // live meter already over the cap
    maxWorkers: 1, maxRounds: 10,
  });
  ok(sweep.stoppedBy === "budget" && dispatched === 0, "sweep stops on live dollar spend before dispatching");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
