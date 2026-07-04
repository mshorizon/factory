/**
 * PM2 ecosystem for the SITC (Self-Improving Template Creator) control plane.
 * SCAFFOLDING — see features/sitc/DEPLOY.md.
 *
 * Two processes:
 *  - sitc-gc            SAFE daemon. Sweeps orphaned (expired-lease) runs every
 *                       15 min: tears down leaked worktrees + drops their run DBs.
 *  - sitc-orchestrator  The per-run consumer. DISABLED by default (autorestart
 *                       false, worker OFF) because a live run spawns an autonomous
 *                       `claude -p` Edit/Write loop — an explicit operator action.
 *                       Enable per the DEPLOY.md runbook.
 *
 * Secrets are read from the environment / apps/engine/.env at start — do NOT
 * hardcode DATABASE_URL here.
 */
const path = require("node:path");
const REPO = __dirname;
// I40: PM2 captures this value when the config FIRST loads — a later `export
// DATABASE_URL=… && pm2 restart` keeps the stale one. The scripts now fall back
// to apps/engine/.env when the env var is empty, so an un-exported shell no
// longer bricks the GC cron. Use `pm2 restart --update-env` after re-exporting.
const DB_URL = process.env.DATABASE_URL || "";

module.exports = {
  apps: [
    {
      name: "sitc-gc",
      cwd: REPO,
      script: "pnpm",
      args: "tsx scripts/sitc-run-db.mts gc --drop-db --yes",
      interpreter: "none",
      autorestart: false,        // run once per cron tick
      cron_restart: "*/15 * * * *",
      env: { DATABASE_URL: DB_URL, ADMIN_DATABASE_URL: DB_URL },
      out_file: "/tmp/sitc-gc.out.log",
      error_file: "/tmp/sitc-gc.err.log",
    },
    {
      name: "sitc-orchestrator",
      cwd: REPO,
      script: "pnpm",
      // operator supplies the run id: `pm2 start ecosystem.sitc.config.cjs --only sitc-orchestrator -- --run <id> --owner vps`
      args: "tsx scripts/sitc-runner.mts --owner vps",
      interpreter: "none",
      autorestart: false,        // a run is a bounded job, not a daemon; do not loop blindly
      env: {
        DATABASE_URL: DB_URL,
        SITC_ENGINE_URL: process.env.SITC_ENGINE_URL || "http://localhost:4321",
        SITC_MODEL: process.env.SITC_MODEL || "sonnet",
        // SITC_ENABLE_WORKER intentionally UNSET → plan-only. Set to "1" to go live (DEPLOY.md §4).
      },
      out_file: "/tmp/sitc-orchestrator.out.log",
      error_file: "/tmp/sitc-orchestrator.err.log",
    },
  ],
};
