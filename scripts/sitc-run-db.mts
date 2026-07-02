#!/usr/bin/env tsx
/**
 * SITC run-scoped DB lifecycle CLI (DESIGN §13.2 / §16).
 *
 * Provisions / seeds / tears down the ISOLATED per-run database, and runs the
 * orphan GC. SCAFFOLDING for the operator — CREATE/DROP DATABASE is real prod
 * DDL, so every destructive action is gated behind an explicit `--yes` flag and
 * prints exactly what it will do first. Nothing here runs automatically.
 *
 * Import workspace SOURCE via relative paths (repo script convention) + only the
 * modules needed, to avoid pulling playwright through the package barrels.
 *
 * Usage (run on the VPS, or locally pointed at the control DB):
 *   ADMIN_DATABASE_URL=postgres://…/hazelgrouse-db \
 *     pnpm tsx scripts/sitc-run-db.ts provision  --run <id> [--yes]
 *     pnpm tsx scripts/sitc-run-db.ts seed       --run <id> --template <name> [--yes]
 *     pnpm tsx scripts/sitc-run-db.ts teardown   --run <id> [--yes]
 *     pnpm tsx scripts/sitc-run-db.ts gc         [--drop-db] [--delete-branch] [--yes]
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { initDb } from "../packages/db/src/client.js";
import { DrizzleRunStore } from "../packages/db/src/sitc-store.js";
import { seedRunProfile, createSqlExec } from "../packages/db/src/sitc-run-db.js";
import { runDbName, runDbUrl, provisionRunDb, dropRunDb } from "../packages/sitc-core/src/orchestrator/run-db.js";
import { sweepOrphans } from "../packages/sitc-core/src/orchestrator/orphan-gc.js";
import { WorktreeManager } from "../packages/sitc-core/src/orchestrator/worktree.js";
import { seedRunDb } from "../packages/sitc-core/src/steps/seed-run-db.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const has = (n: string) => process.argv.includes(`--${n}`);
const cmd = process.argv[2];

function adminUrl(): string {
  const u = process.env.ADMIN_DATABASE_URL || process.env.DATABASE_URL;
  if (!u) throw new Error("ADMIN_DATABASE_URL (or DATABASE_URL) is required — point it at the Postgres admin DB");
  return u;
}

/** Refuse destructive prod DDL unless the operator passed --yes. */
function confirmOrExit(action: string): void {
  if (!has("yes")) {
    console.log(`DRY RUN — would: ${action}`);
    console.log("Re-run with --yes to execute (this is real prod DDL).");
    process.exit(0);
  }
}

async function main() {
  switch (cmd) {
    case "provision": {
      const runId = Number(arg("run"));
      if (!runId) throw new Error("--run <id> required");
      confirmOrExit(`CREATE DATABASE "${runDbName(runId)}" on the admin server`);
      const admin = createSqlExec(adminUrl());
      try {
        const name = await provisionRunDb(admin, runId);
        console.log(`✔ provisioned run DB: ${name}`);
        console.log(`  run DB URL: ${runDbUrl(adminUrl(), runId).replace(/:[^:@/]+@/, ":***@")}`);
      } finally {
        await admin.close();
      }
      break;
    }

    case "seed": {
      const runId = Number(arg("run"));
      const template = arg("template");
      if (!runId || !template) throw new Error("--run <id> and --template <name> required");
      const url = runDbUrl(adminUrl(), runId);
      const templatePath = path.join(REPO_ROOT, "templates", template, `${template}.json`);
      const profile = JSON.parse(await fs.readFile(templatePath, "utf8"));
      confirmOrExit(`seed template "${template}" into run DB ${runDbName(runId)} (validates schema first)`);
      await seedRunDb({ runDbUrl: url, businessId: template, profile, seed: seedRunProfile });
      console.log(`✔ seeded "${template}" into ${runDbName(runId)}`);
      break;
    }

    case "teardown": {
      const runId = Number(arg("run"));
      if (!runId) throw new Error("--run <id> required");
      confirmOrExit(`tear down worktrees for run ${runId}${has("drop-db") ? ` + DROP DATABASE "${runDbName(runId)}"` : ""}`);
      const wt = new WorktreeManager({ repoRoot: REPO_ROOT });
      await wt.teardown(runId, { deleteBranch: has("delete-branch") });
      console.log(`✔ worktrees + ${has("delete-branch") ? "branch " : ""}removed for run ${runId}`);
      if (has("drop-db")) {
        const admin = createSqlExec(adminUrl());
        try { await dropRunDb(admin, runId); console.log(`✔ dropped DB ${runDbName(runId)}`); }
        finally { await admin.close(); }
      }
      break;
    }

    case "gc": {
      confirmOrExit(`sweep orphaned (expired-lease) runs: teardown worktrees${has("drop-db") ? " + DROP their DBs" : ""}`);
      initDb(adminUrl());
      const store = new DrizzleRunStore();
      const wt = new WorktreeManager({ repoRoot: REPO_ROOT });
      const admin = has("drop-db") ? createSqlExec(adminUrl()) : undefined;
      try {
        const report = await sweepOrphans({ store, worktree: wt, admin, deleteBranch: has("delete-branch") });
        console.log(`✔ GC reclaimed ${report.reclaimed.length} run(s): [${report.reclaimed.join(", ")}]`);
        if (report.errors.length) console.log(`  ${report.errors.length} error(s):`, report.errors);
      } finally {
        await admin?.close();
      }
      break;
    }

    default:
      console.log("usage: sitc-run-db.ts <provision|seed|teardown|gc> [--run <id>] [--template <name>] [--yes] [--drop-db] [--delete-branch]");
      process.exit(cmd ? 1 : 0);
  }
  process.exit(0);
}

main().catch((e) => { console.error("sitc-run-db failed:", e); process.exit(1); });
