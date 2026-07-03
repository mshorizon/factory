#!/usr/bin/env tsx
/**
 * Deterministic verification for tasks I14 — scheduler coverage guarantee
 * (CONCLUSIONS #6, the `about`-got-0-iterations bug).
 *
 * The fix: an in-play section below the coverage floor (dispatched < minCoverage)
 * sorts STRICTLY BEFORE covered peers, so no unit is starved to 0 iterations when
 * `maxWorkers < in-play count` and a budget/round cap settles the run early.
 *
 * Run: pnpm tsx packages/tests/sitc-scheduler-coverage.check.mts
 *
 * Covers:
 *   A. pickNext coverage partition — uncovered beats covered regardless of gap;
 *      opt-in (minCoverage=0 ⇒ unchanged pure-gap behavior); floor N>1; gap order
 *      preserved WITHIN a coverage tier; locked/frozen excluded; maxWorkers cap.
 *   B. predicates — dispatchesOf / isCovered / coverageMet.
 *   C. INTEGRATION (real runSweep, fake collaborators) — the actual guarantee:
 *      3 sections, maxWorkers=1, maxRounds=3, none ever promote. Pure-gap ordering
 *      STARVES the two low-gap sections (0 dispatches); coverage-first dispatches
 *      every in-play unit exactly once.
 */
import {
  pickNext,
  dispatchesOf,
  isCovered,
  coverageMet,
  runSweep,
  type SectionState,
  type SectionCollaborators,
} from "../sitc-core/src/index.js";

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; console.log(`  ✓ ${l}`); } else { fail++; console.error(`  ✗ ${l}`); } };

const S = (over: Partial<SectionState> & { sectionId: string }): SectionState => ({
  score: 0, threshold: 0.85, strategy: "tune-json", attempts: 0, locked: false, frozen: false, ...over,
});

// ── A. pickNext coverage partition ────────────────────────────────────────────
console.log("A. pickNext coverage partition");
{
  const hiCovered = S({ sectionId: "hi", score: 0.1, dispatches: 1 });   // big gap, covered
  const loUncov = S({ sectionId: "lo", score: 0.6, dispatches: 0 });     // small gap, uncovered

  const off = pickNext([hiCovered, loUncov], 1); // default minCoverage 0
  ok(off[0].sectionId === "hi", "minCoverage=0 ⇒ pure gap: big-gap covered wins (opt-in, no behavior change)");

  const on = pickNext([hiCovered, loUncov], 1, { minCoverage: 1 });
  ok(on[0].sectionId === "lo", "minCoverage=1 ⇒ uncovered small-gap beats covered big-gap (the fix)");

  // floor N=2: dispatched-once is still uncovered vs a dispatched-twice peer
  const nearlyDone = S({ sectionId: "d1", score: 0.1, dispatches: 1 }); // big gap, 1 dispatch
  const doneTwice = S({ sectionId: "d2", score: 0.5, dispatches: 2 });  // med gap, 2 dispatches
  const floor2 = pickNext([doneTwice, nearlyDone], 1, { minCoverage: 2 });
  ok(floor2[0].sectionId === "d1", "floor N=2: section dispatched once (< floor) beats one dispatched twice");

  // gap order preserved WITHIN the uncovered tier
  const uA = S({ sectionId: "uA", score: 0.6, dispatches: 0 }); // small gap
  const uB = S({ sectionId: "uB", score: 0.1, dispatches: 0 }); // big gap
  const within = pickNext([uA, uB], 2, { minCoverage: 1 });
  ok(within[0].sectionId === "uB" && within[1].sectionId === "uA", "within uncovered tier, larger gap still first");

  // locked/frozen excluded even if uncovered (dispatches 0)
  const lockedUncov = S({ sectionId: "lk", score: 0.1, dispatches: 0, locked: true });
  const frozenUncov = S({ sectionId: "fz", score: 0.1, dispatches: 0, frozen: true });
  const inplay = S({ sectionId: "ip", score: 0.7, dispatches: 5 });
  const excl = pickNext([lockedUncov, frozenUncov, inplay], 5, { minCoverage: 1 });
  ok(excl.length === 1 && excl[0].sectionId === "ip", "locked/frozen never picked despite being under the floor");

  // maxWorkers cap respected under coverage ordering
  const many = [S({ sectionId: "m1", dispatches: 0 }), S({ sectionId: "m2", dispatches: 0 }), S({ sectionId: "m3", dispatches: 0 })];
  ok(pickNext(many, 2, { minCoverage: 1 }).length === 2, "maxWorkers cap respected");
}

// ── B. predicates ─────────────────────────────────────────────────────────────
console.log("B. predicates");
{
  ok(dispatchesOf(S({ sectionId: "x" })) === 0, "dispatchesOf: undefined ⇒ 0");
  ok(dispatchesOf(S({ sectionId: "x", dispatches: 3 })) === 3, "dispatchesOf: reads the counter");
  ok(!isCovered(S({ sectionId: "x", dispatches: 0 }), 1), "isCovered: 0 < 1 ⇒ false");
  ok(isCovered(S({ sectionId: "x", dispatches: 1 }), 1), "isCovered: 1 ≥ 1 ⇒ true");

  const mixed = [S({ sectionId: "a", dispatches: 1 }), S({ sectionId: "b", dispatches: 0 })];
  ok(!coverageMet(mixed, 1), "coverageMet: an in-play unit under floor ⇒ false");
  ok(coverageMet([S({ sectionId: "a", dispatches: 1 }), S({ sectionId: "b", dispatches: 1 })], 1), "coverageMet: all in-play covered ⇒ true");
  // locked/frozen under floor don't block coverage (they're done)
  ok(coverageMet([S({ sectionId: "a", dispatches: 1 }), S({ sectionId: "b", dispatches: 0, locked: true })], 1), "coverageMet: locked under-floor unit ignored");
  ok(coverageMet(mixed, 0), "coverageMet: minCoverage=0 ⇒ vacuously true");
}

// ── C. INTEGRATION — real runSweep, fake collaborators ────────────────────────
console.log("C. runSweep — starvation vs coverage guarantee");
{
  // fake worktree (mirrors sitc-lessons-ab.check): unique sha, integrate echoes it
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
  // sanity ALWAYS fails ⇒ every iteration is a low-yield no-op: scores never move,
  // so gaps stay fixed (A biggest, C smallest) — the pure-gap starvation scenario.
  const collab: SectionCollaborators = {
    mutate: async () => ({ changedFiles: ["templates/template-x/template-x.json"], summary: "edit" }),
    sanity: async () => ({ ok: false, reason: "forced fail" } as any),
    render: async () => ({ ourImg: "/fake/img.png" }),
    score: async () => ({ score: 0, vlm: { score: 0, critique: "" }, pixel: { similarity: 0 }, weights: { vlm: 0.7, pixel: 0.3 } } as any),
    judge: async () => ({ winner: "champion" } as any),
  };
  const mkStates = (): SectionState[] => [
    { sectionId: "A", strategy: "tune-json", score: 0.1, threshold: 0.85, attempts: 0, locked: false, frozen: false }, // gap .75
    { sectionId: "B", strategy: "tune-json", score: 0.4, threshold: 0.85, attempts: 0, locked: false, frozen: false }, // gap .45
    { sectionId: "C", strategy: "tune-json", score: 0.6, threshold: 0.85, attempts: 0, locked: false, frozen: false }, // gap .25
  ];
  const common = { worktree, runId: 1, collab, targetImgFor: (id: string) => `target:${id}`, maxWorkers: 1, maxRounds: 3 };
  const dispatchMap = (states: SectionState[]) => Object.fromEntries(states.map((s) => [s.sectionId, dispatchesOf(s)]));

  // pure-gap (minCoverage: 0) → A hogs every round, B & C starved
  const starved = await runSweep({ ...common, initialStates: mkStates(), minCoverage: 0 });
  const sd = dispatchMap(starved.states);
  ok(starved.stoppedBy === "maxRounds", `pure-gap: stopped by maxRounds (got ${starved.stoppedBy})`);
  ok(sd.A === 3 && sd.B === 0 && sd.C === 0, `pure-gap STARVES low-gap units: A=${sd.A} B=${sd.B} C=${sd.C} (expect 3/0/0)`);
  ok(!coverageMet(starved.states, 1), "pure-gap: coverage NOT met (B,C never dispatched)");

  // coverage-first (default minCoverage: 1) → every in-play unit dispatched once
  const covered = await runSweep({ ...common, initialStates: mkStates() /* minCoverage defaults to 1 */ });
  const cd = dispatchMap(covered.states);
  ok(cd.A === 1 && cd.B === 1 && cd.C === 1, `coverage-first: every unit dispatched once: A=${cd.A} B=${cd.B} C=${cd.C} (expect 1/1/1)`);
  ok(coverageMet(covered.states, 1), "coverage-first: coverage guarantee met (no starvation)");
  ok(covered.workerInvocations === 3, `coverage-first: 3 dispatches over 3 rounds (got ${covered.workerInvocations})`);
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail} checks pass`);
process.exit(fail === 0 ? 0 : 1);
