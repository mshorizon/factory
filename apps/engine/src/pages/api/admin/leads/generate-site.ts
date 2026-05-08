import type { APIRoute } from "astro";
import { getLeadById, updateLeadStatus, createSiteRecord, createTask } from "@mshorizon/db";

const forbidden = () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.auth || locals.auth.role !== "super-admin") return forbidden();

  let body: { leadId?: number; template?: string; cloneFrom?: string; subdomain?: string; additionalRequirements?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { leadId, template = "template-specialist", cloneFrom, subdomain, additionalRequirements } = body;
  if (!leadId || !subdomain) return json({ error: "leadId and subdomain required" }, 400);
  if (cloneFrom !== undefined && !cloneFrom) return json({ error: "cloneFrom cannot be empty when provided" }, 400);

  const lead = await getLeadById(Number(leadId));
  if (!lead) return json({ error: "Lead not found" }, 404);

  const slugifiedSubdomain = String(subdomain)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const minimalConfig = {
    business: {
      name: lead.name,
      industry: lead.businessType,
      contact: {
        phone: lead.phone ?? "",
        email: lead.email ?? "",
        address: lead.address ?? "",
      },
    },
    theme: { mode: "dark", ui: { primaryColor: "#000000", spacing: {}, radius: {}, font: {} } },
    pages: {},
  };

  let site;
  try {
    site = await createSiteRecord({
      subdomain: slugifiedSubdomain,
      businessName: lead.name,
      industry: lead.businessType,
      status: "draft",
      config: minimalConfig,
    });
  } catch (err: any) {
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return json({ error: "A business with this subdomain already exists" }, 409);
    }
    return json({ error: "Failed to create site" }, 500);
  }

  const baseInstruction = cloneFrom
    ? `Clone the design and structure from the existing business "${cloneFrom}" (read its config from the DB via getSiteBySubdomain("${cloneFrom}")) and adapt the content for the new lead.`
    : `Use the "${template}" template as the base.`;

  const taskDescription = `Create a complete business website for a lead.

Lead data:
- Name: ${lead.name}
- Business type: ${lead.businessType}
- City: ${lead.city}
- Address: ${lead.address}
- Phone: ${lead.phone}
- Email: ${lead.email}
- Existing website: ${lead.website || "none"}

Steps:
1. If an existing website URL was provided (${lead.website || "none"}), scrape it with Playwright and extract: page copy, services/products/projects, contact info, images. Save images to R2 and use R2 URLs.
2. ${baseInstruction}
3. Generate a complete and valid business.json config based on the lead data.
4. Save the business config to the database using upsertSiteConfig("${slugifiedSubdomain}", config).
5. Update the business status to 'released' when done: updateSiteStatus("${slugifiedSubdomain}", "released").
6. Update this task status to 'done' and write a short result summary.

CONTENT REQUIREMENTS — all of the following are mandatory:

### Translations
The site must have full translations in 4 languages. Polish is the main/default language.
Use the createBlog / upsertSiteConfig translation mechanism already used by other sites in the DB.
Required languages: pl (primary), en, de, uk (Ukrainian).
Every user-visible string (hero headline, service names, about text, CTA labels, footer tagline, nav items, blog titles/content) must be translated into all 4 languages.
Look at an existing multilingual site in the DB (e.g. getSiteBySubdomain("template-law")) to understand the translation data structure before writing translations.
${cloneFrom ? `
### Content items (services / projects / products / files)
Copy all content items (services, projects, products, files) directly from the source business "${cloneFrom}" as-is. Do NOT generate new items — use the exact data from the source config.

### Blog posts
Copy all blog posts from the source business "${cloneFrom}" as-is using getAllBlogsBySubdomain("${cloneFrom}") (or equivalent). Re-create them for the new subdomain using createBlog with the same content and language variants. Do NOT write new blog posts.` : `
### Content items (services / projects / products / files)
Check what content type the base template "${template}" uses (services, projects, products, or files).
Generate at least 5 realistic items of that type, tailored to the lead's business type ("${lead.businessType}") and city ("${lead.city}").
Each item must be translated into all 4 languages (pl, en, de, uk).

### Blog posts
Create exactly 3 blog posts relevant to the lead's business type and local market.
Each blog post must exist in all 4 language variants (pl, en, de, uk) — use the createBlog DB function for each language variant.
Blog posts should be practical, SEO-friendly articles (400–800 words each) that a local customer would actually search for.
Save blogs to DB after saving the main site config.`}${additionalRequirements ? `

### Additional requirements from operator
${additionalRequirements}` : ""}`;


  const task = await createTask({
    domain: slugifiedSubdomain,
    template: cloneFrom ? `clone:${cloneFrom}` : template,
    location: "admin:administration/leads",
    page: "administration",
    section: "leads",
    isAdminPanel: true,
    description: taskDescription,
    isSuperAdmin: true,
  });

  await updateLeadStatus(Number(leadId), "site_generated", site.id, slugifiedSubdomain);

  return json({ site, task, subdomain: slugifiedSubdomain }, 201);
};
