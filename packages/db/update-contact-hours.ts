import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const subdomain = process.argv[2];
if (!subdomain) {
  console.error("Usage: tsx update-contact-hours.ts <subdomain>");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

const rows = await sql`SELECT subdomain, config, translations FROM sites WHERE subdomain = ${subdomain}`;

if (rows.length === 0) {
  console.error(`Business "${subdomain}" not found`);
  await sql.end();
  process.exit(1);
}

const config = rows[0].config as any;
const translations = (rows[0].translations as any) || {};

// Find contact section in pages.contact.sections
const contactPage = config?.pages?.contact;
if (!contactPage) {
  console.error("No pages.contact found in config");
  await sql.end();
  process.exit(1);
}

const contactSection = contactPage.sections?.find((s: any) => s.type === "contact" && s.info);
if (!contactSection) {
  console.error("No contact section with info found");
  await sql.end();
  process.exit(1);
}

console.log("Current hoursDetailed:", JSON.stringify(contactSection.info.hoursDetailed, null, 2));
console.log("Current receptionHours:", contactSection.info.receptionHours);
console.log("Current receptionLabel:", contactSection.info.receptionLabel);

const newHours = "Poniedziałek - Piątek: 9:00 - 16:00";

contactSection.info.hoursDetailed = [newHours];
delete contactSection.info.receptionHours;
delete contactSection.info.receptionLabel;

// Also clear any hours-related translation keys
for (const lang of Object.keys(translations)) {
  if (lang === "_settings") continue;
  const t = translations[lang] as Record<string, string>;
  if (!t) continue;
  t["contact.info.hours.mon"] = newHours;
  delete t["contact.info.hours.tue"];
  delete t["contact.info.hours.wed"];
  delete t["contact.info.hours.thu"];
  delete t["contact.info.hours.fri"];
  delete t["contact.info.receptionHours"];
  delete t["contact.info.receptionLabel"];
}

await sql`UPDATE sites SET config = ${sql.json(config)}, translations = ${sql.json(translations)}, updated_at = NOW() WHERE subdomain = ${subdomain}`;

console.log(`\nUpdated ${subdomain} contact hours to: "${newHours}"`);

await sql.end();
