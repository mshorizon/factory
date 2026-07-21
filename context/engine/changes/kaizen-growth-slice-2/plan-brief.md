# Kaizen Growth — Slice 2: Type-Aware Resolution + Rationale — Plan Brief

> Full plan: `context/engine/changes/kaizen-growth-slice-2/plan.md`
> PRD: `context/engine/foundation/kaizen-growth/prd.md`
> Slice 1 (archived): `context/engine/archive/2026-07-21-kaizen-growth-core-loop/`

## What & Why

Slice 1 gave the operator a single grounded next step but resolved every step manually. Slice 2
makes the step's **type** drive how it's done: **code** steps run through the existing task
runner, **bug** steps open an interactive local Claude session, and every step gains an
expandable "why." This closes the loop from "here's the next step" to "and here's how it gets
done."

## Starting Point

Slice 1 is live: `goals`/`goal_steps` tables, `pnpm goal:next` (read-only `claude -p`), and a
super-admin Goals admin view with Accept/Resolved/Skip. A separate `pnpm tasks` runner already
resolves DB tasks with `claude -p` and writes status/summary back. There is no link between a
goal step and a task yet.

## Desired End State

Accept a **code** step → "Run now" enqueues a task → `pnpm tasks` resolves it → status+summary
show in the card → operator reviews and clicks Resolved. Accept a **bug** step → run
`pnpm goal:resolve` locally to fix it interactively → Resolved. **Human** steps unchanged. Any
step expands to show north-star → milestone → step + rationale. Re-planning is blocked while a
task is in-flight.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Scope | FR-012/013/006; defer FR-015 dialogue | Ship the resolution loop without the murky local-only dialogue design | Plan |
| Code confirm flow | Two actions: Accept, then Run now | Only Run now creates a pending task — honors confirm-before-run | Plan |
| Task completion | Surface result; operator marks Resolved | Human review gate on the automated change | Plan |
| Bug resolution | `pnpm goal:resolve` → interactive `claude` (no -p) | Local, human-approves-each-action; web can't spawn a terminal | Plan |
| Bug loop close | Operator marks Resolved in UI | "Session exited" ≠ "fix verified" | Plan |
| "Why this step" | Assemble client-side from existing fields | No planner/schema change needed | Plan |
| Status display | Manual refresh (no polling) | Consistent with Slice 1; no new machinery | Plan |
| In-flight edge | `goal:next` refuses while a task runs | Prevents orphaning a running task | Plan |

## Scope

**In scope:** `goal_steps.taskId` link + helpers; code-step enqueue (Accept→Run now) with status
surfaced; `pnpm goal:resolve` interactive bug path; expandable "why this step"; in-flight re-plan
guard.

**Out of scope:** FR-015 dialogue (Slice 3); web-triggered bug resolution; auto-resolve on task
done; live polling; planner emitting richer reasoning; any change to the runner or tasks table.

## Architecture / Approach

Web is where the operator accepts/confirms; local commands do the Claude work. Code: web
`run-step` → `createTask()` (pending) → existing `pnpm tasks` runner (`claude -p`) → status/summary
read back via the new step↔task link. Bug: web marks intent; `pnpm goal:resolve` opens interactive
`claude` (no -p, operator approves) locally. Confirm-before-run is enforced by never creating a
pending task until the explicit "Run now".

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Data layer | `goal_steps.taskId` + link/status helpers | Migration + barrel/dist rebuild |
| 2. Code path (FR-012) | Accept→Run now→enqueue, status surfaced | Guard so nothing runs before confirm |
| 3. Bug path (FR-013) | `pnpm goal:resolve` interactive command | Interactive spawn (stdio inherit) UX |
| 4. Rationale + guard | "Why this step" + in-flight re-plan block | Small; mostly UI + one planner check |

**Prerequisites:** Slice 1 in place; local Claude subscription; `pnpm tasks` runner available.
**Estimated effort:** ~2–3 focused sessions across 4 phases.

## Open Risks & Assumptions

- Interactive `claude` (no -p) with inherited stdio behaves as a normal terminal session — verified conceptually against `run-tasks.sh`'s `-p` usage, but the interactive spawn is exercised only manually.
- "Surface result, operator resolves" assumes the operator will actually review task summaries rather than rubber-stamp — a process assumption, not enforced.
- Blocking re-plan while in-flight is the chosen safety stance; if it feels restrictive, revisit (cancel-task path) in a later slice.

## Success Criteria (Summary)

- A code step goes Accept → Run now → runner resolves → status/summary → Resolved, with nothing executing before "Run now".
- A bug step goes Accept → `pnpm goal:resolve` interactive fix → Resolved.
- Every step exposes its "why"; the planner refuses to propose over an in-flight task.
