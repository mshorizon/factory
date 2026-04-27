import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const subdomain = "notariuszwgarwolinie";
const sql = postgres(DATABASE_URL);

const rows = await sql`SELECT id, config FROM sites WHERE subdomain = ${subdomain}`;

if (rows.length === 0) {
  console.error(`Business "${subdomain}" not found`);
  await sql.end();
  process.exit(1);
}

const siteId: number = rows[0].id;
let config = rows[0].config as any;
if (typeof config === "string") {
  config = JSON.parse(config);
}

const homeSections = config?.pages?.home?.sections ?? [];
const heroSection = homeSections.find((s: any) => s.type === "hero");

if (!heroSection) {
  console.error("Hero section not found in home page");
  await sql.end();
  process.exit(1);
}

// Professional female notary portrait — formal attire, neutral background,
// well-suited for the split-hero layout (right-side portrait panel, ~444×360px)
const newImage =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=880&h=720&fit=crop&crop=faces";

if (heroSection.image === newImage) {
  console.log("Hero image already up to date, skipping.");
  await sql.end();
  process.exit(0);
}

console.log(`Updating hero image:\n  from: ${heroSection.image}\n  to:   ${newImage}`);

heroSection.image = newImage;

await sql`
  UPDATE sites
  SET config = ${sql.json(config)}, updated_at = NOW()
  WHERE subdomain = ${subdomain}
`;

console.log(`Done — hero image updated for ${subdomain}`);
await sql.end();
