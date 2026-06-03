#!/usr/bin/env tsx
/**
 * CLI helper for business DB operations (used by generate-lead-site skill and run-tasks.sh).
 *
 * Commands:
 *   get-business <id>                              → JSON of business (stdout)
 *   set-business-status <id> <status>              → update business status
 *   list-businesses [status]                       → JSON array of businesses, optionally filtered
 */

import { initDb, getSiteById, getAllSites, updateBusinessStatus } from "../packages/db/src/index.js";
import type { SiteStatus } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

const [, , cmd, ...args] = process.argv;

async function main() {
  switch (cmd) {
    case "get-business": {
      const [id] = args;
      if (!id) { process.stderr.write("Usage: get-business <id>\n"); process.exit(1); }
      const biz = await getSiteById(Number(id));
      if (!biz) { process.stderr.write(`Business not found: ${id}\n`); process.exit(1); }
      process.stdout.write(JSON.stringify(biz, null, 2));
      break;
    }

    case "set-business-status": {
      const [id, status] = args;
      if (!id || !status) { process.stderr.write("Usage: set-business-status <id> <status>\n"); process.exit(1); }
      const row = await updateBusinessStatus(Number(id), status as SiteStatus);
      process.stdout.write(JSON.stringify(row ?? {}));
      break;
    }

    case "list-businesses": {
      const [statusFilter] = args;
      const rows = await getAllSites();
      const filtered = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;
      process.stdout.write(JSON.stringify(filtered, null, 2));
      break;
    }

    default:
      process.stderr.write(`Unknown command: ${cmd}\nAvailable: get-business, set-business-status, list-businesses\n`);
      process.exit(1);
  }
}

main().then(() => process.exit(0)).catch((err) => { process.stderr.write(String(err) + "\n"); process.exit(1); });
