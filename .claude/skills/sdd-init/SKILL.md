---
name: sdd-init
description: Initialize the /context directory in this project — scaffold context/ plus a root README that documents the SDD artifact layout (workspace-partitioned in monorepos, flat otherwise). Per-workspace foundation/changes/archive folders are created lazily by the entry skills.
---

# /sdd-init — Initialize /context Directory

Scaffold the `/context` directory and its root `README.md`, which documents the artifact layout the `/sdd-*` skills follow. Idempotent: both the directory and the README are independently create-if-absent; re-running on an initialized project is a no-op.

Per-application folders (`context/<app>/{foundation,changes,archive}/`) are **not** created here — they are created lazily the first time `/sdd-shape` (or `/sdd-plan`) writes an artifact for a given app. `/sdd-init` only lays down the root so the conventions have a home and a place to be documented.

This skill is the explicit entry point for users who want to scaffold the workflow conventions up-front. It is NOT a precondition for the other skills — they self-bootstrap their own per-app folders on demand.

## Process

### Step 1: Scaffold `context/`

If the directory exists, leave it untouched and note `present`. Otherwise create it with `mkdir -p` and note `created`.

### Step 2: Scaffold `context/README.md`

If `context/README.md` exists, leave it untouched and note `present`. Otherwise write it with this canonical content (embedded inline — no separate template file):

```
# Context — Spec-Driven Development artifacts

Artifacts produced by the `/sdd-*` skills live here. When this repo uses a
workspace/monorepo layout, artifacts are partitioned by workspace ("app") first;
otherwise they use a flat layout (see the note at the bottom):

    context/
    └── <app>/                  # one per workspace dir (e.g. packages/apps/<app>, apps/<app>)
        ├── foundation/         # cross-change living docs for this app
        │   └── <project-slug>/ # shape-notes.md, prd.md, roadmap.md per project/feature
        ├── changes/            # in-flight changes (<change-id>/: change.md, plan.md, …)
        └── archive/            # completed changes, moved here on archive

`<app>` is the workspace's directory name — resolved from the repo's layout (a
`packages/apps/*` or `apps/*` dir, or a `workspaces` / `pnpm-workspace.yaml` glob). It is
resolved once by `/sdd-shape` (or `/sdd-plan` for a standalone change) — auto-detected from
cwd when a skill is invoked inside a workspace dir, otherwise you are asked — and then
recorded as the `app:` frontmatter field on every artifact. Per-app folders are created
lazily the first time an artifact is written for that app.

## The three kinds

- **foundation/** — cross-change living documents (product requirements, roadmap,
  tech-stack, glossary, lessons). Edit-in-place; when a doc is fully superseded, move it to
  `foundation/archive/YYYY-MM-DD-<doc>.md`. Shape/PRD/roadmap outputs are grouped per
  project/feature in a `<project-slug>/` subfolder.
- **changes/** — in-flight changes, one folder per change at `changes/<change-id>/`,
  identified by a `change.md` identity file. Holds research, frame, plan, reviews. Created
  via `/sdd-plan` (or `/sdd-new`).
- **archive/** — completed changes, moved here from `changes/` when archived. Read-only by
  convention; skills refuse to write here.

Repos with no workspace layout (single-package or greenfield) omit the `<app>/` layer and
use `context/{foundation,changes,archive}/` directly.
```

### Step 3: Print summary

Print a two-line status block:

```
context/             [created|present]
context/README.md    [created|present]
```

Then a one-paragraph guide on the layout and where to look next:

- Artifacts are partitioned by workspace: `context/<app>/{foundation,changes,archive}/`, where `<app>` is a workspace directory name (e.g. `packages/apps/assets`); repos with no workspace layout use a flat `context/{foundation,changes,archive}/`.
- Run `/sdd-shape` to start a new project/feature — it resolves the app (cwd auto-detect or asks), then creates `context/<app>/foundation/<project-slug>/` lazily and shapes into it.
- `/sdd-plan` creates `context/<app>/changes/<change-id>/` for a single change; archiving moves a completed change to `context/<app>/archive/`.

Stop. Do not chain into `/sdd-shape` or any other skill; the user runs those when they have something to do.

## Notes

- **Idempotent.** Re-running `/sdd-init` on an initialized project is a no-op (with a status print). It must never overwrite existing content.
- **Per-app folders are lazy.** `/sdd-init` does not pre-create `context/<app>/…`. The entry skills create the app subfolder (and its `foundation/` / `changes/` / `archive/` children) the first time they write into it.
- **Repos with no workspace layout** (single-package or greenfield) omit the `<app>/` layer and use `context/{foundation,changes,archive}/` directly; the entry skills create those top-level folders lazily in that case.
- **`lessons.md` and other foundation docs are not scaffolded here.** Those files are owned end-to-end by the skills that read and write them (e.g. `/sdd-lesson`, `/sdd-impl-review`'s triage branches), which self-bootstrap them under `context/<app>/foundation/` on first use.
