import { initDb, getSiteBySubdomain } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

async function main() {
  const site = await getSiteBySubdomain("anna-papiez");
  if (!site) throw new Error("Site not found");
  
  const config = site.config as any;
  const contactPage = config.pages?.contact;
  if (contactPage?.sections) {
    for (const section of contactPage.sections) {
      if (section.type === "contact") {
        console.log("=== section.info ===");
        console.log(JSON.stringify(section.info, null, 2));
      }
    }
  }

  console.log("\n=== translations.pl (contact keys) ===");
  const translations = site.translations as any;
  const pl = translations?.pl || {};
  for (const [k, v] of Object.entries(pl)) {
    if ((k as string).startsWith("contact.info")) {
      console.log(`${k}: ${JSON.stringify(v)}`);
    }
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
