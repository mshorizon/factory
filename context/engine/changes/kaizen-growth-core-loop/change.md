---
change-id: kaizen-growth-core-loop
app: engine
project: Kaizen Growth
status: implementing
created: 2026-07-21
updated: 2026-07-21
---

# Kaizen Growth — Core single-next-step loop (Slice 1)

First vertical slice of the Kaizen Growth goal engine (see
`context/engine/foundation/kaizen-growth/prd.md`). Delivers the core loop: set one
north-star goal → a local repo-aware planner computes a single grounded, type-classified,
comfort-safe next step into the DB → a new admin Goals tab displays it with accept /
mark-resolved / skip. The old strategy surface is fully removed.

**Deferred to follow-up changes:** type-aware auto-execution (FR-012 / FR-013) — simple code
steps → headless `pnpm tasks` (`claude -p`); harder steps (bugs / complex) → interactive
`claude` *without* `-p`, gated behind explicit confirm; dialogue (FR-015); "why this step"
rationale expansion (FR-006).
