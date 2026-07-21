# Kaizen Growth — Slice 2: Type-Aware Resolution + Rationale Implementation Plan

## Overview

Complete the type-aware resolution loop of the Kaizen Growth goal engine. Slice 1 shipped the
data layer, the local planner (`pnpm goal:next`), and a Goals admin view where the operator
accepts / resolves / skips a single next step (all types resolved manually). Slice 2 makes the
step's **type** drive how it gets done: **code** steps enqueue into the existing `pnpm tasks`
runner behind a two-action confirm; **bug** steps open an interactive local `claude` session
via a new `pnpm goal:resolve` command; and every step gains an expandable "why this step"
rationale. A safety guard stops the planner from proposing over an in-flight task.

## Current State Analysis

- **Data**: `goal_steps` (`packages/db/src/schema.ts`) has `id, goalId, title, type (human|code|bug), rationale, milestoneLabel, status (proposed|accepted|resolved|skipped), createdAt, resolvedAt`. No link to `tasks`. Helpers in `packages/db/src/goals.ts`: `getActiveGoal`, `upsertActiveGoal`, `updateGoalAvoidList`, `getCurrentStep`, `createGoalStep` (supersedes any live step), `updateGoalStepStatus`.
- **Tasks**: `tasks` table + `createTask()` (`packages/db/src/tasks.ts:28`) already power the `pnpm tasks` runner (`scripts/run-tasks.sh`), which resolves pending tasks with `claude -p --dangerously-skip-permissions` and writes `status` + `summary` back. Statuses: `pending | in-progress | on_hold | done | failed`.
- **API**: `apps/engine/src/pages/api/admin/goals.ts` — super-admin gated; GET returns `{goal, currentStep}`; POST actions `set-goal`, `update-avoidlist`, `step-action` (accept|resolve|skip).
- **View**: `apps/engine/src/components/admin/GoalsView.tsx` — shows the current step (type badge, milestone, rationale) with Accept / Resolved / Skip.
- **Planner**: `scripts/goal-planner.ts` (`pnpm goal:next`) — read-only `claude -p`, writes one `proposed` step. `scripts/lib/goal-step.ts` holds pure helpers.
- **Constraint (carried from Slice 1)**: the runner auto-executes any `pending` task with skipped permissions, so a `pending` task must not exist until the operator explicitly confirms.

## Desired End State

The operator opens a proposed step and accepts it. If it's a **code** step, a "Run now" button
appears; clicking it enqueues a task into the `pnpm tasks` runner, and the step card shows the
task's live status + summary (on refresh) until the operator reviews it and clicks Resolved. If
it's a **bug** step, the card tells them to run `pnpm goal:resolve`, which opens an interactive
`claude` session (they approve each action) seeded with the step; when done they click Resolved.
A **human** step still uses the Resolved button (unchanged). Any step can be expanded to see the
"why" chain. Re-running `pnpm goal:next` while a task is still pending/in-progress is refused.

Verify: accept a code step → Run now → `pnpm tasks` picks it up → status/summary appears →
Resolved; accept a bug step → `pnpm goal:resolve` opens seeded interactive claude → Resolved;
`goal:next` refused while a task runs; type-check + engine build + db build green.

### Key Discoveries:
- `createTask()` needs `domain, template, location, description` (`packages/db/src/tasks.ts:28-45`); the goal engine can enqueue by supplying these.
- Confirm-before-run maps to a two-action UI: Accept (→`accepted`, no task) then Run now (→`createTask` `pending`). Nothing pending exists until Run now.
- Interactive `claude` (no `-p`) is human-in-the-loop — the operator approves each tool use — so bug resolution needs no `--dangerously-skip-permissions` and is safe by construction. It must run locally (subscription), like `goal:next`.
- The existing runner writes `summary` + `status` back to `tasks`, so the UI can reflect execution by reading the linked task row.

## What We're NOT Doing

- **No FR-015 dialogue** (compare-my-thoughts). Deferred to Slice 3 — its local-only interactive design is a separate chunk.
- **No web-triggered bug resolution.** The web never spawns a local terminal; `pnpm goal:resolve` is a local command (like `goal:next`).
- **No auto-resolve on task completion.** A finished task surfaces its result; the operator reviews and marks Resolved.
- **No live polling.** Task status updates on manual refresh, consistent with Slice 1.
- **No planner change to emit richer reasoning** — FR-006 assembles the "why" from existing fields.
- **No changes to the `pnpm tasks` runner** (`run-tasks.sh`) or the `tasks` table shape.

## Critical Implementation Details

- **Confirm-before-run is the whole point of the two-action flow.** `Accept` must only flip the step to `accepted`. Only `Run now` may call `createTask` (which creates a `pending` row the always-on runner will execute). Never collapse these into one action.
- **Bug resolution is local + interactive.** `pnpm goal:resolve` must `spawn` `claude` with inherited stdio (no `-p`, no `--output-format`, no `--dangerously-skip-permissions`) so the operator drives an interactive session and approves each action. It is local-only by design.
- **In-flight guard reads the linked task.** `goal:next` must refuse when the current step has a `taskId` whose task status is `pending` or `in-progress` — otherwise superseding the step orphans a running task.

## Phase 1: Data Layer — link a step to its task

### Overview
Add the `goal_steps.taskId` link and the helpers the API/planner need to set it and read the linked task's status.

### Changes Required:

#### 1. Schema — link column
**File**: `packages/db/src/schema.ts`
**Intent**: Let a goal step reference the task enqueued to resolve it.
**Contract**: Add `taskId: uuid("task_id").references(() => tasks.id)` (nullable) to `goalSteps`. `tasks` is declared earlier in the file, so the closure reference is valid. No `onDelete` (a task is never deleted out from under a step in this slice).

#### 2. Query helpers
**File**: `packages/db/src/goals.ts`
**Intent**: Set the link and read a step's linked task for status display + the in-flight guard.
**Contract**:
- `linkStepTask(stepId, taskId)` → sets `goalSteps.taskId`, returns the updated row.
- `getCurrentStepWithTask(goalId)` → returns `{ step, task }` where `task` is the linked `tasks` row (or null) for the current step. Reuse `getCurrentStep`, then look up the task by `step.taskId`. (Keeps `getCurrentStep` unchanged for existing callers.)

#### 3. Barrel exports
**File**: `packages/db/src/index.ts`
**Intent**: Export the two new helpers.
**Contract**: Add `linkStepTask`, `getCurrentStepWithTask` to the `./goals.js` export block.

### Success Criteria:
#### Automated Verification:
- db type-check passes: `pnpm --filter @mshorizon/db type-check`
- Schema push applies: `pnpm --filter @mshorizon/db db:push`
- db builds: `pnpm --filter @mshorizon/db build`
- Monorepo type-check passes: `pnpm type-check`
#### Manual Verification:
- `goal_steps.task_id` column exists (studio / `\d goal_steps`).
- Linking a step to a task and reading it back round-trips via a scratch snippet.

**Implementation Note**: After automated verification passes, pause for manual confirmation before Phase 2.

---

## Phase 2: Code path (FR-012) — enqueue into the runner

### Overview
Wire the two-action confirm for code steps: Accept commits the step; Run now enqueues a task and links it; the view surfaces the task's status/summary; Resolved closes it.

### Changes Required:

#### 1. API — run-step action
**File**: `apps/engine/src/pages/api/admin/goals.ts`
**Intent**: Enqueue a task for an accepted code step and link it; extend the snapshot to include the linked task.
**Contract**:
- `snapshot()` returns `{ goal, currentStep, task }` — use `getCurrentStepWithTask`.
- New POST action `run-step { id }`: guard that the step exists, is `type: code`, is `accepted`, and has no live task yet; `createTask({ domain: locals.businessId, template: "goals", location: "goals/<id>", description: "<title>\n\n<rationale>", isAdminPanel: false })`; `linkStepTask(id, task.id)`; return the fresh snapshot. Return 400 on guard failure.

#### 2. View — Run now + status
**File**: `apps/engine/src/components/admin/GoalsView.tsx`
**Intent**: For an accepted code step, show "Run now"; once a task is linked, show its status + summary; keep Resolved.
**Contract**: Consume `task` from the snapshot. When step is `accepted` + `type: code` + no task → show "Run now" (POST `run-step`). When a task exists → show its `status` (badge) and `summary` (when present), plus Resolved. Refresh re-fetches (existing button). Human/bug steps unaffected here.

### Success Criteria:
#### Automated Verification:
- Monorepo type-check passes: `pnpm type-check`
- Engine builds: `pnpm --filter @mshorizon/engine build`
#### Manual Verification:
- Accept a code step → "Run now" appears; clicking it creates a `pending` task (visible in the Tasks tab) and links it.
- With `pnpm tasks` running, the task resolves and its status/summary shows on the step after refresh.
- Nothing is enqueued on Accept alone (no `pending` task until Run now).
- Resolved closes the step.

**Implementation Note**: Pause for manual confirmation before Phase 3.

---

## Phase 3: Bug path (FR-013) — interactive local resolution

### Overview
A new local command opens an interactive `claude` session seeded with the accepted bug step; the operator drives the fix and marks Resolved in the UI.

### Changes Required:

#### 1. Resolve command
**File**: `scripts/goal-resolve.ts` (new)
**Intent**: Launch interactive `claude` (no `-p`) seeded with the current accepted bug step so the operator can fix it with approvals.
**Contract**: Read the active goal + current step (`getCurrentStepWithTask`/`getCurrentStep`). If none, or the step isn't `type: bug` + `accepted`, print a helpful message and exit 0. Otherwise `spawnSync("claude", [seedPrompt], { stdio: "inherit", cwd: REPO_ROOT })` — interactive, no `-p`, no `--output-format`, no skip-permissions. `seedPrompt` states the north-star, the step title + rationale, and "fix this; I'll approve actions." Do not mark the step resolved (operator does that in the UI).

#### 2. npm script
**File**: `package.json`
**Intent**: Expose `pnpm goal:resolve`.
**Contract**: Add `"goal:resolve": "tsx scripts/goal-resolve.ts"`.

#### 3. View — bug hint
**File**: `apps/engine/src/components/admin/GoalsView.tsx`
**Intent**: Tell the operator how to resolve an accepted bug step.
**Contract**: When step is `accepted` + `type: bug` → show a hint to run `pnpm goal:resolve` locally, plus the Resolved button. No Run-now for bug steps.

### Success Criteria:
#### Automated Verification:
- Monorepo type-check passes: `pnpm type-check`
- Engine builds: `pnpm --filter @mshorizon/engine build`
- `pnpm goal:resolve` exits cleanly with a helpful message when there is no accepted bug step.
#### Manual Verification:
- Accept a bug step → the UI shows the `pnpm goal:resolve` hint.
- `pnpm goal:resolve` opens an interactive `claude` session seeded with the step (operator approves actions).
- After fixing, Resolved closes the step.

**Implementation Note**: Pause for manual confirmation before Phase 4.

---

## Phase 4: Rationale (FR-006) + in-flight re-plan guard

### Overview
Add the expandable "why this step" and stop the planner from proposing over a running task.

### Changes Required:

#### 1. View — "why this step"
**File**: `apps/engine/src/components/admin/GoalsView.tsx`
**Intent**: Let the operator expand the reasoning chain for the current step.
**Contract**: An expandable/disclosure section rendering north-star (`goal.title`) → milestone (`step.milestoneLabel`) → this step (`step.title`) + the stored `rationale`. Client-side only, from data already in the snapshot; use shadcn/lucide per admin convention.

#### 2. Planner — in-flight guard
**File**: `scripts/goal-planner.ts`
**Intent**: Refuse to propose a new step while the current step's task is still running, to avoid orphaning it.
**Contract**: Before computing, read the current step + linked task (`getCurrentStepWithTask`). If the linked task status is `pending` or `in-progress`, print a message ("a task is still running for the current step; let it finish or resolve it first") and exit 0 without proposing.

### Success Criteria:
#### Automated Verification:
- Monorepo type-check passes: `pnpm type-check`
- Engine builds: `pnpm --filter @mshorizon/engine build`
#### Manual Verification:
- The current step can be expanded to show the north-star → milestone → step + rationale chain.
- With a code step's task `pending`/`in-progress`, `pnpm goal:next` refuses and explains; after the task finishes (or the step resolves), it proposes again.

**Implementation Note**: Pause for final manual confirmation.

---

## Testing Strategy

### Unit Tests:
- `linkStepTask` sets `taskId`; `getCurrentStepWithTask` returns the linked task (or null).
- `run-step` guard: rejects non-code / non-accepted / already-linked steps; accepts a valid one and links the created task.
- In-flight guard predicate: given a current step + task status, returns propose vs refuse correctly.

### Integration Tests:
- `POST /api/admin/goals { action: "run-step" }` round-trip: accept a code step → run-step → snapshot shows a linked pending task; 403 when unauthenticated / non-super-admin.

### Manual Testing Steps:
1. Code: propose → Accept → Run now → run `pnpm tasks` → refresh shows done + summary → Resolved.
2. Bug: propose → Accept → `pnpm goal:resolve` opens interactive claude → fix → Resolved.
3. Human: propose → Accept → Resolved (unchanged).
4. Expand "why this step" and confirm the chain.
5. With a task in-flight, confirm `pnpm goal:next` refuses.

## Performance Considerations
Negligible — one extra single-row task lookup per snapshot; execution latency is the runner's / interactive session's, both operator-initiated.

## Migration Notes
Additive `goal_steps.task_id` via `drizzle-kit push` (`db:push`); rebuild `packages/db` (`build`) so the engine sees the new column/helpers. No destructive change.

## References
- PRD: `context/engine/foundation/kaizen-growth/prd.md`
- Slice 1 (archived): `context/engine/archive/2026-07-21-kaizen-growth-core-loop/plan.md`
- Task runner + createTask: `scripts/run-tasks.sh`, `packages/db/src/tasks.ts:28`
- Goal engine: `packages/db/src/goals.ts`, `apps/engine/src/pages/api/admin/goals.ts`, `apps/engine/src/components/admin/GoalsView.tsx`, `scripts/goal-planner.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Data Layer — link a step to its task

#### Automated
- [x] 1.1 db type-check passes: `pnpm --filter @mshorizon/db type-check` — 8eab42c1
- [x] 1.2 Schema push applies: `pnpm --filter @mshorizon/db db:push` — 8eab42c1
- [x] 1.3 db builds: `pnpm --filter @mshorizon/db build` — 8eab42c1
- [x] 1.4 Monorepo type-check passes: `pnpm type-check` — 8eab42c1

#### Manual
- [x] 1.5 `goal_steps.task_id` column exists — 8eab42c1
- [x] 1.6 Link + read-back round-trips via a scratch snippet — 8eab42c1

### Phase 2: Code path (FR-012) — enqueue into the runner

#### Automated
- [x] 2.1 Monorepo type-check passes: `pnpm type-check`
- [x] 2.2 Engine builds: `pnpm --filter @mshorizon/engine build`

#### Manual
- [ ] 2.3 Accept code step → "Run now" appears; clicking creates a linked pending task
- [ ] 2.4 With `pnpm tasks` running, status/summary shows on refresh
- [ ] 2.5 Nothing enqueued on Accept alone
- [ ] 2.6 Resolved closes the step

### Phase 3: Bug path (FR-013) — interactive local resolution

#### Automated
- [ ] 3.1 Monorepo type-check passes: `pnpm type-check`
- [ ] 3.2 Engine builds: `pnpm --filter @mshorizon/engine build`
- [ ] 3.3 `pnpm goal:resolve` exits cleanly with a helpful message when no accepted bug step

#### Manual
- [ ] 3.4 Accept bug step → UI shows the `pnpm goal:resolve` hint
- [ ] 3.5 `pnpm goal:resolve` opens interactive claude seeded with the step
- [ ] 3.6 After fixing, Resolved closes the step

### Phase 4: Rationale (FR-006) + in-flight re-plan guard

#### Automated
- [ ] 4.1 Monorepo type-check passes: `pnpm type-check`
- [ ] 4.2 Engine builds: `pnpm --filter @mshorizon/engine build`

#### Manual
- [ ] 4.3 Current step expands to show north-star → milestone → step + rationale
- [ ] 4.4 `pnpm goal:next` refuses while a task is pending/in-progress; proposes again once clear
