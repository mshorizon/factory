<!-- IMPL-REVIEW-REPORT -->

# Implementation Review: Kaizen Growth — Core Loop (Slice 1)

- **Plan**: context/engine/changes/kaizen-growth-core-loop/plan.md
- **Scope**: All 4 phases
- **Date**: 2026-07-21
- **Verdict**: NEEDS ATTENTION → all actioned (fixes in 3f814917)
- **Findings**: 0 critical, 5 warnings, 5 observations

## Verdicts

| Dimension           | Verdict |
| ------------------- | ------- |
| Plan Adherence      | PASS    |
| Scope Discipline    | PASS    |
| Safety & Quality    | WARNING |
| Architecture        | PASS    |
| Pattern Consistency | WARNING |
| Success Criteria    | PASS    |

## Findings

### F1 — Planner ran skip-permissions agent over untrusted task text
- **Severity**: ⚠️ WARNING · **Impact**: 🔬 HIGH · **Dimension**: Safety & Quality
- **Location**: scripts/goal-planner.ts:93-98
- **Detail**: `claude -p --dangerously-skip-permissions` with a prompt embedding task.description values (some externally-scraped) → prompt-injection → RCE vector.
- **Decision**: FIXED (Fix A) — dropped the flag, restricted to read-only tools (Read/Glob/Grep + read-only git). 3f814917

### F2 — AppleScript injection in desktop notification
- **Severity**: ⚠️ WARNING · **Impact**: 🔎 MEDIUM · **Dimension**: Safety & Quality
- **Location**: scripts/goal-planner.ts:41-45
- **Detail**: model-generated title interpolated into `osascript -e` AppleScript source; unescaped `"` can inject.
- **Decision**: FIXED — escape `\` and `"` before interpolation. 3f814917

### F3 — Broken "Run strategic scheduler" admin button left behind
- **Severity**: ⚠️ WARNING · **Impact**: 🏃 LOW · **Dimension**: Safety & Quality (Phase-4 cleanup miss)
- **Location**: apps/engine/src/pages/api/admin/run-script.ts:24-26
- **Detail**: ALLOWED_SCRIPTS still whitelisted `scheduler` → deleted `pnpm run scheduler`.
- **Decision**: FIXED — removed the entry. 3f814917

### F4 — Raw error text leaked to client
- **Severity**: ⚠️ WARNING · **Impact**: 🏃 LOW · **Dimension**: Pattern / Safety
- **Location**: apps/engine/src/pages/api/admin/goals.ts:81
- **Detail**: POST catch returned `{ error: String(err) }`.
- **Decision**: FIXED — log via locals.logger, return generic message. 3f814917

### F5 — Hardcoded brand colors violate admin "black & white only"
- **Severity**: ⚠️ WARNING · **Impact**: 🏃 LOW · **Dimension**: Pattern Consistency
- **Location**: apps/engine/src/components/admin/GoalsView.tsx:42-46
- **Detail**: TYPE_COLORS hardcoded blue/green/red chips.
- **Decision**: FIXED — neutral shadcn Badge variant. 3f814917

### F6 — Goals API/page guarded only `locals.auth`, not super-admin
- **Severity**: 🔷 OBSERVATION · **Impact**: 🔎 MEDIUM · **Dimension**: Safety (authz)
- **Location**: apps/engine/src/pages/api/admin/goals.ts:24,39 / goals.astro:5-9
- **Detail**: sibling admin routes require role === "super-admin".
- **Decision**: FIXED — added super-admin gate on both handlers + the page. 3f814917

### F7 — createGoalStep supersede+insert not transactional
- **Severity**: 🔷 OBSERVATION · **Impact**: 🏃 LOW · **Dimension**: Reliability
- **Location**: packages/db/src/goals.ts:94-110
- **Detail**: two statements; insert failure leaves goal with no live step (history safe).
- **Decision**: SKIPPED — low likelihood; revisit in Slice 2 (wrap in db.transaction).

### F8 — Accepted steps could be orphaned on re-plan
- **Severity**: 🔷 OBSERVATION · **Impact**: 🔎 MEDIUM · **Dimension**: Data safety
- **Location**: packages/db/src/goals.ts:64-98
- **Detail**: createGoalStep only superseded `proposed`, not `accepted`.
- **Decision**: FIXED — supersede any live step (proposed OR accepted). 3f814917

### F9 — goal_steps.goalId FK missing onDelete
- **Severity**: 🔷 OBSERVATION · **Impact**: 🏃 LOW · **Dimension**: Pattern / Data
- **Location**: packages/db/src/schema.ts:431
- **Detail**: other child FKs use onDelete: 'cascade'; latent (no delete-goal path today).
- **Decision**: SKIPPED — latent; add cascade if a delete-goal path is introduced.

### F10 — Hardcoded prod DATABASE_URL default
- **Severity**: 🔷 OBSERVATION · **Impact**: 🏃 LOW · **Dimension**: Security
- **Location**: scripts/goal-planner.ts:35-37
- **Detail**: plaintext prod connection string fallback — consistent with existing repo pattern.
- **Decision**: SKIPPED — repo-wide pre-existing convention; out of scope for this change.
