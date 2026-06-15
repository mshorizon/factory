# Self-Improving Template Creator — Design (mechanics)

> Detailed mechanics for the feature introduced in [`README.md`](./README.md). Section numbers are shared
> across both files (README owns §1–3, §13–14; this file owns §4–12), so every `§x.y` cross-reference is
> unambiguous regardless of which file it lives in.

---

## 4. Architecture

Three cooperating layers, plus the existing engine they target.

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
└───────────────────────┘            │  • Playwright: screenshot our render│
        │ edits                       │  • pixel/SSIM diff vs target        │
        ▼                             │  • VLM (claude -p vision) critique  │
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
- the **relevant lessons** retrieved from the lessons store (see §9).

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
runs **once** at run start and its output is immutable for the rest of the run.

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

---

## 5. The loop (per iteration)

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

Sections are only truly independent (the premise of §5.2) **after** the theme is locked.

### 5.2 Phase B — per-section refinement loop

One **iteration** = one full sweep across the sections still in play.

```
for each section S not yet "locked" (score ≥ threshold) and not "frozen" (plateaued):
    1. SNAPSHOT  — commit current JSON + component code on the run branch (the champion)
    2. MUTATE    — spawn a worker to improve S using the chosen strategy (§6)
    3. RENDER    — HMR-render S (NO full dev restart — see below) → screenshot S at scored breakpoint(s)
    4. SCORE     — Scorer returns absolute hybrid score for tracking (§7)
    5. SELECT    — PAIRWISE A/B judge: show champion + challenger + target to the VLM, "which is closer?"
                   challenger wins (and absolute score did not regress mobile guard) → promote
                   else → REVERT S to the snapshot commit (keep the old champion)
    6. RECORD    — write iteration row + section_score row to DB
after the sweep:
    • check stop conditions (§8)
    • if a manual checkpoint is due → set run state = "awaiting_approval", wait for admin command
    • else → next iteration (possibly escalating strategy on frozen sections)
```

**Why per-section snapshot/revert is the whole point:** global regeneration can trade a better hero for a
worse footer. By snapshotting and scoring each section independently and only promoting improvements, the
template's quality is **monotonically non-decreasing** — it can only get better or stay the same, never
regress. That's what makes "run it for hours" safe and worthwhile. The monotonicity is only as trustworthy
as the SELECT comparison — which is why promotion uses a **pairwise A/B judgment**, not two independently
generated absolute scores (see §7.2).

### 5.3 RENDER without restarting the dev server (throughput)
A naive `pm2 restart astro-dev` per section per iteration means hundreds–thousands of multi-second restarts —
it dominates wall-clock and can turn a 2-hour run into a 12-hour one. Instead:
- JSON-only changes (`tune-json`) → update the row in the run DB; Astro HMR picks it up, no restart.
- code changes (`new-variant`/`extend-variant`) → rely on Vite/Astro HMR; restart only if HMR fails.
- screenshot just the section's DOM node / y-band, not the full page, when possible.
Define this concretely in Phase 2 — it is the single biggest lever on run duration.

### 5.4 Concurrency
After the theme is locked (§5.1), sections are largely independent, so multiple workers can run in parallel
(bounded pool, **default 3**, via `SITC_MAX_WORKERS` / admin UI — §13.6) — **except** when two challengers
touch shared code/tokens. The orchestrator serializes any iteration whose `changedFiles` would overlap, and
re-renders once per merge to avoid cross-contamination of scores.

### 5.5 Escaping local optima (beam, optional)
Strict accept-only-better with a single champion is pure hill-climbing and can stall in a local optimum that
isn't the true best. When a section plateaus *before* reaching threshold and strategy escalation (§6) is
exhausted, optionally widen to a small **beam**: keep the top-K (e.g. K=2–3) candidate snapshots per section
and branch mutations from each, pruning back to top-K after scoring. Off by default (cost); enabled per run.

---

## 6. Mutation strategies (escalation ladder)

These are the **Phase B** (per-section) strategies, applied *after* the global theme is locked (§5.1). A
per-section worker may change section-local structure, variant choice, and content slots — **never** global
`theme.*` tokens. The orchestrator picks a strategy per section, escalating as a section plateaus:

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
(§5 step 5) is a **pairwise judgment**: the VLM is shown *champion screenshot + challenger screenshot +
target* and asked "which is closer to the target, and why?" Pairwise A/B is far more stable than absolute
scoring. The absolute hybrid score (§7) is still recorded — for the threshold check, plateau detection, and
dashboards — but it does **not** decide promotion. Guard: a challenger that wins desktop A/B but drops the
mobile guard below its floor (§4.3) is rejected.

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
2. **Human-readable digest** — `features/self-improving-template-creator/LESSONS.md`, auto-regenerated from
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

- **`sitc_runs`** — `id, template_name, target_url, status (idle|running|awaiting_approval|paused|done|needs_review|aborted), budget_*, weights, max_workers, scored_breakpoints, theme_locked (bool), branch (sitc/run-<id>), run_db_url (isolated render DB), target_manifest (segmentation + alignment + traits), locked_by (owner host — VPS|local), started_at, finished_at, best_overall_score`
- **`sitc_iterations`** — `id, run_id, iteration_no, started_at, finished_at, notes`
- **`sitc_section_scores`** — `id, iteration_id, section_id, strategy, vlm_score, pixel_score, score, is_champion, critique, screenshot_ours, screenshot_target`
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
- **History:** past runs, final scores, diffs applied, delivery outcome (auto-merged vs `needs_review`).
- **Lessons browser:** read/curate the `sitc_lessons` table (archive bad lessons, pin good ones).

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
- **Global tokens are Phase-A only.** Per-section workers must never edit `theme.*` (palette, type, radius,
  spacing scale); those are set once in the global theme pass and locked (§5.1).
- **Validate + seed flow.** `pnpm test:validate` must pass. Render path is template JSON → run DB → HMR
  (NOT a full `pm2 restart` per iteration — §5.3); a full restart is only the fallback when HMR fails.
