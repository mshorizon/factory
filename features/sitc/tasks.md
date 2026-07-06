# Self-Improving Template Creator — Remaining work to a real, full process

> What's left to go from "control plane verified + logic verified with fakes" → "a real run clones a
> website you can open". Everything below replaces an **injected fake** with a real implementation, or wires
> the verified pieces together. Ordered as a critical path. See `README.md` §14 / `DESIGN.md` for context.

**Already done & verified (do not redo):** spike, Phases 0–8 (engine `@mshorizon/sitc-core`, `sitc_*` DB
schema pushed to prod, admin UI), the control-plane runner (`scripts/sitc-orchestrate.ts`, stub worker).

---

## Step 1 — Real run driver (sequence the phases) ⚙️ ✅ (driver done)
- [x] `runFull()` (`pipeline/run.ts`) sequences `lockTiers (theme→atoms) → runSweep (per-section) →
      regressionGate + acceptanceGate → decideDelivery → merge|needs_review`, updating run status.
- [x] Verified with fakes (temp repo): A) clean tuning → **auto-merge** (real merge onto `develop`); B)
      new-variant → **needs_review** (no merge); C) failed SSIM gate → **needs_review**. 9/9 checks pass.
- [x] Managed run: `runFull` acquires the single-owner **lease**; `runSweep` polls the command queue between
      rounds → **pause/abort** take effect (status `paused`/`aborted`, no merge, lease released). 7/7 checks pass.
- ✅ **Step 1 complete** — the full pipeline runs as one controllable, lease-guarded driver (`pipeline/run.ts`),
      verified for auto-merge / needs_review / failed-gate / lease-denied / pause / abort. Next blocker for a
      *real* result is Step 2 (the generative worker) + Step 3 (render the evolving profile).

## Step 2 — Real `authorVariant` worker 🧠 (the generative core) ✅ (code done)
- [x] Replaced the v0 scaffold (`steps/author-variant.ts`) with a real generative worker: surfaces the warm
      authoring kit (existing variant sources, dispatch wiring, schema slice, locked tokens — truncated) directly
      in the prompt, injects critique + advisory lessons, and authors via `Read/Edit/Write` in the worktree.
- [x] Strategy-specific prompts, cheapest-first: `tune-json` (JSON only) → `extend-variant` → `new-variant` →
      `new-section`. Each states the exact write boundary mirroring `loop/allowlist.ts`, so the worker stays
      in-bounds and the SANITY gate re-enforces it on the git diff (verdict is steering signal, not a boundary).
- [x] Defensive verdict normalization (malformed/out-of-range output → safe defaults).
- [x] `createMutateCollaborator` (`loop/mutate-collaborator.ts`) wires `assembleAuthoringKit` + `authorVariant`
      into the sweep's `mutate` seam — the bridge that makes the generative core usable by `runFull`.
- [x] Verified with a fake `WorkerRunner` (no model spawned): 26/26 — strategy prompts/boundaries, kit + token
      surfacing, truncation, critique/lessons injection, tool authorization, verdict normalization, collaborator.
- ⚠️ **Governance (execution, not code):** the code is ready, but RUNNING it spawns headless `claude -p` with
      Edit/Write — an autonomous agent loop the harness gates. The operator runs the real loop (via the local
      runner / VPS orchestrator), not the assistant. Wiring `createClaudeWorker` into the runner = Step 3/7.

## Step 3 — Render integration: run-scoped DB ↔ engine 🖥️ (so there's something to open) ✅
- [x] `renderSection` renders the run's **evolving profile from a working file** (`profilePath` option →
      `?profilePath=` on the harness). The engine harness route loads the worktree's template JSON directly
      (dev/`SITC_HARNESS_FS=1`-gated, path-constrained to `templates/` + `.json`); middleware skips DB business
      resolution for that case so no seeded site is needed in the inner loop.
- [x] `seedRunDb` is real (was a throwing stub): validates the profile, then delegates to an injected
      `RunDbSeedFn` (keeps sitc-core driver-free). Prod adapter `seedRunProfile` + `createSqlExec` added to
      `@mshorizon/db` (dedicated run-DB client, never the dev singleton) for the run-scoped DB / final preview.
- [x] Per-section **champion-image tracking**: `runSweep` persists each promotion via `store.setChampion`
      (score + snapshot commit) and returns the final `championImg` map; `runFull` surfaces it in `FullRunResult`.
- [x] **Verified end-to-end (real, not fakes):** booted the engine, hit the harness with a real template
      `profilePath` → **HTTP 200** with the section node; edited the working file → the change rendered live;
      `renderSection` captured a real 1440×912 screenshot (`screenshots/sitc-step3-hero.png`) with correct theme +
      variant. Path guards reject `/etc/passwd` and non-json (**400**). Plus 12/12 unit checks (render URL,
      seedRunDb validate/delegate, champion persistence). **This is the "open a render & compare to target" milestone.**
- Note: a throwaway working copy with no `translations/` dir shows raw `t:` keys for translated fields; a real
  run's worktree carries the translations dir (the harness loads it). Layout/design fidelity (what the scorer
  judges) is unaffected.

## Step 4 — Target segmentation + alignment 🔬 (riskiest unknown) ✅ (validated)
- [x] Hardened `segmentTarget`: better prompt (full-bleed bands, contiguous coverage, height hint) + a
      deterministic `normalizeBands` pass that turns noisy model y-ranges into a clean gapless, non-overlapping,
      reindexed top-to-bottom partition. New deterministic `cropBands` (pngjs row-slice → per-section target crops)
      and `alignSections` (band↔our-section map) + `targetImageMap` / `newSectionCandidates` helpers.
- [x] **Validated for real** (not just fakes): captured a real 1440×8575 full-page render of `template-specialist`
      and ran **real `claude -p` (sonnet, Read-only)** segmentation. Result: clean gapless partition, correct
      top-to-bottom order, hero first, and it nailed the distinctive bands (hero, services, the 120px `ctaBanner`
      marquee, testimonials). 6/6 structural checks pass + 27/27 deterministic unit checks + 12/12 alignment.
- [x] **Honest finding → fix:** the VLM labels bands by *appearance*, so our internal types drift
      (`ref` shared-sections read as `about/features/serviceArea`, `blog` read as `footer`). Pure type-equality
      alignment would orphan every drifted section. Added an **order-preserving positional second pass**
      (`fillPositional`, default on): after type-matching, leftover bands↔sections pair by document order. On the
      REAL segmentation output (8 bands vs 9 ground-truth sections) this yields **8 matched, 0 orphaned, 1 ours-only**
      — the loop gets a sane target crop per section despite label noise.
- ⚠️ **Loop did NOT need reshaping**, but two refinements noted (not blocking): (a) positional fill can cross a
      type-pinned match (valid 1:1 assignment, not strictly order-consistent — make it gap-aware later); (b) full-page
      capture includes the layout footer as a band with no page-section equivalent → surfaces as a new-section
      candidate; curation/operator handles it. Optionally feed our section vocabulary+count to `segmentTarget` as a
      labeling hint to cut drift at the source.

## Step 5 — Real gate toolchain 🚦 ✅
- [x] `delivery/checks.ts`: real implementations of the injected `RegressionChecks`/`AcceptanceChecks`/`SanityCheck`.
- [x] **Regression (§7.3):** `build`/`validate` spawn the actual repo scripts (`pnpm type-check`, `pnpm test:validate`)
      in the worktree via execFile (exit-code → ok/fail, stderr tail captured); `existingTemplatesMinSsim` uses the
      offset-tolerant pixel scorer over injected render/baseline image pairs; import-boundary greps changed
      `packages/ui` files for forbidden `apps/engine` imports.
- [x] **Acceptance (§7.4):** real **axe-core** ruleset injected into the page (`axeFailOn` impact filter); perf via
      Playwright **Core-Web-Vitals** (LCP/CLS) + transfer/request **budgets** — deliberately NOT Lighthouse
      (its single score is too flaky for a gate; CWV+budgets are reproducible); responsive = no horizontal overflow
      at mobile+desktop; hygiene = title/lang/img-alt/leaked-`t:`-keys/console-errors.
- [x] **Verified with real tools** (live engine): 14/14 — real `build()` passes on a clean pkg & detects non-zero
      exits (captures stderr); SSIM ~1 on identical / <0.9 on different images; `regressionGate` passes clean and
      fails on an SSIM regression; `perf`/`a11y`/`responsive`/`hygiene` all ran against the rendered site (real axe
      run, real CWV); tight budget correctly fails perf; empty `axeFailOn` passes a11y (threshold filter works).
- Decision: chose **axe-core (tiny pure-JS dep) + Playwright CWV** over Lighthouse for a more reproducible gate
  ("better results"). New dep: `axe-core@4.12.1` in sitc-core.
- Note: dev-server numbers are inflated (unbundled: ~18 MB / 459 req); default budgets target PROD output. The
  orchestrator should point acceptance at a prod-built preview, not `astro dev` (wire in Step 7).

## Step 6 — Judge calibration on subtle deltas ⚖️ (spike caveat #1) ✅ (validated)
- [x] Built `scorer/calibration-gen.ts`: `generateSubtleTriples` renders the SAME section at controlled
      perturbation magnitudes (target = pristine, near = small delta, far = larger delta) so ground truth is
      objective (smaller delta = closer) with no human labeling. Helpers `colorPerturbation` / `pxPerturbation` /
      `shiftHex` perturb theme tokens. Each perturbation → 2 triples (champion=near and champion=far) to also probe
      order independence. 12/12 unit checks.
- [x] **Ran REAL calibration** (claude -p sonnet, order-symmetric pairwise judge over rendered perturbed heroes):
      - Subtle deltas (color ±35/90, radius ±30/56): **4/4 correct, 100% order-stable**.
      - Finer deltas (color ±12/28, radius ±10/22): **4/4 correct, order-stable**.
      - Near-imperceptible (color ±4/10): degraded to `tie`/order-unstable — NOT a wrong answer.
- [x] **Confirmed the bar:** ≥90% agreement + order-stability on perceptible-subtle deltas. **Key safety result:
      confident-WRONG = 0 across all 10 triples** — the judge never confidently promoted the worse candidate; at the
      imperceptibility floor it returns `tie` → loop keeps champion (no regression promotion). Auto-merge trust on
      the judge's *promote* decision is justified; its failure mode is conservative by construction (§7.2a).
- Note: persisting a DURABLE labeled set into `sitc_judge_calibration` is deferred to Step 7 — the triples here use
  ephemeral local image paths; durable rows need artifact storage (R2), which the orchestrator wires. The generator
  + harness IS the mechanism to (re)populate it.

## Step 7 — Deploy for real runs 🚀 ⏳ (scaffolding built; live bring-up is operator-driven)
- [x] **Orchestrator entrypoint** `scripts/sitc-runner.mts`: wires the full real run via `runFull` — target
      ingestion (capture→segment→crop→align→targetImageMap) → `lockTiers` → per-section sweep with REAL
      collaborators (claude-p mutate, isolation render from worktree working file, hybrid scorer, pairwise judge,
      sanity+regression+acceptance gate toolchain) → strategy-routed delivery. **Autonomous `claude -p` Edit/Write
      is gated behind `SITC_ENABLE_WORKER=1`**; without it the runner does ingestion + prints the PLAN and exits
      (no edits, no merge).
- [x] **Run-DB lifecycle CLI** `scripts/sitc-run-db.mts`: `provision` / `seed` / `teardown` / `gc`. Every prod-DDL
      action is **dry-run by default**, executes only with `--yes`. `seed` validates the profile first; `gc` wraps
      `sweepOrphans`.
- [x] **PM2** `ecosystem.sitc.config.cjs`: `sitc-gc` (safe orphan-GC cron, every 15 min) + `sitc-orchestrator`
      (autorestart off, worker OFF by default — operator enables per run).
- [x] **DEPLOY.md** runbook (create run → provision/seed → plan-only dry run → live run → PM2 → teardown) + the
      known gaps to close before unattended auto-merge.
- [x] **Verified**: both scripts type-check clean; run-DB CLI dry-runs gate prod DDL correctly (usage/provision/gc);
      runner load-test resolves the full import graph and fails fast on missing `DATABASE_URL`; PM2 config loads
      (worker confirmed UNSET/plan-only by default). npm scripts `sitc:runner` / `sitc:run-db` added.
- ⚠️ **NOT executed live** (by design — autonomous worker + prod DDL are operator actions). Open before trusting
      unattended auto-merge (see DEPLOY.md §"Known gaps"): (1) wire real existing-template SSIM (currently a stub
      `()=>[]` → SSIM 1); (2) point acceptance gate at a PROD-built preview, not `astro dev`; (3) durable calibration
      artifacts in R2; (4) supervised first live `runFull` against a real target.

## Step 8 — Optional / degrades gracefully ✅
- [x] Hardened `commandEmbedder` (`learning/embed.ts`): validates output is a non-empty finite numeric array of the
      **expected dimension** (default `SITC_EMBED_DIM`=1536, = the pgvector column — a mismatch is rejected loudly
      instead of silently poisoning retrieval / breaking inserts), L2-normalizes, and **times out** a hung command
      (default 20s). `expectedDim:0` opts out of the dim check.
- [x] Added `probeEmbedder`: runs the configured embedder on a sample and reports source / dim / latency / error —
      lets the operator verify `SITC_EMBED_CMD` (and that the model dim matches the DB) before a run.
- [x] Wired into `sitc-runner.mts`: an embedder **preflight** logs status at startup, and the mutate collaborator's
      `lessonsFor` now retrieves advisory lessons (`retrieveLessons` + `DrizzleLessonStore` + `defaultEmbedder`) into
      the worker prompt — degrades to empty if the store is empty or pgvector is unavailable. Example `SITC_EMBED_CMD`
      (OpenAI text-embedding-3-small) documented in DEPLOY.md §5b.
- [x] **Verified with real external commands** (11/11): happy path → 1536-dim normalized; wrong dim (768) rejected
      loudly; `expectedDim:0` accepts any length; non-finite output rejected; hung command times out fast; probe
      reports ok / flags wrong dim / works on the hashing fallback; cosine geometry sanity (identical→~1, different→lower).

---

### Smallest-first-real-result milestone (recommended to sequence within the above)
A single-section, single-iteration **real** cycle (slice of Steps 2+3): real `authorVariant` edits one section
→ `renderSection` renders it from a working file → `scoreSection` + `pairwiseJudge` vs the captured target crop.
First point where you can **open a rendered section and compare it to the target**.

---

## Improvement roadmap — next wave (post-live-run analysis, 2026-06-25)

> Ranked by leverage. Tiers mirror the analysis: T0 = existential (does the premise hold?), T1 = bottleneck +
> flywheel, T2 = gaps blocking *trusted* unattended runs, T3 = sharpening, T4 = scope expansion. Items flagged
> **[amplifies]** extend a CONCLUSIONS.md roadmap item; **[new]** is a fresh angle.

### Tier 0 — prove the core premise
- [x] **I1 — Measure whether the learning store actually compounds. [new framing of §18-G]** ✅ *mechanism built
      & verified (17/17); live A/B is an operator action.*
      The whole reason this exists over `clone-template` is "run 5 converges faster than run 1," yet lessons have
      only ever run with the hashing-fallback embedder in tests and iterations-to-threshold is unmeasured. Built:
      - (a) **iterations-to-threshold telemetry** — `runSweep` now records `iterationsToLock` (round each section
        first crossed threshold) + `workerInvocations`; surfaced through `FullRunResult.metrics` (`RunMetrics`).
        (`loop/sweep.ts`, `pipeline/run.ts`)
      - (b) **lessons-on vs lessons-off A/B toggle** — `SITC_DISABLE_LESSONS=1` makes the runner inject no lessons
        into the worker prompt (the OFF arm); each run writes `.sitc/runs/<id>/metrics.json` tagged with its arm.
        (`scripts/sitc-runner.mts`)
      - (c) **one-command comparison report** — `pnpm sitc:lessons-ab --on <run> --off <run>` →
        `compareLessonsAb` + `renderAbReport`: per-section rounds-saved, net extra locked, invocations saved,
        score-delta guard, and a conservative verdict (`lessons-help`/`hurt`/`inconclusive`).
        (`packages/sitc-core/src/experiment/lessons-ab.ts`, `scripts/sitc-lessons-ab.mts`)
      - **Verified deterministically:** `packages/tests/sitc-lessons-ab.check.mts` — 17/17 (verdict logic incl.
        regression guard + only-on/off advantage, report rendering, and a fake-collaborator sweep proving
        `iterationsToLock` lands at the correct round). sitc-core type-checks clean; runner import graph resolves.
      - **Operator step (the actual experiment):** on the VPS, run the same target twice — once normally, once
        with `SITC_DISABLE_LESSONS=1` (needs a non-empty `sitc_lessons` store + a real `SITC_EMBED_CMD` for a fair
        ON arm) — then `pnpm sitc:lessons-ab`. Cheap falsification: if lessons don't move the number, delete a
        large subsystem (pgvector/distill/dedup/decay) and simplify.

### Tier 1 — bottleneck & flywheel
- [x] **I2 — Split the render path by strategy: `tune-json` must never compile. [new]** ✅ *built & verified
      (11/11); live perf win is operator-observed.* JSON-only changes don't touch component code, so the most
      common/cheapest strategy now renders through a **shared, already-warm engine pinned at the iteration's
      `base` champion** (the worker's edited JSON supplied via `?profilePath=`), instead of cold-compiling a
      fresh per-worktree engine. Code-changing strategies (`extend-variant`/`new-variant`/`new-section`) keep
      their own per-worktree engine (their edits live there and must compile). Design notes:
      - **Per-champion base worktree, not per-iteration.** `WorktreeManager.ensureBaseWorktree(runId, baseSha)`
        creates ONE immutable detached worktree per champion generation, reused by every `tune-json` iteration
        at that champion → one cold compile per generation (~handful/run) instead of one per iteration (~dozens).
        Immutable ⇒ no reset/rewarm/mutex needed; concurrent renders at the same champion are trivially safe.
        (`orchestrator/worktree.ts`)
      - **Routing seam.** `SectionCollaborators.render` ctx gained `strategy` + `base`; the runner branches on
        `strategy === "tune-json"`. (`loop/section-iteration.ts`, `scripts/sitc-runner.mts`)
      - **Correctness:** the harness path-constraint already allows a persistent engine to read a *different*
        worktree's JSON (only requires `templates/` segment + `.json` + exists), so the shared engine renders the
        edited JSON against the correct champion components. EngineManager `maxEngines` bumped to
        `maxWorkers + 2` so the warm champion engine survives a full round of code-strategy engines.
      - **Observability:** runner logs `N warm / M cold` renders at run end (also feeds I9).
      - **Verified deterministically:** `packages/tests/sitc-render-routing.check.mts` — 11/11 (real temp-git repo:
        base worktree pinned at the right sha, idempotent, concurrent-create dedupe, distinct path per
        generation; + fake-collab proof that `runSectionIteration` threads `strategy`/`base` into `render`).
        sitc-core type-checks clean; I1 check still green; runner import graph resolves.
- [x] **I3 — Persistent per-worker worktrees + engine pool. [amplifies CONCLUSIONS #1]** ✅ *built & verified
      (17/17); live speedup operator-observed.* I2 covered `tune-json`; I3 covers the code-changing strategies
      (`extend-variant`/`new-variant`/`new-section`), which still cold-compiled a fresh worktree per iteration.
      - **Pool of N = maxWorkers persistent slot worktrees** (`WorktreePool` + `WorktreeManager.acquireSlot`):
        each iteration leases a free slot, reset `--hard` to the current champion + `clean -fdq` on acquire (cheap;
        node_modules symlinks are git-excluded so they survive). The slot's render engine stays warm across
        iterations → Vite HMR recompiles only the worker's edits instead of cold-starting.
      - **Additive seam:** `runSectionIteration` gained an optional `lease` — when present it acquires/releases a
        pooled slot; when absent it falls back to the original `addWorkerWorktree`/`removeWorktree`. Threaded
        through `runSweep` → `runFull` → the runner (`new WorktreePool(worktree, runId, maxWorkers)`).
      - **Pool semantics:** bounded, blocks-then-unblocks on release, reuses freed slots, idempotent release,
        returns the slot if `acquireSlot` throws (no deadlock). EngineManager headroom (`maxWorkers + 2`, set in
        I2) keeps the slot engines + the tune-json base engine warm together.
      - **Verified deterministically:** `packages/tests/sitc-worktree-pool.check.mts` — 17/17 (pool bounding/
        blocking/reuse/idempotency/failure-return; real temp-git `acquireSlot` create-then-reset-to-advanced-
        champion + untracked cleanup; `runSectionIteration` lease lifecycle incl. release-on-sanity-failure and
        the no-lease fallback). sitc-core type-checks clean; all six check suites green (81 checks); runner loads.
      - CONCLUSIONS #1 (the named "single biggest reliability/speed win") marked addressed (with I2).
- [x] **I4 — Close the auto-merge loop so the flywheel turns. [amplifies CONCLUSIONS #2 + #7]** ✅ *built &
      verified (17/17); live push/PR is operator-gated.* The compounding claim's second leg: each clean run lands
      on `develop` automatically so the next run seeds improved — no hand cherry-picks. Built `landDelivery`
      (`delivery/delivery.ts`), wired into `runFull` (`pipeline/run.ts`) + the runner:
      - **auto-merge** (clean `tune-json`/`extend-variant`, threshold + gates pass) → no-ff merge into `develop`.
        Local merge alone accumulates on the VPS so the next clone-template seed starts improved (CONCLUSIONS #7).
      - **safe downgrade** — a dirty tree / conflict no longer crashes the run mid-flight (the old inline
        `mergeRunToDevelop` threw): it downgrades to `needs_review` with the branch intact and a reason note.
      - **opt-in push** — `SITC_DELIVERY_PUSH=1` pushes `develop` (outward-facing → prod deploy; off by default).
      - **auto-PR** — `SITC_DELIVERY_PR=1` pushes the run branch + opens a `gh` PR for `needs_review` runs instead
        of leaving them for cherry-pick (`SITC_GIT_REMOTE` overrides remote). PR opener is injectable (testable).
      - Outcome logged + written to `.sitc/runs/<id>/delivery.json`; `FullRunResult` gained `pushed`/`prUrl`.
      - **Verified deterministically:** `packages/tests/sitc-delivery-landing.check.mts` — 17/17 on real temp git
        repos + a bare remote (auto-merge advances develop; push reaches the remote; dirty tree → safe downgrade,
        branch intact; needs_review → branch pushed + injected PR opener called). sitc-core type-checks clean;
        I1/I2 checks still green; runner import graph resolves. DEPLOY.md §4 documents the flags.
      - **Still gated on the gates being trustworthy:** auto-merge is only as safe as I5 (acceptance on a PROD
        build) + I6 (real existing-template SSIM). Until those land, run with `SITC_DELIVERY_PUSH` off (local
        accumulation only) or `SITC_DELIVERY_PR=1` for a human gate.

### Tier 2 — gaps blocking trusted unattended runs (DEPLOY.md §Known gaps)
- [x] **I5 — Point the acceptance gate at a PROD build, not `astro dev`.** ✅ *built & verified (7/7); live build
      on first run.* Dev numbers (~18MB/459 req) made perf/transfer budgets meaningless. Fix has two parts:
      - **Don't enforce perf against dev.** `createAcceptanceChecks({ enforcePerf })` — when false, `perf()` is
        skipped (passes with a note, no browser) so inflated dev numbers can't *falsely fail OR falsely reassure*;
        a11y/responsive/hygiene still run. (`delivery/checks.ts`)
      - **Provide a real prod target.** `resolveAcceptanceTarget` precedence: `SITC_ACCEPTANCE_URL` (operator prod
        preview) → `SITC_ACCEPTANCE_BUILD=1` (`buildAndServePreview` does `pnpm --filter @mshorizon/engine build`
        on the champion worktree + serves the `@astrojs/node` standalone server) → dev fallback (perf off + loud
        note). (`delivery/preview-server.ts`)
      - **Lazy URL.** The build-mode preview URL only exists post-sweep (built from the champion), so
        `createAcceptanceChecks` now accepts a memoized URL thunk resolved once at gate time across all checks.
      - **Verified deterministically:** `packages/tests/sitc-acceptance-target.check.mts` — 7/7 (resolver
        precedence + perf-authoritative flags; `perf()` skip passes without launching a browser or resolving the
        URL when `enforcePerf=false`). sitc-core type-checks clean; I1/I2/I4/I6 checks still green; runner loads.
        DEPLOY.md gap #2 closed.
      - **Note:** evolved-template *content* under a prod build needs the run DB seeded with the champion
        (`SITC_PREVIEW_DATABASE_URL`, gap #3 / Step 3); perf/bundle characteristics are meaningful regardless.
- [x] **I6 — Wire real existing-template SSIM (currently `() => []` → SSIM=1).** ✅ *built & verified (12/12);
      live render pass on first supervised run.* The backward-compat visual regression gate was effectively OFF —
      scariest gap for a system that auto-merges unreviewed additive code. Built `createRealExistingSsim`
      (`delivery/existing-ssim.ts`), wired into the runner's `createRegressionChecks`:
      - **Mechanism:** pin two immutable worktrees via I2's `ensureBaseWorktree` — baseline @ `develop`, challenger
        @ run-branch champion — then render every existing template (≠ the run's own) section-by-section through
        BOTH and pair `[challenger, baseline]`. The template JSON is identical on both branches, so the diff
        isolates exactly shared-`packages/ui` regressions. `existingTemplatesMinSsim` < 0.99 → gate fails → no
        auto-merge.
      - **Bounded + observable:** `SITC_REGRESSION_MAX_TEMPLATES` caps the sample (logged, no silent truncation);
        no-ops when the run branch == develop (no shared-code delta); pairs written to `.sitc/runs/<id>/regression/`.
      - **Testable design:** pure dependency-injected orchestration (`createExistingTemplatesSsim`) + real wiring
        (`createRealExistingSsim`). Discovery (`listExistingTemplates`) is real-FS.
      - **Verified deterministically:** `packages/tests/sitc-existing-ssim.check.mts` — 12/12 (real-FS discovery
        excludes the run template / counts sections / skips non-JSON dirs; orchestration pairs challenger@champion
        vs baseline@develop, honors both caps, no-ops on run==develop). sitc-core type-checks clean; I1/I2/I4
        checks still green; runner import graph resolves. DEPLOY.md gap #1 closed.
- [x] **I7 — Live judge-drift detection in prod. [amplifies §7.2a + Step 6]** ✅ *built & verified (16/16);
      triple-seeding + R2 is the operator infra step.* The loop's whole correctness rests on the pairwise judge;
      it can drift between runs and (post-I4) a drifting judge could auto-merge the wrong design. Now gated:
      - **Gate** (`scorer/judge-health.ts`): `judgeHealthGate` fails the run on agreement < 0.90, order-stability
        < 0.90, or < 4 confident triples (**fail-closed** — an unvalidated judge isn't trusted). `checkJudgeHealth`
        loads durable triples → replays via `runCalibration` → gates → maps persistence rows; skips gracefully on
        an empty set.
      - **Durable store**: `DrizzleJudgeCalibrationStore` (`@mshorizon/db`) loads triples from
        `sitc_judge_calibration` + appends replay verdicts as an audit log (feeds the admin Judge-health panel).
      - **Run-start gate**: `SITC_JUDGE_GATE=1` runs the check before any engine/worktree setup; a failure
        `process.exit(3)` refuses the run (drift risk) before spending tokens.
      - **Verified deterministically:** `packages/tests/sitc-judge-health.check.mts` — 16/16 (gate thresholds + 
        fail-closed on too-few triples; `checkJudgeHealth` healthy-pass + empty-skip + **biased-judge → 0
        agreement/stability → gate fails**; row mapping). Both packages type-check (sitc-core rebuilt so db sees
        the new types); all 10 suites green (143 checks); runner loads. DEPLOY gap #3 closed (seeding+R2 = infra).

### Tier 3 — sharpening quality & observability
- [x] **I8 — Per-dimension structured scoring. [amplifies CONCLUSIONS #5]** ✅ *built & verified (20/20).* The
      scorer already computed a per-dimension `breakdown` but discarded it — the worker only saw a prose critique.
      - **Structured rubric** (`scorer/rubric.ts`): `Finding{dimension,severity,gap,fix}` +
        `normalizeFindings` (defensive: drops unknown dimensions/empty items, defaults severity, clamps lengths,
        caps count, sorts must-fix first), `weakestDimension`, `renderCritique` (checklist that leads with the
        weakest dimension + must-fix items, with per-dim scores).
      - **VLM scorer** (`scorer/vlm.ts`): prompt now elicits the structured checklist; `VlmScore` gains
        `findings`, and `critique` is DERIVED from them (falls back to prose if the model emits none). Since the
        sweep already feeds `vlm.critique` to the next worker, the sharper steering flows through with no
        control-flow change — low risk.
      - **New angle — strategy hint** (`suggestStrategy`): maps the dominant gap → a strategy (token gaps
        color/typography/spacing → `tune-json`; structural must-fix layout/imagery → `new-variant`; never
        `new-section`). Advisory only — the runner logs it per iteration (`↳ hint: …`); the orchestrator's
        plateau ladder still governs control flow (kept the verified loop intact).
      - **Verified deterministically:** `packages/tests/sitc-rubric.check.mts` — 20/20 (normalize edge cases,
        weakest/checklist ordering, strategy mapping incl. minor-structural-doesn't-escalate, and `vlmScore`
        over a fake runner parsing findings + deriving/ falling-back the critique). sitc-core type-checks clean;
        all seven suites green (101 checks); runner loads. CONCLUSIONS #5 marked done.
- [x] **I9 — Live cost/ROI telemetry during a run. [new]** ✅ *built & verified (19/19).* `claude -p
      --output-format json` reports `total_cost_usd` + token usage per call — previously discarded. Now captured
      and surfaced:
      - **Usage capture:** `claude-worker` gained an `onUsage` sink + `parseClaudeUsage` (defensive: missing/non-
        numeric → 0; pulls cost, in/out tokens, `cache_read_input_tokens`, duration).
      - **`CostMeter`** (`cost-meter.ts`): accumulates totals and attributes cost **by call-type** (mutate/score/
        judge/other) via `AsyncLocalStorage` — correct even under concurrent workers. `snapshot()` + compact
        `line()` for live logging.
      - **Runner wiring:** one meter; all `claude -p` workers route through it (`mkWorker`); collab calls scoped
        by type. Live burn appended to each iteration log `[$… · …k tok · N calls]`; end-of-run summary +
        per-call-type breakdown + **ROI** (`runCostRoi`: $/promotion, $/locked-section, cache-read share) written
        to `.sitc/runs/<id>/cost.json`. Gives real numbers to set budget defaults on (CONCLUSIONS #7), vs the
        pre-launch `estimateRunCost` guess.
      - **Bonus:** the captured `cache_read_input_tokens` share is exactly the signal **I10** needs (is the warm
        authoring kit being prompt-cached across spawns?) — I10 is now mostly a measurement/analysis task.
      - **Verified deterministically:** `packages/tests/sitc-cost-meter.check.mts` — 19/19 (envelope parsing incl.
        missing/junk fields; meter accumulation + concurrent ALS attribution with no cross-talk + unscoped→other;
        ROI incl. div-by-zero guards). sitc-core type-checks clean; all eight suites green (120 checks); runner loads.
- [x] **I10 — Verify the authoring kit is actually prompt-cached across `claude -p` spawns. [new]** ✅ *built &
      verified (7/7); live answer is operator-run.* §4.2 assumes the warm kit is cacheable but it was never
      measured. I9 already captures `cache_read_input_tokens`; I10 turns it into a direct verdict:
      - **Per-call-type cache telemetry:** `CostMeter` now tracks input + cache-read tokens per label;
        `cacheReadShareByLabel` = cacheRead/(input+cacheRead). The runner logs it at run end with a verdict on
        the `mutate` label (which carries the big static kit): GOOD ≥50% / PARTIAL / NONE, written to `cost.json`.
      - **Direct cross-spawn probe:** `scripts/sitc-cache-probe.mts` (`pnpm sitc:cache-probe`) sends an identical
        large stable prefix across N sequential `claude -p` spawns and reads `cache_read_input_tokens` — spawn 1
        primes, spawns 2+ reveal whether a *separate process* reuses the cache. Prints ✅/➖/❌ + the fix
        (front-load the stable prefix / keep a session) if NONE.
      - **Verified deterministically:** `packages/tests/sitc-cache-share.check.mts` — 7/7 (per-label input/cache
        accumulation, share math, zero-token → 0 not NaN). sitc-core type-checks clean; all nine suites green
        (127 checks); runner + probe load.
      - **The fix is now conditional + measured, not speculative:** if a live run shows `mutate` cache ≈0% (or the
        probe says NONE), front-load the static kit as an identical prefix in `steps/author-variant.ts`. Deferred
        until the measurement says it's needed — no speculative prompt churn.

### Tier 4 — scope expansion
- [x] **I11 — Target asset capture. [amplifies CONCLUSIONS #4 / §18-F]** ✅ *built & verified (10/10); live DOM
      extraction exercised on a real capture run.* The loop couldn't fix a broken/placeholder image because it had
      no notion of what imagery a section should carry.
      - **Reference metadata, not bytes** (IP posture, README §1.1): `captureTarget` now records per-band
        `BandImage[]` — `kind` (img/background), dimensions, **aspect ratio**, alt — area-ranked top few, from the
        same DOM pass that reads bands/style. (`scorer/capture.ts`)
      - **Worker hint:** `summarizeBandImages` buckets them ("full-bleed background ~16:9; 3 square ~1:1 images")
        and the runner appends it to each section's `targetStyle` string (existing seam → worker prompt), so the
        worker chooses a closer-aspect placeholder/R2/Unsplash asset. Aspect ratio is exactly the §18-F gap (a
        16:9 hero scores differently than 1:1 with identical structure).
      - **Verified deterministically:** `packages/tests/sitc-asset-capture.check.mts` — 10/10 (aspect bucketing,
        full-bleed-first ordering, fg counts + pluralization, empty/background-only). sitc-core type-checks clean;
        all 12 suites green (167 checks); runner loads. CONCLUSIONS #4 updated.
      - **Out of scope (deliberate):** downloading the target's actual image bytes — design inspiration, not asset
        copying. The worker sources its own licensed/generic assets matching the captured shape.
- [x] **I12 — Multi-breakpoint scoring. [amplifies CONCLUSIONS #8]** ✅ *built & verified (14/14).* Finding: the
      "mobile guard" §5.2 step 6 describes was **never actually wired** — mobile was captured at ingestion but the
      loop only rendered/scored/judged desktop, so a desktop-good/mobile-broken challenger got promoted (caught
      only maybe at the acceptance gate).
      - **Mobile guard, now real:** additive optional `guard` collaborator (same low-risk seam as I3's lease) —
        fires only when a challenger WINS desktop AND a champion exists; `ok:false` reverts (champion kept), reason
        feeds the next critique. (`loop/section-iteration.ts`)
      - **Overflow signal:** `measureHorizontalOverflow` (`steps/render.ts`) → `scrollWidth−clientWidth` at a
        breakpoint; `mobileGuardVerdict` (`scorer/breakpoints.ts`) rejects a challenger that introduces/worsens
        mobile overflow vs the champion (equal-or-better passes — never blocks a pre-existing problem). No mobile
        target crop needed (self-regression guard).
      - **Runner opt-in** `SITC_SCORE_MOBILE=1`: renders challenger (its worktree) + champion (its I2 base
        worktree) at mobile, applies the verdict, logs rejections.
      - **Pure primitive for full scoring:** `combineBreakpointScores` (weighted, guards excluded) is ready for
        true both-breakpoint *scoring* once ingestion produces aligned mobile target crops (needs mobile DOM
        segmentation — deferred).
      - **Verified deterministically:** `packages/tests/sitc-breakpoints.check.mts` — 14/14 (combine weighting +
        guard-exclusion; verdict introduce/worsen/improve/sub-floor; guard seam fail→revert / pass→promote /
        first-attempt-skip / absent→unchanged). sitc-core type-checks clean; all 11 suites green (157 checks);
        runner loads. CONCLUSIONS #8 updated.
- [x] **I13 — Smarter convergence handoff. [new]** ✅ *built & verified (20/20); escalated sweep is operator-run.*
      §8.1 dumped every un-closable gap into one "manual" bucket — but some are component-code the worker merely
      *declined*, which a stronger model could finish.
      - **Gap classification** (`loop/convergence.ts`): `classifyGap` → `asset` / `layout-primitive` /
        `component-code` / `other` (asset & layout-primitive take precedence over a stray "component" mention).
        `planEscalation` splits residual gaps into **escalatable** (component-code) vs **manual** (asset/layout-
        primitive); `other` is low-signal → neither. A unit that already exhausted escalation is forced to manual.
      - **Report**: `renderConvergenceReport` now leads with a "Try escalation first" section + the exact command,
        then "Manual follow-ups (out of the loop's reach)".
      - **Escalated pass** (runner, opt-in `SITC_ESCALATE=1`): on convergence with escalatable units, runs ONE
        sweep over just those units at `SITC_ESCALATION_MODEL` (e.g. opus) with strategy forced to `new-variant`
        (explicit component authoring), reusing the warm engines/pool before cleanup; updates the convergence
        state so a real gain continues the loop and a no-gain falls through to manual.
      - **Verified deterministically:** `packages/tests/sitc-convergence.check.mts` — 20/20 (classification +
        precedence; converged/locked/categories; plan split incl. exhausted→manual and other→neither; report
        sectioning + command). sitc-core + db type-check; **all 13 suites green (187 checks)**; runner loads.
      pass (stronger model / explicit "you may write the component"). Reserve true handoff for asset/layout
      primitives the loop genuinely can't touch.

### Tier 2 — gaps blocking trusted unattended runs (cont.)
- [x] **I14 — Scheduler coverage guarantee: no in-play unit starved to 0 iterations. [amplifies CONCLUSIONS #6]**
      ✅ *built & verified (20/20).* CONCLUSIONS #6: `about` once got **0 iterations** because higher-gap peers
      hogged every round under the pure gap-priority scheduler when `maxWorkers < in-play count`, and the run
      then settled on budget/rounds before it was ever dispatched. The scorer can't fix what it never renders.
      - **Coverage floor** (`loop/scheduler.ts`): added an optional, never-reset `dispatches` counter to
        `SectionState` (distinct from `attempts`, which resets on promote). `pickNext(states, maxWorkers, {minCoverage})`
        now sorts **uncovered (dispatches < minCoverage) STRICTLY BEFORE covered** peers — a hard partition that
        beats gap — then falls back to the existing gap → cost → attempts ordering within each tier. `minCoverage=0`
        keeps the exact old behavior (opt-in). Helpers `dispatchesOf`/`isCovered`/`coverageMet` for observability.
      - **Wired** (`loop/sweep.ts` → `pipeline/run.ts` → `scripts/sitc-runner.mts`): the sweep increments
        `st.dispatches` per pick (survives promote) and defaults `minCoverage=1`, so **every in-play unit is
        attempted at least once before the scheduler re-rolls a covered peer**. Operator override `SITC_MIN_COVERAGE`.
        Guarantee is bounded by `rounds × maxWorkers` (can't cover more units than the round budget allows).
      - **Verified deterministically:** `packages/tests/sitc-scheduler-coverage.check.mts` — 20/20. Unit: coverage
        partition beats gap, opt-in off = unchanged, floor N>1, gap order preserved within a tier, locked/frozen
        excluded, maxWorkers cap; predicates. **Integration (real `runSweep`, fake collab):** 3 sections /
        maxWorkers 1 / maxRounds 3, none promote → pure-gap **STARVES** low-gap units (dispatches **3/0/0**),
        coverage-first dispatches **1/1/1** and `coverageMet`. sitc-core type-checks clean; lessons-ab sweep check
        still 17/17; runner import graph resolves. CONCLUSIONS #6 marked done.
