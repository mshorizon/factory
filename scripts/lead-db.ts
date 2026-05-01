#!/usr/bin/env tsx
/**
 * CLI helper for lead DB operations (used by generate-lead-site skill and run-tasks.sh).
 *
 * Commands:
 *   get-lead <id>                                  → JSON of lead (stdout)
 *   set-lead-status <id> <status> [subdomain]      → update lead status + optional subdomain
 *   list-leads [status]                            → JSON array of leads, optionally filtered
 */

import { initDb, getLeadById, getAllLeads, updateLeadStatus } from "../packages/db/src/index.js";
import type { LeadStatus } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

const [, , cmd, ...args] = process.argv;

async function main() {
  switch (cmd) {
    case "get-lead": {
      const [id] = args;
      if (!id) { process.stderr.write("Usage: get-lead <id>\n"); process.exit(1); }
      const lead = await getLeadById(Number(id));
      if (!lead) { process.stderr.write(`Lead not found: ${id}\n`); process.exit(1); }
      process.stdout.write(JSON.stringify(lead, null, 2));
      break;
    }

    case "set-lead-status": {
      const [id, status, subdomain] = args;
      if (!id || !status) { process.stderr.write("Usage: set-lead-status <id> <status> [subdomain]\n"); process.exit(1); }
      const row = await updateLeadStatus(Number(id), status as LeadStatus, null, subdomain ?? null);
      process.stdout.write(JSON.stringify(row ?? {}));
      break;
    }

    case "list-leads": {
      const [statusFilter] = args;
      const rows = await getAllLeads();
      const filtered = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;
      process.stdout.write(JSON.stringify(filtered, null, 2));
      break;
    }

    default:
      process.stderr.write(`Unknown command: ${cmd}\nAvailable: get-lead, set-lead-status, list-leads\n`);
      process.exit(1);
  }
}

main().then(() => process.exit(0)).catch((err) => { process.stderr.write(String(err) + "\n"); process.exit(1); });
