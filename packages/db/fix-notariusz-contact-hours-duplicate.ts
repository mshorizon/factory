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

const DUPLICATE_TEXT = "Poniedziałek - Piątek: 9:00 - 16:00";
let changed = false;

const dedupeArray = (arr: string[] | undefined): string[] | undefined => {
  if (!Array.isArray(arr)) return arr;
  const seen = new Set<string>();
  const deduped = arr.filter((item) => {
    if (item === DUPLICATE_TEXT && seen.has(item)) return false;
    seen.add(item);
    return true;
  });
  return deduped;
};

const info = contactSection.info;

if (Array.isArray(info.hoursDetailed)) {
  const deduped = dedupeArray(info.hoursDetailed)!;
  if (deduped.length !== info.hoursDetailed.length) {
    info.hoursDetailed = deduped;
    changed = true;
  }
}

if (Array.isArray(info.additionalInfo)) {
  const deduped = dedupeArray(info.additionalInfo)!;
  if (deduped.length !== info.additionalInfo.length) {
    info.additionalInfo = deduped;
    changed = true;
  }
}

if (!changed) {
  console.log(`No duplicate "${DUPLICATE_TEXT}" found in contact section arrays — nothing to update.`);
  await sql.end();
  process.exit(0);
}

await sql`UPDATE sites SET config = ${sql.json(config)}, updated_at = NOW() WHERE subdomain = ${subdomain}`;

console.log(`Updated ${subdomain}: removed duplicate "${DUPLICATE_TEXT}" from contact section`);
await sql.end();
