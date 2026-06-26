# SITC — Deploy & Operate (Step 7 scaffolding)

How to run the Self-Improving Template Creator on the VPS. This is **operator-driven
scaffolding**: a live run spawns an autonomous `claude -p` Edit/Write loop and (for
the run DB) real `CREATE/DROP DATABASE`, so every such action is gated behind an
explicit flag. Nothing here runs automatically.

## Components
| Piece | What | Where |
| :-- | :-- | :-- |
| `scripts/sitc-runner.mts` | Per-run consumer: target ingestion → lockTiers → sweep → gates → delivery (`runFull`). | VPS |
| `scripts/sitc-run-db.mts` | Run-scoped DB lifecycle: `provision` / `seed` / `teardown` / `gc`. | VPS |
| `ecosystem.sitc.config.cjs` | PM2: `sitc-gc` (safe cron daemon) + `sitc-orchestrator` (disabled by default). | VPS |
| `apps/engine` (dev, port 4321) | Renders sections from worktree working files (harness fs mode). | VPS (PM2 `astro-dev`) |

## Prerequisites
- `DATABASE_URL` / `ADMIN_DATABASE_URL` → the Postgres control DB (the `sitc_*` tables are already pushed).
- The engine running with harness filesystem mode: it's auto-on in `astro dev`; for a prod build set `SITC_HARNESS_FS=1`.
- `claude` CLI authenticated on the host (the worker uses `claude -p`, **not** the API).
- A target URL and a starting template under `templates/<name>/`.

## 1. Create a run (admin UI or DB)
Use `/admin/template-creator`, or insert a `sitc_runs` row (`templateName`, `targetUrl`, `budgetIterations`).
Note the run id.

## 2. Provision + seed the run DB (real prod DDL — gated)
```bash
# dry-run first (prints what it would do, touches nothing)
pnpm sitc:run-db provision --run <id>
pnpm sitc:run-db provision --run <id> --yes          # executes CREATE DATABASE
pnpm sitc:run-db seed --run <id> --template <name> --yes
```
Seeding validates the profile against the schema before writing.

## 3. Plan-only dry run (safe — no edits)
```bash
DATABASE_URL=… SITC_ENGINE_URL=http://localhost:4321 \
  pnpm tsx scripts/sitc-runner.mts --run <id> --owner vps
```
Captures + segments the target, builds the band↔section alignment, and prints the
PLAN (which sections it would evolve toward which target crop). **No worktree edits,
no model authoring, no merge.** Use this to sanity-check ingestion + alignment.

## 4. Live autonomous run (governance gate)
⚠️ This spawns headless `claude -p` with Edit/Write per section — an autonomous agent
loop. Run it deliberately, watch the logs, and keep the run on its own `sitc/run-<id>`
branch (the runner creates it; delivery only merges to `develop` on a clean auto-merge
decision per §13.4).
```bash
SITC_ENABLE_WORKER=1 DATABASE_URL=… SITC_ENGINE_URL=http://localhost:4321 \
  pnpm tsx scripts/sitc-runner.mts --run <id> --owner vps
```
Pause/abort from the admin UI (commands are polled between sweep rounds); the single-
owner lease prevents a second runner from racing the same run.

**Delivery landing (I4).** On a clean, converged, gate-passing `tune-json`/`extend-variant`
run the runner now lands the branch automatically (no manual cherry-pick):
- default: local no-ff merge into `develop` — accumulates on the VPS so the **next run
  seeds from the improved template** (CONCLUSIONS #7). A dirty/conflicting tree safely
  **downgrades to `needs_review`** (branch intact), never crashes the run.
- `SITC_DELIVERY_PUSH=1` — also `git push origin develop` (OUTWARD-FACING: triggers prod
  auto-deploy). Off by default.
- `SITC_DELIVERY_PR=1` — for `needs_review` runs, push the run branch and open a `gh` PR
  instead of leaving it local. `SITC_GIT_REMOTE` overrides the remote (default `origin`).
The outcome is logged and written to `.sitc/runs/<id>/delivery.json`.

## 5. PM2
```bash
export DATABASE_URL=…                       # so the config picks it up
pm2 start ecosystem.sitc.config.cjs --only sitc-gc           # safe: orphan GC every 15 min
# orchestrator is disabled by default; start a specific run explicitly:
SITC_ENABLE_WORKER=1 pm2 start ecosystem.sitc.config.cjs --only sitc-orchestrator -- --run <id> --owner vps
pm2 logs sitc-orchestrator
```

## 5b. Embeddings (optional — lessons retrieval, DESIGN §9.3)
The learning system degrades gracefully: with no `SITC_EMBED_CMD` it uses the dependency-free hashing embedder
(1536-dim) — retrieval still works, just less semantic. To use a real model, set a command that reads text on
stdin and prints a 1536-dim JSON vector (must match the pgvector column):
```bash
export SITC_EMBED_CMD="python3 -c \"import sys,json,openai; print(json.dumps(openai.embeddings.create(model='text-embedding-3-small', input=sys.stdin.read()).data[0].embedding))\""
```
The runner runs an **embedder preflight** at startup (`probeEmbedder`) and logs source / dim / latency — a wrong
dimension or a hung command fails loudly there, before any run work. Output is validated (finite, correct dim) and
L2-normalized on every call.

## 6. Teardown
```bash
pnpm sitc:run-db teardown --run <id> --drop-db --delete-branch --yes
```
GC also reclaims runs whose lease expired without cleanup (the `sitc-gc` daemon).

## Known gaps to close before trusting unattended auto-merge
1. ✅ **Regression SSIM is real (I6).** `createRealExistingSsim` renders every existing template (≠ the run's) on
   the run-branch champion vs the `develop` baseline (two I2-style pinned worktrees) and diffs them, so a shared
   `packages/ui` edit that regresses another business fails the gate (`existingTemplatesMinSsim` < 0.99). Cap the
   sample with `SITC_REGRESSION_MAX_TEMPLATES`. Pairs are written to `.sitc/runs/<id>/regression/`. *Orchestration
   verified deterministically (12/12); the live render pass is exercised on the first supervised run (gap #4).*
2. ✅ **Acceptance gate prod target (I5).** Perf/transfer budgets are now enforced ONLY against a real prod
   build, never `astro dev` (unbundled = inflated). Precedence: `SITC_ACCEPTANCE_URL` (an operator-run prod
   preview) → `SITC_ACCEPTANCE_BUILD=1` (the runner does `pnpm --filter @mshorizon/engine build` on the champion
   worktree + serves the `@astrojs/node` standalone server) → **dev fallback with perf NOT enforced** (a11y/
   responsive/hygiene still run). For the evolved template's *content* to render under a prod build, point
   `SITC_PREVIEW_DATABASE_URL` at the run DB seeded with the champion (gap #3 / Step 3); perf/bundle characteristics
   are meaningful regardless. *Resolver + perf-skip verified deterministically (7/7); live build on first run.*
3. ✅ **Judge-drift gate (I7).** `DrizzleJudgeCalibrationStore` loads durable triples from `sitc_judge_calibration`;
   `SITC_JUDGE_GATE=1` replays them through the pairwise judge at run start and **refuses the run** if agreement
   or order-stability drop below the spike bar (0.90/0.90, ≥4 confident triples) — fail-closed. Verdicts are
   appended as an audit log. Remaining operator step: **seed** the table with subtle triples (use
   `generateSubtleTriples`) and back the image paths with R2 so they survive a headless box. *Gate logic verified
   deterministically (16/16); seeding + R2 image hosting is the infra step.*
4. **First live run is unverified end-to-end** — the wiring type-checks and each collaborator is independently
   verified, but the full `runFull` path against a real target has not been executed (it requires the autonomous
   worker). Treat the first live run as a supervised bring-up.
