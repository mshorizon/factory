# Self-Improving Template Creator

> **Status:** 🧊 **Spec FROZEN — v1** (design complete). ✅ **Phase −1 spike PASSED** (2026-06-15) — both
> load-bearing bets (isolation-render fidelity §4.4, pairwise-judge reliability §7.2a) hold; see
> [`SPIKE-FINDINGS.md`](./SPIKE-FINDINGS.md). Next action: **build** at §14 Phase 0. Reopen the spec only if
> later evidence invalidates a load-bearing decision (then bump to v1.1 and note what changed and why).
> **Owner:** msadlo
> **ADR:** [`docs/adr/0020-self-improving-template-creator.md`](../../docs/adr/0020-self-improving-template-creator.md) (architecture decisions of record)
> **Related:** `.claude/skills/clone-template/SKILL.md` (single-pass cloning — this feature is the looping evolution of it)
> **Detailed mechanics:** see [`DESIGN.md`](./DESIGN.md). Section numbers are shared across both files
> (this README owns §1–3 and §13–14; DESIGN owns §4–12 and §15–18), so every `§x.y` cross-reference is unambiguous.

---

## 1. What it is

A long-running, **iterative** mechanism that takes a reference website URL and evolves one of our
factory templates until its rendered output visually converges on that reference design.

Where the existing `clone-template` skill does **one pass** (analyze → map → implement → seed → done),
this feature wraps that idea in a **convergence loop** that can run for hours, unattended:

```
browse target → render our version → score each section → keep what improved →
mutate what didn't → re-render → score again → repeat until "close enough" or budget spent
```

The critical insight (from the original brief): a single generation improves some sections and
**degrades others**. So evaluation and selection happen **per section** — we only carry forward the
sections that got better, and re-roll the ones that got worse. This is an evolutionary loop with a
**per-section champion**, not a single global "regenerate everything" gamble.

A second goal is **compounding quality**: every run writes back lessons learned, so the *next* run —
even for a different website and a different template — starts smarter and converges faster.

**This feature does not start from zero.** Iteration 0 is the existing `clone-template` single pass (the
~70% first cut). This loop is the *refinement engine* bolted onto that output — see DESIGN §5 (Phase 0) and §14.

### 1.1 Scope & assumptions (v1)

- **Home/landing page only.** The input URL is "most often a landing page", and the landing page carries the
  design signal. v1 converges the **home page**; other pages (about/services/contact) **inherit** the locked
  theme + atoms (DESIGN §5.1/§5.1b) and **reuse the converged section variants**, but are not independently
  optimized. Per-page convergence is future work (DESIGN §18).
- **Visual design system only.** The loop optimizes layout, theme, atoms, and section structure/variants — it
  does **not** judge or rewrite copy quality, SEO/meta, navigation information architecture, or business
  logic. Copy and imagery stay generic-by-design for a reusable template (DESIGN §7, §18-F).
- **Design inspiration, not asset copying (IP/ToS).** Like `clone-template` today, this reproduces a target's
  *visual design language* using our own components, generic copy, and our own/licensed assets — it does not
  copy the target's text, images, or code. Ensuring a given clone doesn't infringe is the operator's call;
  this is a conscious, inherited posture, not an oversight.
- **Reproducibility.** Each run pins the worker **model + prompt version** (DESIGN §10), so a run can be
  understood, compared, and replayed.

---

## 2. Why it exists

- `clone-template` gets us ~70% of the way in one shot, then a human hand-tunes the rest. That manual
  polish is the bottleneck in the "Site Factory" thesis.
- We already have a rich library of section/atom variants. The loop's job is to **search** that space
  (and extend it when needed) automatically, using objective + semantic scoring instead of human eyeballing.
- Each run currently throws away its reasoning. Persisting it turns N independent clone jobs into a
  system that gets measurably better over time.

---

## 3. Core principles (decided)

| Decision | Choice | Consequence |
| :--- | :--- | :--- |
| **Compute** | **No Claude API.** Workers are `claude -p` (headless Claude Code) processes. | A plain orchestrator script spawns them and reads their structured verdicts. (Live watchability is a **non-goal** — progress is observed via the admin view / DB, not by attaching to workers.) |
| **Mutation scope** | **Business JSON _and_ component code** (`packages/ui` + engine dispatch). | The loop can invent new variants when existing ones can't match the target. |
| **Backward compatibility** | New variants are **strictly additive** (new variant names / new optional fields). | Existing templates must never change behavior. Adding new variant keys to a template's business JSON is expected and fine. |
| **Scoring** | **Hybrid: VLM (Claude vision) + pixel diff;** promotion by **pairwise A/B** with order-symmetric voting + calibration. | VLM gives semantic scores + critique; pixel/SSIM is a regression guard; the judge is a hardened subsystem, not an oracle (DESIGN §7, §7.2a). |
| **Rendering** | **Section-isolation harness** (Storybook-style), not full-site dev-server renders. | 5–10× faster, true parallelism, and per-section monotonicity becomes *real* (DESIGN §4.4). |
| **Granularity** | **Three locked tiers:** global theme → shared atoms → per-section. | Each tier frozen before the next, so lower tiers are a stable substrate and sections are genuinely independent (DESIGN §5). |
| **Code reuse** | **Shared core library** with `clone-template` — the worker is a scoped clone-template call. | One source of truth for design→component; the loop and the one-shot skill can't drift (DESIGN §4.5). |
| **Inner-loop safety** | **Sanity gate** (allowlist + build/typecheck/validate) before every score. | Broken or out-of-bounds challengers revert instantly; the expensive render+VLM path only sees valid code (DESIGN §5.2a). |
| **Codegen sandbox** | **Write-allowlist:** additive, dependency-free, design-system packages only; never `apps/engine`. | Makes auto-merging unreviewed generated code defensible (DESIGN §15). |
| **Delivery acceptance** | Visual score **plus** a non-visual gate: perf/a11y/responsive/hygiene. | A pretty-but-slow-or-broken template can't ship (DESIGN §7.4). |
| **Scheduling** | **Cost-aware** (bandit) work-unit selection, not round-robin. | Budget flows to highest expected score-gain-per-token; the cap becomes an optimizer (DESIGN §5.6). |
| **Library health** | **Reuse-before-create + periodic variant curation.** | Prevents the variant library / schema enum from rotting into near-duplicate noise over many runs (DESIGN §17). |
| **Resilience** | Defined failure-recovery + orphan GC; champion-commit = source of truth. | Multi-hour unattended runs are crash-resumable and don't leak run DBs/worktrees (DESIGN §16). |
| **Stop conditions** | Score threshold **AND** plateau detection **AND** budget cap **AND** manual checkpoint. | Whichever fires first wins; see DESIGN §8. |
| **Control plane** | **Pause / resume**, persisted in **PostgreSQL**, driven from a new **Admin Panel** page. | A run survives restarts; a human can pause, inspect, approve, or abort at any checkpoint. |
| **Learning** | **Semantic (embedding-based) lessons store** read at the start of every run, written at the end. | Cross-run, cross-template compounding improvement (pgvector retrieval — see DESIGN §9). |
| **Where it runs** | **Portable:** VPS (PM2) by default, **local optional** (to use a stronger local model). | Stateless orchestrator + `claude -p` workers ⇒ only env (`DATABASE_URL`, worker cmd, model) differs. One owner per run via DB lock. |
| **Render env** | **Isolated, run-scoped DB** — never the shared dev site. | Experiments can't destabilize `*.dev.hazelgrouse.pl` (which shares the prod environment). Torn down at run end. |
| **Snapshot/revert** | **Per-run git branch** `sitc/run-<id>`; champion = commit, revert = targeted checkout. | Clean diffs, trivial per-section revert, reviewable final delta. |
| **Delivery** | **Auto-merge into `develop`**, routed by risk — only clean tuning runs auto-merge. | `new-variant`/`new-section` runs stop in `needs_review` (§13.4). Any failed gate ⇒ `needs_review`, branch intact. |
| **Concurrency** | **Default 3** parallel section workers, raisable via `SITC_MAX_WORKERS` / admin UI. | Bounds render thrash; can scale up once proven. |

---

## 13. Resolved decisions

1. **Where the orchestrator runs — portable (VPS default, local optional).** Primary home is the VPS under
   PM2 (lives for hours, survives SSH disconnect). But it must run **locally too**, because a stronger model
   may be available there. This is achievable for free given the design: the orchestrator is stateless (all
   state in PostgreSQL) and workers are `claude -p`, so the *only* environment differences are
   `DATABASE_URL`, the worker command, and which model `claude` resolves to. Implications:
   - Everything configurable via env (`SITC_DB_URL`, `SITC_WORKER_CMD`, `SITC_MODEL`, render base URL).
   - Exactly **one** orchestrator may own a given `run_id` at a time → a DB advisory lock / `runs.locked_by`
     guard prevents a VPS run and a local run from both driving the same run.
   - A run started on the VPS can be paused, then resumed locally (it just re-reads DB state) — handy for
     "let the better local model take the hard sections".

2. **Render target during a run — isolated, run-scoped DB (NOT the shared dev DB).** The live dev site can
   be unstable (prod shares the environment), and in-progress experiments must not disturb it. Each run gets
   its own **isolated Postgres schema/database** seeded only with the template under evolution; the engine is
   pointed at it via a run-scoped base URL/`DATABASE_URL` for screenshotting. The `*.dev.hazelgrouse.pl` site
   is never touched by a run. The isolated DB is torn down (or archived) when the run finishes.

3. **Snapshot/revert — per-run git branch + per-worker worktrees.** Each run works on a dedicated branch
   `sitc/run-<id>`. A champion snapshot is a commit; a section revert is a targeted checkout/reset to the
   champion commit. Because workers run concurrently, **each parallel worker gets its own git worktree**
   (git can't take concurrent commits to one working tree); promoted challengers are integrated back via a
   single-writer commit queue owned by the orchestrator (DESIGN §5.4). Clean diffs, trivial revert,
   reviewable final delta, and no index races.

4. **Final delivery — auto-merge into `develop`, routed by mutation risk.** A run that reaches threshold and
   passes the backward-compat regression gate (DESIGN §7.3) auto-merges its `sitc/run-<id>` branch into
   `develop` — **but only if it touched no shared code.** Routing (DESIGN §6):
   - clean `tune-json` / `extend-variant` run → **auto-merge**, no manual step;
   - any `new-variant` / `new-section` run (new *shared* component code or schema enum) → stops in
     **`needs_review`** for a human to approve before merge.
   Safety rails on auto-merge:
   - The regression gate (DESIGN §7.3) **must** pass: additive-by-construction structural checks + SSIM ≥ 0.99
     on a sample of existing templates (not pixel-identity — that's unachievable and the wrong check).
   - `pnpm test:validate` + `pnpm type-check` + build must pass.
   - Additive-only invariant enforced (no existing variant behavior changed).
   - If any gate fails → no merge; run ends in `needs_review` with the branch left intact.

5. **Lesson retrieval — target (semantic) version from day one.** Lessons are first-class, so we build the
   full retrieval, not a tag-match stopgap:
   - Each lesson is **embedded** (vector) on write; retrieval is semantic similarity over a query built from
     the target's detected design traits + the current section + the live VLM critique — so the most
     *situationally* relevant lessons surface, not just tag matches.
   - Stored via **pgvector** in PostgreSQL (`sitc_lessons.embedding`), with tag columns kept as a cheap
     pre-filter (scope, design family) before the vector search.
   - Lessons carry a **confidence/score-delta weight** and a decay/archival path so disproven lessons fade.
   - Embeddings are produced by a local embedding model or a small `claude -p` step (no Claude API), keeping
     the "no API" constraint. See DESIGN §9 for the full lifecycle.

6. **Concurrency cap — default 3, configurable upward.** Parallel section workers default to **3** (bounds
   dev-server/render thrash on the isolated env). Exposed as `SITC_MAX_WORKERS` (env) and editable per-run
   from the admin UI, so it can be raised later as the render path proves it can take more load.

---

## 14. Build order (suggested phases)

> ### ⚠️ Phase −1 — SPIKE FIRST (validate the two load-bearing bets before committing the roadmap)
> Phases 0 and 2 are real upfront engineering, and the whole loop's value rests on two unproven assumptions.
> Prove them in throwaway spikes *before* building the rest:
>
> 1. **Isolation-render fidelity (DESIGN §4.4).** Mount ONE existing section (e.g. a `hero` variant) in the
>    isolation harness with real theme tokens, and compare its screenshot to the same section rendered
>    in-page by the live engine. **Question: is the isolated render close enough (SSIM and by eye) that a
>    score computed on it is trustworthy?** If isolated ≉ in-page, the per-section premise is shaky — fall
>    back to full-page render + crop, or invest in making the harness faithful, before anything else.
> 2. **Pairwise-judge reliability (DESIGN §7.2a).** Hand-label ~20 (champion, challenger, target) triples,
>    then run the order-symmetric pairwise judge over them. **Question: does it agree with you ≥~90% and is
>    it order-stable?** If not, the loop will confidently converge on the wrong design — fix the rubric/
>    voting (or reconsider VLM-as-judge) before building the loop around it.
>
> Cost: ~1–2 days. If either spike fails, the architecture changes — far cheaper to learn now than in Phase 5.

0. ✅ **Shared core extraction (DONE)** — `packages/sitc-core` created (DESIGN §4.5): typed step contract +
   `createClaudeWorker` runner. **Implemented:** `validateProfile`, `renderSection` (isolation harness,
   promoted from the spike), `assembleAuthoringKit`. **v0 AI scaffolds** over the runner: `analyzeTarget`,
   `segmentTarget`, `mapSection`, `authorVariant` (prompts to refine + calibrate in Phase 2). **Phase-1 seam:**
   `seedRunDb`. Type-checks, builds, smoke-tested against the real repo. The one-shot skill and the loop both
   consume this — nothing else duplicates design→component logic.
1. **DB + state machine + isolated render env + lifecycle** — `sitc_*` tables (with pgvector +
   `sitc_judge_calibration`), run/pause/resume + `needs_review`, `locked_by` + heartbeat lease, run-scoped DB
   provisioning + teardown (§13.2), per-run git branch + **per-worker worktrees** (§13.3 / DESIGN §5.4), and
   the **orphan-GC sweep** (DESIGN §16). No AI yet (orchestrator drives a stub worker) — but crash-recovery is
   exercised here.
2. **Render harness + Scorer** — the **section-isolation render harness** (DESIGN §4.4); frozen de-noised
   capture, VLM segmentation + alignment map, breakpoint policy (DESIGN §4.3); pixel/SSIM diff + VLM critique
   + **pairwise A/B with order-symmetric voting + calibration** (DESIGN §7.2/§7.2a), validated against
   hand-scored examples. The harness gates run duration — get it right here.
3. **Phase 0 → A → A.5** — seed iteration 0 from a `clone-template` pass (DESIGN §5.0); lock global theme
   (DESIGN §5.1); lock shared atoms (DESIGN §5.1b) before any per-section work.
4. **Single-section loop + sandbox** — `claude -p` worker (warm authoring kit, DESIGN §4.2) for `tune-json` on
   one section, with the **sanity gate incl. write-allowlist** (DESIGN §5.2a / §15), worktree-isolated
   commit/revert + pairwise selection. Portable (VPS + local via env) here (§13.1).
5. **Full sweep + strategy escalation + scheduler** — all sections, default 3 workers, `extend-variant`/
   `new-variant`/`new-section`; **cost-aware scheduler** (DESIGN §5.6); reuse-before-create enforcement
   (DESIGN §17); optional beam for stuck sections (DESIGN §5.5); per-unit timeout/retry recovery (DESIGN §16).
6. **Learning store (semantic)** — `sitc_lessons` + embeddings + retrieval injected into prompts +
   end-of-run distillation + `LESSONS.md` digest (DESIGN §9). Wire lesson signals into the scheduler (step 5).
7. **Admin Panel UI** — start/monitor/control/history/lessons/variant-curation/judge-health/ops (DESIGN §11);
   pre-launch cost estimate (DESIGN §18-H).
8. **Hardening + delivery** — budget caps, the DESIGN §7.3 regression gate + **§7.4 acceptance gate**
   (perf/a11y/responsive/hygiene), validate/type-check/build gates, then strategy-routed delivery
   (DESIGN §6 / §13.4): auto-merge clean tuning runs; `new-variant`/`new-section` → `needs_review`.
9. **Steady-state curation** (ongoing, not one-off) — periodic variant near-duplicate/retirement pass
   (DESIGN §17) and feature-success telemetry: iterations-to-threshold trend + post-delivery human edits
   (DESIGN §18-G).
