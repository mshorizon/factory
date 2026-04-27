import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const subdomain = process.argv[2];
const googlePlaceQuery = process.argv[3];

if (!subdomain || !googlePlaceQuery) {
  console.error("Usage: tsx update-google-place-query.ts <subdomain> <googlePlaceQuery>");
  console.error('Example: tsx update-google-place-query.ts notariuszwgarwolinie "Kancelaria Notarialna Aleksandra Durys Garwolin"');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

const rows = await sql`SELECT subdomain, config FROM sites WHERE subdomain = ${subdomain}`;

if (rows.length === 0) {
  console.error(`Business "${subdomain}" not found`);
  await sql.end();
  process.exit(1);
}

const config = rows[0].config as any;
const location = config?.business?.contact?.location;

if (!location) {
  console.error("No contact.location found in business config");
  await sql.end();
  process.exit(1);
}

console.log("Current location:", JSON.stringify(location, null, 2));

location.googlePlaceQuery = googlePlaceQuery;

await sql`UPDATE sites SET config = ${sql.json(config)}, updated_at = NOW() WHERE subdomain = ${subdomain}`;

console.log(`Updated ${subdomain} with googlePlaceQuery: "${googlePlaceQuery}"`);

await sql.end();
