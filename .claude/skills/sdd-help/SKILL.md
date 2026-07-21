---
name: sdd-help
description: >
  Explain the Spec-Driven Development (SDD) workflow in this repo — what the
  sdd-* skills do, in what order, and what artifacts they produce. Read-only:
  never writes or edits files. With NO argument it explains how to start a new
  flow from scratch using all the sdd-* skills. With a skill/topic argument it
  answers that targeted question. With a project name it reports where that
  project stands and the single next command. Use when the user asks "how does
  SDD work", "what is sdd", "how do I start", "which sdd skill do I run",
  "explain the sdd skills", "sdd help", "where am I in the chain", "jak działa
  sdd", "od czego zacząć", or is unsure how shape → prd → roadmap fit together.
  This is the map and entry point for the SDD skill family — start here when in
  doubt.
---

# /sdd-help — How the Spec-Driven Development Workflow Works

This skill is the **map** for the `sdd-*` skill family. It explains the approach and shows the pipeline. How it responds depends on the argument:

- **No argument** → a **getting-started walkthrough**: how to start a brand-new SDD flow using all the `sdd-*` skills, in order. It does **not** probe what's already in progress.
- **A skill or topic** (`/sdd-help shape`, `/sdd-help prd`) → a targeted answer about that one thing.
- **A project name** (`/sdd-help brickworks-personalisations`) or a status request → a "you are here" report for that project plus the single next command.

It is **read-only**: it never creates, edits, or moves files. For scaffolding, shaping, or generating, it points at the skill that owns that step; it never does that work itself.

## What SDD is

Spec-Driven Development turns an idea into shipped code through a chain of small, single-purpose skills. Each skill consumes the previous one's artifact and produces the next, so the specification is built up incrementally and reviewed by a human at every handoff — rather than jumping straight from a vague idea to code.

Five principles run through every skill in the family; internalize them before explaining any individual step:

1. **Facilitate or generate — never invent.** `/sdd-shape` facilitates a discovery conversation and writes down only what the user said. `/sdd-prd` and `/sdd-roadmap` generate documents strictly from their input. None of them invents domain decisions, business rules, success criteria, or requirements. Anything missing becomes an explicit `# TODO` routed to an `## Open Questions` section, not a guessed value.
2. **The schema is the contract.** `shape-notes.md`, `prd.md`, and `roadmap.md` all conform to a locked schema (`sdd-shape/references/prd-schema.md` for the first two). Section names and frontmatter keys are load-bearing; downstream skills grep for them. Drift between a skill and the schema is the failure mode the family is built to prevent.
3. **Gaps surface, they don't hide.** Thin input produces a document full of named TODOs and Open Questions, not a hollow document that looks complete. Every skill warns (a soft gate) when its input is too thin, but lets the user override with eyes open.
4. **Never chain automatically.** Each skill ends by *announcing* the next command (and copying it to the clipboard), never by invoking it. The human reviews each artifact before moving on.
5. **Product-level, stack-open.** The PRD describes *what* the product is and *who* it's for — never *how* it's built. Frameworks, databases, file paths, and deployment targets are deliberately kept out of `shape-notes.md` and `prd.md`; they belong to downstream stack-selection / planning steps.

### Repo profile

The shaping/PRD skills apply two defaults, auto-adapted per repo:

- **Brownfield when the repo already exists.** `/sdd-shape` and `/sdd-prd` auto-detect brownfield mode from project markers (git history, lockfiles) — "what exists, what's changing, what must be preserved" — and use the 11-section brownfield PRD template. A fresh/empty repo shapes as greenfield instead.
- **Product-feature delivery mode by default.** Features are specified by product/design and built end-to-end. The MVP-scoping and personal-timeline questions are skipped, and Success Criteria describe the full feature. A user can override back to MVP framing by explicitly saying "MVP" / "smallest slice" / "prototype".

## The pipeline

```
            ┌─────────────┐
            │  /sdd-init  │  scaffold context/ + root README (workspace-first; per-app folders lazy)
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │ /sdd-shape  │  idea ──▶ shape-notes.md   (facilitated discovery, 6 phases + quality gate)
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │  /sdd-prd   │  shape-notes.md ──▶ prd.md  (schema-conformant PRD generator)
            └──────┬──────┘
                   │
       (stack step — installed: /sdd-tech-stack-selector [greenfield]
        · /sdd-stack-assess → /sdd-health-check [brownfield])
                   │
            ┌──────▼──────┐
            │/sdd-roadmap │  prd.md ──▶ roadmap.md      (vertical slices in dependency order)
            └──────┬──────┘
                   │  (pick a slice's Change ID)
       (optional per-change prep, all before /sdd-plan: /sdd-new opens the
        change folder · /sdd-frame challenges the *what* · /sdd-research maps the code)
                   │
            ┌──────▼──────┐
            │  /sdd-plan  │  change-id ──▶ context/<app>/changes/<change-id>/plan.md + plan-brief.md
            └──────┬──────┘
                   │
            ┌──────▼─────────┐
            │ /sdd-implement │  plan.md ──▶ code + commits, phase by phase (flips ## Progress)
            └──────┬─────────┘
                   │
            ┌──────▼─────────┐
            │/sdd-impl-review│  (optional) plan vs. actual ──▶ drift / safety / pattern findings
            └──────┬─────────┘
                   │
            ┌──────▼──────┐
            │ /sdd-archive │  closeout — git-mv the change to context/<app>/archive/, close its roadmap item
            └─────────────┘
```

When the repo uses a workspace/monorepo layout, every artifact lives under a **workspace** folder — `context/<app>/…`, where `<app>` is the resolved workspace directory's name. `/sdd-shape` resolves the app once (cwd auto-detect or asks) and stamps `app:` into the frontmatter; downstream skills inherit it from the path. Repos with no workspace layout use a flat `context/…` instead. See "Where the artifacts live" below.

**Installed in this repo (24):** the full family. The core spine (`sdd-init → sdd-shape → sdd-prd → sdd-roadmap → sdd-plan → sdd-implement → sdd-archive`); the stack steps between PRD and roadmap (`sdd-tech-stack-selector` for greenfield, `sdd-stack-assess` + `sdd-health-check` for brownfield); the per-change prep helpers (`sdd-new`, `sdd-frame`, `sdd-research`) that feed `/sdd-plan`; the plan-quality gate `sdd-plan-review`; three execution variants of `/sdd-implement` (`sdd-tdd` test-first, `sdd-e2e` browser-level, `sdd-goal-implement` unattended); the review steps (`sdd-impl-review` locally, `sdd-impl-review-ci` in CI); the phased test-rollout orchestrator `sdd-test-plan`; `sdd-lesson` to bank a recurring rule; `sdd-help` itself (this map); and `sdd-map`, which renders a project's roadmap as a Mermaid dependency graph (the visual companion to `sdd-help`); and `sdd-archive-project`, the project-level sibling of `sdd-archive` that closes out a whole `foundation/<slug>` project once its changes are all archived.

**Handling uninstalled hand-offs.** A skill may occasionally name a `/sdd-*` command that isn't installed in a given project. When a hand-off names a command that isn't available, say so plainly — the conceptual step still exists in the method, the slash command just isn't in this project. Do not pretend an uninstalled command will run. (`/sdd-plan` runs even without a `/sdd-frame` or `/sdd-research` doc — those upstream artifacts just reduce how many questions it asks.)

## The installed skills

| Skill          | Consumes                       | Produces                                  | Use it when                                                | Skip it when                                                            |
| -------------- | ------------------------------ | ----------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `/sdd-init`    | nothing                        | `context/` + root README (per-app folders created lazily) | You want the `/context` skeleton set up up-front           | Already scaffolded (it's idempotent — re-running is a no-op)            |
| `/sdd-shape`   | an idea / rough notes          | `context/<app>/foundation/<slug>/shape-notes.md` | Starting a project or shaping a meaningful change to one   | A single bug/refactor too small for a PRD; you already have a PRD       |
| `/sdd-prd`     | `shape-notes.md` (or raw notes) | `context/<app>/foundation/<slug>/prd.md`         | Shaping notes are ready and you want a PRD on disk         | Still ideating (run `/sdd-shape`); you want hand-edits to an existing PRD |
| `/sdd-tech-stack-selector` | `prd.md` (greenfield) | `context/foundation/tech-stack.md` (starter hand-off) | Greenfield: the PRD is written and you need to pick a starter/stack | Brownfield (use `/sdd-stack-assess`); no PRD yet |
| `/sdd-stack-assess` | `prd.md` (brownfield) + existing code | `context/foundation/stack-assessment.md` | Brownfield: score an existing stack against the 4 agent-friendly gates before the roadmap | Greenfield (use `/sdd-tech-stack-selector`) |
| `/sdd-health-check` | an existing project | `context/foundation/health-check.md` | Brownfield: audit deps/security/tests/CI after the stack assessment | Greenfield (use `/sdd-tech-stack-selector`) |
| `/sdd-roadmap` | `prd.md`                       | `context/<app>/foundation/<slug>/roadmap.md` (sibling of prd.md) | The PRD is populated and you want to know what to build first | The PRD is hollow (firm it up first); you want to plan a *single* change |
| `/sdd-map`     | a project's `roadmap.md`       | `roadmap-map.md` — a Mermaid dependency graph beside the roadmap (opened in your editor) | You want to *see* the roadmap's slices, dependencies and status at a glance (the visual `/sdd-help`) | No roadmap yet (run `/sdd-roadmap`); you only want the next command in prose (`/sdd-help`) |
| `/sdd-test-plan` | `prd.md` + `roadmap.md` (brownfield) | `context/foundation/test-plan.md`; drives new→research→plan→implement per phase | You want a phased test-rollout strategy for an existing product | Greenfield; a single change (use `/sdd-plan`) |
| `/sdd-new`     | a new `<change-id>`            | `context/<app>/changes/<change-id>/change.md` (folder + identity file) | You want to open a change folder up-front — e.g. a change not traced to a roadmap slice | You're planning a roadmap slice — `/sdd-plan` creates the folder for you |
| `/sdd-frame`   | a "bug + proposed fix", scope question, or design choice | `context/<app>/changes/<change-id>/frame.md` | The *what* is in doubt (right fix? right scope?) — run BEFORE `/sdd-plan` | The what is settled and you only need the *how* |
| `/sdd-research` | a `<change-id>` + the questions to answer | `context/<app>/changes/<change-id>/research.md` | A non-trivial change needs a thorough codebase map before planning | The change is small or you already know the code area |
| `/sdd-plan`    | a roadmap slice's Change ID (+ optional `frame.md` / `research.md`) | `context/<app>/changes/<change-id>/plan.md` + `plan-brief.md` | You've picked one slice to build and want a detailed, phased implementation plan | You're still sequencing the whole project (use `/sdd-roadmap`); the change is trivial enough to just do |
| `/sdd-plan-review` | a `plan.md` | interactive findings (substance / feasibility / architectural fitness) | After `/sdd-plan`, before `/sdd-implement` — validate the plan will actually work | Trivial plans you'll eyeball yourself |
| `/sdd-implement` | `context/<app>/changes/<change-id>/plan.md` (a reviewed plan) | code changes + per-phase commits; flips the plan's `## Progress` checkboxes; updates `change.md` status | A plan exists and you're ready to build it phase by phase with verification gates | No plan yet (run `/sdd-plan`); the plan still needs review/edits |
| `/sdd-tdd` | a reviewed `plan.md` (TDD'able phases) | code + per-phase commits, red→green→refactor | You want to drive testable phases test-first | Phases that don't suit TDD (it routes those to `/sdd-implement`) |
| `/sdd-e2e` | a reviewed `plan.md` (browser-level phases) + the running app | Playwright/E2E tests, one risk at a time | Driving plan phases that genuinely need a browser, feature already built | Non-browser phases (routes to `/sdd-tdd` / `/sdd-implement`) |
| `/sdd-goal-implement` | a reviewed `plan.md` | code + per-phase commits, unattended (under `/goal`) | You want autonomous/headless plan execution with no human interaction | Interactive, gated builds (use `/sdd-implement`) |
| `/sdd-impl-review` | a completed plan (or a single `phase N`) | `context/<app>/changes/<change-id>/reviews/impl-review.md` + interactive triage | After a phase or the full plan — catch drift, unsafe decisions, pattern violations before archiving | Trivial changes you'll eyeball yourself |
| `/sdd-impl-review-ci` | a PR + its plan | `reviews/impl-review.md` committed to the PR branch + a summary comment | Non-interactive review in CI / GitHub Actions against a PR | Local interactive review (use `/sdd-impl-review`) |
| `/sdd-lesson`  | a recurring rule / pitfall you spotted | appends to `context/<app>/foundation/lessons.md` | You hit a *class* of bug or design pitfall worth enforcing in future reviews & plans | A one-off mistake with no recurring pattern |
| `/sdd-archive` | a completed change's `<change-id>` | git-moves the change to `context/<app>/archive/<date>-<change-id>/`, stamps `change.md` archived, closes its roadmap item | The change is implemented and you want to close it out and free up `changes/` | Still implementing; uncommitted edits in the change folder (it hard-blocks) |
| `/sdd-archive-project` | a completed project's `<project-slug>` | git-moves `foundation/<slug>/` to `context/<app>/foundation/archive/<date>-<slug>/`, stamps `roadmap.md` archived | Every slice is archived and the whole project is done | Any change still in flight (it hard-blocks to avoid orphans); a single change (use `/sdd-archive`) |

## Where the artifacts live

Everything is partitioned by **application** first (`context/<app>/…`). Within an app, shape/PRD/roadmap outputs are grouped **per project** in a slug-named foundation subfolder (the roadmap sits beside its PRD); each planned slice gets a **per-change** folder under that app's `changes/`:

```
context/
├── README.md                          # explains the workspace-first layout
└── <app>/                             # = resolved workspace dir name (e.g. assets, campaigns)
    ├── foundation/
    │   └── <project-slug>/
    │       ├── shape-notes.md        # /sdd-shape
    │       ├── prd.md                # /sdd-prd
    │       ├── prd-vN.md             # versioned PRD saves (collision resolution)
    │       └── roadmap.md            # /sdd-roadmap (sibling of prd.md, per project)
    ├── changes/                       # in-flight per-change folders
    │   └── <change-id>/
    │       ├── change.md             # /sdd-plan creates it; /sdd-implement advances its status
    │       ├── plan.md               # /sdd-plan writes it; /sdd-implement flips its ## Progress
    │       └── plan-brief.md         # /sdd-plan (the two-pager to read first)
    └── archive/                       # completed changes (moved here by /sdd-archive)
```

`<app>` is the resolved workspace directory's name (omitted in repos with no workspace layout); every artifact also records it as an `app:` frontmatter field. A `change-id` is the kebab-case identifier from a roadmap slice's `Change ID` column (e.g. `first-gated-generation`).

The project slug is derived from the project name: lowercase, each run of non-alphanumeric characters → one hyphen, trimmed. It is fixed once the subfolder is created. (Repos with no workspace layout drop the `<app>/` layer and use `context/{foundation,changes,archive}/` directly.)

## Process

First, classify the argument (if any):

- **No argument** → run **Branch A** (getting-started walkthrough). Do **not** probe what's in progress.
- **Argument is a skill name or topic** (`init`, `shape`, `prd`, `roadmap`, `plan`, `implement`, or a question like "difference between shape and prd") → run **Branch B** (targeted answer).
- **Argument is a project slug** (e.g. `brickworks-personalisations`) **or a status/"where am I" request** → run **Branch C** (state probe).

When the argument is ambiguous, prefer Branch B for a single word that matches a skill name, otherwise Branch C. Run exactly one branch.

### Branch A — No argument: how to start a new flow

The user wants to know how to begin. Do **not** read `context/` or report in-progress projects. Explain the path from idea to implemented code using the installed `sdd-*` skills, in order, with the concrete command and the artifact each step produces. Keep it to the sequence below; lead with the one command they should run first.

1. **(One-time) `/sdd-init`** — scaffolds `context/` + a root README documenting the workspace-first layout. Per-app folders are created lazily by the entry skills. It's idempotent, so it's safe to run but a no-op once the root exists. In a repo that's already initialized, mention this exists but tell them they can skip straight to shaping.
2. **`/sdd-shape "<your idea>"` — start here.** A facilitated discovery conversation (6 phases + a quality gate). It first resolves the **app** (auto-detects from cwd if you're inside a workspace dir, otherwise asks which one; skipped in repos with no workspace layout), then writes `context/<app>/foundation/<slug>/shape-notes.md`. Pass the idea inline or as a file path (`/sdd-shape @notes.md`). Repo profile: **brownfield (auto-detected) + product-feature** by default (describe what's changing in the existing system; no MVP scoping) unless they say "MVP".
3. **`/sdd-prd`** — turns the shape-notes into a schema-conformant `prd.md` in the same project subfolder (inheriting the app from the path). Run it after shaping; it warns if the notes are too thin.
4. **Stack step** — between PRD and roadmap. Brownfield: `/sdd-stack-assess` scores the existing stack against the four agent-friendly quality gates, then `/sdd-health-check` audits deps/security/tests/CI. Greenfield: `/sdd-tech-stack-selector` picks a starter from the PRD. All three stack skills are installed.
5. **`/sdd-roadmap`** — decomposes the PRD into vertical, dependency-ordered slices and writes `context/<app>/foundation/<slug>/roadmap.md` (beside the PRD), with a `## Backlog Handoff` table that assigns each slice a kebab-case `Change ID`.
6. **`/sdd-plan <change-id>`** — pick one `ready` slice from the roadmap and plan it. It researches the codebase, asks complexity-scaled questions, and writes `context/<app>/changes/<change-id>/plan.md` + `plan-brief.md` (creating the change folder + `change.md`). Run it once per slice. *(Optional prep, all before this step: `/sdd-new` opens a change folder that isn't tied to a roadmap slice; `/sdd-frame` challenges the *what* when a fix or scope is in doubt; `/sdd-research` writes a `research.md` codebase map for a non-trivial change. `/sdd-plan` runs fine without them — they just reduce the questions it asks.)*
7. **`/sdd-implement <change-id> phase 1`** — builds the plan one phase at a time: implements the changes, runs the success-criteria checks, flips the plan's `## Progress` checkboxes, and commits per phase with a manual-verification gate between phases. Re-invoke per phase (it copies the next-phase command to the clipboard).
8. **`/sdd-impl-review <change-id>` (optional, recommended)** — after a phase or once all phases are done, review the implementation against the plan for drift, unsafe decisions, and pattern violations; it writes `reviews/impl-review.md` and walks you through triage. The "Record as lesson" triage choice hands off to `/sdd-lesson`, which appends the rule to `context/<app>/foundation/lessons.md`.
9. **`/sdd-archive <change-id>`** — closeout: once the plan's phases are all done, it git-moves the change to `context/<app>/archive/<date>-<change-id>/`, stamps `change.md` as archived, and closes the matching roadmap item (flips its status to `done`, adds a `## Done` entry). It hard-blocks only on uncommitted edits inside the change folder.

Present this as a numbered walkthrough (the table and pipeline above are the reference), then close with the single first action and a pointer to status:

```
► Start here: /sdd-shape "<one-line description of what you want to build or change>"
  (Run /sdd-init first only if context/ doesn't exist yet — it's idempotent.
   /sdd-shape will ask which app this belongs to, or detect it from your cwd.)

  Already mid-flight on something? Run /sdd-help <project-slug> to see where it stands.
```

Then stop. Do not run any of the commands for the user.

### Branch B — Argument is a skill or topic

`/sdd-help shape`, `/sdd-help prd`, `/sdd-help "what's the difference between shape and prd"`, etc. — answer just that, drawn from the table and pipeline above plus, if useful, a quick read of that skill's own `SKILL.md` in `.claude/skills/sdd-<name>/`. Do not run the state probe; the user asked a targeted question, give a targeted answer. Then stop.

### Branch C — Argument is a project, or a status request: orient the user ("you are here")

Probe the project's current SDD state (read-only) and report where each project sits, then recommend exactly one next command. Run these checks:

The argument may be a **project slug**, an **app name**, or a status request — the probes scan across all apps, so any of them resolves.

```bash
# Is the skeleton scaffolded?
test -d context && echo "init: done" || echo "init: missing"

# Which projects (across all apps) have been shaped / have a PRD / have a roadmap?
ls -1 context/*/foundation/*/shape-notes.md 2>/dev/null
ls -1 context/*/foundation/*/prd.md 2>/dev/null
ls -1 context/*/foundation/*/roadmap.md 2>/dev/null

# Which changes exist, in which app?
ls -d context/*/changes/*/ 2>/dev/null
```

Each artifact's path is `context/<app>/foundation/<project-slug>/…` or `context/<app>/changes/<change-id>/…`, so the `<app>` and project/change are read straight off the path. For each project found, determine its stage from which artifacts exist. Where a `shape-notes.md` exists, you may read its frontmatter `checkpoint:` block to report the phase and quality-check status; where a `prd.md` exists, read its frontmatter `status` and count `## Open Questions` / `# TODO` entries to gauge readiness. Keep reads light — this skill orients, it doesn't audit.

Then print a state report and a single recommended next move (mirroring the family's "one recommendation, not a menu" posture):

```
═══════════════════════════════════════════════════════════
  SDD STATUS
═══════════════════════════════════════════════════════════

  Skeleton (/sdd-init):   [done | missing]

  Projects (app / project):
    <app>/<project-slug>:  shaped: [yes/phase] | PRD: [yes/status] | roadmap: [yes/no]
    ...

  ► Next move: <one command> — <one-line reason>
═══════════════════════════════════════════════════════════
```

Recommendation logic (first match wins, per project the user is asking about — or the most recently touched one if unspecified). `<app>` is read from the artifact's path:

1. `context/` missing → recommend `/sdd-init`.
2. No `shape-notes.md` for the project → recommend `/sdd-shape` (it resolves the app).
3. `shape-notes.md` present, no `prd.md` → recommend `/sdd-prd`.
4. `prd.md` present, no `context/<app>/foundation/<slug>/roadmap.md` → recommend the stack step first: brownfield → `/sdd-stack-assess` (then `/sdd-health-check`); greenfield → `/sdd-tech-stack-selector`. Once the stack step is done — or if the user chooses to skip it — recommend `/sdd-roadmap`.
5. `roadmap.md` present, but no planned change covers a `ready` slice → recommend `/sdd-plan <change-id>`, naming a `ready` slice's `Change ID` from the roadmap's `## Backlog Handoff` table (prefer the north-star slice, else the highest fan-out `ready` one). To check what's already planned, look at `context/<app>/changes/*/` for existing `plan.md` files and cross-reference their `change.md` against the roadmap.
6. A plan exists for the slice (`context/<app>/changes/<change-id>/plan.md`) with `## Progress` rows still unchecked → recommend `/sdd-implement <change-id> phase 1` (or the next unchecked phase). Read the plan's `## Progress` section to find the first `- [ ]` and name the phase it sits under.
7. The plan's `## Progress` is fully `- [x]` (every phase done) but no `context/<app>/changes/<change-id>/reviews/impl-review*.md` exists yet → recommend `/sdd-impl-review <change-id>` to check the implementation against the plan before closing out. (Optional but recommended — `/sdd-archive` only *warns* if it's skipped, it doesn't block.)
8. The plan's `## Progress` is fully `- [x]` and the change folder is committed → recommend `/sdd-archive <change-id>` to close it out (moves it to `context/<app>/archive/` and closes its roadmap item). If the change folder has uncommitted edits, say so — `/sdd-archive` hard-blocks until they're committed.

If multiple projects are mid-flight, list each with its stage and recommend the next move for the one the user names (or, if they don't name one, the furthest-along project, and mention the others briefly).

Always stop after reporting. This skill never runs the recommended command for the user.

## Guardrails

1. **Read-only.** `/sdd-help` never writes, edits, moves, or deletes a file. If the user wants to *do* a step, point at the owning skill and stop. Probes are `test`/`ls`/`Read` only.
2. **Be honest about what's installed.** All 24 commands in the family are available here: `sdd-init`, `sdd-shape`, `sdd-prd`, `sdd-tech-stack-selector`, `sdd-stack-assess`, `sdd-health-check`, `sdd-roadmap`, `sdd-map`, `sdd-test-plan`, `sdd-new`, `sdd-frame`, `sdd-research`, `sdd-plan`, `sdd-plan-review`, `sdd-implement`, `sdd-tdd`, `sdd-e2e`, `sdd-goal-implement`, `sdd-impl-review`, `sdd-impl-review-ci`, `sdd-lesson`, `sdd-archive`, `sdd-archive-project`, and `sdd-help`. If the workflow's natural next step is ever a `/sdd-*` command that isn't installed in a given project, name it as part of the method but state clearly that it isn't installed — never imply it will run.
3. **One recommendation, not a menu.** Like `/sdd-roadmap`'s hand-off, end with a single "next move" and a one-line reason, not a list the user has to triage. They can ask for alternatives.
4. **Don't re-derive the schema.** This skill explains; it doesn't re-document the PRD schema. For schema detail, point at `sdd-shape/references/prd-schema.md`.
5. **Mirror the user's language.** If the user asks in Polish, answer in Polish (translate section names: `Open Questions` → `Otwarte pytania`, etc.), matching the family's language convention.

## Notes

- This is a **help / orientation** skill. Its output is an explanation and a recommendation — never an artifact on disk.
- The single source of truth for the PRD/shape-notes shape is `sdd-shape/references/prd-schema.md`. If anything here contradicts that file, the schema wins and this skill should be corrected.
- If the family grows (the planning/execution tail gets installed, or new `sdd-*` skills are added), update the pipeline diagram and the installed-skills table here so the map stays accurate.
