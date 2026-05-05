import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sites, blogs } from "./schema.js";
import { eq, desc, notInArray } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const SUBDOMAIN = process.env.SUBDOMAIN || "anna-papiez";
const KEEP = parseInt(process.env.KEEP || "3", 10);

async function trimBlogs() {
  const client = postgres(DATABASE_URL as string);
  const db = drizzle(client);

  const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.subdomain, SUBDOMAIN)).limit(1);
  if (!site) {
    console.error(`Site not found: ${SUBDOMAIN}`);
    await client.end();
    process.exit(1);
  }

  // Get all blogs ordered by createdAt DESC to determine which to keep
  const allBlogs = await db
    .select({ id: blogs.id, slug: blogs.slug, lang: blogs.lang, createdAt: blogs.createdAt })
    .from(blogs)
    .where(eq(blogs.siteId, site.id))
    .orderBy(desc(blogs.createdAt));

  console.log(`Found ${allBlogs.length} blog rows for ${SUBDOMAIN} (site id=${site.id})`);

  if (allBlogs.length === 0) {
    console.log("No blogs to trim.");
    await client.end();
    return;
  }

  // Identify unique slugs ordered by newest createdAt
  const seenSlugs: string[] = [];
  for (const blog of allBlogs) {
    if (!seenSlugs.includes(blog.slug)) {
      seenSlugs.push(blog.slug);
    }
  }

  console.log(`Unique slugs (${seenSlugs.length}):`, seenSlugs);

  if (seenSlugs.length <= KEEP) {
    console.log(`Only ${seenSlugs.length} unique blog slugs — nothing to delete.`);
    await client.end();
    return;
  }

  const keepSlugs = seenSlugs.slice(0, KEEP);
  const deleteSlugs = seenSlugs.slice(KEEP);

  console.log(`\nKeeping newest ${KEEP} slugs:`, keepSlugs);
  console.log(`Deleting ${deleteSlugs.length} slugs:`, deleteSlugs);

  const idsToDelete = allBlogs
    .filter((b) => deleteSlugs.includes(b.slug))
    .map((b) => b.id);

  console.log(`\nDeleting ${idsToDelete.length} rows with ids: ${idsToDelete.join(", ")}`);

  if (idsToDelete.length > 0) {
    await db.delete(blogs).where(notInArray(blogs.id, allBlogs.filter((b) => keepSlugs.includes(b.slug)).map((b) => b.id)));
    console.log(`Deleted successfully.`);
  }

  await client.end();
}

trimBlogs().catch((err) => {
  console.error("Trim failed:", err);
  process.exit(1);
});
