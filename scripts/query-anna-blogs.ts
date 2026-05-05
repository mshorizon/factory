#!/usr/bin/env tsx
import { initDb } from "../packages/db/src/index.js";
import { blogs } from "../packages/db/src/schema.js";
import { eq } from "drizzle-orm";
import { getDb } from "../packages/db/src/client.js";

const DATABASE_URL = "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

async function main() {
  initDb(DATABASE_URL);
  const db = getDb();
  const rows = await db.select({ slug: blogs.slug, lang: blogs.lang, image: blogs.image })
    .from(blogs).where(eq(blogs.siteId, 29));
  const bySlug: Record<string, string[]> = {};
  for (const r of rows) {
    if (!bySlug[r.slug]) bySlug[r.slug] = [];
    bySlug[r.slug].push(`${r.lang}(img:${r.image ? 'YES' : 'no'})`);
  }
  for (const [slug, langs] of Object.entries(bySlug).sort()) {
    console.log(slug, '->', langs.join(', '));
  }
}
main().catch(console.error);
