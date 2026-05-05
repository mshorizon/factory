import { initDb, getSiteBySubdomain, updateSiteTranslations } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

async function main() {
  const site = await getSiteBySubdomain("anna-papiez");
  if (!site) throw new Error("Site anna-papiez not found");

  const translations = site.translations as Record<string, Record<string, string>>;
  
  // Patch only the pl contact.info.hours key
  const updated: Record<string, Record<string, string>> = {};
  for (const [lang, langData] of Object.entries(translations)) {
    if (lang === "_settings") continue;
    updated[lang] = { ...(langData as Record<string, string>) };
  }

  // Change the pl hours label from concatenated schedule to a simple header
  if (updated.pl) {
    updated.pl["contact.info.hours"] = "Godziny pracy:";
  }

  await updateSiteTranslations("anna-papiez", updated);
  console.log("✓ Fixed: contact.info.hours (pl) → 'Godziny pracy:'");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
