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
