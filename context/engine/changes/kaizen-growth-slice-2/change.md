---
change-id: kaizen-growth-slice-2
app: engine
project: Kaizen Growth
status: implementing
created: 2026-07-21
updated: 2026-07-21
---

# Kaizen Growth — Slice 2: type-aware resolution + rationale

Second slice of the Kaizen Growth goal engine (Slice 1 archived at
`context/engine/archive/2026-07-21-kaizen-growth-core-loop/`). Completes the type-aware
resolution loop on top of Slice 1's data layer, planner, and Goals view:

- **FR-012** — accepted **code** steps enqueue into the existing `pnpm tasks` runner via a
  two-action confirm (Accept → Run now), with a step↔task link and status surfaced in the UI.
- **FR-013** — accepted **bug** steps get a new local command `pnpm goal:resolve` that opens
  interactive `claude` (without `-p`) seeded with the step; operator marks Resolved in the UI.
- **FR-006** — expandable "why this step" (north-star → milestone → step + rationale),
  assembled client-side from existing fields.
- Safety edge — `pnpm goal:next` refuses to propose while the current step's task is in-flight.

**Deferred to Slice 3:** FR-015 dialogue (compare-my-thoughts) — its local-only-brain
interactive design is a distinct chunk.
