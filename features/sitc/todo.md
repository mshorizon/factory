# SITC — Improvement wave 2 (post-run-40/41 code review, 2026-07-03)

> Findings from a three-way code review of `packages/sitc-core`, `scripts/sitc-runner.mts`, and the real
> run artifacts in `.sitc/runs/` (runs 40/41 vs `template-sacrum`). None of these duplicate tasks.md
> I1–I14 or CONCLUSIONS #1–8. Ranked by leverage. Numbering continues the I-series (I15+).
>
> **Headline:** the engineering is done, but the feature's two core claims — "self-improving" and
> "auto-merge flywheel" — were **not actually operating** in the live runs. Tier 0 turns them on.
>
> **STATUS 2026-07-03: I15–I41 ALL RESOLVED** (25 suites, ~510 deterministic checks). Remaining
> open threads, deliberately deferred: `sitc:seed-calibration` command (I30 — needs a store insert path
> + artifact home), persisted per-section ids (I32 — schema change; positional matching covers today's
> case), collaborator/escalation extraction (I33 — thin runner glue, no second consumer), engine
> refcounting (I37 — idle-age guard covers the observed failure). **Next step: a supervised live run**
> (`SITC_PROFILE=live SITC_ENABLE_WORKER=1`), then `pnpm sitc:report` to see the gates + flywheel operate.

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

- [x] **I18 — Lease heartbeat: the GC cron will destroy a live run.** ✅ *built & verified (2026-07-03,
      part of `sitc-run-resilience` 12/12).* `startLeaseHeartbeat` (`pipeline/run.ts`, exported): renews at
      ttl/3 via an unref'd interval for the driver's whole lifetime (not just between rounds — a single
      iteration can outlive the TTL), stopped in `runFull`'s finally. A lost lease / renew error surfaces
      via `onLost` → the new `FullRunInput.log` (wired to console in the runner) but never aborts the run
      (GC only reaps EXPIRED leases; the heartbeat keeps retrying). Verified: periodic renewal with correct
      id/owner/ttl, stop() halts, renew-false and renew-throw both route to onLost, and a real `runFull`
      renews during the run.

- [x] **I19 — Integrate-conflict recovery: a conflicting cherry-pick wedges the run silently.** ✅ *built &
      verified (9/9, `sitc-integrate-recovery`, real temp git).* `integrate()` now (a) SELF-HEALS on entry
      (`cherry-pick --abort` + `checkout -f` + `reset --hard` — recovers from a crash mid-pick), and (b) on
      a failed pick aborts + hard-resets back to the branch tip and throws a tagged `integrate-conflict:`
      error: champion unchanged, ops tree clean, and the sweep's critique tells the worker to re-edit from
      the NEW champion (an immediate re-pick would conflict identically — the section's next mutate starts
      from the advanced champion, which is the correct retry). Verified: conflict throws tagged + champion
      stable + no CHERRY_PICK_HEAD + clean tree, the NEXT promotion integrates fine (previously impossible),
      and a hand-wedged ops tree self-heals on entry.

- [x] **I20 — Crashed runs stay `running` forever, invisible to GC.** ✅ *built & verified (part of
      `sitc-run-resilience` 12/12).* `runFull` now catches a `drive()` crash and routes the run through the
      state machine's (previously never-used) `fail` event → `needs_review`, guarded by `canTransition` and
      best-effort (never masks the original crash, which still propagates), then releases the lease. A
      crashed run is now visible in the admin UI as `needs_review` instead of a phantom `running` with
      leaked worktrees/run-DB. Verified: crash propagates + status lands `needs_review` + lease released;
      the lease-denied short-circuit leaves status untouched. (The "GC matches running+null-lease" variant
      became unnecessary — crashed runs are no longer `running`.)

- [x] **I21 — Run the regression gate + merge in a dedicated worktree, not the operator's checkout.** ✅
      *built & verified (17/17, `sitc-merge-isolation`, real temp repos + real spawned commands).* Three
      fixes: (a) `createRegressionChecks` gained a lazy memoized `cwd` thunk — the runner passes the
      CHAMPION base worktree, so pre-merge build/validate finally checks the code being merged (proven with
      a marker-file command: runs in the champion tree, nothing in repoRoot; back-compat default preserved).
      (b) `mergeRunToDevelop`: HEAD==develop (VPS case) merges in place with the clean-tree guard; HEAD on
      any other branch merges in a THROWAWAY worktree pinned at develop — operator's branch, index, and
      dirty files untouched (develop checked out elsewhere → worktree-add refuses → safe downgrade).
      (c) `landDelivery` with push enabled fetches first and refuses BEFORE merging when local develop is
      behind the remote (no local merge to unwind). Pre-existing `sitc-delivery-landing` 17/17 still green.

- [x] **I22 — Additive-schema check: recurse `oneOf`/`anyOf`/`allOf`.** ✅ *built & verified (24/24,
      `sitc-schema-additive`).* `isAdditiveSchemaChange` now recurses combinator arrays positionally
      (removed branches flagged; added branches additive; reordering surfaces per-branch — conservative by
      design), catches `additionalProperties` narrowing to `false` and recurses schema-form AP (removing
      the AP schema widens → additive), recurses `patternProperties` (removed pattern flagged), and handles
      tuple-form `items` positionally. Verified incl. the realistic shape: a variant-enum removal nested in
      `$defs→section→oneOf[0]` is caught with a precise violation path; the same nested enum ADDITION passes.

## Tier 2 — cost: most of the budget buys nothing

- [x] **I23 — Score-then-lock: don't spend mutate tokens on units that already match.** ✅ *built &
      verified (part of `sitc-cost-cuts` 21/21, 2026-07-03).* `preScoreAndLock` (`loop/prescore.ts`) +
      a `prescore` seam in `runFull` that runs AFTER lockTiers (scored champion includes the locked theme)
      and before the sweep: each unit's champion renders once through the warm I2 base engine and is
      VLM-scored against its target crop. Units ≥ threshold lock with `iterationsToLock=0` and a REAL
      final score (no more misleading 0s); in-play units get (a) a seeded champion image — so the FIRST
      challenger must now WIN the pairwise judgment instead of auto-promoting a possibly-worse render —
      and (b) the champion's critique seeded as their first steering input (new `initialCritiques` on
      `runSweep`). Per-unit failure degrades to the old behavior. Runner opt-out: `SITC_PRESCORE=0`.
      Cost: one render + 1 VLM call per unit ≪ the $7.78/15-mutate-call waste it removes.

- [x] **I24 — Keep the critique on promote.** ✅ *built & verified (`sitc-cost-cuts`).* The sweep now
      carries every result's critique forward — a promoted result's critique is the NEW champion's
      remaining-gap description, so a promoted-but-unlocked section's next mutate starts steered instead
      of blind (locked sections aren't dispatched, so nothing to clear).

- [x] **I25 — Pre-gate the judge with a pixel identity check.** ✅ *built & verified (`sitc-cost-cuts`).*
      Optional `pixelSimilarity` collaborator on `runSectionIteration` (runner wires `pixelScore`): with a
      champion present, a challenger at similarity ≥ 0.995 reverts IMMEDIATELY after render — skipping the
      VLM score AND both pairwise calls (3 model calls saved per null edit) — with a critique telling the
      worker its edit changed nothing visible. Below threshold / no champion / no collaborator → previous
      behavior. Render nondeterminism only makes the gate conservatively not fire.

- [x] **I26 — Shared browser instance.** ✅ *built (2026-07-03); live perf win operator-observed.* New
      `src/browser.ts`: `sharedBrowser()` (one Chromium per process, relaunches if it crashed/disconnected)
      + `withPage()` (fresh context per call — full isolation — always closed) + `closeSharedBrowser()`.
      Converted all four launch sites: `renderSection`, `measureHorizontalOverflow`, `captureTarget`
      (context per breakpoint), and the acceptance checks' `withBrowser`. Runner cleanup closes it.
      Removes ~1–2s + a process fork per screenshot on the contention-limited machine (CONCLUSIONS #6).

- [x] **I27 — Dollar cap in BudgetCaps.** ✅ *built & verified (`sitc-cost-cuts`).* `BudgetCaps.maxUsd` +
      `BudgetSpent.usd`; the sweep gained a `spentUsd` thunk (runner wires `meter.snapshot().costUsd`)
      checked each round alongside iterations/wall-clock → `stoppedBy:"budget"`. Operator flag
      `SITC_MAX_USD`. A stuck-expensive run now stops on real spend, not just the iteration count.

- [x] **I28 — Drop the 240s render timeout.** ✅ *built (2026-07-03).* Runner renders now default to 60s
      (`SITC_RENDER_TIMEOUT_MS` to override) with ONE retry on timeout only — fail-fast errors (HTTP≥400,
      error overlay) are deterministic and never retried. Applies to the mutate render path and the I23
      prescore renders. Worst-case wedge cost drops from 4 min to ~2 min, typical to seconds.

## Tier 3 — operational trust

- [x] **I29 — Config story: `SITC_PROFILE=live` preset + print effective config.** ✅ *built & verified
      (part of `sitc-ops-trust` 32/32, 2026-07-03).* `resolveRunnerConfig` (`orchestrator/config.ts`) is
      the ONE typed resolver over the SITC_* flags: `SITC_PROFILE=live` turns the quality bundle ON (judge
      gate, mobile guard, prod-build acceptance, delivery PR, escalation); an explicit env value always
      wins (`SITC_SCORE_MOBILE=0` beats the profile); the autonomous worker and prod push are NEVER
      profile-implied (governance). `renderConfigLines` prints the effective config at run start. The
      runner's scattered env reads are all routed through the resolver.

- [x] **I30 — Judge gate must fail closed when explicitly enabled.** ✅ *built (2026-07-03; semantics
      verified via I29's `judgeGateExplicit` in `sitc-ops-trust`).* Two-tier semantics in the runner:
      an EXPLICIT `SITC_JUDGE_GATE=1` now `process.exit(3)`s on an empty calibration table or an errored
      health check (fail-closed, as I7 claimed); a PROFILE-implied gate (`SITC_PROFILE=live` without the
      explicit flag) skips loudly instead, so an unseeded table doesn't block the first live runs.
      **Still open:** a `pnpm sitc:seed-calibration` command — `generateSubtleTriples` exists but the
      Drizzle store has no seed-insert path (only `loadTriples`/`recordResults`) and durable artifacts
      need a home (R2 or VPS disk); operator infra step.

- [x] **I31 — Cross-run trend report (§18-G, still unmeasured).** ✅ *built & verified + smoke-tested on
      the real artifacts (2026-07-03).* `aggregateRuns`/`renderRunsReport` (`experiment/report.ts`, pure)
      + `scripts/sitc-report.mts` + `pnpm sitc:report`: one table (locked/rounds/invocations/promotions/
      cost/$-per-promotion/delivery/first gate reason) + a per-template first→latest trend, written to
      `.sitc/report.md`. First real output is already diagnostic: runs 39–41 all `needs_review` on
      existing-template SSIM (0.914/0.735/0.703 — the I17 false positive), 0 merged, cost $2→$11→$8.65.
      Admin-panel persistence to `sitc_runs` left as a future nicety.

- [x] **I32 — Stable section identity across runs.** ✅ *comparison-level fix built & verified
      (`sitc-ops-trust`).* `alignArmSectionIds` (`experiment/lessons-ab.ts`): exact id matches first, then
      a leftover off-arm id unifies with the UNIQUE leftover on-arm id sharing its positional `#index`
      (ambiguous positions are left alone, chrome units match exactly). `compareLessonsAb` applies it
      before any per-section math and surfaces `renames` in the report ("features#3→about#3, matched by
      position") — the run-40/41 drift no longer splits one unit into two half-empty rows. A persisted
      per-section id in the template JSON (schema change) remains the fuller future fix if sections start
      being added/removed mid-experiment.

- [x] **I33 — Extract the runner's untested orchestration into sitc-core.** ✅ *mostly done (2026-07-03).*
      Extracted + unit-checked: target-context assembly (`steps/ingest.ts` `buildTargetContext` —
      target-crop map, measured-style lines incl. I11 imagery, chrome-unit derivation, evolve list;
      ~60 runner lines), env handling (`orchestrator/config.ts`, I29), and the duplicated convergence
      stat-tracking (one `trackUnitStats` closure shared by both onIteration callbacks). **Left in the
      runner deliberately:** the strategy-routed render collaborator and the escalation pass — they're
      thin glue over engines/worktrees/meter whose extraction would mean passing the whole runner context
      as a deps object; revisit only if a second consumer appears.

## Smaller items (one-liners, fix opportunistically)

- [x] **I34** ✅ *(verified in `sitc-small-fixes` 15/15, 2026-07-03)* — `pixelScore` now reports `overlap =
      (minW/maxW)·(minH/maxH)` and multiplies similarity by it when < 0.95 (few-px render variance stays
      unpenalized): a half-height render of identical pixels drops from ~1.0 to ~0.5. Applies to the
      hybrid score, the identity gate (only makes it conservatively not-fire on real size changes), and
      the regression-SSIM signal.
- [x] **I35** ✅ — `dismissBanners` clicks only buttons inside banner-ish containers (role=dialog/
      alertdialog, aria-modal, cookie/consent/gdpr/privacy class-or-id) plus a second pass for unnamed
      fixed/sticky overlays; after EVERY click `page.url()` is asserted and a navigation is undone by
      re-goto-ing the capture URL. A page CTA like "OK, book now" can no longer poison the capture.
- [x] **I36** ✅ — Vite cache dir keyed by a sha1 of the WORKTREE path (was: port — port reuse handed a
      different worktree a stale cache), and `stop()` removes the dead engine's cache dir so `/tmp`
      caches no longer persist across runs.
- [x] **I37** ✅ *(retirement verified in `sitc-small-fixes`)* — eviction now considers only engines idle
      >180s (an engine ensured recently may be mid-render); if none are idle the cap is soft-exceeded
      with a log instead of killing a busy engine. `WorktreeManager.retireBaseWorktrees(runId, keepShas,
      {beforeRemove})` retires superseded `__base-` generations; the runner keeps the last 3 champion
      generations and stops each engine before its worktree is removed. (Full refcounting deferred —
      the idle-age guard covers the observed failure mode without an API change.)
- [x] **I38** ✅ *(verified in `sitc-small-fixes`)* — dead `maxIterations` param dropped; the guard is now
      simply "adopt the candidate only if IT validates" — an invalid candidate off an already-invalid
      seed keeps the seed (the old guard adopted it, compounding the breakage).
- [x] **I39** ✅ *(verified in `sitc-small-fixes`)* — commands + budget (incl. live `spentUsd`) are
      re-checked before each in-round dispatch via a shared `stopping` flag; skipped dispatches don't
      count as invocations. Honest scope note: dispatches within a round start concurrently, so the
      practical latency floor is one iteration's duration — true preemption of in-flight `claude -p`
      is out of scope; what this fixes is a round dispatching new work after the stop condition is
      already known at dispatch time.
- [x] **I40** ✅ — (a) `envFileFallback` (`orchestrator/env-file.ts`): runner + run-db CLI fall back to
      `apps/engine/.env` for `DATABASE_URL`, so PM2's frozen-at-first-start env can't brick the GC cron
      (config comment documents `pm2 restart --update-env`); (b) stale `scripts/sitc-orchestrate.ts`
      Phase-1 stub DELETED along with its npm script (which also embedded the DB credential);
      (c) render wall-clock is now metered (count/total/avg logged + `renderWallClock` in `cost.json`) —
      the dominant local cost is no longer invisible next to claude spend.
- [x] **I41 — Acceptance gate covers inherited pages.** *(Found in the post-backlog cross-check: this
      reviewer finding had been dropped from the original todo.)* ✅ *built & verified (2026-07-03,
      `sitc-baseline-acceptance` 27/27).* a11y/hygiene/responsive previously probed ONLY the home URL,
      while about/contact/… inherit the converged variants and ship in the same merge — a broken
      inherited page could auto-merge. Now `createAcceptanceChecks({pages})` iterates the main URL plus
      each page path (runner derives them from `profile.pages` keys == engine route slugs, capped at 4),
      each diffed I16-style against the SAME path on the develop baseline; `responsive` also became
      baseline-relative (a pre-existing overflow can't fail every future run). Pure helpers `withPath`
      (query-preserving — `?business=` selection intact) + `aggregatePages` (any failing page fails, named
      per page) are exported + unit-checked. Perf stays home-only by design (CWV budgets are an
      origin-level signal).
