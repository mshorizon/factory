# Kaizen Growth — Core Single-Next-Step Loop (Slice 1) — Plan Brief

> Full plan: `context/engine/changes/kaizen-growth-core-loop/plan.md`
> PRD: `context/engine/foundation/kaizen-growth/prd.md`

## What & Why

Build the first slice of Kaizen Growth: the operator sets one north-star goal and the tool
surfaces a **single** grounded, non-scary next step toward it. It exists because the operator
executes small tasks well but freezes on big goals; the current flat "5-suggestions" scheduler
makes it worse with generic, sometimes off-limits advice (it once suggested cold calling).

## Starting Point

The admin panel already has a fixed view pattern (`*View.tsx` + `/api/admin/*` + DB helpers,
registered as a tab in `AdminForm.tsx`), auto-auth on `/admin/*`, and a local task runner
(`scripts/run-tasks.sh`) that resolves tasks with `claude -p` on the **local Claude
subscription**. The unused strategy surface (`/admin/strategy` + `strategic-scheduler.ts`,
which uses the API key) is what this replaces.

## Desired End State

A new **Goals** tab where the operator sets a north-star + avoid-list, runs `pnpm goal:next`
locally to compute one step (type-badged human/code/bug, with milestone + rationale), and
clicks **Accept → Resolved** or **Skip**. Re-running re-plans against updated state. The old
strategy surface and its DB table are gone.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Scope | Slice 1 = core loop only | Prove the local-brain architecture before building execution wiring | Plan |
| Brain runtime | Local CLI planner → DB → web display | Claude runs locally only; web works in prod by reading the DB | Plan |
| Invocation | `claude -p` (Claude Code CLI, headless) | Uses local **subscription not API key**, repo-aware, matches run-tasks.sh, zero new deps | Plan |
| Persistence | New `goals` + `goal_steps` tables | Clean step lifecycle; never conflate a step with a `pending` task | Plan |
| Off-limits | Fixed baseline + operator override list | Safe by default day one, extensible without code | Plan |
| Goal tree depth | North-star + step + milestone label | Satisfies "see the tree" cheaply; step feels non-arbitrary | Plan |
| Testing | Deterministic layer + schema-validate brain output | Fast, reliable; LLM boundary contract-tested not content-tested | Plan |
| Removal | Full, incl. drop `strategic_suggestions` | Operator's call; table has no other consumers | Plan |

## Scope

**In scope:** set/edit one north-star goal + avoid-list; local repo-aware planner computing
ONE grounded, type-classified, comfort-safe step; Goals admin tab with Accept/Resolved/Skip;
full removal of the old strategy surface.

**Out of scope:** type-aware auto-execution (simple code → `pnpm tasks`; harder/bug →
interactive `claude` without `-p`) — deferred to Slice 2; dialogue; expandable rationale;
multiple goals; multi-user; web-triggered compute.

## Architecture / Approach

Local `pnpm goal:next` → `claude -p` (subscription, reads repo + DB state) → schema-validated
JSON step → `goal_steps` table. The web Goals view (runs in prod) only reads/writes that table.
Compute is local; display is web. The web "refresh" re-reads the DB — it never spawns Claude.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Data layer | `goals` + `goal_steps` tables, helpers, migration | Barrel/dist rebuild missed → engine can't see exports |
| 2. Local planner | `pnpm goal:next` produces one validated step | Parsing/validating `claude -p` JSON reliably |
| 3. Web Goals view + API | Goals tab: set goal, show step, Accept/Resolved/Skip | Nav wiring in the large `AdminForm.tsx` |
| 4. Remove strategy surface | Old UI/route/scheduler + table dropped | Destructive `db:push` drop is irreversible |

**Prerequisites:** local Claude Code logged in (subscription); DB access; the existing `tasks`
runner untouched.
**Estimated effort:** ~3–4 focused sessions across 4 phases.

## Open Risks & Assumptions

- `claude -p --output-format json` output is parseable into a strict step JSON with bounded retries; if the model is chatty, the prompt/validation must be firm.
- `pnpm goal:next` is local-only by design; the operator is comfortable triggering compute from a terminal (consistent with `pnpm tasks`/SITC).
- The `strategic_suggestions` drop assumes no external consumers — verified across `apps`/`packages`, re-checked in Phase 4.

## Success Criteria (Summary)

- The operator sets a goal, gets one grounded small step, and acts on it via the Goals tab.
- Re-running the planner re-plans against updated state; steps are never off-limits.
- The old strategy surface is fully gone with no regressions and a clean type check/build.
