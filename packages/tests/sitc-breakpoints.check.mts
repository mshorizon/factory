#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I12 (multi-breakpoint scoring + mobile guard).
 * Pure primitives + the section-iteration guard seam with fakes (no engine/model).
 *
 * Run: pnpm tsx packages/tests/sitc-breakpoints.check.mts
 *
 * Covers:
 *   A. combineBreakpointScores — weighted over score-role only; guards excluded.
 *   B. mobileGuardVerdict — rejects a challenger that introduces/worsens mobile
 *      overflow; passes when equal-or-better than the champion.
 *   C. runSectionIteration guard seam — a failing guard turns a desktop WIN into a
 *      revert (champion kept); guard is skipped on the first attempt (no champion);
 *      absent guard = current behavior.
 */
import { combineBreakpointScores, mobileGuardVerdict } from "../sitc-core/src/scorer/breakpoints.js";
import { runSectionIteration, type SectionCollaborators } from "../sitc-core/src/loop/section-iteration.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

// ── A. combineBreakpointScores ───────────────────────────────────────────────
console.log("A. combineBreakpointScores");
{
  ok(combineBreakpointScores([{ label: "d", role: "score", score: 0.8 }, { label: "m", role: "score", score: 0.6 }]) === 0.7, "equal-weight average");
  const w = combineBreakpointScores([{ label: "d", role: "score", score: 0.9, weight: 3 }, { label: "m", role: "score", score: 0.5, weight: 1 }]);
  ok(Math.abs(w - (0.9 * 3 + 0.5) / 4) < 1e-9, "weighted average");
  ok(combineBreakpointScores([{ label: "d", role: "score", score: 0.8 }, { label: "m", role: "guard", score: 0.1 }]) === 0.8, "guard role excluded from the score");
  ok(combineBreakpointScores([]) === 0, "empty → 0");
}

// ── B. mobileGuardVerdict ────────────────────────────────────────────────────
console.log("B. mobileGuardVerdict");
{
  ok(mobileGuardVerdict({ championOverflowPx: 0, challengerOverflowPx: 0 }).ok, "both clean → pass");
  ok(!mobileGuardVerdict({ championOverflowPx: 0, challengerOverflowPx: 40 }).ok, "challenger introduces overflow → reject");
  ok(mobileGuardVerdict({ championOverflowPx: 50, challengerOverflowPx: 50 }).ok, "equal overflow (champion already had it) → pass");
  ok(mobileGuardVerdict({ championOverflowPx: 50, challengerOverflowPx: 10 }).ok, "challenger improves mobile → pass");
  ok(mobileGuardVerdict({ championOverflowPx: 0, challengerOverflowPx: 1 }).ok, "sub-floor overflow tolerated");
}

// ── C. guard seam in runSectionIteration ─────────────────────────────────────
console.log("C. runSectionIteration guard seam");
{
  let n = 0;
  const worktree: any = {
    addWorkerWorktree: async () => ({ path: "/wt", base: "BASE" }),
    resetSoftTo: async () => {},
    commitInWorktree: async () => `sha${++n}`,
    changedFiles: async () => ["templates/x/x.json"],
    integrate: async (_i: number, sha: string) => sha,
    removeWorktree: async () => {},
  };
  const base: SectionCollaborators = {
    mutate: async () => ({ changedFiles: ["templates/x/x.json"], summary: "e" }),
    sanity: async () => ({ ok: true } as any),
    render: async () => ({ ourImg: "/i.png" }),
    score: async () => ({ score: 0.9, vlm: { score: 0.9, critique: "c" }, pixel: { similarity: 0.9 }, weights: { vlm: 0.7, pixel: 0.3 } } as any),
    judge: async () => ({ winner: "challenger" } as any), // challenger WINS desktop
  };

  // failing guard turns a desktop win into a revert (champion kept)
  let guardCalls = 0;
  const r1 = await runSectionIteration({
    worktree, runId: 1, workerId: "w", sectionId: "hero#0", strategy: "tune-json",
    targetImg: "t.png", championImg: "champ.png", // existing champion → guard applies
    collab: { ...base, guard: async () => { guardCalls++; return { ok: false, reason: "mobile h-overflow 40px" }; } },
  });
  ok(guardCalls === 1, "guard called when challenger wins desktop with a champion present");
  ok(r1.outcome === "reverted" && /overflow/.test(r1.critique ?? ""), "failing guard → reverted (champion kept) with reason");

  // passing guard → promote
  const r2 = await runSectionIteration({
    worktree, runId: 1, workerId: "w", sectionId: "hero#0", strategy: "tune-json",
    targetImg: "t.png", championImg: "champ.png",
    collab: { ...base, guard: async () => ({ ok: true }) },
  });
  ok(r2.outcome === "promoted", "passing guard → promoted");

  // first attempt (no champion) → guard skipped, auto-promote
  let guardCalls2 = 0;
  const r3 = await runSectionIteration({
    worktree, runId: 1, workerId: "w", sectionId: "hero#0", strategy: "tune-json",
    targetImg: "t.png", championImg: null,
    collab: { ...base, guard: async () => { guardCalls2++; return { ok: false }; } },
  });
  ok(guardCalls2 === 0 && r3.outcome === "promoted", "first attempt: guard skipped (no fallback), auto-promotes");

  // no guard provided → unchanged behavior (promote)
  const r4 = await runSectionIteration({
    worktree, runId: 1, workerId: "w", sectionId: "hero#0", strategy: "tune-json",
    targetImg: "t.png", championImg: "champ.png", collab: base,
  });
  ok(r4.outcome === "promoted", "no guard → current behavior preserved");
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
