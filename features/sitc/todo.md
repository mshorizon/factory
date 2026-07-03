# SITC — Improvement wave 2 (post-run-40/41 code review, 2026-07-03)

> Findings from a three-way code review of `packages/sitc-core`, `scripts/sitc-runner.mts`, and the real
> run artifacts in `.sitc/runs/` (runs 40/41 vs `template-sacrum`). None of these duplicate tasks.md
> I1–I14 or CONCLUSIONS #1–8. Ranked by leverage. Numbering continues the I-series (I15+).
>
> **Headline:** the engineering is done, but the feature's two core claims — "self-improving" and
> "auto-merge flywheel" — were **not actually operating** in the live runs. Tier 0 turns them on.

---

## Tier 0 — the premise isn't running

- [x] **I15 — Wire the lessons write-path (the "self-improving" part is dead code).** ✅ *built & verified
      (30/30, 2026-07-03); first live distill happens on the next real run.* `createLessonWritePath`
      (`learning/write-path.ts`) owns the full lifecycle: `lessonsFor` (retrieval with traits threaded +
      embedding memoization + injected-id tracking), `recordIteration` (recordUse → recompute confidence →
      archive when disproven; no-ops attribute nothing), `finalize` (end-of-run distill → dedupe → insert;
      duplicates bump evidence on the existing row). Wired into `sitc-runner.mts` (both onIteration callbacks
      + a post-run distill step scoped as `distill` in the cost meter, before cost.json). The OFF A/B arm
      injects nothing but still WRITES. Sub-fixes: `distillLessons` now serializes history item-wise
      (`serializeHistory` — no more mid-token `slice(6000)`), the distill prompt constrains `designTraits` to
      a fixed vocabulary (`TRAIT_VOCAB`) matching `traitTagsFromStyle(cap.globalStyle)`, and BOTH lesson
      stores treat trait-less lessons as wildcards (they were silently excluded by trait-filtered queries).
      Verified: `packages/tests/sitc-lesson-write-path.check.mts` (30/30); sitc-core + db type-check clean;
      all 18 suites green; runner import graph resolves. Opt-out: `SITC_DISABLE_DISTILL=1`.
      `distillLessons`, `dedupeLessons`, `recordUse`, `computeConfidence`, `shouldArchive`,
      `renderLessonsDigest` are exported (`src/index.ts`) and called by **nothing** — the runner only
      READS (`retrieveLessons`, `sitc-runner.mts`). No run has ever written a lesson: the store is empty,
      confidence sits at insert-time 0 (retrieval rank degenerates to `similarity × 0.15`,
      `learning/retrieval.ts:39`), and the I1 A/B is moot (runs 40/41 tagged `lessons-on` against an empty
      store). Fix: end-of-run distill→dedupe→insert step in `runFull`/runner fed from promoted/reverted
      iteration critiques, plus per-iteration `recordUse(id, promoted)` for the lessons that were injected.
      Related sub-fixes: `distillLessons` truncates `JSON.stringify(history).slice(0, 6000)` mid-token
      (`learning/distill.ts:39`) — sample promoted/reverted iterations instead; the runner's retrieval query
      never passes `designTraits` (tag pre-filter degenerates to scope-only) and re-embeds per iteration
      with no cache — thread traits + memoize by text hash.

- [x] **I16 — Make the acceptance a11y/hygiene gates baseline-relative.** ✅ *built & verified (20/20,
      2026-07-03).* `createAcceptanceChecks` gained `baselineUrl` (lazy thunk, memoized like `url`): a11y and
      hygiene probe BOTH pages and fail only on regressions the run introduced — new axe rule ids (rule-id
      granularity), counts that grew, console errors whose normalized text (`normalizeConsoleError`: URLs/
      numbers stripped) isn't on the baseline. Pure diff helpers `diffA11yViolations`/`diffHygiene`
      (`delivery/checks.ts`) are exported + unit-tested; a failed baseline probe degrades to ABSOLUTE mode
      (stricter, never looser). Runner supplies the baseline: the same template served from a
      develop-pinned `ensureBaseWorktree` engine. Verified:
      `packages/tests/sitc-baseline-acceptance.check.mts` (20/20) incl. the exact run-40/41 fixtures
      (footer-iframe violations + google.com console error present on both sides → pass).
      `delivery.json` for runs 40 AND 41 fails on the *identical* pre-existing defects: footer map-iframe
      a11y (color-contrast, frame-title, list) and the `google.com` iframe console error. These exist on
      `develop` — every future run fails on them regardless of what it changed, so auto-merge can
      mathematically never fire. Fix: capture the same checks against the develop baseline render and fail
      only on violations **not present in the baseline** (new-violations-only diff).

- [x] **I17 — Fix the existing-template SSIM systematic false positive.** ✅ *built & verified (16/16,
      2026-07-03).* Both guards in `delivery/existing-ssim.ts`, injected deps so the pure orchestration
      stays unit-testable: (a) **shared-code early exit** — new `changedPaths` dep
      (`git diff --name-only dev...champ` in the real wiring); a diff touching only `templates/` returns
      no pairs and renders NOTHING (run 41 burned ~110 screenshots proving byte-identical code ≠ 1.0);
      (b) **noise self-calibration** (`noiseControl`, on in `createRealExistingSsim`) — renders the SAME
      baseline tree twice and SSIMs the pair before any real pairing; self-SSIM < 0.99 on identical code
      means the harness can't distinguish regressions from render noise → gate skipped LOUDLY (fail-open)
      instead of failing every run at ~0.70. Verified: `packages/tests/sitc-ssim-guards.check.mts` (16/16)
      incl. back-compat (absent deps → original behavior); pre-existing
      `sitc-existing-ssim.check.mts` still 12/12.
      Runs 40/41 gate-failed at SSIM 0.735/0.703 — but run 41's only promotion was JSON-only, so shared
      code was byte-identical between baseline@develop and challenger@champion; identical code should
      score ≈1.0. ~0.7 is render nondeterminism (animations/fonts/images) in the I6 live pass. Fixes:
      (a) **early-exit SSIM=1** when `git diff develop...champion -- packages/ui` is empty (also saves
      ~110 Playwright renders/run); (b) **noise self-calibration** — render one baseline-vs-baseline pair
      first; if the identical pair scores <0.99 the harness is too noisy to gate on (fail-open with a loud
      note, or raise tolerance to the measured noise floor).

## Tier 1 — bugs that will kill a long unattended run

- [ ] **I18 — Lease heartbeat: the GC cron will destroy a live run.**
      `runFull` acquires a 60s-TTL lease (`pipeline/run.ts:96`) and never renews — `renewLease` is only
      called by the Phase-1 stub orchestrator. `ecosystem.sitc.config.cjs` runs orphan GC with
      `--drop-db --yes` every 15 min; `sweepOrphans` tears down worktrees + drops the run DB of any
      expired-lease non-terminal run. A multi-hour sweep is "orphaned" 60s in. Fix: heartbeat
      `store.renewLease` in `runSweep`'s round loop (store + runId already threaded).

- [ ] **I19 — Integrate-conflict recovery: a conflicting cherry-pick wedges the run silently.**
      `integrate()` (`orchestrator/worktree.ts:210`) has no failure path. Concurrent sections edit the
      same template JSON; a cherry-pick conflict leaves `__integrate` mid-pick (CHERRY_PICK_HEAD), every
      later promotion degrades to an "iteration error" no-op, and the run burns its remaining budget
      achieving nothing — no distinct signal. Fix: on failure `cherry-pick --abort` + `reset --hard
      <branch>`, tag the critique as an integrate conflict, retry the pick from the new champion.

- [ ] **I20 — Crashed runs stay `running` forever, invisible to GC.**
      If `drive()` throws, `runFull`'s `finally` releases the lease but never updates status; GC's
      `findExpiredLeasedRuns` only matches `lockedBy != null` → phantom run, leaked worktrees/run-DB.
      The state machine's `fail` event exists and is never used. Fix: catch → `applyEvent(cur, "fail")`
      before releasing the lease; optionally let GC also match `running` runs with a null lease.

- [ ] **I21 — Run the regression gate + merge in a dedicated worktree, not the operator's checkout.**
      `createRegressionChecks` runs `pnpm type-check`/`test:validate` in `repoRoot` (`delivery/checks.ts:92`)
      — the main checkout on `develop`, i.e. the pre-merge build/validate checks code that never changed.
      And `mergeRunToDevelop` does `git checkout develop` in the operator's working tree mid-run and never
      fetches (`delivery/delivery.ts:63`). Fix: pin a worktree at the champion for the gates and one at
      (fetched) `develop` for the merge; never touch the main checkout.

- [ ] **I22 — Additive-schema check: recurse `oneOf`/`anyOf`/`allOf`.**
      `isAdditiveSchemaChange` (`delivery/schema-additive.ts:54`) only descends `properties`/`definitions`/
      `$defs`/`items` — an enum removal or type change inside a combinator branch (present in
      `business.schema.json`) passes as "additive" and could auto-merge. Fix: recurse combinator arrays
      (positional match; flag reordering as non-additive), `additionalProperties`, `patternProperties`.

## Tier 2 — cost: most of the budget buys nothing

- [ ] **I23 — Score-then-lock: don't spend mutate tokens on units that already match.**
      Run 41: 15 mutate calls = $7.78 of $8.65 total, 1 render, 1 promotion — 4/6 units self-reported
      "already matches target" repeatedly, because units are only scored when a challenger renders.
      Fix: score champion-vs-target once at run start (and on any no-op verdict) and lock units already
      ≥ threshold before dispatching mutate. Side effect: fixes `metrics.json` reporting finalScore 0
      for sections that actually match.

- [ ] **I24 — Keep the critique on promote.**
      `loop/sweep.ts:141` resets critique to `""` on promote, but a promoted result's critique is the NEW
      champion's remaining-gap description — exactly what the next attempt on a still-unlocked section
      needs. Fix: keep `res.critique` on promote; clear only on lock.

- [ ] **I25 — Pre-gate the judge with a pixel identity check.**
      Every non-no-op iteration pays 1 VLM + 2 pairwise calls even when the challenger renders
      pixel-identically to the champion (semantically-null edit). Fix: `pixelScore(championImg, ourImg)
      ≥ ~0.995 → auto-tie`, skip both judge calls.

- [ ] **I26 — Shared browser instance.**
      `renderSection` (`steps/render.ts:59`), `measureHorizontalOverflow` (`steps/render.ts:164`), and every
      acceptance check (`withBrowser`, `delivery/checks.ts:143`) each do `chromium.launch()`/`close()` —
      hundreds of launches/run, self-inflicted load on the machine-contention failure mode (CONCLUSIONS #6).
      Fix: one shared browser, fresh *context* per render, closed at run end.

- [ ] **I27 — Dollar cap in BudgetCaps.**
      `delivery/budget.ts` caps only iterations/wall-clock; the I9 CostMeter knows `totalUsd` live but
      nothing enforces it. Fix: add `maxUsd` + thread `meter.snapshot()` into the sweep's budget check.

- [ ] **I28 — Drop the 240s render timeout.**
      `sitc-runner.mts` `waitForMs: 240000` predates I2/I3's warm engines; any non-fail-fast wedge costs
      4 min/iteration. Fix: 30–60s with one retry.

## Tier 3 — operational trust

- [ ] **I29 — Config story: `SITC_PROFILE=live` preset + print effective config.**
      27 distinct `SITC_*` flags; every quality feature (judge gate, mobile guard, prod acceptance build,
      delivery PR, escalation) defaults OFF — the *recommended* configuration has likely never run. Fix:
      a `live` preset composing the sane flags, effective-config printout at startup, and default
      `SITC_DELIVERY_PR=1` so `needs_review` runs open a PR instead of silently parking a branch
      (sitc-21-preview still strands 4 real component improvements).

- [ ] **I30 — Judge gate must fail closed when explicitly enabled.**
      With `SITC_JUDGE_GATE=1`, an empty `sitc_judge_calibration` table or an errored health check logs
      "SKIPPED" and proceeds (`sitc-runner.mts` ~:210) — contradicting I7's fail-closed claim exactly when
      the operator asked for the gate. Fix: explicit flag → hard fail; also ship `pnpm sitc:seed-calibration`
      (generateSubtleTriples exists; R2 upload is the only missing piece).

- [ ] **I31 — Cross-run trend report (§18-G, still unmeasured).**
      24 run dirs under `.sitc/runs/`, nothing aggregates them. Fix: `pnpm sitc:report` sweeping
      `.sitc/runs/*/{metrics,cost,delivery}.json` into one table (iterations-to-threshold trend,
      $/promotion over time); optionally persist to `sitc_runs` for the admin panel.

- [ ] **I32 — Stable section identity across runs.**
      `type#index` drifts as the template JSON evolves (run 40 `about#3` = run 41 `features#3`) — corrupts
      any cross-run per-section comparison, including the I1 A/B tooling. Fix: a stable per-section id
      (content hash at seed time, or persisted id in the section JSON).

- [ ] **I33 — Extract the runner's untested orchestration into sitc-core.**
      ~250 lines in `sitc-runner.mts` (target-style assembly, chrome-unit derivation, strategy-routed
      render collaborator, escalation pass, duplicated convergence stat tracking) have zero coverage while
      sitc-core has 13 deterministic suites. Fix: `ingestTarget()` + `createRunCollaborators()` in
      sitc-core with checks.

## Smaller items (one-liners, fix opportunistically)

- [ ] **I34** — `pixelScore` crops to overlap (`scorer/pixel.ts:35`): a half-height render pays no size
      penalty (30% of hybrid score + the SSIM gate signal). Multiply by an overlap penalty
      `(minH/maxH)×(minW/maxW)`.
- [ ] **I35** — `dismissBanners` (`scorer/capture.ts:18`) clicks any button matching /ok|accept|agree/i —
      a CTA like "OK, book now" navigates and poisons the one-shot target capture. Scope to
      dialog/cookie/fixed-overlay containers + assert `page.url()` unchanged.
- [ ] **I36** — Vite cache dir keyed by port (`orchestrator/engine-manager.ts:112`) + port reuse hands a
      new worktree a stale cache — the exact failure class the variable was added to prevent. Key by
      worktree-path hash; clean in `stop()`.
- [ ] **I37** — EngineManager LRU can evict an engine mid-render (`lastUsed` only bumps on `ensure()`);
      `__base-<sha>` engines squeeze the window. Refcount acquire/release around renders; evict idle only,
      prefer stale-champion base engines. Also: base worktrees accumulate one per champion generation
      until teardown — retire superseded ones when the champion advances.
- [ ] **I38** — `theme-pass.ts:95` `maxIterations` accepted but never read (dead API); validation guard
      adopts an invalid candidate when the seed was already invalid — require `after.valid` outright.
- [ ] **I39** — Pause/abort/budget only take effect between rounds (up to ~10 min latency): re-check
      `nextCommand` + `budgetExceeded` before each iteration dispatch inside a round.
- [ ] **I40** — Ops crud: `ecosystem.sitc.config.cjs:18` freezes `DATABASE_URL` into PM2 env at first
      start (stale after restart); `scripts/sitc-orchestrate.ts` is a stale Phase-1 stub kept beside the
      real runner (fold into `--stub` or delete); I9 cost telemetry counts only claude spend — render
      wall-clock (the dominant local cost) is unmetered.
