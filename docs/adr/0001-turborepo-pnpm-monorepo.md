# ADR-0001: Turborepo + pnpm Workspaces as Monorepo Tooling

**Status:** accepted  
**Date:** 2026-04-01

## Context
The factory consists of multiple interdependent packages: a rendering engine, a shared UI library, a schema package, a database layer, and shared configs. All packages must share types, configs, and be buildable in a single command. A monorepo approach was needed.

## Decision
Use **pnpm workspaces** for dependency management and **Turborepo** for task orchestration.

- `pnpm-workspace.yaml` declares all workspace packages
- `turbo.json` defines task pipeline (`build`, `dev`, `type-check`, `test:visual`, `test:validate`) with dependency order and caching
- `workspace:*` protocol for internal dependencies
- Single `pnpm-lock.yaml` ensures version consistency across all packages

## Consequences
**Positive:**
- Parallel builds with incremental caching (Turborepo skips unchanged packages)
- Single install step for entire monorepo
- Internal packages import with `@mshorizon/*` aliases — no publishing needed
- Consistent tooling via `packages/config` shared configs

**Negative:**
- pnpm learning curve vs npm/yarn
- Turborepo config must be updated when adding new tasks
- Cold cache (first build / CI) is slower than single-package builds

## Alternatives considered
- **Nx** — more features but heavier; better for large teams with complex dependency graphs. Overkill for this project.
- **Lerna + yarn workspaces** — legacy tooling, slower, less cache-aware
- **Multiple repos** — simpler per-package but breaks type sharing and atomic commits across engine + UI
