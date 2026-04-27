import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const subdomain = "notariuszwgarwolinie";
const sql = postgres(DATABASE_URL);

const rows = await sql`SELECT id FROM sites WHERE subdomain = ${subdomain}`;
if (rows.length === 0) {
  console.error(`Business "${subdomain}" not found`);
  await sql.end();
  process.exit(1);
}

const siteId: number = rows[0].id;

// Industry-specific images for a notary office (notariusz)
const blogImages: Record<string, string> = {
  // Notarial acts — formal document signed before a notary, official seal
  "service-akty-notarialne":
    "https://images.unsplash.com/photo-1450101499163-c8848e968838?q=80&w=1200&h=630&fit=crop",

  // Inheritance certification — estate, legal succession documents
  "service-poswiadczenia-dziedziczenia":
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&h=630&fit=crop",

  // Certifications / notarizations — official document authentication, stamp
  "service-poswiadczenia":
    "https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=1200&h=630&fit=crop",

  // Real estate sales contracts — property transaction, house keys
  "service-umowy-sprzedazy-nieruchomosci":
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&h=630&fit=crop",

  // Wills / testaments — person writing a formal will, estate planning
  "service-testamenty":
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&h=630&fit=crop",

  // Powers of attorney — authorization between two parties, signing
  "service-pelnomocnictwa":
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1200&h=630&fit=crop",
};

// Fallback for any other notary-related blogs not mapped above
const fallbackImage =
  "https://images.unsplash.com/photo-1450101499163-c8848e968838?q=80&w=1200&h=630&fit=crop";

// Fetch all blogs for this site
const allBlogs = await sql`
  SELECT id, slug, lang, image FROM blogs WHERE site_id = ${siteId}
`;

console.log(`Found ${allBlogs.length} blog records for ${subdomain}`);

let updatedCount = 0;

for (const blog of allBlogs) {
  const image = blogImages[blog.slug] ?? fallbackImage;

  if (blog.image === image) {
    console.log(`  Skipped (already set): ${blog.slug} [${blog.lang}]`);
    continue;
  }

  await sql`
    UPDATE blogs
    SET image = ${image}, updated_at = NOW()
    WHERE id = ${blog.id}
  `;

  console.log(`  Updated: ${blog.slug} [${blog.lang}] → ${image}`);
  updatedCount++;
}

console.log(`\nTotal updated: ${updatedCount} / ${allBlogs.length} blog records`);
await sql.end();
