# Self-Improving Template Creator

> **Status:** Design / spec (not yet implemented)
> **Owner:** msadlo
> **Related:** `.claude/skills/clone-template/SKILL.md` (single-pass cloning — this feature is the looping evolution of it)

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
| **Compute** | **No Claude API.** Workers are `claude -p` (headless Claude Code) processes. | A plain orchestrator script spawns/observes them; the whole process is watchable live in a terminal or via logs. |
| **Mutation scope** | **Business JSON _and_ component code** (`packages/ui` + engine dispatch). | The loop can invent new variants when existing ones can't match the target. |
| **Backward compatibility** | New variants are **strictly additive** (new variant names / new optional fields). | Existing templates must never change behavior. Adding new variant keys to a template's business JSON is expected and fine. |
| **Scoring** | **Hybrid: VLM (Claude vision) + pixel diff.** | VLM gives semantic per-section scores + critique; pixel/SSIM gives an objective regression guard. Combined into one score. |
| **Stop conditions** | Score threshold **AND** plateau detection **AND** budget cap **AND** manual checkpoint. | Whichever fires first wins; see §8. |
| **Control plane** | **Pause / resume**, persisted in **PostgreSQL**, driven from a new **Admin Panel** page. | A run survives restarts; a human can pause, inspect, approve, or abort at any checkpoint. |
| **Learning** | A persistent **lessons store** read at the start of every run, written at the end. | Cross-run, cross-template compounding improvement. |

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
- **Watchability:** each worker is a discrete, inspectable invocation with its own log; you can tail any one.
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

---

## 5. The loop (per iteration)

One **iteration** = one full sweep across the sections still in play.

```
for each section S not yet "locked" (score ≥ threshold) and not "frozen" (plateaued):
    1. SNAPSHOT  — git-stash-like checkpoint of current JSON + component code (the champion)
    2. MUTATE    — spawn a worker to improve S using the chosen strategy (§6)
    3. RENDER    — seed DB (or render template directly) + restart dev → screenshot S
    4. SCORE     — Scorer returns hybrid score for S (§7)
    5. SELECT    — if new score > champion score by ≥ epsilon → promote challenger to champion
                   else → REVERT S to the snapshot (keep the old champion)
    6. RECORD    — write iteration row + section_score row to DB; update live admin view
after the sweep:
    • check stop conditions (§8)
    • if a manual checkpoint is due → set run state = "awaiting_approval", wait for admin command
    • else → next iteration (possibly escalating strategy on frozen sections)
```

**Why per-section snapshot/revert is the whole point:** global regeneration can trade a better hero for a
worse footer. By snapshotting and scoring each section independently and only promoting strict
improvements, the template's quality is **monotonically non-decreasing** — it can only get better or
stay the same, never regress. That's what makes "run it for hours" safe and worthwhile.

### 5.1 Concurrency
Sections are largely independent, so multiple workers can run in parallel (bounded pool, e.g. 3–4) —
**except** when two challengers touch shared code/tokens. The orchestrator serializes any iteration whose
`changedFiles` would overlap, and re-renders once per merge to avoid cross-contamination of scores.

---

## 6. Mutation strategies (escalation ladder)

The orchestrator picks a strategy per section, escalating as a section plateaus:

1. **`tune-json`** — adjust only the business JSON for that section: swap variant, tweak colors→tokens,
   spacing tokens, typography, content, image slots. Cheapest, safest, tried first.
2. **`extend-variant`** — add optional fields to an existing variant and bind them (additive schema change).
3. **`new-variant`** — author a brand-new variant `.tsx` for the section type, wire it into
   `{Type}Section.astro` + `packages/ui/src/sections/index.ts`, reference it by a new variant name.
4. **`new-section`** — only when the target section maps to no existing type: new schema enum value +
   new component + dispatcher registration (full path from clone-template FAZA 3).

Escalation rule of thumb: try `tune-json` until plateau, then `extend-variant`, then `new-variant`.
`new-section` is reserved for genuinely novel layouts. Every step above `tune-json` **must remain additive**
so other templates are untouched.

---

## 7. Scoring (hybrid)

Per section, the Scorer produces a single `score ∈ [0,1]` plus a breakdown and a textual critique that
feeds the next worker prompt.

```
score = w_vlm * vlm_score + w_pixel * pixel_score
```

- **VLM score (`claude -p` with the two screenshots):** semantic rubric — layout/composition, color
  fidelity, typography, spacing rhythm, imagery, overall "vibe match". Returns 0–100 + a critique listing
  the top concrete gaps. Forgiving of acceptable differences (placeholder copy, stock images).
- **Pixel score (Playwright + SSIM/pixelmatch):** objective structural similarity of the section
  screenshot vs the target crop. Acts as a **regression guard** and a cheap tiebreaker.
- Default weights `w_vlm ≈ 0.7`, `w_pixel ≈ 0.3` (tunable per run; pixel is noisy when copy/images differ).

> The VLM critique is as valuable as the number: it's the steering signal handed to the next worker
> ("headline weight too light; CTA should be filled not outline; bg gradient angle wrong").

---

## 8. Stop conditions (any one ends/pauses the run)

| Condition | Definition | Action |
| :--- | :--- | :--- |
| **Threshold** | Every in-play section ≥ target score (e.g. 0.90). | Run completes → success. |
| **Plateau** | A section shows < epsilon improvement for N consecutive iterations. | That section is **frozen** (stops consuming budget); run continues for others. If all frozen → run ends. |
| **Budget cap** | Wall-clock, iteration count, **and/or** worker-invocation count exceeded. | Run ends → "best so far" is the result. |
| **Manual checkpoint** | Every K iterations, or on demand from admin. | Run pauses → `awaiting_approval`; human reviews and resumes/aborts. |

Pause/resume is first-class: the run state machine is
`idle → running → (awaiting_approval ⇄ running) → (paused ⇄ running) → done | aborted`,
fully persisted so a VPS restart resumes cleanly.

---

## 9. The learning element (cross-run memory)

The differentiator. Two stores:

1. **Structured `lessons` table** — tagged, queryable rows:
   - `{ scope: "hero|color|typography|spacing|general", trigger: "...", lesson: "...", evidence_run_id, score_delta }`
   - e.g. *"When target uses a dark hero with a centered headline, starting from the `gradient` hero variant
     beats `default` by ~0.2 on first iteration."*
2. **Human-readable digest** — `features/self-improving-template-creator/LESSONS.md`, auto-regenerated from
   the table, so the knowledge is reviewable/editable in Git and can seed worker prompts directly.

**Lifecycle:**
- **Run start:** orchestrator retrieves the most relevant lessons (by section type, by detected design
  traits of the target — dark/light, layout family, industry) and injects them into worker prompts.
- **During the run:** every promotion/revert is a data point (which strategy, from which starting variant,
  what score delta).
- **Run end:** a distillation worker (`claude -p`) reads the run's iteration history and proposes new/updated
  lessons (deduped against existing ones), which are written back to the table + digest.

Net effect: the 5th template run should reach threshold in fewer iterations than the 1st.

---

## 10. Data model (PostgreSQL, Drizzle — sketch)

> Lives in `packages/db`. Names indicative.

- **`sitc_runs`** — `id, template_name, target_url, status, budget_*, weights, started_at, finished_at, best_overall_score`
- **`sitc_iterations`** — `id, run_id, iteration_no, started_at, finished_at, notes`
- **`sitc_section_scores`** — `id, iteration_id, section_id, strategy, vlm_score, pixel_score, score, is_champion, critique, screenshot_ours, screenshot_target`
- **`sitc_champions`** — current best per `(run_id, section_id)`: `score, snapshot_ref (git sha / stash id), variant_name`
- **`sitc_commands`** — control channel the admin UI writes and the orchestrator polls: `run_id, type (pause|resume|abort|approve), created_at, consumed_at`
- **`sitc_lessons`** — `id, scope, trigger, lesson, evidence_run_id, score_delta, created_at, archived`

(`sitc` = self-improving template creator. Rename if a cleaner prefix is preferred.)

---

## 11. Admin Panel UI (`/admin/template-creator`)

Built with the existing shadcn admin stack (see CLAUDE.md → Admin Panel Architecture), black & white,
isolated styles.

- **Start run:** target URL + template name (with the `template-` prefix rule from clone-template) +
  budget + weights + threshold.
- **Live run view:** per-section cards showing `target screenshot | our screenshot | score trend sparkline |
  current strategy`. Overall progress + budget burndown.
- **Controls:** Pause · Resume · Abort · "Approve checkpoint" (these write `sitc_commands`).
- **History:** past runs, final scores, diffs applied.
- **Lessons browser:** read/curate the `sitc_lessons` table (archive bad lessons, pin good ones).

---

## 12. Hard rules the implementation must honor

Pulled from `CLAUDE.md` — the loop and every worker prompt must enforce these, or quality drifts:
- **No hardcoded colors or spacing.** Semantic tokens only (`bg-primary`, `py-spacing-section`, …).
- **Industry-agnostic components.** New variants must work for any niche, not just this target.
- **Schema-first.** Any new data field → update `packages/schema/src/business.schema.json` → `pnpm generate` →
  validate → only then UI.
- **Additive only.** Never change an existing variant's behavior; other templates must render identically
  before and after a run. New variant names + new optional fields only.
- **Validate + seed flow.** `pnpm test:validate` must pass; render path is template JSON → `db:seed` →
  `pm2 restart astro-dev` → screenshot (per the Template→Database workflow).

---

## 13. Open decisions (to confirm before building)

1. **Where does the orchestrator run?** Proposed: on the VPS under PM2 (it must live for hours and survive
   SSH disconnects). Confirm vs. running locally.
2. **Render target during a run:** seed to the **shared dev DB** (visible at `*.dev.hazelgrouse.pl`) vs. a
   throwaway/branch DB so in-progress experiments don't disturb the live dev site. Recommend an isolated
   run-scoped DB/schema.
3. **Snapshot mechanism for revert (§5 step 1/5):** git commits/stash on a dedicated run branch vs. copying
   JSON+files to a run workdir. Recommend a per-run git branch (clean diff + easy final PR).
4. **Final delivery:** does a successful run open a PR with the new template + new variants, or auto-merge?
   Recommend PR for human review (especially for `new-variant`/`new-section`).
5. **Lesson relevance retrieval:** simple tag match (scope + design traits) to start; embeddings later if the
   lesson store grows large.
6. **Concurrency cap** for parallel section workers (suggest 3–4 to bound dev-server thrash).

---

## 14. Build order (suggested phases)

1. **DB + state machine** — tables, run/pause/resume, no AI yet (orchestrator can drive a stub worker).
2. **Scorer** — Playwright screenshots + pixel diff + VLM critique, validated against hand-scored examples.
3. **Single-section loop** — orchestrator + real `claude -p` worker for `tune-json` on one section, with
   snapshot/revert + champion selection.
4. **Full sweep + strategy escalation** — all sections, `extend-variant`/`new-variant`/`new-section`.
5. **Learning store** — lessons read at start, distilled at end, digest regenerated.
6. **Admin Panel UI** — start/monitor/control/history/lessons.
7. **Hardening** — budget caps, backward-compat regression check (render all existing templates, assert
   pixel-identical before/after a run), PR delivery.
