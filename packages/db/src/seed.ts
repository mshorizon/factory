import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sites } from "./schema.js";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const dataDir = join(import.meta.dirname, "..", "..", "..", "data");

function readJson(filePath: string): any {
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, "utf-8"));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return null;
}

async function seed() {
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  const entries = readdirSync(dataDir, { withFileTypes: true });
  const businessDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  console.log(`Found ${businessDirs.length} businesses to seed: ${businessDirs.join(", ")}`);

  for (const subdomain of businessDirs) {
    const configPath = join(dataDir, subdomain, `${subdomain}.json`);
    const config = readJson(configPath);

    if (!config) {
      console.warn(`  Skipping ${subdomain}: no config JSON found`);
      continue;
    }

    // Read translations
    const translations: Record<string, Record<string, unknown>> = {};
    const transDir = join(dataDir, subdomain, "translations");
    if (existsSync(transDir)) {
      for (const lang of ["en", "pl"]) {
        const langData = readJson(join(transDir, `${lang}.json`));
        if (langData) {
          translations[lang] = langData;
        }
      }
    }

    const businessName = config.business?.name || config.name || subdomain;
    const industry = config.business?.industry || config.industry || null;

    // Upsert: update if exists, insert if not
    const [existing] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(eq(sites.subdomain, subdomain))
      .limit(1);

    if (existing) {
      await db
        .update(sites)
        .set({
          businessName,
          industry,
          config,
          translations,
          updatedAt: new Date(),
        })
        .where(eq(sites.subdomain, subdomain));
      console.log(`  Updated: ${subdomain}`);
    } else {
      await db.insert(sites).values({
        subdomain,
        businessName,
        industry,
        config,
        translations,
      });
      console.log(`  Inserted: ${subdomain}`);
    }
  }

  console.log("Seed complete!");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
