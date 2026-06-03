import { initDb, getSiteBySubdomain, upsertSiteConfig } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

async function main() {
  const site = await getSiteBySubdomain("darpol-elektryk");
  if (!site) throw new Error("Site darpol-elektryk not found");

  const config = site.config as any;

  if (!config.business?.contact?.location) {
    throw new Error("config.business.contact.location not found");
  }

  config.business.contact.location.googlePlaceQuery = "Darpol Elektryk";
  console.log("✓ Set googlePlaceQuery = 'Darpol Elektryk'");

  await upsertSiteConfig("darpol-elektryk", config);
  console.log("✓ Config updated in database");

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
