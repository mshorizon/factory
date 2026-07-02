# Self-Improving Template Creator — Design (mechanics)

> 🧊 **Spec FROZEN — v1.** Stable; reopen only if a Phase −1 spike (§14) invalidates a load-bearing decision.
> Detailed mechanics for the feature introduced in [`README.md`](./README.md). Section numbers are shared
> across both files (README owns §1–3 and §13–14; this file owns §4–12 and §15–18), so every `§x.y`
> cross-reference is unambiguous regardless of which file it lives in.

---

## 4. Architecture

Three cooperating layers, plus the existing engine they target. Two cross-cutting pieces are detailed below
and omitted from the diagram for clarity: the **section-isolation render harness** (§4.4) that the Scorer
renders through, and the **shared core library** (§4.5) that both this loop and `clone-template` build on.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ADMIN PANEL  (/admin/template-creator)                                    │
│  start run · live scores per section · screenshots (target vs ours) ·      │
│  pause/resume/abort · approve checkpoints · browse lessons learned         │
└───────────────▲───────────────────────────────────┬──────────────────────┘
                │ reads run state / writes commands   │
                │                                     ▼
┌───────────────┴──────────────────────────────────────────────────────────┐
│  ORCHESTRATOR  (root process, runs on VPS under PM2 — long-lived)          │
│  • owns the loop & the budget                                              │
│  • picks next work unit (which section, what mutation strategy)            │
│  • spawns a `claude -p` WORKER per work unit                               │
│  • reads each worker's structured result, updates per-section champions    │
│  • honors pause/resume/stop commands from the DB                           │
│  • at run end, distills lessons → lessons store                            │
└───────┬───────────────────────────────────────┬──────────────────────────┘
        │ spawns                                  │ reads/writes
        ▼                                         ▼
┌───────────────────────┐            ┌────────────────────────────────────┐
│  WORKER  (`claude -p`) │            │  STATE STORE  (PostgreSQL)         │
│  one bounded task:     │            │  runs · iterations · section_scores│
│  "improve the <hero>   │            │  champions · commands · lessons    │
│   section toward       │            └────────────────────────────────────┘
│   target screenshot"   │                          ▲
│  → edits JSON/code     │            ┌──────────────┴─────────────────────┐
│  → returns JSON verdict│            │  SCORER                            │
└───────────────────────┘            │  • isolation-harness render (§4.4)  │
        │ edits                       │  • pixel/SSIM diff vs target        │
        ▼                             │  • VLM A/B + critique (§7.2/§7.2a)  │
┌───────────────────────────────┐    │  → {score, breakdown, critique}     │
│  THE ENGINE (target of edits)  │    └────────────────────────────────────┘
│  templates/<name>/<name>.json  │
│  packages/ui/src/sections/...  │
│  apps/engine/.../SectionDispatcher│
└───────────────────────────────┘
```

### 4.1 Why `claude -p` workers instead of one long Claude session
- **Bounded blast radius:** a worker gets exactly one section + one strategy, so a bad generation can't
  corrupt the whole template.
- **Determinism of control:** the *loop* logic (selection, budget, stop conditions) lives in plain code in
  the orchestrator — not in a model's head — so it's reproducible and resumable.
- **Resumability:** because state lives in the DB and workers are stateless, the orchestrator can be killed
  and restarted mid-run without losing progress.

### 4.2 Worker contract
The orchestrator invokes a worker roughly as:

```bash
claude -p "$(render_worker_prompt sectionId=hero strategy=new-variant runId=42 iter=7)" \
        --output-format json
```

The worker prompt is templated and always includes:
- the **target screenshot(s)** for that section (path on disk),
- the **current rendered screenshot** for that section,
- the **current scorer critique** (what's wrong, from the VLM),
- the **allowed mutation strategy** for this attempt (see §6),
- the **hard rules** (additive-only variants, semantic tokens only, no hardcoded colors/spacing — per CLAUDE.md),
- the **relevant lessons** retrieved from the lessons store (see §9),
- a precomputed **section authoring kit** (see below).

**Warm start — the section authoring kit.** A cold `claude -p` would re-explore the repo every spawn
(re-read CLAUDE.md, rediscover the dispatch pattern, hunt for sibling variants) — wasteful across thousands
of invocations. Instead the orchestrator precomputes and injects a compact kit per work unit: the source of
the relevant existing variant(s) for that section type, the `{Type}Section.astro` dispatch pattern, the
schema slice for that section, and the **locked theme + atom tokens** (§5.1). The worker authors instead of
explores. Keep the static portion of the prompt **prompt-cacheable** so repeated spawns reuse it. The kit is
assembled by the shared core library (§4.5).

The worker **must** return a structured verdict (so the orchestrator can act without parsing prose):

```jsonc
{
  "sectionId": "hero",
  "strategy": "new-variant",
  "changedFiles": ["packages/ui/src/sections/hero/Nebula.tsx", "templates/template-x/template-x.json", "..."],
  "newVariantNames": ["nebula"],          // additive; empty if none
  "summary": "Added hero 'nebula' variant: starfield bg, split CTA, gradient headline",
  "selfAssessment": 0.0,                   // worker's own guess 0..1 (advisory only — scorer is authoritative)
  "risks": ["uses a new optional field heroBackground.starfield"]
}
```

### 4.3 Target ingestion (capture · segmentation · alignment · breakpoints)

Before the loop can score anything it must turn a live, messy URL into a **stable, segmented goal**. This
runs **once** at run start and its output is immutable for the rest of the run. **v1 scope:** the ingested
goal is the **home/landing page** (README §1.1); other pages inherit the locked theme/atoms and reuse the
converged variants rather than being independently optimized.

**Frozen capture (de-noised).** The target is a moving thing — animations, lazy-load, carousels, cookie
banners, A/B tests. Capture deterministically:
- dismiss cookie/consent banners, wait for `networkidle`, disable CSS animations/transitions, freeze
  carousels to their first slide, scroll to trigger lazy-load then return to top,
- fixed viewport(s) (see breakpoints below),
- store the resulting screenshots as the **immutable goal**; the loop never re-fetches the URL.

**Segmentation.** A VLM pass (`claude -p`) splits the full-page target into ordered, labeled **section
bands** (`hero`, `services`, `testimonials`, …) with pixel y-ranges, plus the detected global design traits
(dark/light, layout family, type feel) used to seed lesson retrieval (§9). This is stored as the run's
**target manifest**.

**Alignment (target band ↔ our section).** Our render has its own section list, which may not be 1:1 with
the target (target has 8 bands, we render 6). The orchestrator builds a correspondence map:
- match by **order + section type** first; resolve ambiguity with the VLM ("which of our sections best
  corresponds to target band 4?"),
- **unmatched target band** → candidate for a `new-section`/`new-variant` (something the target has that we
  don't render yet),
- **unmatched our section** → flagged for possible removal or repurposing.
The alignment map is what makes "score per section" well-defined; without it the per-section comparison is
meaningless. It is recomputed only when the section list structurally changes (e.g. after a `new-section`).

**Breakpoints.** The engine renders responsive sites, so matching desktop while breaking mobile is a real
failure mode. Each run declares which viewports are **scored** and which are merely **regression-guarded**:
- **v1 default:** desktop (e.g. 1440px) is the *optimization* target; mobile (e.g. 390px) is a *guard* — a
  challenger that improves desktop but tanks mobile below a floor is rejected.
- Promotable later to scoring both breakpoints with weighted scores.

### 4.4 Section-isolation render harness (how RENDER actually works)

The naive render path — edit → HMR the whole Astro site → screenshot the page → crop the band — is slow,
stateful, and **couples sections**: a sticky navbar, scroll-driven effects, or shared layout context bleed
across the page, so a change to section A can move section B's screenshot. That quietly breaks the
per-section monotonicity the whole loop rests on (§5.2).

Instead, render sections **in isolation** (Storybook/Histoire-style): a harness mounts *one* section
component with its props + the locked theme/atom tokens (§5.1) onto a standalone page and screenshots just
that node. Benefits:
- **5–10× faster** — no full-site build/HMR cycle per attempt.
- **True parallelism with zero cross-contamination** — isolated renders can't affect each other, so the
  concurrency cap (§5.4) is bounded by CPU, not by shared-state races.
- **Monotonicity becomes real** — a section's score depends only on that section.

**Tradeoff & mitigation:** a section can look right alone but wrong *in page flow* (vertical rhythm between
sections, sticky-header overlap). So isolation rendering is the **inner-loop** scorer; a **full-page render**
is still used for (a) the global theme/atom passes (§5.1), (b) manual checkpoints, and (c) the final
acceptance shot. The orchestrator picks harness-vs-full-page per the work unit.

### 4.5 Shared core library (unify with `clone-template`, don't parallel it)

A worker is essentially a *scoped, single-section `clone-template` invocation*. The two features share page
analysis, section mapping, component authoring, validation, and seeding — maintained twice, they **will
drift**. Extract those phases into one library (e.g. `packages/sitc-core`) with composable steps:
`analyzeTarget · segment · mapSection · authorVariant · assembleAuthoringKit · validate · seedRunDb · render`.
- the existing **`clone-template` skill** = "run all steps once, full page" (iteration 0 / Phase 0, §5.0);
- **this loop** = "call the per-section steps repeatedly, scored and selected."
One source of truth for *how we turn a design into our components*; the loop and the one-shot skill can never
disagree.

---

## 5. The loop (per iteration)

The optimizer works at **three locked tiers of granularity**, coarse → fine, each frozen before the next so
lower tiers are a stable substrate (this is what makes per-section scoring independent):

```
Phase 0   seed from clone-template (§5.0)
Phase A   GLOBAL THEME    palette · typography · radius · spacing scale   → lock theme.*   (§5.1)
Phase A.5 SHARED ATOMS    button · card · input · badge variants          → lock atoms     (§5.1b)
Phase B   PER-SECTION     layout · variant · content slots                 (the main loop)  (§5.2)
```

### 5.0 Phase 0 — cold start (seed from `clone-template`)

The loop never begins on a blank template. Run start = **one `clone-template` pass** producing the initial
business JSON + any obvious variant choices (~70% match). That output, seeded into the isolated run DB, is
**iteration 0 / the first champion** for every section. The loop's job is the last 30%.

### 5.1 Phase A — global theme pass (run before per-section work)

Color palette, typography, border-radius, and the spacing scale are **global** `theme.*` tokens shared by
every section. If a per-section worker changed `theme.colors.primary` to match the hero, it would move every
other section's score and break per-section independence. So the theme is resolved **first, as its own short
loop**, then **frozen**:
- a worker proposes `theme` tokens from the target manifest (palette, type pairing, radius, spacing scale),
- score globally (whole-page VLM + pixel) over a few iterations until stable,
- **lock `theme`** — per-section workers below may NOT touch global tokens, only section-local structure,
  variant choice, and content slots.

Sections are only truly independent (the premise of §5.2) **after** the theme *and* shared atoms are locked.

### 5.1b Phase A.5 — shared-atom pass (run after theme, before sections)

Between global tokens and whole sections sits a tier the brief explicitly called out: **atoms**. A target's
distinctive button shape/fill, card elevation/border, input style, or badge treatment is **shared by every
section**. If each per-section worker re-derived it, the buttons across sections would diverge and no section
could "lock" cleanly.

So after the theme is locked, a short pass tunes the **shared atom variants** (`packages/ui/src/atoms/*`)
against representative target crops, scores globally, and **locks** them. Per-section workers below consume
the locked atoms as-is (they may *choose* which atom variant a section uses, but may not redefine the atom).
Same additive rule: new atom variants are new names, never edits to existing ones.

### 5.2 Phase B — per-section refinement loop

One **iteration** = one full sweep across the sections still in play.

```
for each section S not yet "locked" (score ≥ threshold) and not "frozen" (plateaued):
    1. SNAPSHOT  — commit current JSON + component code on the run branch (the champion)
    2. MUTATE    — spawn a worker (warm authoring kit) to improve S using the chosen strategy (§6)
    3. SANITY    — fast build + type-check + schema validate of the challenger (§5.2a)
                   FAILS → instant REVERT, record failure, feed the error back as next-attempt critique;
                           skip RENDER/SCORE (don't waste a screenshot + VLM call on broken code)
    4. RENDER    — isolation-harness render of S (§4.4) → screenshot at scored breakpoint(s)
    5. SCORE     — Scorer returns absolute hybrid score for tracking (§7)
    6. SELECT    — PAIRWISE A/B judge (§7.2): champion + challenger + target → VLM, "which is closer?"
                   challenger wins (and did not drop the mobile guard) → promote
                   else → REVERT S to the snapshot commit (keep the old champion)
    7. RECORD    — write iteration row + section_score row to DB
after the sweep:
    • check stop conditions (§8)
    • if a manual checkpoint is due → set run state = "awaiting_approval", wait for admin command
    • else → next iteration (scheduler picks the next work units — §5.6)
```

**Why per-section snapshot/revert is the whole point:** global regeneration can trade a better hero for a
worse footer. By snapshotting and scoring each section independently and only promoting improvements, the
template's quality is **monotonically non-decreasing** — it can only get better or stay the same, never
regress. That's what makes "run it for hours" safe and worthwhile. Two things make the monotonicity *real*
rather than aspirational: (a) **isolation rendering** (§4.4) so a section's score can't be moved by its
neighbors, and (b) the **pairwise A/B** SELECT (§7.2) so scoring noise can't promote a worse render.

### 5.2a SANITY gate — allowlist + build/typecheck/validate before scoring
A worker can emit code that doesn't compile, JSON that doesn't validate, or files it should never touch.
Scoring such a challenger would waste a render + a VLM A/B call, and the delivery regression gate (§7.3) runs
far too late to help the inner loop. So immediately after MUTATE, run a **fast challenger gate**:
1. **Write-allowlist check (§15)** — reject any diff that touches a path outside the allowlist, adds a
   dependency, or matches a forbidden pattern. This runs *first* and is non-negotiable.
2. **Build/typecheck** — incremental `tsc`/build of the changed files.
3. **Validate** — `pnpm test:validate` for JSON/schema.
On any failure → instant revert, record a failed attempt, and hand the specific error (allowlist violation /
compiler / validator message) back to the worker as its next-attempt critique. Cheap insurance that keeps
broken or out-of-bounds candidates out of the expensive scoring path *and* out of the run branch.

### 5.3 RENDER throughput
Render uses the **section-isolation harness** (§4.4), not a full-site `pm2 restart` — that's the single
biggest lever on run duration (a full restart per attempt can turn a 2-hour run into a 12-hour one). The
harness mounts one section with the locked tokens and screenshots just that node; full-page renders are
reserved for the theme/atom passes, checkpoints, and final acceptance. `pm2 restart astro-dev` survives only
as the fallback when the harness can't represent something (rare).

### 5.4 Concurrency (and the git model)
With isolation rendering (§4.4) sections can't contaminate each other, so after theme + atoms are locked
multiple workers run in parallel bounded only by CPU (pool **default 3**, via `SITC_MAX_WORKERS` / admin UI —
§13.6).

**Git correctness — one worktree per worker.** Multiple workers cannot commit to a single working tree of the
`sitc/run-<id>` branch concurrently (git index races). Each parallel worker therefore gets its **own git
worktree** checked out at the current champion commit; it mutates + sanity-gates + renders there in isolation.
A promoted challenger is integrated back onto the run branch through a **single-writer commit queue** owned by
the orchestrator (cherry-pick / fast-forward, one at a time). Two challengers whose `changedFiles` overlap
(same shared file — possible for `extend-variant`/`new-variant`) are additionally serialized at the queue and
their merged result is re-rendered once before the second is scored, so no promotion is based on a stale
render. Worktrees are torn down with the run (§16).

### 5.5 Escaping local optima (beam, optional)
Strict accept-only-better with a single champion is pure hill-climbing and can stall in a local optimum that
isn't the true best. When a section plateaus *before* reaching threshold and strategy escalation (§6) is
exhausted, optionally widen to a small **beam**: keep the top-K (e.g. K=2–3) candidate snapshots per section
and branch mutations from each, pruning back to top-K after scoring. Off by default (cost); enabled per run.

### 5.6 Work-unit scheduling (cost-aware, not round-robin)
"Run for hours" only pays off if the budget flows where it helps. A flat round-robin sweep spends as much on
a section already at 0.95 as on one stuck at 0.40. The orchestrator instead keeps a **priority queue** and
picks the next work unit by **expected score-gain per token** — a lightweight multi-armed-bandit:
- prioritize sections far below threshold, on strategies that have historically paid off **for this design's
  traits** (this is exactly where the lessons store, §9, earns its keep);
- decay the priority of a section after repeated low-yield attempts (feeds plateau/freeze, §8);
- never starve a cheap near-threshold section that one `tune-json` would lock.
This turns the budget cap (§8) from a guillotine into an optimizer: spend stops mattering as a hard wall and
starts mattering as allocation.

---

## 6. Mutation strategies (escalation ladder)

These are the **Phase B** (per-section) strategies, applied *after* the global theme (§5.1) **and** shared
atoms (§5.1b) are locked. A per-section worker may change section-local structure, variant choice, and
content slots, and may *choose* which locked atom variant a section uses — but **never** redefine global
`theme.*` tokens or shared atoms. The orchestrator picks a strategy per section, escalating as it plateaus:

1. **`tune-json`** — adjust only the business JSON for that section: swap variant, choose spacing tokens,
   pick content/image slots, set section-local options. Cheapest, safest, tried first. (Global palette/type
   live in Phase A, not here.)
2. **`extend-variant`** — add optional fields to an existing variant and bind them (additive schema change).
3. **`new-variant`** — author a brand-new variant `.tsx` for the section type, wire it into
   `{Type}Section.astro` + `packages/ui/src/sections/index.ts`, reference it by a new variant name.
4. **`new-section`** — only when a target band maps to no existing type (§4.3 alignment): new schema enum
   value + new component + dispatcher registration (full path from clone-template FAZA 3).

Escalation rule of thumb: try `tune-json` until plateau, then `extend-variant`, then `new-variant`.
`new-section` is reserved for genuinely novel layouts. Every step above `tune-json` **must remain additive**
so other templates are untouched.

**Delivery risk by strategy.** Schema-touching strategies are the riskiest paired with auto-merge: a one-off
target's oddball band becoming a global `sectionType` enum value affects *every* business. Therefore:
- a run that used only `tune-json` / `extend-variant` may **auto-merge** to `develop` (§13.4);
- a run that introduced any **`new-variant` or `new-section`** ends in **`needs_review`** — a human approves
  the new shared code before merge. (Configurable, but this is the safe default.)

---

## 7. Scoring (hybrid)

Per section, the Scorer produces a single `score ∈ [0,1]` plus a breakdown and a textual critique that
feeds the next worker prompt.

```
score = w_vlm * vlm_score + w_pixel * pixel_score
```

- **VLM score (`claude -p` with the two screenshots):** semantic rubric — layout/composition, color
  fidelity, typography, spacing rhythm, imagery, overall "vibe match". Returns 0–100 + a critique listing
  the top concrete gaps.
- **Pixel score (Playwright + SSIM/pixelmatch):** objective structural similarity of the section
  screenshot vs the aligned target band. Acts as a **regression guard** and a cheap tiebreaker.
- Default weights `w_vlm ≈ 0.7`, `w_pixel ≈ 0.3` (tunable per run; pixel is noisy when copy/images differ).

**The rubric scores the design system, not the literal content.** Placeholder copy and stock images will
never match the target's actual words/photos, so a content-sensitive score never reaches threshold and every
run just exhausts budget. Scoring therefore targets **layout, color, typography, spacing, radius, imagery
*treatment*** — explicitly discounting literal text and specific photos. The 0.90 threshold (§8) is
calibrated to *this* design-system rubric.

> The VLM critique is as valuable as the number: it's the steering signal handed to the next worker
> ("headline weight too light; CTA should be filled not outline; bg gradient angle wrong").

### 7.2 Promotion = pairwise A/B (not absolute-score comparison)

Absolute VLM scores jitter run-to-run; comparing a freshly-scored challenger against a freshly-scored
champion lets scoring *noise* promote a worse render (and revert real work). So the **SELECT decision**
(§5.2 step 6) is a **pairwise judgment**: the VLM is shown *champion screenshot + challenger screenshot +
target* and asked "which is closer to the target, and why?" Pairwise A/B is far more stable than absolute
scoring. The absolute hybrid score (§7) is still recorded — for the threshold check, plateau detection, and
dashboards — but it does **not** decide promotion. Guard: a challenger that wins desktop A/B but drops the
mobile guard below its floor (§4.3) is rejected.

### 7.2a Judge reliability (the judge is a subsystem, not an oracle)

The *entire* correctness of the loop rests on the pairwise judge being right, and LLM pairwise judging has a
known **positional bias** — it tends to favor whichever image is shown first. Untreated, the loop can
confidently converge on the wrong design. Three guards:
- **Order-symmetric voting.** Run each A/B in *both* orders (champion-first and challenger-first); promote
  only if the verdict agrees both ways. Disagreement = "too close to call" → no promotion (keep champion).
  Optionally best-of-3 with majority for high-stakes promotions (e.g. accepting a `new-variant`).
- **Calibration set.** Maintain a small human-labeled set of (champion, challenger, target, correct-answer)
  triples. Periodically replay it through the judge and surface agreement-with-human in the admin UI (§11);
  a drop flags prompt/model drift before it corrupts runs.
- **Tie-break by objective signal.** When the VLM is undecided, fall back to the pixel/SSIM delta (§7) rather
  than coin-flipping.

### 7.3 Backward-compat regression gate (delivery prerequisite)

Mutations can touch *shared* component code, so before merge a run must prove it didn't change any existing
template. Two layers:

1. **Additive-by-construction (primary, structural).** Existing templates never reference the new variant
   names, and new code is gated behind those names (`} else if (variant === "newName")`), so by construction
   their render is unaffected. Verify it structurally — cheap and deterministic:
   - every pre-existing template's **resolved JSON is unchanged** and its **selected variant names are
     unchanged**;
   - all schema changes are **additive only** (new enum values / new optional fields — no removals, no
     required-field additions, no type changes);
   - `pnpm test:validate` + `pnpm type-check` + build pass.
2. **Visual diff with a threshold (secondary, sanity).** Re-render a sample of existing templates off the run
   branch and compare to their `develop` baseline with **SSIM ≥ 0.99** (NOT pixel-identity — screenshots are
   not byte-deterministic across renders: antialiasing, font hinting, Tailwind JIT class ordering all
   produce tiny diffs with zero real change). A drop below threshold fails the gate.

Any failure → no merge, run ends in `needs_review` with the branch intact.

### 7.4 Acceptance criteria beyond the visual score (delivery prerequisite)

A high design-system score is necessary but not sufficient: a template can look 0.92 and still be slow,
inaccessible, or broken on mobile. So delivery (auto-merge or `needs_review` approval) also gates on a
**non-visual acceptance checklist**, run once on the full assembled template at the end:
- **Performance** — production build within budget (bundle size; Lighthouse performance ≥ target — the
  factory's perf posture, ADR-0002 / CLAUDE.md).
- **Accessibility** — automated a11y pass (axe): no critical violations; color-contrast on the chosen palette.
- **Responsive integrity** — renders without overflow/overlap at the guarded breakpoint (§4.3), navbar
  overlap rule respected (CLAUDE.md).
- **Hygiene** — no console errors, no broken internal links/images, all referenced assets resolve.
A failure here blocks auto-merge and routes to `needs_review` with the specific failures listed.

---

## 8. Stop conditions (any one ends/pauses the run)

| Condition | Definition | Action |
| :--- | :--- | :--- |
| **Threshold** | Every in-play section ≥ target **design-system** score (e.g. 0.90 on the §7 rubric — not content). | Run completes → delivery gate (§7.3). |
| **Plateau** | A section shows < epsilon improvement for N consecutive iterations *after* strategy escalation is exhausted. | That section is **frozen** (stops consuming budget); run continues for others. If all frozen → run ends. |
| **Budget cap** | Wall-clock, iteration count, **and/or** worker-invocation count exceeded. | Run ends → "best so far" is the result. |
| **Manual checkpoint** | Every K iterations, or on demand from admin. | Run pauses → `awaiting_approval`; human reviews and resumes/aborts. |

On run end, delivery is gated (§7.3) and routed by strategy (§6): clean `tune-json`/`extend-variant` runs
**auto-merge** to `develop`; any `new-variant`/`new-section` run stops in **`needs_review`**.

### §8.1 Convergence → manual-fix handoff

The strategy ladder eventually plateaus: a run lands **0 promotions** because every unit either already
matches the target or its remaining gap is **unreachable by the loop's strategies** — it needs component
code the worker declined, a real asset/image, or a layout primitive that no JSON/variant edit can produce.
At that point further runs only no-op and burn tokens.

So a converged run is treated as a **signal, not a dead end**. `summarizeConvergence`
(`packages/sitc-core/src/loop/convergence.ts`) inspects the per-unit outcomes:

- **converged** = 0 promotions this run (the loop added nothing).
- **followUps** = each un-locked unit's *latest worker critique* — the worker's own description of the gap
  it couldn't close — flagged `needsCode` when the critique says it needs out-of-loop work.

The runner writes this to `.sitc/runs/<id>/manual-followups.md` and, on convergence, prints
`── CONVERGED — next step: MANUAL fixes ──` with the backlog. **This is the intended end of the automated
loop**: once it converges, stop iterating and hand the residual gaps to a human for targeted manual fixes
(e.g. the footer's auto-injected "Strony" column, a navbar CTA icon, a broken image) — exactly the class of
fix the loop correctly diagnoses but cannot perform.

Pause/resume is first-class: the run state machine is
`idle → running → (awaiting_approval ⇄ running) → (paused ⇄ running) → (done | needs_review | aborted)`,
fully persisted so a VPS restart resumes cleanly. `needs_review` keeps the run branch intact for a human.

---

## 9. The learning element (cross-run memory) — **target / semantic version**

The differentiator, built to its full form from the start (no tag-match stopgap). Lessons are retrieved by
**semantic similarity** to the *current situation*, not just by matching tags.

### 9.1 Stores
1. **`sitc_lessons` table with embeddings (pgvector).** Each row:
   - `{ scope, design_traits[], trigger, lesson, embedding vector, evidence_run_id, score_delta, confidence, uses, wins, created_at, archived }`
   - `scope`: `hero | color | typography | spacing | layout | general | …`
   - `design_traits`: detected traits the lesson applies to (`dark`, `centered-hero`, `editorial`, `saas`, …)
   - `embedding`: vector of `trigger + lesson + traits`, used for similarity search.
   - `confidence` / `score_delta` / `uses` / `wins`: track how reliable the lesson has proven across runs.
   - e.g. *"Target = dark hero, centered headline → seed from the `gradient` hero variant; beats `default`
     by ~0.2 on iter 1."*
2. **Human-readable digest** — `features/sitc/LESSONS.md`, auto-regenerated from
   the table (top lessons by confidence), reviewable/editable in Git.

### 9.2 Retrieval (the "target" part)
At each worker spawn, the orchestrator builds a **query** from:
the target's detected design traits + the current section type + the live VLM critique of what's still wrong.
Retrieval = **tag pre-filter** (`scope`, overlapping `design_traits`) **then vector similarity** over
`embedding`, ranked by `similarity × confidence`. The top-K lessons are injected into the worker prompt.
This surfaces situationally-relevant guidance ("this specific kind of gap, on this kind of design") rather
than generic tag buckets.

### 9.3 Embeddings without the Claude API
Embeddings are produced **locally** — either a small local embedding model (e.g. a sentence-transformer via
a tiny sidecar) or a short `claude -p` step that emits a vector — preserving the **no-Claude-API** constraint.
Pluggable via `SITC_EMBED_CMD`.

### 9.4 Lifecycle
- **Run start:** detect target design traits → preload globally-relevant lessons.
- **Per worker:** situational retrieval (§9.2) → inject top-K.
- **During the run:** every promotion/revert is a data point; on use, bump the cited lesson's `uses`, and on
  a winning iteration bump `wins` → recompute `confidence`.
- **Run end:** a distillation worker (`claude -p`) reads the iteration history, proposes new/updated lessons,
  **dedupes against existing rows by embedding similarity** (merge instead of duplicate), embeds the new
  ones, writes back, and regenerates the digest.
- **Decay:** lessons whose `confidence` falls below a floor (repeatedly cited but not winning) are archived.

Net effect: the 5th template run reaches threshold in fewer iterations than the 1st — and the knowledge is
*situational*, so it transfers across different websites and templates rather than only within one niche.

---

## 10. Data model (PostgreSQL, Drizzle — sketch)

> Lives in `packages/db`. Names indicative.

- **`sitc_runs`** — `id, template_name, target_url, status (idle|running|awaiting_approval|paused|done|needs_review|aborted), model_version, prompt_version (pinned per run for reproducibility — README §1.1), budget_*, weights, max_workers, scored_breakpoints, theme_locked (bool), atoms_locked (bool), branch (sitc/run-<id>), run_db_url (isolated render DB), target_manifest (segmentation + alignment + traits), acceptance_report (§7.4 results), locked_by (owner host — VPS|local), lease_expires_at (heartbeat lease for crash detection — §16), cleaned_up (bool), started_at, finished_at, best_overall_score`
- **`sitc_iterations`** — `id, run_id, iteration_no, started_at, finished_at, notes`
- **`sitc_section_scores`** — `id, iteration_id, section_id, strategy, outcome (promoted|reverted|sanity_failed), vlm_score, pixel_score, score, ab_verdict, is_champion, critique, screenshot_ours, screenshot_target`
- **`sitc_judge_calibration`** — `id, champion_img, challenger_img, target_img, human_answer, judge_answer, agreed (bool), checked_at` — the human-labeled set replayed to detect judge drift (§7.2a)
- **`sitc_champions`** — current best per `(run_id, section_id)`: `score, snapshot_commit (sha on the run branch), variant_name`
- **`sitc_commands`** — control channel the admin UI writes and the orchestrator polls: `run_id, type (pause|resume|abort|approve|approve_merge|set_max_workers), payload, created_at, consumed_at`
- **`sitc_lessons`** — `id, scope, design_traits[], trigger, lesson, embedding vector, evidence_run_id, score_delta, confidence, uses, wins, created_at, archived` (pgvector index on `embedding`; see §9)

(`sitc` = self-improving template creator. Rename if a cleaner prefix is preferred.)
Requires the **pgvector** extension on the control DB. `locked_by` enforces single-owner so a VPS run and a
local run can't drive the same `run_id` (§13.1). `run_db_url` points at the isolated render DB (§13.2).

---

## 11. Admin Panel UI (`/admin/template-creator`)

Built with the existing shadcn admin stack (see CLAUDE.md → Admin Panel Architecture), black & white,
isolated styles.

- **Start run:** target URL + template name (with the `template-` prefix rule from clone-template) +
  budget + weights + threshold.
- **Live run view:** per-section cards showing `target screenshot | our screenshot | score trend sparkline |
  current strategy`. Overall progress + budget burndown.
- **Controls:** Pause · Resume · Abort · "Approve checkpoint" · **"Approve & merge"** (for `needs_review`
  runs that introduced shared code — §6/§13.4) (these write `sitc_commands`).
- **History:** past runs, final scores, diffs applied, delivery outcome (auto-merged vs `needs_review`),
  acceptance report (§7.4: perf/a11y/responsive/hygiene).
- **Lessons browser:** read/curate the `sitc_lessons` table (archive bad lessons, pin good ones).
- **Variant curation (§17):** variant usage counts across templates, near-duplicate clusters, retirement
  proposals.
- **Judge health:** current judge-vs-human agreement on the calibration set (§7.2a) — a drop warns of model/
  prompt drift before it corrupts runs.
- **Ops:** orphans reclaimed (§16), per-run cost/duration vs. the pre-launch estimate (§18-H).

---

## 12. Hard rules the implementation must honor

Pulled from `CLAUDE.md` — the loop and every worker prompt must enforce these, or quality drifts:
- **No hardcoded colors or spacing.** Semantic tokens only (`bg-primary`, `py-spacing-section`, …).
- **Industry-agnostic components.** New variants must work for any niche, not just this target.
- **Schema-first.** Any new data field → update `packages/schema/src/business.schema.json` → `pnpm generate` →
  validate → only then UI.
- **Additive only.** Never change an existing variant's behavior; new variant names + new optional fields
  only. Enforced at delivery by the §7.3 gate (structural additive-by-construction checks + SSIM ≥ 0.99 on
  existing templates — not pixel-identity).
- **Respect the locked tiers.** Per-section workers must never edit `theme.*` (palette, type, radius, spacing
  scale — locked in Phase A, §5.1) or **shared atoms** (button/card/input/badge — locked in Phase A.5,
  §5.1b). They consume both as-is; they may only choose which locked variant a section uses.
- **Sanity before scoring.** Every challenger must pass the allowlist + build + type-check + `pnpm
  test:validate` *before* it is rendered/scored (§5.2a); broken or out-of-bounds candidates revert
  immediately, never reach the VLM or the run branch.
- **Stay inside the sandbox.** Workers may only write to allowlisted paths, may not add dependencies, and may
  never import `apps/engine` (workspace boundary, CLAUDE.md). Enforced by the gate (§15).
- **Validate + seed flow.** `pnpm test:validate` must pass. Render path is template JSON → run DB → HMR
  (NOT a full `pm2 restart` per iteration — §5.3); a full restart is only the fallback when HMR fails.

---

## 15. Worker sandbox & write-allowlist

Workers generate code that can ultimately **auto-merge to `develop`** (§13.4) — so what a worker may touch is
a hard security boundary, not a style preference. The orchestrator enforces it at the SANITY gate (§5.2a) by
inspecting the challenger's diff; a violation is an instant revert, same as a build failure.

**Allowed writes (per strategy):**
- `tune-json` → only the run's `templates/<name>/<name>.json` (the section's slice).
- `extend-variant` / `new-variant` → `packages/ui/src/{sections,atoms}/**` and the matching
  `apps/engine/src/components/sections/{Type}Section.astro` dispatch branch, `packages/ui/src/sections/index.ts`.
- `new-section` → additionally `packages/schema/src/business.schema.json` (additive enum/field only) +
  `SectionDispatcher.astro` registration + `apps/engine/src/lib/pages.ts` `DEFAULT_VARIANTS`.

**Forbidden, always:**
- any path outside the allowlist (CI, config, secrets, scripts, `apps/engine` business logic, other packages);
- **`packages/ui` importing from `apps/engine`** (ADR workspace boundary);
- **adding/upgrading dependencies** — no new `package.json` entries, no new imports of uninstalled packages
  (a worker that "needs" a library fails the gate and must solve it within the existing toolset, or escalate);
- network calls, filesystem access outside the repo, env/secret reads, shelling out;
- editing existing variant behavior or locked theme/atom tokens (additive-only + tier lock, §6/§5.1).

The allowlist is data-driven (a per-strategy path glob set), so it can tighten without code changes. This is
what makes "auto-merge unreviewed generated code" defensible: the only code that can land is additive,
dependency-free, inside the design-system packages, and already passed build + validate + the §7.3 gate.

---

## 16. Failure modes & recovery (runbook)

"Runs for hours, unattended, resumable" is only true if every failure has a defined recovery. State lives in
PostgreSQL and on the `sitc/run-<id>` branch; workers are stateless and disposable.

| Failure | Detection | Recovery |
| :--- | :--- | :--- |
| **Worker hangs** | per-worker wall-clock timeout | kill, record a failed attempt, revert its worktree, free the slot; the work unit returns to the scheduler (§5.6) with one retry budget consumed. |
| **Worker crashes / returns malformed JSON** | non-zero exit or schema-invalid verdict | same as hang; after N consecutive failures on a unit, mark it `frozen` (§8) and move on. |
| **Worker writes out of bounds / broken code** | SANITY gate (§5.2a / §15) | instant revert; error fed back as next-attempt critique. |
| **Orchestrator dies mid-iteration** | heartbeat / `locked_by` lease expiry | on restart, the orchestrator reconciles: any uncommitted worktree is discarded (the champion commit on the branch is the source of truth — an un-promoted challenger is simply lost, which is safe). It resumes from the last recorded iteration row. |
| **Render harness / dev server wedged** | render timeout | recycle the harness; fall back to full-page render once; if still failing, pause the run to `needs_review`. |
| **Run aborted / completed** | terminal state | **cleanup job** drops the run-scoped DB, removes all worker worktrees, and (unless merged) leaves the `sitc/run-<id>` branch for inspection. |

**Orphan garbage collection.** A periodic sweep reclaims leaked resources from runs that died without
cleanup: run-scoped DBs/schemas with no live `locked_by` lease, `sitc/run-*` worktrees with no active run, and
branches older than a retention window whose run ended in `aborted`. Without this, dead runs accumulate
databases and disk indefinitely. Surfaced in the admin UI as "orphans reclaimed".

**Idempotency & resumability.** Every iteration writes its row *before* acting and marks it done *after*, so a
crash leaves at most one in-flight unit to re-run. Combined with "champion commit = source of truth", a run is
always resumable to a consistent state — on the VPS or, after pause, locally (§13.1).

---

## 17. Variant-library curation & entropy

The library of section/atom variants is the asset that makes the factory fast — and an unattended loop that
mints new variants will, over dozens of runs, **bloat it** with near-duplicate `hero`s and a swelling
`sectionType` enum. Left unmanaged, the thing that makes us fast rots into noise (and slows every future
worker's authoring kit and the dispatcher).

Countermeasures:
- **Reuse-before-create, enforced.** The worker prompt and the escalation ladder (§6) require *searching
  existing variants first* (the authoring kit, §4.2, ships the candidate variants for the section type); a
  `new-variant` verdict must justify why no existing variant + `extend-variant` sufficed. The scheduler (§5.6)
  also biases toward cheaper reuse strategies.
- **Near-duplicate detection.** New variants are embedded (visual + prop-shape signature) and checked against
  existing ones; a high-similarity hit is flagged for merge rather than added — mirroring the lesson-dedup
  in §9.4.
- **Periodic curation pass** (offline, human-in-the-loop, like the lessons browser §11): report variant usage
  counts across all templates, cluster near-duplicates, and propose retirements/merges. A variant used by zero
  live templates after a retention window is a retirement candidate. Retiring is itself an additive-safe op
  (mark deprecated, stop offering it to workers; only physically remove once no template references it).

This keeps the variant library a curated design system, not an append-only dump.

---

## 18. Open questions / future work

Not blocking the first build, but tracked so they aren't forgotten:

- **Per-page convergence.** v1 optimizes the home page only and lets other pages inherit (README §1.1). A
  later version ingests, segments, and independently scores about/services/contact pages, with a shared
  theme/atom lock across the whole site.
- **(F) Asset & imagery strategy.** Placeholder vs. real images during a run, sourcing via Unsplash/R2
  (ADR-0011), and how image **aspect ratios** affect layout scoring (a hero with a 16:9 image scores
  differently than 1:1 even with identical structure). For *templates* (reusable blueprints) copy/images stay
  generic by design; the loop optimizes treatment, not literal assets (§7).
- **(G) Feature-level success metric.** Actually measure the compounding claim: track **iterations-to-threshold
  per run over time** and **human edits required after delivery**; expose the trend so we can prove (or
  disprove) that the lessons store is working, rather than asserting it.
- **(H) Cost & duration model.** A rough budgeting formula — `sections × iterations × (mutate + score) tokens`
  + render wall-clock — surfaced in the admin "Start run" screen as an *estimate before launch*, so a run's
  likely cost/time is known up front and the budget cap (§8) can be set sensibly.
