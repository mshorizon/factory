---
name: create-business
description: Create a new business website from a template. Takes template name, business domain, and optional client website URL. Populates DB directly (no template files), finds/uploads images to R2, creates blogs and services.
---

## Purpose

Scaffold a new business website that lives **only in the database** (no files in `templates/`). Based on an existing template's structure, customized with real or generated content.

## Parameters

Parse from the user's invocation:
1. **template** (required) — source template directory name, e.g. `template-law`, `template-specialist`, `template-tech`, `template-art`
2. **business-domain** (required) — subdomain for the site, e.g. `tom-lawyer` → `tom-lawyer.hazelgrouse.pl`
3. **client-url** (optional) — URL of the actual client's website to scrape for real business info

Example invocations:
```
/create-business template-law jan-kowalski-adwokat
/create-business template-specialist mario-plumber https://mario-plumbing.com
/create-business template-tech acme-software https://acme.io
```

## Files to read before starting

Read these to understand the architecture:
- The source template JSON: `templates/{template}/{template}.json`
- The source template translations: `templates/{template}/translations/`
- The source template blogs: `templates/{template}/blogs/` (if exists)
- Schema: `packages/schema/src/business.schema.json`
- DB queries: `packages/db/src/queries.ts` — especially `upsertSiteConfig()`
- R2 lib: `apps/engine/src/lib/r2.ts`
- Admin save endpoint: `apps/engine/src/pages/api/admin/save.ts`
- Existing upload scripts for pattern: `scripts/upload-portfolio-law-blog-images.mjs`

## STEP 1 — Gather Information

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
Generate realistic placeholder content appropriate for the industry. Use the template's industry as guidance:
- `template-law` → legal services (lawyer, notary, tax advisor)
- `template-specialist` → trade services (plumber, electrician, barber)
- `template-tech` → tech company (software house, SaaS, IT consulting)
- `template-art` → creative (artist, photographer, designer)

Generate a realistic Polish business with:
- Real-sounding Polish business name
- Warsaw or other Polish city address
- Realistic phone (+48 xxx xxx xxx) and email
- Industry-appropriate services (5-8 services)
- Realistic testimonials (3-5)
- Blog post topics relevant to the industry

## STEP 2 — Prepare Images

Images are critical — every business needs unique visuals. The business ID for R2 paths is the **business-domain** parameter (e.g., `tom-lawyer`).

### Strategy for finding images:
1. **If client-url provided**: Download key images from the client's site using Playwright
2. **For all businesses**: Find high-quality royalty-free images from Unsplash that match the industry

### Required images (depending on template sections):
- **Hero image** — main banner/background
- **About image** — team or founder photo
- **Service images** — one per service (if template uses service images)
- **Blog images** — one per blog post
- **Testimonial avatars** — optional but nice
- **Gallery images** — if template has gallery section

### Upload to R2:

Create a Node.js script to download and upload images. Use this pattern (from existing scripts):

```javascript
// Save as a temporary .mjs script, run with `node`, then delete
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_CONFIG = {
  endpoint: "https://b1904e29dea07111f8dd157eb07973af.r2.cloudflarestorage.com",
  accessKeyId: "d324e6cb094303144c3c652ca196ffac",
  secretAccessKey: "def36f9b9d01afe0a770fae6c1e0d90ec94a8784e019d48c59726b939609c8ce",
  bucketName: "hazelgrouse-r2",
  publicUrl: "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev",
};

const BUSINESS_ID = "{business-domain}"; // e.g., "tom-lawyer"

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

**R2 URL format**: `https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/{business-domain}/{filename}`

After uploading, note all R2 URLs for use in the business JSON.
Delete the temporary upload script when done.

## STEP 3 — Build Business JSON

Clone the source template JSON and customize it completely. The new business JSON must be a **fully independent** configuration.

### Mandatory changes:
```json
{
  "business": {
    "id": "{business-domain}",          // e.g., "tom-lawyer"
    "name": "t:business.name",          // use translation keys
    "industry": "{appropriate-industry}",
    "assets": {
      "favicon": "...",                 // generate or use template's
      "icon": "..."
    },
    "contact": {
      "address": "...",                 // real address from client or generated
      "phone": "+48 ...",
      "email": "...",
      "location": { "latitude": ..., "longitude": ... }
    }
  }
}
```

### Theme:
- Keep the source template's `majorTheme` (this controls which component variants render correctly)
- Optionally adjust colors if the client has specific branding
- Keep typography and spacing from the template

### Data — Services, Products:
- If template has `data.services`: create 4-8 services appropriate for the business
- If template has `data.products`: create 3-6 products if relevant
- Each service/product needs: `id`, `slug`, `title` (use `t:` translation keys), `description`, `icon`, `category`
- Use R2 URLs for any service/product images

### Pages and Sections:
- Keep the same page structure and section types/variants as the source template
- Update content references to use new translation keys
- Replace all image URLs with newly uploaded R2 URLs
- Adjust section content counts (testimonials, FAQ items, etc.) as needed

### Translation key convention:
All user-facing text should use `t:key.path` format in the JSON, with actual text in translation files. Since DB-only businesses don't have translation files, include translations directly in the config OR save them via the API.

**IMPORTANT**: For DB-only businesses, you have two options:
1. Put translations in the `translations` column of the `sites` table (preferred for multi-language)
2. Use literal text instead of `t:` keys (simpler for single-language businesses)

Choose based on whether the business needs multiple languages.

## STEP 4 — Save to Database

Use the seed script approach to insert the business into the database. Create a temporary one-off seed script:

```bash
# Option A: Use the admin API (if dev server is running)
curl -X POST "https://{business-domain}.dev.hazelgrouse.pl/api/admin/save" \
  -H "Content-Type: application/json" \
  -d '{"businessId": "{business-domain}", "data": {FULL_JSON}}'

# Option B: Direct DB insert via a temporary script (more reliable)
```

For **Option B**, create a temporary TypeScript file that:
1. Connects to the DB using `DATABASE_URL`
2. Calls `upsertSiteConfig()` from `packages/db/src/queries.ts`
3. Also saves translations if using `t:` keys

The DATABASE_URL is:
```
postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db
```

**IMPORTANT: Never create files in `templates/`. The `templates/` folder is reserved for manually authored base templates only. All new businesses go directly to the database.**

## STEP 5 — Create Blog Posts

If the source template has blogs, create equivalent blog posts for the new business.

### For each blog post:
1. Write content relevant to the new business's industry and services
2. Generate in the business's primary language (and optionally in other languages)
3. Include: slug, title, description, content (HTML), image (R2 URL), author, category, tags
4. Blog posts should be substantive (500-1000 words) and SEO-friendly

### Save blogs:
Use the admin API or a direct DB script (same as STEP 4):

```bash
curl -X POST "https://{business-domain}.dev.hazelgrouse.pl/api/admin/blogs/create" \
  -H "Content-Type: application/json" \
  -d '{"businessId": "{business-domain}", "blog": {BLOG_OBJECT}}'
```

The blog object format:
```json
{
  "slug": "my-blog-post",
  "title": "Blog Post Title",
  "description": "Short description for SEO",
  "content": "<h2>...</h2><p>...</p>",
  "image": "https://pub-...r2.dev/{business-domain}/blog-image.jpg",
  "author": "Author Name",
  "category": "Category",
  "tags": ["tag1", "tag2"],
  "status": "published",
  "lang": "pl",
  "publishedAt": "2026-01-15T08:00:00Z"
}
```

## STEP 6 — Restart Dev Server & Verify

```bash
pm2 restart astro-dev
```

Wait a few seconds, then verify with Playwright:
```
1. mcp__playwright__browser_navigate → https://{business-domain}.dev.hazelgrouse.pl/
2. mcp__playwright__browser_take_screenshot → save to /screenshots/
3. Navigate to key subpages (about, services, contact, blog) and screenshot each
```

### Checklist:
- [ ] Homepage loads correctly with all sections
- [ ] Images display (not broken)
- [ ] Navigation works (all pages reachable)
- [ ] Contact info is correct
- [ ] Services/products display properly
- [ ] Blog posts are accessible
- [ ] Theme looks appropriate

## STEP 7 — Cleanup & Report

1. Delete any temporary files (upload scripts, temp JSON in `/tmp/`)

### Report to user:
```
Business created: {business-domain}
URL (dev): https://{business-domain}.dev.hazelgrouse.pl/
URL (admin): https://{business-domain}.dev.hazelgrouse.pl/admin

Template: {template}
Industry: {industry}
Services: {count}
Blog posts: {count}
Images uploaded: {count}

Screenshots saved to /screenshots/
```

## Important Notes

- **NEVER create files in `templates/`** — new businesses exist ONLY in the database. The `templates/` folder is reserved exclusively for manually authored base templates
- **The `majorTheme` must match the source template** — this ensures correct component rendering
- **All images must be on R2** — never use local paths or external hotlinks (except Unsplash)
- **Validate JSON against schema** before saving: `cd packages/schema && pnpm test:validate`
- **Blog content should be unique** — don't just copy the template's blogs, write new ones