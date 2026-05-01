import type { APIRoute } from "astro";
import { getLeadById, updateLeadStatus, createSiteRecord, createTask } from "@mshorizon/db";

const forbidden = () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.auth || locals.auth.role !== "super-admin") return forbidden();

  let body: { leadId?: number; template?: string; subdomain?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { leadId, template = "template-specialist", subdomain } = body;
  if (!leadId || !subdomain) return json({ error: "leadId and subdomain required" }, 400);

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
1. If an existing website URL was provided (${lead.website || "none"}), scrape it and extract: page copy, services/products, contact info, images. Save images to R2 and use R2 URLs.
2. Use the "${template}" template as the base.
3. Generate a complete and valid business.json config based on the lead data.
4. Save the business config to the database using upsertSiteConfig("${slugifiedSubdomain}", config).
5. Update the business status to 'released' when done: updateSiteStatus("${slugifiedSubdomain}", "released").
6. Update this task status to 'done' and write a short result summary.`;

  const task = await createTask({
    domain: slugifiedSubdomain,
    template,
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
