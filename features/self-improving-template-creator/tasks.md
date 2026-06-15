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

## Step 4 — Target segmentation + alignment 🔬 (riskiest unknown)
- [ ] Real `segmentTarget` (split target into section bands) + band↔our-section alignment map (DESIGN §4.3).
- [ ] Validate it works — the spike did NOT prove this (tested fidelity + judge on *gross* differences only).
      May reshape the loop if weak.

## Step 5 — Real gate toolchain 🚦
- [ ] `regressionGate` checks: real `tsc`/build/`test:validate` + render existing templates + SSIM-diff vs
      `develop` baseline (§7.3 backward-compat proof).
- [ ] `acceptanceGate` checks: real Lighthouse (perf) + axe (a11y) + responsive + hygiene (§7.4).

## Step 6 — Judge calibration on subtle deltas ⚖️ (spike caveat #2)
- [ ] Populate `sitc_judge_calibration` with **subtle** champion/challenger/target triples.
- [ ] Confirm ≥90% agreement + order-stability before trusting auto-merge.

## Step 7 — Deploy for real runs 🚀
- [ ] Orchestrator as a PM2 process on the VPS, pointed at the run-scoped DB (§13.1).
- [ ] Run-DB lifecycle (provision → teardown → orphan-GC) exercised against the real server.

## Step 8 — Optional / degrades gracefully
- [ ] Real embedding model via `SITC_EMBED_CMD` (lessons work crudely on the hashing fallback without it).

---

### Smallest-first-real-result milestone (recommended to sequence within the above)
A single-section, single-iteration **real** cycle (slice of Steps 2+3): real `authorVariant` edits one section
→ `renderSection` renders it from a working file → `scoreSection` + `pairwiseJudge` vs the captured target crop.
First point where you can **open a rendered section and compare it to the target**.
