---
project: 'Kaizen Growth'
app: engine
context_type: brownfield
delivery_mode: product-feature
created: 2026-07-21
updated: 2026-07-21
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: tool shape
      decision: evolve the Strategic Scheduler into a north-star goal engine (decompose → single next small step)
    - topic: core insight
      decision: fear-of-success paralysis + business-grounded advice + must-stay-synced + comfort/legality filters
    - topic: persona scope
      decision: single named user — the solo factory operator; no multi-user
    - topic: access control
      decision: no change — reuse existing admin auth
    - topic: cadence
      decision: on-demand only (no cron)
    - topic: accept/resolution routing
      decision: type-aware — human→Resolved button, code→pnpm tasks pipeline, bug→interactive Claude Code; always confirm before run
    - topic: single next step
      decision: exactly one step surfaced (no options list)
    - topic: state freshness
      decision: re-read full current state each request (no since-last-run diff tracking)
    - topic: dialogue discipline
      decision: conversation allowed but must resolve to one committed step
  frs_drafted: 15
  quality_check_status: accepted
---

# Kaizen Growth — Shape Notes

> Seed idea (verbatim from `.tasks.md`):
> A tool to (1) maximize business success (e.g. earn a million) and (2) propose a
> list of small steps to achieve it. User is good at solving small tasks, not at
> achieving large goals — due to fear of success. Lacks a tool that thoroughly
> understands the business — a page factory that renders finished SME websites
> from a single JSON in the database. Several MD files in the repo describe the
> architecture — the tool must be aware of them. There must be a mechanism for
> updating the tool's knowledge: proposed tasks get recorded; code changes get
> noticed, so the next task request accounts for the latest progress. User does
> not know what this tool should be and asks for a suggestion. Context: an AI
> suggested acquiring the first 10 clients via cold calling; the user has
> reservations about calling people and considers it rather illegal.

## Current System

**System purpose (one sentence):** Hazelgrouse Studio runs a single rendering engine
(the "Site Factory") that generates unique SME websites from per-business JSON stored in
PostgreSQL; alongside it, a **Strategic Scheduler** produces daily proactive work
suggestions to move the business forward.

**Key architecture (relevant slice):**
- Turborepo + pnpm monorepo; the only workspace app is `apps/engine` (Astro hybrid renderer + shadcn admin panel).
- `scripts/strategic-scheduler.ts` — daily cron (08:00, system crontab). Calls Anthropic once/day.
- Data layer: `packages/db` (PostgreSQL on Coolify + Drizzle ORM). A `tasks` table and a strategic-suggestions table already exist.
- Admin UI: `/admin/strategy` (`apps/engine/src/components/admin/StrategyView.tsx`) renders the suggestions.

**What the Scheduler does today:**
- Reads `CONTEXT.md`, ADR titles (`docs/adr/`), the last 30 **done** tasks, and existing pending suggestions.
- Prompts Claude to emit exactly **5 flat suggestions** balanced across `tech_debt | feature | marketing | client_acquisition | infrastructure`, each with priority (1–5) and effort (s/m/l/xl).
- Stores them in the DB (`createdBy: claude_scheduler`), idempotent per calendar day, and writes an open-suggestions metric back into `CONTEXT.md`.

**Users today:** one — the factory operator (the user).

**Pain / gap driving this change:** the Scheduler produces *flat, generic* advice (e.g. it
suggested acquiring 10 clients by **cold calling** — uncomfortable and arguably illegal
under EU telemarketing/GDPR rules). It is **blind to the architecture MD files and to actual
code changes**, it does **not** decompose a large goal into small achievable steps, and it
does **not** track progress beyond "recent done tasks."

**Must preserve (guardrail):** the `tasks` table and any other data other features depend on.
**NOT preserved:** the operator has confirmed they do **not** use the current `/admin/strategy`
UI or the flat-5-suggestions Scheduler — these **may be removed or replaced** by the goal
engine. So this is less "evolve in place" and more "replace the strategy surface with a
goal-anchored one," reusing the plumbing (DB, admin panel, Anthropic access) where useful.

## Vision & Problem Statement

*(Delta-framed — what's changing and why.)*

The operator is good at completing small, well-defined tasks but freezes on large goals
("earn a million") due to **fear of success** — the goal is too big to start. The current
Strategic Scheduler makes this worse: it hands over 5 undifferentiated suggestions with no
sense of a north-star, no decomposition, and occasionally advice that is off-business or
uncomfortable/illegal (cold calling). The result is noise, not momentum.

The insight — what the operator knows that a generic AI advisor does not:
1. **Fear-of-success paralysis is the real blocker.** The operator can execute small tasks all day; the tool's core job is to always shrink the next move until it is non-scary and startable.
2. **Generic advice ignores the actual business.** The real leverage of a JSON-driven site factory is producing sites fast and cheaply at scale — not phoning strangers. Advice must be grounded in what this specific machine can do.
3. **Staleness makes it useless.** Advice built on stale state is noise. The tool must notice code changes and task progress so each suggestion reflects the latest reality.
4. **Legality / comfort constraints are hard filters.** Growth moves the operator is unwilling or not legally allowed to do (cold calling) must be excluded, not surfaced.

The change: evolve the flat daily Scheduler into a **goal engine** — the operator sets a
north-star goal; the tool decomposes it into a tree and surfaces the **single next small
step**, grounded in the architecture docs and real code/task progress, and filtered by
comfort/legality constraints.

## User & Persona

**Primary (and only) persona — "The Operator":** the solo founder/developer of Hazelgrouse
Studio (the user). Senior frontend dev, runs the factory largely after-hours and remotely
(VSCode Tunnel / mobile). Reaches for this tool when deciding *what to actually work on next*
to grow the business — especially in moments of overwhelm when the big goal feels
unstartable. Single-user: no multi-user, no roles, no team hand-off (an explicit non-goal
for now).

## Access Control

**No changes planned — current model preserved.** Kaizen Growth lives inside the existing
`/admin` panel, gated by the current admin auth (`apps/engine/src/lib/auth.ts`, `admin_token`
cookie, login page + users table). The goal engine's UI (a new `/admin/*` view) and any API
routes it needs sit behind that same login, exactly like `/admin/strategy` does today. No new
auth mechanism, no new roles, no per-goal privacy boundary (single-operator scope makes it
unnecessary; revisit only if a teammate is added — see Non-Goals).

## Success Criteria

### Primary

- The end-to-end loop works: the operator sets a north-star goal, and the tool surfaces **the single next small step** — grounded in the architecture docs + real code/task progress, filtered for comfort/legality — which the operator can **accept (→ recorded as a task)**, skip, or mark done. Completing a step or landing new code causes the **next** run to re-plan against the updated reality. Success = the operator repeatedly acts on the suggested next step instead of freezing on the big goal.

### Secondary

- **"Why this step" on demand:** each suggested step can expand to show the reasoning that traces it back up the goal tree (north-star → milestone → this step) and to current business/code state. Nice-to-have, not required for the core loop to succeed.

### Guardrails

- **Steps are always small & startable.** The surfaced next step must be shrinkable to something doable in one short sitting — never a scary multi-day blob. This is the anti-fear core; violating it defeats the tool's purpose.
- **Never suggests illegal or personally-off-limits moves.** Cold calling and similar GDPR/telemarketing-risky or uncomfortable actions are filtered out, always.
- **Steps are grounded, not hallucinated.** Every suggested step must trace to real business/code/task state — no invented tasks referencing things that don't exist.

## Functional Requirements

*(Brownfield-tagged: `new` / `modified` / `preserved` / `removed`. Priority defaults to must-have unless noted.)*

### Goal management
- FR-001: Operator can set and edit a single north-star goal (e.g. "10 paying clients", "€1M revenue"). Priority: must-have. Change: new
  > Socrates: Counter considered — "why only one goal, not several?" Resolution: **single north-star** keeps focus; multiple concurrent goals would dilute the single-next-step discipline. Multi-goal is a Non-Goal for now.
- FR-002: Operator can view the goal decomposed as a tree (north-star → milestones → this-week → the next step). Priority: must-have. Change: new
  > Socrates: Stands as written — the tree is the context that makes the single step feel non-arbitrary (supports FR-006).

### Next-step engine
- FR-003: The engine can compute the **single next small step** toward the north-star, grounded in the architecture docs + real code/task state. Priority: must-have. Change: new
  > Socrates: Counter considered — "one step could be wrong; why not show 2–3 options?" Resolution: **keep exactly one.** Optionality is the enemy of the anti-fear core; a wrong step is cheap to skip for the next one.
- FR-004: The engine can filter out illegal / personally-off-limits actions (e.g. cold calling) from suggestions. Priority: must-have. Change: new
  > Socrates: Stands as written (low counter-argument). Open sub-question: who defines "off-limits" — a fixed rule or an operator-editable list? → routed to Open Questions.
- FR-005: The engine can classify each suggested step by execution type — **human** / **code** / **bug** — which determines its resolution path. Priority: must-have. Change: new
  > Socrates: Stands as written. Risk noted: mis-classification routes wrongly — mitigated by FR-012/013's "always confirm before run" (operator sees the type and path before anything executes).
- FR-006: Operator can expand a "why this step" rationale tracing the step up the goal tree to the north-star and to current state. Priority: nice-to-have. Change: new
  > Socrates: Stands as written (nice-to-have; no counter-argument).

### Context & sync
- FR-007: The engine can read the repo's architecture MD files (CLAUDE.md, `docs/adr/*`, etc.) as business context. Priority: must-have. Change: new
  > Socrates: Stands as written — this is the seed's "must be aware of the architecture" requirement; core to grounding.
- FR-008: On each on-demand request, the engine reads the **full current** code + task state fresh (open/done tasks, current repo state) to ground its decomposition. No "since last run" diff tracking. Priority: must-have. Change: new
  > Socrates: Counter considered — "detect changes since last run and narrate the delta." Resolution: **re-read full state each time.** On-demand cadence makes diff tracking unnecessary complexity and git-diff parsing is fragile; freshness beats delta-narration.
- FR-009: The engine can read back task results/progress from the DB to inform the next decomposition. Priority: must-have. Change: new
  > Socrates: Stands as written — this is how the loop stays synced; reuses the existing executor's DB writes.

### Dialogue
- FR-015: Operator can **converse** with the engine about what to do next — surfacing their own thoughts/ideas and having the engine compare them against its recommendation. Every dialogue **must resolve to one committed next step** (it cannot end open-ended). (Open: whether the engine also reads prior Claude Code conversation history as a context source — see Open Questions.) Priority: must-have. Change: new
  > Socrates: Counter considered — "open-ended conversation reintroduces the overthinking/paralysis the tool exists to prevent." Resolution: **dialogue must end in exactly one committed step** — converse freely, but always converge. Preserves the anti-fear discipline.

### Accept & type-aware resolution
- FR-010: Operator can accept a suggested step. Priority: must-have. Change: new
  > Socrates: Stands as written.
- FR-011: For a **human** step, operator can mark it complete via a "Resolved" button (manual completion — e.g. after making a call). Priority: must-have. Change: new
  > Socrates: Stands as written.
- FR-012: For a **code** step, accepting **queues** it; a separate explicit confirmation then triggers the existing `pnpm tasks` pipeline (local Claude Code) to resolve it. Nothing runs on accept alone. Priority: must-have. Change: new
  > Socrates: Counter considered — "auto-run on accept for max momentum." Resolution: **always confirm before it runs.** A mis-classified/ungrounded step must not execute code unbidden; the grounding guardrail stays enforceable.
- FR-013: For a **bug** step, accepting **queues** it; a separate explicit confirmation then launches an interactive local Claude Code session (without `-p`) to resolve it. Nothing runs on accept alone. Priority: must-have. Change: new
  > Socrates: Same as FR-012 — confirm-before-run is the safe default.
- FR-014: Operator can skip or snooze a suggested step. Priority: must-have. Change: new
  > Socrates: Stands as written.

### Removed
- FR-R01: The flat "5 suggestions/day" Strategic Scheduler and the `/admin/strategy` UI are removed/replaced by the goal engine. Change: removed
  > Socrates: Counter considered — "removing it loses the daily prompt habit." Resolution: acceptable — the operator confirmed they don't use it; the on-demand goal engine replaces the habit with a better one.

## User Stories

### US-01: Operator gets and resolves the single next step

- **Given** the operator has set a north-star goal and there is current code/task state in the repo and DB
- **When** they open the goal view and request the next step
- **Then** they see exactly one small, startable, comfort/legal-safe step, tagged with its type (human/code/bug), and can accept it — which routes to the type-appropriate resolution path (Resolved button / `pnpm tasks` / interactive Claude Code)

#### Acceptance Criteria
- The step is small enough to start in one short sitting; never a multi-day blob.
- The step traces to real business/code/task state (no hallucinated references).
- No suggested step is an illegal or off-limits action (no cold calling).
- After resolution, a subsequent request re-plans against the updated state.

## Business Logic

*(Brownfield: this change **adds a new domain rule**.)*

**Rule (one sentence):** From a single north-star goal and the current state of the business
(its docs, code, tasks, and progress), Kaizen Growth selects the **one smallest next action**
that most advances the goal while staying **startable in a single sitting** and **free of
off-limits moves**.

The rule consumes, as user-facing inputs: the operator's **north-star goal**, the operator's
own **thoughts** surfaced through dialogue, and the **current reality of the business** (what
is already built and what work is done vs pending). Its output is **exactly one typed next
action** (human / code / bug) with a short rationale and a resolution path. The operator
encounters it on demand: they open the tool, optionally converse to compare their thinking
with the tool's, receive the single step, accept it (routing to the type-appropriate
resolution, always with a confirm before anything runs), and later return — at which point the
rule re-evaluates against the updated reality. This is not CRUD: the tool *decides* what is
worth doing next, it does not merely store a list.

## Non-Functional Requirements

- **Perceived responsiveness under a slow brain.** Because the reasoning engine (Claude Code) can take seconds to minutes, any operation longer than ~2s shows continuous visible progress; the operator never faces a frozen or silent wait.
- **Grounded output.** Every suggested step references only real, currently-existing business/code/task state — an outside observer can verify each referenced artifact exists. No hallucinated references.
- **Privacy of personal strategy.** The operator's north-star goals, fears, and dialogue never appear on rendered public sites and never leave the authenticated admin session.
- **No unbidden execution.** No suggested step ever runs code on a single accept action — the step's type is shown and an explicit confirmation is required before any `pnpm tasks` run or interactive Claude Code session starts.

## Constraints & Preserved Behavior

- **Existing task executor is a fixed contract.** The `pnpm tasks` runner (`scripts/run-tasks.sh`, plus `tasks:once` / `tasks:tmux` / `tasks:stop`) and the local Claude Code execution mechanism must keep working unchanged. Kaizen Growth **writes tasks in the shape that runner already expects** and integrates with it — it must not fork or rewrite the executor.
- **`tasks` table preserved.** The existing `tasks` table (and any other feature reading it) must not regress; the goal engine reads/writes through it, it does not break its schema for other consumers.
- **Admin auth & panel preserved.** The existing admin login (`lib/auth.ts`, `admin_token`) and the admin panel shell (`AdminForm.tsx`) must keep working; the goal engine is added as a new `/admin/*` view behind the same gate.
- **Safe removal of the strategy surface.** Removing `/admin/strategy` touches: the nav entry in `AdminForm.tsx`, `StrategyView.tsx`, `pages/admin/strategy.astro`, `pages/api/admin/strategy.ts`, the `strategic-scheduler.ts` cron, and the `strategic_suggestions` DB table + its queries. Removal must not break other admin routes or other consumers of those DB queries. (No external consumers found in `apps`/`packages` beyond the strategy surface itself; verify the DB table has no other readers before dropping it.)
- **No data migration of live business JSONs.** This change does not touch the rendering pipeline or per-business JSON data.

## Non-Goals

- **No multiple concurrent north-star goals.** One goal at a time; multi-goal would dilute the single-next-step discipline. (Functional.)
- **No multi-user, team, or roles.** Single-operator only — no sharing, hand-off, or per-user goal privacy. Revisit only if a teammate is ever added. (Functional.)
- **No outbound-to-strangers tactics.** Cold calling and similar are permanently out of the suggestion space — a stated product non-goal, not merely a runtime filter. This is the origin motivation of the whole tool. (Functional / ethical.)
- **No parallel task executor.** Kaizen Growth reuses the existing `pnpm tasks` / local Claude Code loop; it will not build its own execution engine. (Functional.)
- **No changes to the rendering pipeline or per-business JSONs.** The tool advises on growth; it does not touch how sites are rendered or stored. (Scope.)

## Product framing (frontmatter — recorded for /sdd-prd)

- `product_type`: **web-app** — a new view inside the existing Astro admin panel. No change to product surface.
- `target_scale.users`: **small** — single operator. No change.
- `timeline_budget`: **null** — product-feature mode; no hard deadline.

## Open Questions

1. **Who defines "off-limits" actions (FR-004)?** — a fixed rule set (illegal/GDPR-risky) vs an operator-editable avoid-list. Owner: operator. Not blocking; default to a small fixed rule set + operator overrides.
2. **Does the engine read prior Claude Code conversation history as a context source (FR-015)?** — the operator wants to compare their thoughts with the AI's; whether that means live dialogue only, or also ingesting past conversations, is undecided. Owner: operator. Resolve during planning.
3. **Exact integration shape of the Claude Code "brain"** — Claude Code skill/subagent vs headless invocation vs MCP vs Claude UI. Downstream (tech-stack / plan) decision, not a PRD concern.

## Forward: tech-stack

*(Informational — for the downstream stack-selection / planning step; NOT part of the PRD schema.)*

- **Claude Code / Claude UI as the reasoning "brain."** The operator explicitly wants to use Claude Code / the Claude UI as the engine that "knows what to do next" — i.e. the intelligence should come from an agent that already has repo access and can read the architecture docs and code state directly, rather than a blind daily API call with hand-assembled context (as the current `strategic-scheduler.ts` does). This is a load-bearing preference for how the goal engine is built: prefer a Claude-Code-driven / repo-aware agent over a stateless prompt. Exact integration shape (Claude Code skill/subagent, headless invocation, MCP, or Claude UI) is a downstream decision.
- The existing `strategic-scheduler.ts` + `/admin/strategy` can be **removed or repurposed** — the operator does not use them.
- **Cadence: on-demand.** No daily cron — the engine computes the next step when the operator asks (opens the view / hits refresh), always against current state.
- **Existing task-execution loop to reuse (do not rebuild).** The operator already has a working mechanism where a written **task is resolved by local Claude Code, with results written back to the DB** (appears to be the "SITC" local-run mechanism — always runs locally, per-worktree engine). This closes the loop Kaizen Growth needs: the goal engine's job is to **produce the next task** (feeding this executor) and **read back its result / progress from the DB** to inform the next decomposition. The engine should integrate with this existing pipeline rather than build a parallel executor. This is the concrete realization of the seed's "proposed tasks get recorded; code changes get noticed" requirement.


