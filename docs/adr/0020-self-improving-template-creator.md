# ADR-0020: Self-Improving Template Creator (iterative design-convergence loop)

**Status:** accepted  
**Date:** 2026-06-15  
**Validation:** Phase −1 spike (2026-06-15) confirmed the two load-bearing bets — isolation-render fidelity
(decision 4) and pairwise-judge reliability (decision 5). See
`features/self-improving-template-creator/SPIKE-FINDINGS.md`.

## Context
The `clone-template` skill (ADR-0013 variant system, ADR-0005 template→DB sync) takes a reference website
URL and produces a template in **one pass** — reaching roughly ~70% visual fidelity before a human hand-tunes
the rest. That manual polish is the bottleneck in the "Site Factory" thesis: it doesn't scale to 100+
businesses, and every clone job throws away its reasoning, so we never get faster.

We want a mechanism that, given a reference URL, **iteratively** evolves a template until its rendered output
converges on the reference design — running unattended for hours if needed — and that **gets better over
time** by remembering what worked across runs. The full design lives in
`features/self-improving-template-creator/` (`README.md` + `DESIGN.md`); this ADR records the load-bearing
architectural decisions so they aren't re-litigated.

The hard parts: a single regeneration improves some sections and degrades others (so global accept/reject is
wrong); LLM visual judgment is noisy and biased; mutating *shared* component code can silently break other
templates; and "run for hours" is only worthwhile if the loop is safe (never regresses) and efficient.

## Decision
Build a **stateless orchestrator** that drives a population of **headless `claude -p` workers**, with all run
state in PostgreSQL. The architecture rests on these decisions:

1. **Compute = `claude -p`, not the Claude API.** Workers are headless Claude Code invocations; the
   orchestrator spawns them and reads structured JSON verdicts. (Consistent with ADR-0017's narrow
   API-usage scope — this feature adds no new API surface.) Loop control (selection, budget, stop) lives in
   plain orchestrator code, so it is deterministic and resumable.

2. **Evolutionary loop with per-section champions.** Evaluation and accept/reject happen **per section**: a
   challenger is promoted only if it beats the current champion, else reverted. Template quality is therefore
   **monotonically non-decreasing**.

3. **Three locked tiers of granularity** (coarse→fine, each frozen before the next): **global theme**
   (`theme.*` palette/type/radius/spacing) → **shared atoms** (button/card/input/badge) → **per-section**
   structure/variant/content. Lower tiers are a stable substrate, which is what makes per-section scoring
   genuinely independent.

4. **Section-isolation render harness** (Storybook-style) for the inner loop, instead of full-site dev-server
   renders. Faster, parallelizable, and removes cross-section contamination — the precondition for (2) being
   *real* rather than aspirational. Full-page renders are reserved for the theme/atom passes, checkpoints,
   and final acceptance.

5. **Hybrid scoring; promotion by pairwise A/B.** Absolute score = VLM (design-system rubric, discounting
   literal copy/images) + pixel/SSIM. The **promotion decision** is a pairwise A/B judgment
   (champion vs challenger vs target), hardened with order-symmetric voting + a human-labeled calibration set,
   because absolute LLM scores jitter and pairwise judging has positional bias.

6. **Additive-only mutations + risk-routed delivery.** New variants/sections are strictly additive (new
   names / new optional fields), verified by an additive-by-construction structural gate plus SSIM ≥ 0.99 on
   existing templates (NOT pixel-identity). Clean `tune-json`/`extend-variant` runs **auto-merge to
   `develop`**; any run introducing shared code (`new-variant`/`new-section`) stops in `needs_review`.

7. **Isolated run-scoped render DB + per-run git branch.** Each run seeds its own throwaway Postgres
   schema/DB (never the shared `*.dev.hazelgrouse.pl` site — ADR-0014) and works on a `sitc/run-<id>` branch
   where a champion is a commit and a revert is a targeted checkout.

8. **Semantic, compounding learning store.** Lessons are embedded (pgvector, ADR-0007) and retrieved by
   situational similarity (design traits + section + live critique), with confidence/decay, so each run
   starts smarter than the last — across different sites and templates.

9. **Shared core library with `clone-template`.** The skill's phases are extracted into `packages/sitc-core`;
   the skill becomes "run all phases once" (iteration 0) and the loop calls per-section phases repeatedly.
   One source of truth for design→component, so the two can't drift.

10. **Cost-aware scheduling + portability.** The orchestrator allocates budget by expected score-gain-per-
    token (bandit, not round-robin). It runs on the VPS (PM2) by default but is portable to local (stronger
    model) via env, with a DB single-owner lock per run.

11. **Hard write-allowlist sandbox.** Workers may write only to additive, dependency-free, design-system
    paths (`packages/ui/src/{sections,atoms}`, `templates/`, additive `packages/schema`) — never
    `apps/engine` business logic, config, secrets, or new dependencies. Enforced at the sanity gate before
    any render. This is what makes auto-merging *unreviewed* generated code (decision 6) defensible.

12. **Per-worker git worktrees + single-writer commit queue.** Concurrent workers (decision 10) cannot share
    one working tree; each gets its own worktree, and promotions integrate onto the run branch through a
    serialized queue owned by the orchestrator.

13. **Delivery gates on non-visual acceptance too** (perf/a11y/responsive/hygiene), not just the visual
    score — a pretty-but-broken template must not ship.

14. **Variant-library curation.** Reuse-before-create is enforced and a periodic dedup/retirement pass keeps
    the variant library and `sectionType` enum from rotting into near-duplicate noise over many runs.

**Validate-first:** decisions (4) and (5) are unproven bets; the build order gates them behind a 1–2 day
spike (isolation-render fidelity; pairwise-judge reliability) before the rest is built.

## Consequences
**Positive:**
- Removes the manual-polish bottleneck; converts one-off clone jobs into a system that compounds.
- Monotonic + additive + risk-routed delivery makes a multi-hour autonomous run *safe* — worst case is "no
  improvement", never a regression or a broken sibling template.
- Isolation rendering + cost-aware scheduling make long runs fast and efficient, not just possible.
- Unifying with `clone-template` reduces, rather than duplicates, the design→component codebase.

**Negative / costs:**
- Significant upfront engineering before the loop produces anything: the render harness (4) and the
  `sitc-core` extraction (9) are on the critical path and (9) touches a working skill.
- New infra surface: orchestrator process, run-scoped DB lifecycle + **orphan garbage collection**, pgvector,
  per-worker git worktrees + a commit queue (12), a calibration set to maintain, and a new admin page — more
  to operate and monitor.
- Correctness hinges on the VLM judge; calibration drift is an ongoing operational concern.
- The three-tier lock order is a hard constraint workers must respect; a bug that lets a per-section worker
  mutate global tokens would silently break the per-section independence guarantee.
- **Autonomous codegen is only as safe as the allowlist (11).** A gap in the sandbox or a non-additive change
  slipping past the gates would let unreviewed code reach `develop`; the gates (allowlist + build/validate +
  §7.3 regression + §7.4 acceptance) must be treated as security-critical, not best-effort.
- Variant-library curation (14) is recurring work; skipping it lets the library and schema enum bloat.

## Alternatives considered
- **Keep one-shot `clone-template` + manual polish** — simplest; but it's the exact bottleneck we're removing
  and it never compounds.
- **Single global "regenerate the whole template" loop** — far simpler control flow; but a generation that
  improves the hero and worsens the footer has no safe accept/reject, so quality oscillates instead of
  converging. Rejected in favor of per-section champions.
- **Claude API instead of `claude -p`** — cleaner programmatic control; rejected to honor the no-new-API-
  surface posture (ADR-0017) and to keep the whole process observable as ordinary Claude Code runs.
- **Absolute-score promotion** (promote if challenger score > champion score) — simpler; but LLM score noise
  promotes worse renders and reverts real work. Replaced by pairwise A/B.
- **Pixel-identity regression gate** — strongest-sounding backward-compat guarantee; but screenshots aren't
  byte-deterministic (antialiasing, font hinting, Tailwind JIT ordering), so it produces false failures with
  zero real change. Replaced by additive-by-construction structural checks + thresholded SSIM.
- **Full-site render per iteration** — reuses the existing engine as-is; but `pm2 restart` per attempt
  dominates wall-clock and couples sections, breaking the per-section premise. Replaced by the isolation
  harness.
- **Tag-match lesson retrieval** — cheaper than embeddings; but misses situational relevance and doesn't
  transfer across niches. Went straight to semantic (pgvector) retrieval.
