# Feature: bc-check (backward-compatibility check)

**Status: implemented** (2026-07-02)

One shared rendering engine + shared `packages/ui` sections serve every template site, so a
change made for one template can silently regress the others. This feature adds:

1. **`pnpm bc-check [template] [--threshold 0.98]`** (`scripts/bc-check.mts`) — compares the
   prod (`main`) and dev (`develop`) deployment of every template, page by page (navbar
   discovery), section by section (per-`data-section-index` screenshot pixel diff). Prints
   scores, names the differing sections, writes `reports/latest.json`, exits non-zero on
   failure.
2. **`/bc-fix` Claude Code skill** (`.claude/skills/bc-fix/SKILL.md`) — reads the report,
   inspects the failing sections' prod/dev screenshots, traces the cause via
   `git diff main...develop`, and applies a backward-compatible fix (variant/prop guarded,
   old rendering stays the default).

Docs: `README.md` (usage), `CONTEXT.md` (non-obvious facts — read before changing anything),
`TODO.md` (roadmap). Original request: `TASK.md` (note: its `-dev.` URL guess was wrong —
see CONTEXT.md).
