import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const subdomain = "notariuszwgarwolinie";
const sql = postgres(DATABASE_URL);

const rows = await sql`SELECT subdomain, config FROM sites WHERE subdomain = ${subdomain}`;

if (rows.length === 0) {
  console.error(`Business "${subdomain}" not found`);
  await sql.end();
  process.exit(1);
}

const config = rows[0].config as any;

if (!config.business) {
  config.business = {};
}
if (!config.business.assets) {
  config.business.assets = {};
}

config.business.assets.iconLucide = "scale";

await sql`UPDATE sites SET config = ${sql.json(config)}, updated_at = NOW() WHERE subdomain = ${subdomain}`;

console.log(`Updated ${subdomain}: set business.assets.iconLucide = "scale"`);

await sql.end();
