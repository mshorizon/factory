import { initDb, getSiteBySubdomain, upsertSiteConfig, updateSiteTranslations } from "../packages/db/src/index.js";
import type { BusinessProfile } from "@mshorizon/schema";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

async function main() {
  const site = await getSiteBySubdomain("darpol-elektryk");
  if (!site) throw new Error("Site darpol-elektryk not found");

  const config = site.config as BusinessProfile;

  // Restore the translation key in config (the name is resolved via translations)
  config.business.name = "t:business.name";
  await upsertSiteConfig("darpol-elektryk", config);
  console.log("✓ config.business.name restored to translation key");

  // Update the actual business name in Polish translations
  const translations = site.translations as Record<string, Record<string, string>>;
  translations.pl["business.name"] = "Dariusz Zieliński";
  await updateSiteTranslations("darpol-elektryk", translations);
  console.log("✓ translations.pl.business.name updated to: Dariusz Zieliński");

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
