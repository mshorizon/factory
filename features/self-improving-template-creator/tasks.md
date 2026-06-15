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

## Step 2 — Real `authorVariant` worker 🧠 (the generative core)
- [ ] Replace the v0 scaffold with a real `claude -p` worker that edits the section's JSON / component code in
      the worktree toward the target and returns a verdict (DESIGN §4.2/§6/§15).
- [ ] Prompt engineering for `tune-json` first (cheapest), then `extend-variant`/`new-variant`.
- ⚠️ **Governance:** spawning headless `claude -p` with Edit/Write is an autonomous agent loop — the harness
      may gate this. Likely needs the operator to run it (not the assistant) or an approved permission rule.

## Step 3 — Render integration: run-scoped DB ↔ engine 🖥️ (so there's something to open)
- [ ] Implement `seedRunDb` for real (currently a stub that throws) — provision + seed the working profile.
- [ ] Make `renderSection` render the run's **evolving profile** (from run DB or a working file), not a
      pre-seeded `?business=`.
- [ ] Per-section **champion-image tracking** wired into the loop (champion render vs challenger render).

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
