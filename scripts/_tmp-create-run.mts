import { initDb } from "../packages/db/src/client.js";
import { DrizzleRunStore } from "../packages/db/src/sitc-store.js";

async function main() {
  initDb(process.env.DATABASE_URL!);
  const store = new DrizzleRunStore();
  const run = await store.createRun({
    templateName: "template-sacrum",
    targetUrl: "https://trbki-sacrum-home.base44.app/",
    budgetIterations: 12,
  });
  console.log(`RUN_ID=${run.id}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
