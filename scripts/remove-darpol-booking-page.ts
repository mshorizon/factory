import { initDb, getSiteBySubdomain, upsertSiteConfig } from "../packages/db/src/index.js";
import type { BusinessProfile } from "@mshorizon/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

initDb(DATABASE_URL);

async function main() {
  const site = await getSiteBySubdomain("darpol-elektryk");
  if (!site) throw new Error("Site darpol-elektryk not found");

  const config = site.config as BusinessProfile & { pages?: Record<string, unknown>; booking?: Record<string, unknown> };

  if (config.pages && "booking" in config.pages) {
    delete config.pages.booking;
    console.log("✓ Removed pages.booking");
  } else {
    console.log("ℹ pages.booking not found, nothing to remove");
  }

  if (config.booking) {
    (config.booking as Record<string, unknown>).enabled = false;
    console.log("✓ Set booking.enabled = false");
  }

  await upsertSiteConfig("darpol-elektryk", config as BusinessProfile);
  console.log("✓ Config updated in database");

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
