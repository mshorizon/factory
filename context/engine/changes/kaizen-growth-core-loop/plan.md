# Kaizen Growth — Core Single-Next-Step Loop (Slice 1) Implementation Plan

## Overview

Deliver the first vertical slice of the Kaizen Growth goal engine: the operator sets one
north-star goal; a **local, repo-aware planner** (`pnpm goal:next`, backed by `claude -p`
using the local Claude subscription) computes a **single** grounded, type-classified,
comfort-safe next step and writes it to the database; and a new **Goals** tab in the admin
panel displays that step with **Accept / Resolved / Skip**. The old, unused strategy surface
(the flat 5-suggestions Scheduler + `/admin/strategy`) is fully removed.

## Current State Analysis

- The admin panel is a single React island (`/admin` → `AdminForm.tsx`) plus a set of
  standalone `/admin/*` Astro pages. Views follow a fixed pattern: a `*View.tsx` component +
  a `/api/admin/*.ts` route + DB helpers, registered as a tab in `AdminForm.tsx`'s
  `navGroups` (`apps/engine/src/components/admin/AdminForm.tsx:1725`) and `getTabContent()`
  (`:1696`). The existing "Suggestions" tab (`StrategyView.tsx` + `api/admin/strategy.ts`) is
  the exact template.
- Auth is automatic: any `/admin/*` page or `/api/admin/*` route is gated by
  `apps/engine/src/middleware.ts:114-122` via the `admin_token` cookie. Convention keeps an
  in-file `!locals.auth` guard anyway.
- A DB-backed task runner already exists: `scripts/run-tasks.sh` polls `pending` rows from the
  `tasks` table and resolves them with **`claude -p … --dangerously-skip-permissions`**
  (`run-tasks.sh:121`) — i.e. the Claude Code CLI on the **local subscription, no API key**.
  Tasks are created via `createTask()` (`packages/db/src/tasks.ts:28`).
- The current strategy brain (`scripts/strategic-scheduler.ts`) uses `@anthropic-ai/sdk` +
  `ANTHROPIC_API_KEY` and hand-assembled context — the "blind API call" this project moves
  away from. The operator does not use `/admin/strategy` and it may be removed.
- DB migrations use **`drizzle-kit push`** (`packages/db` script `db:push`); there are no
  versioned migration files. `packages/db/dist` is prebuilt (`build` = `tsc`) and the barrel
  `packages/db/src/index.ts` must re-export any new helper/type. `strategicSuggestions` is a
  `pgTable` at `packages/db/src/schema.ts:417`.

## Desired End State

The operator opens the **Goals** tab in `/admin`, sets a north-star goal (e.g. "10 paying
clients") and an optional avoid-list, then runs `pnpm goal:next` locally. Within a few
seconds a single next step appears — with a type badge (human/code/bug), the milestone it
belongs to, a one-line title, and a rationale — grounded in the repo's architecture docs and
the current task/business state, and never an off-limits action. The operator clicks
**Accept**, does the work (or, for this slice, does it however they like), and clicks
**Resolved**; or **Skip** to discard it. Running `pnpm goal:next` again produces a fresh step
against the updated state. `/admin/strategy`, `StrategyView`, `strategic-scheduler.ts`, and
the `strategic_suggestions` table no longer exist.

Verification: the Goals tab renders and round-trips all actions against the DB;
`pnpm goal:next` writes exactly one `proposed` `goal_steps` row (superseding any prior);
`pnpm type-check` and the db build pass; the strategy surface is gone with no dangling imports.

### Key Discoveries:

- Admin view pattern to clone: `apps/engine/src/pages/admin/strategy.astro`,
  `apps/engine/src/components/admin/StrategyView.tsx`, `apps/engine/src/pages/api/admin/strategy.ts`,
  nav wiring at `AdminForm.tsx:1696` (`getTabContent`) and `:1788` (nav item).
- `claude -p` uses the **local subscription**, is **repo-aware**, and is already proven on the
  operator's machine (`run-tasks.sh:121`). This is the planner's engine.
- **Confirm-before-run guardrail:** the runner auto-executes any `pending` `tasks` row with
  `--dangerously-skip-permissions`. `goal_steps` must therefore be a **separate table** from
  `tasks` — a proposed/accepted step must never be a `pending` task. (Slice 2 will create a
  linked task only on explicit confirm.)
- Migration = edit `schema.ts` → `pnpm --filter @mshorizon/db db:push` → `pnpm --filter @mshorizon/db build`. The barrel `index.ts` must export new symbols.
- `strategic_suggestions` has **no consumers outside the strategy surface itself** (verified across `apps`/`packages`), so a destructive drop is safe.

## What We're NOT Doing

- **No type-aware auto-execution** (FR-012 / FR-013). In Slice 1 every step type is resolved
  manually via the **Resolved** button. Deferred to a follow-up change. The deferred routing,
  keyed off the step `type` captured here, is: **simple code steps → the headless `pnpm tasks`
  runner (`claude -p`)**, while **harder steps (bugs / complex work) → an interactive `claude`
  session *without* `-p`** so the operator can drive them. (The operator explicitly wants harder
  tasks resolved via interactive Claude Code, not headless.) Both paths gate execution behind an
  explicit confirm.
- **No dialogue** (FR-015) and **no expandable "why this step" rationale** (FR-006) beyond a
  static one-line rationale field. Deferred.
- **No multiple concurrent goals, no multi-user/roles** (permanent Non-Goals).
- **No web-triggered compute.** The web view never spawns Claude; `pnpm goal:next` is a
  local-only command. The web "refresh" only re-reads the DB.
- **No changes to the rendering pipeline, per-business JSONs, the `tasks` table, or the
  existing task runner.**

## Implementation Approach

Four phases, each independently verifiable: (1) additive data layer for goals/steps; (2) the
local planner that fills it; (3) the web view that displays and mutates it; (4) removal of the
old strategy surface. Building the replacement first (1–3) and demolishing last (4) keeps the
panel working throughout. The web/DB/API layers are fully deterministic and tested; the LLM
boundary is contract-tested (schema-validated), not content-tested.

## Critical Implementation Details

- **Local-only planner.** `pnpm goal:next` invokes `claude -p` and MUST run in the repo root
  on the operator's local machine (subscription auth). It will not work on the prod VPS; that
  is by design — the web Goals view (which does run in prod) only reads/writes the DB.
- **Single active step invariant.** At most one `goal_steps` row per goal is in a live state
  (`proposed` or `accepted`). When the planner writes a new step it first supersedes any prior
  `proposed` step (→ `skipped`). Enforce this in the create helper, not the caller.
- **`claude -p` output parsing.** Invoke with `--output-format json`; the CLI returns a wrapper
  object whose `result` field holds the model's text. The prompt must instruct Claude to emit
  the step as a single strict JSON object (no prose); the planner extracts it, validates against
  the step schema, and retries a bounded number of times (e.g. 2) on malformed output before
  failing loudly. Never write an unvalidated step.
- **Off-limits filter is prompt-side.** A hardcoded baseline rule set (no cold calling / no
  GDPR-risky outreach / nothing illegal) is concatenated with the goal's operator avoid-list
  and injected into the planner prompt as hard exclusions.

## Phase 1: Data Layer (goals & goal_steps)

### Overview

Add two Drizzle tables and their query helpers so goals and steps can be persisted, then push
the schema and rebuild the db package.

### Changes Required:

#### 1. Schema

**File**: `packages/db/src/schema.ts`

**Intent**: Define the `goals` and `goal_steps` tables (modeled on `strategicSuggestions` at
`:417`) plus their status/type constant arrays and inferred types.

**Contract**:
- `goals` (`goals`): `id` uuid PK `defaultRandom`; `title` text notNull (the north-star); `avoidList` text nullable (operator override list, newline-separated); `status` text notNull default `'active'`; `createdAt`/`updatedAt` timestamps `defaultNow`.
- `goalSteps` (`goal_steps`): `id` uuid PK; `goalId` uuid notNull (FK → `goals.id`); `title` text notNull; `type` text notNull (`human|code|bug`); `rationale` text nullable; `milestoneLabel` text nullable; `status` text notNull default `'proposed'`; `createdAt` timestamp `defaultNow`; `resolvedAt` timestamp nullable.
- Export const arrays `GOAL_STATUSES = ['active','archived']`, `STEP_TYPES = ['human','code','bug']`, `STEP_STATUSES = ['proposed','accepted','resolved','skipped']`, and `$inferSelect`/`$inferInsert` types for both tables. Status/type are plain `text` (validated in app code), matching the `tasks` convention.

#### 2. Query helpers

**File**: `packages/db/src/queries.ts`

**Intent**: CRUD + lifecycle helpers the API and planner call.

**Contract**: `getActiveGoal()` (the single `status='active'` row or null); `upsertActiveGoal({title, avoidList?})` (archive any prior active goal, insert a new active one — or update the existing active goal's title/avoidList); `updateGoalAvoidList(goalId, avoidList)`; `getCurrentStep(goalId)` (latest `proposed`|`accepted` step); `createGoalStep({goalId,title,type,rationale,milestoneLabel})` — **supersedes** any prior `proposed` step for that goal (→ `skipped`) then inserts the new `proposed` step; `updateGoalStepStatus(id, status)` (validates against `STEP_STATUSES`, stamps `resolvedAt` when `resolved`). Validate `type`/`status` against the const arrays; throw on invalid.

#### 3. Barrel exports

**File**: `packages/db/src/index.ts`

**Intent**: Re-export the new helpers, tables, and types so `@mshorizon/db` consumers see them.

**Contract**: Add the six helpers + `goals`/`goalSteps` tables + their types to the existing export lists.

#### 4. Push schema & rebuild

**Intent**: Apply the additive schema to the database and rebuild the prebuilt db package.

**Contract**: `pnpm --filter @mshorizon/db db:push` then `pnpm --filter @mshorizon/db build`.

### Success Criteria:

#### Automated Verification:
- Type check passes: `pnpm --filter @mshorizon/db type-check`
- Schema push succeeds: `pnpm --filter @mshorizon/db db:push`
- db package builds: `pnpm --filter @mshorizon/db build`
- Monorepo type check passes: `pnpm type-check`

#### Manual Verification:
- `goals` and `goal_steps` tables exist in the DB (via `db:studio` or `psql \d`).
- A manual insert of a goal + step round-trips through the new helpers in a scratch `tsx` snippet.

**Implementation Note**: After automated verification passes, pause for manual confirmation before Phase 2.

---

## Phase 2: Local Planner (`pnpm goal:next`)

### Overview

A new local script assembles context, invokes repo-aware `claude -p`, validates the returned
step against a schema, and persists exactly one `proposed` step.

### Changes Required:

#### 1. Planner script

**File**: `scripts/goal-planner.ts` (new)

**Intent**: Compute the single next step for the active goal and write it to `goal_steps`. Runs
locally, uses the Claude subscription via the CLI, never the API key.

**Contract**:
- Read the active goal via `getActiveGoal()`; exit with a clear message if none.
- Read recent progress from the DB: recent `done`/`pending` `tasks` (via `listTasks()`), and any current step, to tell Claude what's already in flight.
- Build a prompt containing: the north-star goal; the baseline off-limits rules **concatenated with** the goal's `avoidList`; the progress summary; and an instruction to (a) read the repo's architecture docs (`CLAUDE.md`, `docs/adr/*`) and current git/code state, (b) propose exactly ONE smallest startable next step, and (c) output it as a single strict JSON object and nothing else.
- Invoke `claude -p "<prompt>" --output-format json` via `child_process` (spawn), from repo root. Extract the model text from the CLI wrapper's `result` field.
- Validate the parsed step against the step schema (below). On malformed/invalid output, retry up to 2× with a corrective note; if still invalid, exit non-zero without writing.
- On success, `createGoalStep(...)` (which supersedes any prior `proposed` step).
- Reuse the `run-tasks.sh` conventions: `DATABASE_URL` default, macOS `osascript` completion notification.

**Contract (step schema)**: a JSON object `{ title: string (≤120 chars), type: 'human'|'code'|'bug', rationale: string, milestoneLabel: string }`. Enforce with a small validator (zod or ajv — ajv already used in `packages/schema`).

#### 2. Baseline off-limits constant

**File**: `scripts/goal-planner.ts` (same file, or a sibling `scripts/lib/off-limits.ts`)

**Intent**: The hardcoded safety baseline that is always excluded.

**Contract**: An exported string/array: no cold calling; no unsolicited outreach that is GDPR/telemarketing-risky; nothing illegal. Injected into the prompt ahead of the operator avoid-list.

#### 3. npm script

**File**: `package.json`

**Intent**: Expose the planner as `pnpm goal:next`.

**Contract**: Add `"goal:next": "tsx scripts/goal-planner.ts"` to root `scripts`.

### Success Criteria:

#### Automated Verification:
- Type check passes: `pnpm type-check`
- Step schema validator rejects a malformed fixture and accepts a valid one (unit test, run via the repo's test runner).
- Planner exits cleanly with a helpful message when no active goal exists (can be asserted by running `pnpm goal:next` with an empty goals table).

#### Manual Verification:
- With an active goal set, `pnpm goal:next` produces exactly one new `proposed` `goal_steps` row grounded in real repo/business state.
- The step is small/startable, carries a valid `type` and `milestoneLabel`, and is never an off-limits action.
- Running it again supersedes the prior `proposed` step (prior → `skipped`, one live step remains).

**Implementation Note**: After automated verification passes, pause for manual confirmation before Phase 3.

---

## Phase 3: Web Goals View + API

### Overview

A new admin tab that sets the goal/avoid-list and displays and acts on the current step,
cloning the Suggestions pattern.

### Changes Required:

#### 1. API route

**File**: `apps/engine/src/pages/api/admin/goals.ts` (new)

**Intent**: Serve the goal + current step and handle goal/step mutations. Model on
`api/admin/strategy.ts`.

**Contract**: `if (!locals.auth) return 401` in each handler. `GET` → `{ goal, currentStep }`
from `getActiveGoal()` + `getCurrentStep()`. `POST` with a JSON `{ action, ... }` body:
`set-goal { title }` → `upsertActiveGoal`; `update-avoidlist { avoidList }` →
`updateGoalAvoidList`; `step-action { id, action }` where `action ∈ accept|resolve|skip` →
`updateGoalStepStatus` (`accept`→`accepted`, `resolve`→`resolved`, `skip`→`skipped`). Returns
the updated `{ goal, currentStep }`.

#### 2. View component

**File**: `apps/engine/src/components/admin/GoalsView.tsx` (new)

**Intent**: The operator-facing UI. Model on `StrategyView.tsx` (no props, self-fetching).

**Contract**: Fetches `GET /api/admin/goals` on mount. Renders: a north-star input (save →
`set-goal`); an avoid-list `Textarea` (save → `update-avoidlist`); the current step as a
`Card` with a type badge (human/code/bug), the `milestoneLabel`, the title, and the rationale;
and **Accept / Resolved / Skip** buttons wired to `step-action`. Shows an empty-state when no
step exists, with a hint: "Run `pnpm goal:next` locally to compute your next step." A refresh
button re-fetches. Uses `@/components/ui/*` (card, button, input, textarea, badge, label) and
`lucide-react` icons, per convention.

#### 3. Register the tab

**File**: `apps/engine/src/components/admin/AdminForm.tsx`

**Intent**: Make Goals reachable in the `/admin` sidebar.

**Contract**: Import `GoalsView` (near `:25`); import a `Target` icon in the `lucide-react`
block (`:64-113`); add a `getTabContent()` branch `if (activeTab === "goals") return <GoalsView />;`
(near `:1696`); add a nav item `{ id: "goals", label: "Goals", Icon: Target }` to a `navGroups`
group (near `:1788`).

#### 4. Standalone page (parity with strategy)

**File**: `apps/engine/src/pages/admin/goals.astro` (new)

**Intent**: Optional direct-URL entry point, mirroring `strategy.astro`.

**Contract**: Clone `strategy.astro`: `AdminLayout` + `<GoalsView client:load />` inside the
scoped wrapper; in-file `if (!auth) return Astro.redirect('/admin/login')`.

### Success Criteria:

#### Automated Verification:
- Type check passes: `pnpm type-check`
- Engine builds: `pnpm --filter @mshorizon/engine build`
- Lint passes: `pnpm lint`

#### Manual Verification:
- The Goals tab appears in `/admin` and loads without console errors.
- Setting a north-star goal and avoid-list persists (survives refresh).
- After `pnpm goal:next`, the step renders with correct type badge, milestone, and rationale.
- Accept / Resolved / Skip each update the DB and the UI reflects the new state.
- No hardcoded colors/spacing; semantic tokens only (per CLAUDE.md styling rules) — admin uses its own theme.

**Implementation Note**: After automated verification passes, pause for manual confirmation before Phase 4.

---

## Phase 4: Remove Old Strategy Surface

### Overview

Fully remove the unused strategy Scheduler and `/admin/strategy`, including a destructive drop
of the `strategic_suggestions` table.

### Changes Required:

#### 1. Delete UI + route + page

**Files**: `apps/engine/src/components/admin/StrategyView.tsx`,
`apps/engine/src/pages/admin/strategy.astro`, `apps/engine/src/pages/api/admin/strategy.ts`

**Intent**: Remove the strategy surface files.

**Contract**: Delete all three. `createTask` (still used elsewhere) stays in the db barrel.

#### 2. Unwire the nav

**File**: `apps/engine/src/components/admin/AdminForm.tsx`

**Intent**: Remove all references so the panel builds without the strategy tab.

**Contract**: Remove the `StrategyView` import (`:25`), the strategy nav item (`:1788`), and the
`getTabContent()` strategy branch (`:1696`). Remove the now-unused `Lightbulb` icon import only
if nothing else uses it.

#### 3. Delete the scheduler

**Files**: `scripts/strategic-scheduler.ts`, root `package.json`, `CLAUDE.md`, system crontab

**Intent**: Remove the daily API-key-based scheduler and its documentation.

**Contract**: Delete `scripts/strategic-scheduler.ts`; remove any scheduler npm script; delete
the `## 🗓 Scheduler` section from `CLAUDE.md`; remove the crontab entry (manual step —
document in the phase's manual verification).

#### 4. Drop the table + helpers

**Files**: `packages/db/src/schema.ts`, `packages/db/src/queries.ts`, `packages/db/src/index.ts`

**Intent**: Remove the `strategic_suggestions` schema, its query helpers, and barrel exports,
then push the (now destructive) schema change.

**Contract**: Delete `strategicSuggestions` + `SuggestionStatus`/`StrategicSuggestion`/`NewStrategicSuggestion`
types (`schema.ts:417-430`); delete `getStrategicSuggestions` / `updateStrategicSuggestionStatus` /
`createStrategicSuggestion` (`queries.ts:745-789`); remove their barrel exports; then
`pnpm --filter @mshorizon/db db:push` (confirm the drop) and `pnpm --filter @mshorizon/db build`.

### Success Criteria:

#### Automated Verification:
- No dangling references: `grep -r "StrategyView\|strategic_suggestions\|StrategicSuggestion\|/admin/strategy\|strategic-scheduler" apps packages scripts` returns nothing (outside this plan/change docs).
- Monorepo type check passes: `pnpm type-check`
- Engine builds: `pnpm --filter @mshorizon/engine build`
- db package builds: `pnpm --filter @mshorizon/db build`

#### Manual Verification:
- `/admin` no longer shows a Suggestions tab; `/admin/strategy` 404s.
- The `strategic_suggestions` table is gone from the DB.
- The crontab entry for the scheduler has been removed (`crontab -l`).
- No other admin feature regressed (spot-check Businesses, Tasks, Blog tabs).

**Implementation Note**: After automated verification passes, pause for final manual confirmation.

---

## Testing Strategy

### Unit Tests:
- Step JSON schema validator: rejects malformed (missing/invalid `type`), accepts valid.
- `createGoalStep` supersession: a second create marks the prior `proposed` step `skipped` and leaves exactly one live step.
- `updateGoalStepStatus`: stamps `resolvedAt` on `resolved`; rejects invalid status.
- `upsertActiveGoal`: archives a prior active goal; only one `active` goal remains.

### Integration Tests:
- `GET/POST /api/admin/goals` round-trip: set-goal → get → step-action → get, asserting DB state and 401 when unauthenticated.

### Manual Testing Steps:
1. Set a north-star goal + avoid-list in the Goals tab; refresh — both persist.
2. Run `pnpm goal:next`; confirm one grounded, small, correctly-typed step appears with a milestone and rationale, and is never off-limits.
3. Accept → Resolved; run `pnpm goal:next` again; confirm a fresh step supersedes the old.
4. Skip a step; confirm it disappears and the empty-state hint shows.
5. Confirm the LLM boundary: feed a deliberately malformed model output (temporarily) and confirm the planner retries then fails loudly without writing.

## Performance Considerations

`pnpm goal:next` latency is dominated by the `claude -p` call (seconds); acceptable for an
on-demand local command. The web view does only lightweight single-row DB reads/writes.

## Migration Notes

Additive tables (Phase 1) and the destructive drop (Phase 4) both go through `drizzle-kit push`
(`db:push`), which diffs `schema.ts` against the live DB. The Phase 4 drop is irreversible —
confirm the drop prompt deliberately. `packages/db/dist` must be rebuilt (`build`) after each
schema/query change so the engine app picks up the new/removed exports.

## References

- PRD: `context/engine/foundation/kaizen-growth/prd.md`
- Shape notes: `context/engine/foundation/kaizen-growth/shape-notes.md`
- Admin view template: `apps/engine/src/components/admin/StrategyView.tsx`, `apps/engine/src/pages/api/admin/strategy.ts`, `apps/engine/src/pages/admin/strategy.astro`
- Nav wiring: `apps/engine/src/components/admin/AdminForm.tsx:1696`, `:1788`
- Task runner (claude -p on subscription): `scripts/run-tasks.sh:121`, task creation `packages/db/src/tasks.ts:28`
- Auth gate: `apps/engine/src/middleware.ts:114`, `apps/engine/src/lib/auth.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Data Layer (goals & goal_steps)

#### Automated
- [x] 1.1 Type check passes: `pnpm --filter @mshorizon/db type-check` — 435e1cf0
- [x] 1.2 Schema push succeeds: `pnpm --filter @mshorizon/db db:push` — 435e1cf0
- [x] 1.3 db package builds: `pnpm --filter @mshorizon/db build` — 435e1cf0
- [x] 1.4 Monorepo type check passes: `pnpm type-check` — 435e1cf0

#### Manual
- [x] 1.5 `goals` and `goal_steps` tables exist in the DB — 435e1cf0
- [x] 1.6 Goal + step round-trips through the new helpers in a scratch snippet — 435e1cf0

### Phase 2: Local Planner (`pnpm goal:next`)

#### Automated
- [x] 2.1 Type check passes: `pnpm type-check` — 578b8616
- [x] 2.2 Step schema validator rejects malformed / accepts valid (unit test) — 578b8616
- [x] 2.3 Planner exits cleanly with a helpful message when no active goal exists — 578b8616

#### Manual
- [x] 2.4 `pnpm goal:next` writes exactly one grounded `proposed` step — 578b8616
- [x] 2.5 Step is small/startable, correctly typed, with milestone; never off-limits — 578b8616
- [x] 2.6 Re-running supersedes the prior `proposed` step (one live step remains) — 578b8616

### Phase 3: Web Goals View + API

#### Automated
- [x] 3.1 Type check passes: `pnpm type-check` — 942e0b49
- [x] 3.2 Engine builds: `pnpm --filter @mshorizon/engine build` — 942e0b49
- [x] 3.3 Lint passes: `pnpm lint` (no lint tasks configured — trivially passes) — 942e0b49

#### Manual
- [x] 3.4 Goals tab appears in `/admin` and loads without console errors — 942e0b49
- [x] 3.5 North-star goal + avoid-list persist across refresh — 942e0b49
- [x] 3.6 Step renders with correct type badge, milestone, rationale — 942e0b49
- [x] 3.7 Accept / Resolved / Skip each update DB and UI — 942e0b49
- [x] 3.8 Styling follows admin theme conventions (no hardcoded colors/spacing) — 942e0b49

### Phase 4: Remove Old Strategy Surface

#### Automated
- [x] 4.1 No dangling references (grep for StrategyView/strategic_suggestions/etc. is empty)
- [x] 4.2 Monorepo type check passes: `pnpm type-check`
- [x] 4.3 Engine builds: `pnpm --filter @mshorizon/engine build`
- [x] 4.4 db package builds: `pnpm --filter @mshorizon/db build`

#### Manual
- [x] 4.5 `/admin` has no Suggestions tab; `/admin/strategy` 404s
- [x] 4.6 `strategic_suggestions` table dropped from the DB
- [x] 4.7 Scheduler crontab entry removed (`crontab -l`) — none found locally; verify VPS system crontab if it ran there
- [x] 4.8 No regression in other admin tabs (Businesses, Tasks, Blog)
