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

## Step 8 — Optional / degrades gracefully
- [ ] Real embedding model via `SITC_EMBED_CMD` (lessons work crudely on the hashing fallback without it).

---

### Smallest-first-real-result milestone (recommended to sequence within the above)
A single-section, single-iteration **real** cycle (slice of Steps 2+3): real `authorVariant` edits one section
→ `renderSection` renders it from a working file → `scoreSection` + `pairwiseJudge` vs the captured target crop.
First point where you can **open a rendered section and compare it to the target**.
