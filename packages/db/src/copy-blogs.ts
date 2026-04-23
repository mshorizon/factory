import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sites, blogs } from "./schema.js";
import { eq, and } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const SOURCE = "portfolio-law";
const TARGET = "komornikwotwocku";

async function copyBlogs() {
  const client = postgres(DATABASE_URL as string);
  const db = drizzle(client);

  const [sourceSite] = await db.select({ id: sites.id }).from(sites).where(eq(sites.subdomain, SOURCE)).limit(1);
  if (!sourceSite) {
    console.error(`Source site not found: ${SOURCE}`);
    await client.end();
    process.exit(1);
  }

  const [targetSite] = await db.select({ id: sites.id }).from(sites).where(eq(sites.subdomain, TARGET)).limit(1);
  if (!targetSite) {
    console.error(`Target site not found: ${TARGET}`);
    await client.end();
    process.exit(1);
  }

  console.log(`Copying blogs from ${SOURCE} (id=${sourceSite.id}) → ${TARGET} (id=${targetSite.id})`);

  const sourceBlogs = await db.select().from(blogs).where(eq(blogs.siteId, sourceSite.id));
  console.log(`Found ${sourceBlogs.length} blogs in ${SOURCE}`);

  let inserted = 0;
  let skipped = 0;

  for (const blog of sourceBlogs) {
    const [existing] = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(and(eq(blogs.siteId, targetSite.id), eq(blogs.slug, blog.slug), eq(blogs.lang, blog.lang)))
      .limit(1);

    if (existing) {
      console.log(`  Skipped existing [${blog.lang}]: ${blog.slug}`);
      skipped++;
      continue;
    }

    await db.insert(blogs).values({
      siteId: targetSite.id,
      slug: blog.slug,
      lang: blog.lang,
      title: blog.title,
      description: blog.description,
      content: blog.content,
      image: blog.image,
      author: blog.author,
      category: blog.category,
      tags: blog.tags,
      status: blog.status,
      standalone: blog.standalone,
      publishedAt: blog.publishedAt,
      metaTitle: blog.metaTitle,
      metaDescription: blog.metaDescription,
    });
    console.log(`  Copied [${blog.lang}]: ${blog.slug}`);
    inserted++;
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);
  await client.end();
}

copyBlogs().catch((err) => {
  console.error("Copy failed:", err);
  process.exit(1);
});
