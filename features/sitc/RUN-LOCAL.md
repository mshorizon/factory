# SITC — How to run locally

Quick, copy-paste runbook for running the Self-Improving Template Creator **locally**.
For the full reference (teardown, embeddings, the gaps to close before trusting
unattended auto-merge) see [DEPLOY.md](./DEPLOY.md).

> **SITC always runs locally, and the feature must work locally.** The runner, the
> engine, and the git worktrees must share one filesystem (the harness renders sections
> from a worktree working file via an absolute `profilePath`) — on your own machine that
> is true by default. You own the single lease (`--owner local`, §13.1). Do **not** run
> it on the VPS: the VPS is authenticated against a shared Claude subscription, so a run
> there silently burns *everyone's* session limit; keep SITC on your local machine and
> your own Claude auth.
>
> **⚠️ The autonomous edit loop CANNOT run from inside a Claude Code session.** The
> per-section worker spawns `claude -p … --permission-mode acceptEdits` to apply edits
> headlessly (the runner adds this automatically — `--allowedTools` alone makes a
> node-spawned claude silently no-op). A Claude Code session's auto-mode classifier
> **blocks** spawning claude with that permission mode, so the worker can't persist
> edits there. **Run the live loop from a plain terminal** (Terminal.app / iTerm / a
> raw shell) — *not* from within Claude Code. (Verified empirically: edits succeed in a
> plain process, are silently dropped when launched through a Claude Code sandbox.)
>
> **⚠️ Run on a quiet machine.** The engine renders each section through Vite SSR; when
> the box is loaded (Docker, a busy IDE, heavy webpack, background indexers) compiles
> time out or throw `FailedToLoadModuleSSR`. Keep concurrent module load low
> (CONCLUSIONS #7 — load < 15). Close what you don't need before a live run.

---

## 0. Build the code (do this first)

```bash
# in your local checkout
git checkout develop && git pull
pnpm install
pnpm --filter @mshorizon/sitc-core build
```

## 1. Verify prerequisites (all local)

```bash
# start the engine locally (harness filesystem mode is auto-on because astro dev sets DEV=true)
pnpm --filter @mshorizon/engine dev      # serves http://localhost:4321

# in another terminal:
claude --version                          # the worker uses `claude -p` — must be authenticated on THIS machine
claude -p "say ok" --output-format json   # confirm claude is actually logged in locally
node -e "require('axe-core')" && echo "axe ok"   # Step 5 dep present after pnpm install
```

- **`claude` auth is the most likely gap.** The autonomous worker shells out to
  `claude -p` on the same machine the runner runs on, so claude must be logged in
  locally with your own account.
- The engine via `astro dev` has `DEV=true`, so harness filesystem mode is on
  automatically. (Only a prod build needs `SITC_HARNESS_FS=1`.)

## 2. Create a run + provision its DB

```bash
# create the run row in /admin/template-creator, note the <id>, then:
pnpm sitc:run-db provision --run <id>          # dry-run, prints what it'd do
pnpm sitc:run-db provision --run <id> --yes    # real CREATE DATABASE
pnpm sitc:run-db seed --run <id> --template template-specialist --yes
```

> A freshly provisioned run DB is empty. If seed fails with `42P01` (undefined table),
> push the schema into it first: `CREATE EXTENSION IF NOT EXISTS vector;` then
> `DATABASE_URL="<run_db_url>" pnpm --filter @mshorizon/db drizzle-kit push --force`,
> then re-run the seed.

## 3. Plan-only dry run first (safe — no edits)

```bash
DATABASE_URL="postgresql://postgres:…@46.224.191.237:5432/hazelgrouse-db" \
SITC_ENGINE_URL="http://localhost:4321" \
  pnpm tsx scripts/sitc-runner.mts --run <id> --owner local
```

Confirms target ingestion + band↔section alignment + the embedder preflight. Prints
the plan, exits, touches nothing. (Safe to run from anywhere, including a Claude Code
session — it makes no edits.)

## 4. Live run (the governance gate — watch it)

⚠️ This spawns headless `claude -p` with Edit/Write per section — an autonomous agent
loop. **Launch it from a plain terminal** (see the caveat at the top), run it
deliberately, and watch the logs. It stays on its own `sitc/run-<id>` branch; delivery
only merges to `develop` on a clean auto-merge decision (§13.4), otherwise routes to
`needs_review`.

```bash
SITC_ENABLE_WORKER=1 \
DATABASE_URL="postgresql://postgres:…@46.224.191.237:5432/hazelgrouse-db" \
SITC_ENGINE_URL="http://localhost:4321" \
  pnpm tsx scripts/sitc-runner.mts --run <id> --owner local
```

## 5. GC daemon (optional, set once)

```bash
export DATABASE_URL="postgresql://postgres:…@46.224.191.237:5432/hazelgrouse-db"
pnpm tsx scripts/sitc-run-db.mts gc     # sweep orphaned run DBs / worktrees
```

---

### Shorthand

The convenience npm scripts (`pnpm sitc:runner`, `pnpm sitc:run-db`) already have
`DATABASE_URL` inlined, so you can shorten steps 3–4 to e.g.:

```bash
SITC_ENABLE_WORKER=1 pnpm sitc:runner --run <id> --owner local
```

### One caveat

The control DB defaults to the **shared prod DB** (over the network). The single-owner
lease (`--owner local`) keeps two runners off the same run — don't start the same run
from two places at once, pick one owner. If you'd rather not touch the shared DB at all,
point `DATABASE_URL` at a local Postgres and provision the run there.
