import postgres from 'postgres';
import { readFileSync } from 'fs';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);

  const config = JSON.parse(readFileSync('/tmp/notariuszwgarwolinie-config.json', 'utf-8'));
  const translations = JSON.parse(readFileSync('/tmp/notariuszwgarwolinie-translations.json', 'utf-8'));

  const subdomain = 'notariuszwgarwolinie';
  const businessName = 'Kancelaria Notarialna Aleksandra Durys';
  const industry = 'legal';

  // Upsert site
  const [existing] = await sql`SELECT id FROM sites WHERE subdomain = ${subdomain}`;
  let siteId: number;

  if (existing) {
    await sql`UPDATE sites SET config = ${sql.json(config)}, translations = ${sql.json(translations)}, business_name = ${businessName}, industry = ${industry}, updated_at = NOW() WHERE subdomain = ${subdomain}`;
    siteId = existing.id;
    console.log('Updated existing site. ID:', siteId);
  } else {
    const [row] = await sql`INSERT INTO sites (subdomain, business_name, industry, config, translations, status) VALUES (${subdomain}, ${businessName}, ${industry}, ${sql.json(config)}, ${sql.json(translations)}, 'released') RETURNING id`;
    siteId = row.id;
    console.log('Created new site. ID:', siteId);
  }

  // Delete existing blogs for this site (clean slate)
  const deleted = await sql`DELETE FROM blogs WHERE site_id = ${siteId}`;
  console.log('Deleted existing blogs:', deleted.count);

  // Insert blogs
  const blogs = JSON.parse(readFileSync('/tmp/notariuszwgarwolinie-blogs.json', 'utf-8'));
  let blogCount = 0;
  for (const blog of blogs) {
    try {
      await sql`INSERT INTO blogs (site_id, slug, lang, title, description, content, image, author, category, tags, status, standalone, published_at, meta_title, meta_description) VALUES (${siteId}, ${blog.slug}, ${blog.lang || 'pl'}, ${blog.title}, ${blog.description}, ${blog.content}, ${blog.image}, ${blog.author}, ${blog.category}, ${sql.json(blog.tags || [])}, ${blog.status || 'published'}, ${blog.standalone || false}, ${blog.published_at || blog.publishedAt || new Date().toISOString()}, ${blog.meta_title || blog.metaTitle || null}, ${blog.meta_description || blog.metaDescription || null})`;
      blogCount++;
    } catch (err: any) {
      console.error(`Failed to insert blog ${blog.slug} (${blog.lang}):`, err.message);
    }
  }
  console.log(`Inserted ${blogCount}/${blogs.length} blogs`);

  console.log(`\n✅ Business cloned to DB. Site ID: ${siteId}`);
  console.log(`URL (dev): https://notariuszwgarwolinie.dev.hazelgrouse.pl/`);
  console.log(`URL (admin): https://notariuszwgarwolinie.dev.hazelgrouse.pl/admin`);

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
