#!/usr/bin/env tsx
import { initDb, listTasks } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

async function main() {
  const tasks = await listTasks();
  for (const t of tasks) {
    if ((t.description || "").includes("Klimonda") || (t.description || "").includes("kancelaria-notarialna-dariusz")) {
      console.log(JSON.stringify(t, null, 2));
    }
  }
  // Also show all pending/in_progress tasks
  console.log("\n--- All non-done tasks ---");
  for (const t of tasks) {
    if (t.status !== "done") {
      console.log(t.id, t.status, (t.title || "").slice(0, 60));
    }
  }
  process.exit(0);
}
main().catch((err) => { console.error(err); process.exit(1); });
