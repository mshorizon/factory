#!/usr/bin/env tsx
import { initDb, getSiteBySubdomain } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

async function main() {
  const garwolin = await getSiteBySubdomain("notariuszwgarwolinie");
  console.log("=== GARWOLIN CONFIG ===");
  console.log(JSON.stringify(garwolin?.config, null, 2));

  const law = await getSiteBySubdomain("template-law");
  console.log("=== TEMPLATE-LAW TRANSLATIONS ===");
  console.log(JSON.stringify(law?.translations, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
