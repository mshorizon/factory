#!/usr/bin/env node
// Sets navbar icon, favicon, and footer icon for notariuszwgarwolinie.
// Run: DATABASE_URL="..." node scripts/update-notariusz-icons.mjs

import postgres from "postgres";

const SUBDOMAIN = "notariuszwgarwolinie";
const R2_BASE = "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev";

const ICONS = {
  favicon: `${R2_BASE}/${SUBDOMAIN}/icon.png`,
  icon: `${R2_BASE}/${SUBDOMAIN}/icon.png`,
  footerIcon: `${R2_BASE}/${SUBDOMAIN}/icon.png`,
};

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

async function main() {
  const sql = postgres(DATABASE_URL);

  const rows = await sql`SELECT config FROM sites WHERE subdomain = ${SUBDOMAIN}`;
  if (rows.length === 0) {
    await sql.end();
    throw new Error(`Business "${SUBDOMAIN}" not found in DB`);
  }

  const config = rows[0].config;

  if (!config.business) config.business = {};
  if (!config.business.assets) config.business.assets = {};

  config.business.assets.favicon = ICONS.favicon;
  config.business.assets.icon = ICONS.icon;
  config.business.assets.footerIcon = ICONS.footerIcon;

  await sql`UPDATE sites SET config = ${sql.json(config)}, updated_at = NOW() WHERE subdomain = ${SUBDOMAIN}`;
  console.log("Updated icons for", SUBDOMAIN);
  console.log("  favicon:", ICONS.favicon);
  console.log("  icon:", ICONS.icon);
  console.log("  footerIcon:", ICONS.footerIcon);

  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
