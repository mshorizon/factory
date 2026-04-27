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

const contactSection = config?.pages?.contact?.sections?.find(
  (s: any) => s.type === "contact" && s.info
);
if (!contactSection) {
  console.error("No contact section with info found");
  await sql.end();
  process.exit(1);
}

const newItem = "Możliwe jest też dokonanie czynności w innych terminach, po uprzednim uzgodnieniu";

if (!contactSection.info.additionalInfo) {
  contactSection.info.additionalInfo = [];
}

if (!contactSection.info.additionalInfo.includes(newItem)) {
  contactSection.info.additionalInfo.push(newItem);
}

await sql`UPDATE sites SET config = ${sql.json(config)}, updated_at = NOW() WHERE subdomain = ${subdomain}`;

console.log(`Updated ${subdomain}: added additionalInfo item with information icon`);

await sql.end();
