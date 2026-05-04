---
name: clone-business
description: Clone an existing client business from the database, customize with new client info and optional website URL, and create a new business in the database.
---

## Purpose

Clone an existing business **from the database** to create a new business for a different client. Uses the source business's full config (theme, layout, sections, structure) as a starting point, then customizes everything with the new client's info.

This is different from `create-business` (which uses template files) — this skill works entirely DB-to-DB, cloning any live business regardless of whether it has template files.

## Parameters

Parse from the user's invocation:
1. **source-business** (required) — subdomain of the existing business to clone, e.g. `tom-lawyer`
2. **new-business** (required) — subdomain for the new business, e.g. `anna-adwokat`
3. **client-url** (optional) — URL of the new client's actual website to scrape for real info

Example invocations:
```
/clone-business tom-lawyer anna-adwokat
/clone-business tom-lawyer anna-adwokat https://anna-kancelaria.pl
/clone-business mario-plumber jan-hydraulik
```

## Files to read before starting

Read these to understand the architecture:
- DB queries: `packages/db/src/queries.ts` — `getSiteBySubdomain()`, `upsertSiteConfig()`, `updateSiteTranslations()`, `getBlogsBySiteId()`, `createBlog()`, `getProjectsBySiteId()`, `createProject()`
- Schema: `packages/schema/src/business.schema.json`
- R2 lib: `apps/engine/src/lib/r2.ts`
- Major themes: `packages/ui/src/themes/majorThemes.ts`
- Existing upload scripts for R2 pattern: `scripts/upload-portfolio-law-blog-images.mjs`

## STEP 1 — Fetch Source Business from DB

Query the source business directly from PostgreSQL:

```bash
cd packages/db && DATABASE_URL="postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db" npx tsx -e "
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
const [row] = await sql\`SELECT id, subdomain, config, translations FROM sites WHERE subdomain = '{source-business}'\`;
if (!row) { console.error('Business not found'); process.exit(1); }
// Write config and translations to temp files for inspection
import { writeFileSync } from 'fs';
writeFileSync('/tmp/source-config.json', JSON.stringify(row.config, null, 2));
writeFileSync('/tmp/source-translations.json', JSON.stringify(row.translations, null, 2));
console.log('Site ID:', row.id);
console.log('Config saved to /tmp/source-config.json');
console.log('Translations saved to /tmp/source-translations.json');
await sql.end();
"
```

Also fetch blogs and projects:

```bash
cd packages/db && DATABASE_URL="..." npx tsx -e "
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
const [site] = await sql\`SELECT id FROM sites WHERE subdomain = '{source-business}'\`;
const blogs = await sql\`SELECT slug, lang, title, description, content, image, author, category, tags, status, standalone, published_at, meta_title, meta_description FROM blogs WHERE site_id = \${site.id}\`;
const projects = await sql\`SELECT slug, lang, title, description, content, image, category, tags, status, published_at FROM projects WHERE site_id = \${site.id}\`;
import { writeFileSync } from 'fs';
writeFileSync('/tmp/source-blogs.json', JSON.stringify(blogs, null, 2));
writeFileSync('/tmp/source-projects.json', JSON.stringify(projects, null, 2));
console.log('Blogs:', blogs.length, '| Projects:', projects.length);
await sql.end();
"
```

Read the saved files to understand the source business structure:
- `/tmp/source-config.json` — full business config
- `/tmp/source-translations.json` — all translations
- `/tmp/source-blogs.json` — blog posts
- `/tmp/source-projects.json` — project/portfolio entries

## STEP 2 — Gather New Client Information

### If client-url is provided:
Use Playwright MCP to analyze the client's actual website:

```
1. mcp__playwright__browser_navigate → open client URL
2. mcp__playwright__browser_take_screenshot → capture homepage
3. mcp__playwright__browser_snapshot → extract text content
4. Navigate to subpages (About, Services, Contact, Blog) and repeat
```

Extract from the real site:
- **Business name** and tagline
- **Industry** and services offered
- **Contact info**: address, phone, email, hours
- **About text**: company story, team info, years of experience
- **Services list**: names, descriptions, pricing if visible
- **Testimonials** if present
- **Blog posts** titles and content
- **Color scheme** and branding (to optionally adjust the theme)
- **Images**: download key images (hero, about, team, service images) for R2 upload

### If NO client-url:
Ask the user for the minimum required info, or generate realistic placeholder content:
- Business name
- Industry
- City/location
- Contact details (phone, email, address)
- Services offered (or generate based on industry)

## STEP 3 — Prepare Images

Every new business needs unique images. The business ID for R2 paths is the **new-business** subdomain.

### Image sources (priority order):
1. **Client website** (if URL provided) — download via Playwright
2. **Unsplash** — search for industry-appropriate royalty-free images
3. **Source business images** — last resort; re-upload under new business path

### Required images (based on what sections the source business uses):
- **Hero image** — main banner/background
- **About image** — team or founder photo
- **Service images** — one per service (if sections use them)
- **Blog images** — one per blog post
- **Gallery images** — if source has gallery section
- **Testimonial avatars** — if source has testimonials with avatars
- **Project images** — if source has portfolio/project section

### Upload to R2:

Create a temporary Node.js script to download and upload images:

```javascript
// Save as /tmp/upload-{new-business}-images.mjs, run with `node`, then delete
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_CONFIG = {
  endpoint: "https://b1904e29dea07111f8dd157eb07973af.r2.cloudflarestorage.com",
  accessKeyId: "d324e6cb094303144c3c652ca196ffac",
  secretAccessKey: "def36f9b9d01afe0a770fae6c1e0d90ec94a8784e019d48c59726b939609c8ce",
  bucketName: "hazelgrouse-r2",
  publicUrl: "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev",
};

const BUSINESS_ID = "{new-business}";

async function downloadAndUpload(sourceUrl, filename, contentType = "image/jpeg") {
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; HazelgrouseFactory/1.0)" },
  });
  const buffer = Buffer.from(await response.arrayBuffer());

  const client = new S3Client({
    region: "auto",
    endpoint: R2_CONFIG.endpoint,
    credentials: {
      accessKeyId: R2_CONFIG.accessKeyId,
      secretAccessKey: R2_CONFIG.secretAccessKey,
    },
  });

  const key = `${BUSINESS_ID}/${filename}`;
  await client.send(new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `${R2_CONFIG.publicUrl}/${key}`;
}
```

**R2 URL format**: `https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/{new-business}/{filename}`

After uploading, note all R2 URLs for use in the business JSON.
Delete the temporary upload script when done.

## STEP 4 — Build New Business JSON

Deep-clone the source business config and customize. The cloned JSON must be **fully independent** — no references to the source business.

### Mandatory changes to the cloned config:

```json
{
  "business": {
    "id": "{new-business}",
    "name": "New Business Name (or t:business.name if using translations)",
    "industry": "{new-industry}",
    "assets": {
      "favicon": "...",
      "icon": "..."
    },
    "contact": {
      "address": "new address",
      "phone": "+48 xxx xxx xxx",
      "email": "new@email.com",
      "hours": "...",
      "location": { "latitude": ..., "longitude": ... }
    },
    "socials": { ... },
    "serviceArea": { ... },
    "googleRating": { ... }
  }
}
```

### What to KEEP from source (structure):
- `theme.majorTheme` — CRITICAL: controls which component variants render. Must match
- `theme.preset`, `theme.ui` (radius, spacing)
- `layout.navbar.variant`, `layout.footer.variant`
- Page structure: same pages, same section types and variants
- Section layout patterns (number of items, grid configurations)

### What to CUSTOMIZE:
- `theme.colors` — adjust if client has specific branding
- `theme.typography` — adjust if client has specific fonts
- `business.*` — all business identity fields
- `data.services` — new services matching the client's business
- `data.products` — new products if applicable
- All section content: headings, descriptions, CTAs, stats, testimonials, FAQ items
- All image URLs → point to newly uploaded R2 images
- `navigation.cta` — adjust CTA label/target

### Translation handling:
For DB-only businesses, you have two options:
1. **Multi-language** (preferred): Use `t:key.path` format in config, store translations in the `translations` column. Clone the source translations structure and replace all values with new content.
2. **Single-language**: Use literal text directly in the config JSON. Simpler but no i18n.

If the source uses `t:` keys, maintain the same key structure but with new translated values.

### Image URL replacement:
Walk the entire JSON tree and replace ALL image URLs that reference the source business:
- `https://pub-...r2.dev/{source-business}/...` → `https://pub-...r2.dev/{new-business}/...`
- Or replace with completely new images from Step 3

## STEP 5 — Save to Database

**IMPORTANT: Never create files in `templates/`. Cloned businesses go directly to the database. The `templates/` folder is reserved for manually authored base templates only.**

### Option A: Direct DB insert via script (recommended)

Create a temporary TypeScript script at `/tmp/clone-{new-business}.ts` that:
1. Connects to DB using `postgres` package
2. Upserts the site config
3. Updates translations
4. Creates blogs via direct insert
5. Creates projects via direct insert

```typescript
// /tmp/clone-{new-business}.ts
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const config = JSON.parse(await import('fs').then(fs => fs.readFileSync('/tmp/{new-business}-config.json', 'utf-8')));
  const translations = JSON.parse(await import('fs').then(fs => fs.readFileSync('/tmp/{new-business}-translations.json', 'utf-8')));

  // Upsert site
  const [existing] = await sql`SELECT id FROM sites WHERE subdomain = ${'{new-business}'}`;
  let siteId: number;

  if (existing) {
    await sql`UPDATE sites SET config = ${sql.json(config)}, translations = ${sql.json(translations)}, business_name = ${config.business.name}, industry = ${config.business.industry}, updated_at = NOW() WHERE subdomain = ${'{new-business}'}`;
    siteId = existing.id;
  } else {
    const [row] = await sql`INSERT INTO sites (subdomain, business_name, industry, config, translations, status) VALUES (${'{new-business}'}, ${config.business.name}, ${config.business.industry}, ${sql.json(config)}, ${sql.json(translations)}, 'released') RETURNING id`;
    siteId = row.id;
  }

  // Insert blogs
  const blogs = JSON.parse(await import('fs').then(fs => fs.readFileSync('/tmp/{new-business}-blogs.json', 'utf-8')));
  for (const blog of blogs) {
    const [existingBlog] = await sql`SELECT id FROM blogs WHERE site_id = ${siteId} AND slug = ${blog.slug} AND lang = ${blog.lang || 'en'}`;
    if (!existingBlog) {
      await sql`INSERT INTO blogs (site_id, slug, lang, title, description, content, image, author, category, tags, status, standalone, published_at, meta_title, meta_description) VALUES (${siteId}, ${blog.slug}, ${blog.lang || 'en'}, ${blog.title}, ${blog.description}, ${blog.content}, ${blog.image}, ${blog.author}, ${blog.category}, ${sql.json(blog.tags || [])}, ${blog.status || 'published'}, ${blog.standalone || false}, ${blog.publishedAt || blog.published_at || new Date().toISOString()}, ${blog.metaTitle || blog.meta_title || null}, ${blog.metaDescription || blog.meta_description || null})`;
    }
  }

  // Insert projects (if any)
  const projectsFile = '/tmp/{new-business}-projects.json';
  try {
    const projects = JSON.parse(await import('fs').then(fs => fs.readFileSync(projectsFile, 'utf-8')));
    for (const project of projects) {
      const [existingProject] = await sql`SELECT id FROM projects WHERE site_id = ${siteId} AND slug = ${project.slug} AND lang = ${project.lang || 'en'}`;
      if (!existingProject) {
        await sql`INSERT INTO projects (site_id, slug, lang, title, description, image, category, tags, status, published_at) VALUES (${siteId}, ${project.slug}, ${project.lang || 'en'}, ${project.title}, ${project.description}, ${project.image}, ${project.category}, ${sql.json(project.tags || [])}, ${project.status || 'published'}, ${project.publishedAt || project.published_at || new Date().toISOString()})`;
      }
    }
  } catch {}

  console.log('✅ Business cloned to DB. Site ID:', siteId);
  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
```

Run the script:
```bash
cd packages/db && DATABASE_URL="postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db" npx tsx /tmp/clone-{new-business}.ts
```

Delete the script after:
```bash
rm /tmp/clone-{new-business}.ts
```

### Option B: Admin API (if dev server is running)

```bash
# Save config
curl -X POST "https://{new-business}.dev.hazelgrouse.pl/api/admin/save" \
  -H "Content-Type: application/json" \
  -d '{"businessId": "{new-business}", "data": {FULL_JSON}}'

# Create each blog post
curl -X POST "https://{new-business}.dev.hazelgrouse.pl/api/admin/blogs/create" \
  -H "Content-Type: application/json" \
  -d '{"businessId": "{new-business}", "blog": {BLOG_JSON}}'
```

## STEP 6 — Clone Blogs

For each blog from the source business:
1. **If client-url provided**: Write new blog content relevant to the new business
2. **If no client-url**: Adapt the source blog content — change business name, industry terms, location references, and services mentioned
3. Each blog needs unique content — don't just copy-paste with find/replace

Blog fields to update:
- `title` — new title relevant to new business
- `description` — new SEO description
- `content` — rewritten HTML content
- `image` — new R2 image URL
- `author` — new author name
- `category` / `tags` — adjust to new business
- `lang` — maintain same languages as source
- `publishedAt` — use recent dates

## STEP 7 — Clone Projects (if source has them)

Same approach as blogs — clone and customize project/portfolio entries.

## STEP 8 — Restart Dev Server & Verify

```bash
pm2 restart astro-dev
```

Wait a few seconds, then verify with Playwright:
```
1. mcp__playwright__browser_navigate → https://{new-business}.dev.hazelgrouse.pl/
2. mcp__playwright__browser_take_screenshot → save to /screenshots/
3. Navigate to key subpages and screenshot each
```

### Verification checklist:
- [ ] Homepage loads with all sections
- [ ] Images display (not broken)
- [ ] Navigation works (all pages reachable)
- [ ] Contact info shows new business details (not source business)
- [ ] Services/products are customized
- [ ] Blog posts load and display
- [ ] Theme looks correct
- [ ] No references to the source business anywhere visible

## STEP 9 — Cleanup & Report

1. Delete all temporary files: upload scripts, temp JSON files in `/tmp/`
2. Clean up `/tmp/source-*.json` and `/tmp/{new-business}-*.json` files

### Report to user:
```
✅ Business cloned successfully!

Source: {source-business} → New: {new-business}
URL (dev): https://{new-business}.dev.hazelgrouse.pl/
URL (admin): https://{new-business}.dev.hazelgrouse.pl/admin

Business: {business-name}
Industry: {industry}
Theme: {majorTheme} (kept from source)
Services: {count}
Blog posts: {count}
Projects: {count}
Images uploaded: {count}

Screenshots saved to /screenshots/
```

## Important Notes

- **NEVER create files in `templates/`** — cloned businesses exist ONLY in the database. The `templates/` folder is reserved exclusively for manually authored base templates
- **The `majorTheme` MUST match the source** — changing it will break component variant rendering
- **All image URLs must be updated** — never leave source business image paths in the new config
- **Validate JSON against schema** before saving: `cd packages/schema && pnpm test:validate`
- **Check for hardcoded source references** — search the final JSON for the source subdomain string
- **Blog content must be unique** — rewrite, don't just find/replace
- **Translations must be consistent** — if source uses `t:` keys, new business must have all referenced keys in its translations