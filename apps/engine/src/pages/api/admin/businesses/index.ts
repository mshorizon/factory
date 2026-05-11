import type { APIRoute } from "astro";
import {
  getAllSites,
  getLatestHealthCheck,
  createSiteRecord,
  createTask,
} from "@mshorizon/db";
import { getAuthFromCookies } from "../../../../lib/auth";
import logger from "../../../../lib/logger";

const forbidden = () =>
  new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const GET: APIRoute = async ({ cookies, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== "super-admin") return forbidden();

  try {
    const allSites = await getAllSites();

    const businesses = await Promise.all(
      allSites.map(async (site) => {
        let healthStatus: string = "unknown";
        let lastCheckedAt: string | null = null;
        if (site.subdomain) {
          try {
            const latest = await getLatestHealthCheck(site.id);
            if (latest) {
              healthStatus = latest.status;
              lastCheckedAt = latest.checkedAt.toISOString();
            }
          } catch {
            // ignore health check errors
          }
        }

        return {
          id: site.id,
          subdomain: site.subdomain,
          businessName: site.businessName,
          industry: site.industry,
          status: site.status ?? "lead",
          healthStatus,
          lastCheckedAt,
          city: site.city,
          address: site.address,
          phone: site.phone,
          email: site.email,
          website: site.website,
          source: site.source,
          createdAt: site.createdAt.toISOString(),
          updatedAt: site.updatedAt.toISOString(),
          lastDeployedAt: site.lastDeployedAt?.toISOString() ?? null,
        };
      })
    );

    return json({ businesses });
  } catch (error) {
    (locals.logger ?? logger).error({ err: error }, "GET /api/admin/businesses failed");
    return json({ error: "Failed to fetch businesses" }, 500);
  }
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const auth = await getAuthFromCookies(cookies);
  if (!auth || auth.role !== "super-admin") return forbidden();

  try {
    const body = await request.json();
    const {
      businessName,
      subdomain,
      industry,
      existingWebsiteUrl,
      template,
      primaryColor,
      phone,
      email,
      address,
      notes,
    } = body ?? {};

    if (!businessName || !subdomain || !industry) {
      return json({ error: "businessName, subdomain and industry are required" }, 400);
    }

    const slugifiedSubdomain = String(subdomain)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const minimalConfig = {
      business: {
        name: businessName,
        industry,
        contact: {
          phone: phone ?? "",
          email: email ?? "",
          address: address ?? "",
        },
      },
      theme: {
        mode: "dark",
        ui: {
          primaryColor: primaryColor ?? "#000000",
          spacing: {},
          radius: {},
          font: {},
        },
      },
      pages: {},
    };

    const site = await createSiteRecord({
      subdomain: slugifiedSubdomain,
      businessName,
      industry,
      status: "onboarding",
      config: minimalConfig,
    });

    const chosenTemplate = template || "template-specialist";
    const taskDescription = `Create a complete business website for the following client.

Form data: ${JSON.stringify({ businessName, subdomain: slugifiedSubdomain, industry, existingWebsiteUrl, template, primaryColor, phone, email, address, notes }, null, 2)}

Steps to follow:
1. If an existing website URL was provided (${existingWebsiteUrl || "none"}), scrape it and extract: page copy, services/products/projects listed, contact info, images. Save all images to Cloudflare R2 and use the R2 URLs in the JSON config.
2. If no template was selected, analyze the industry description and choose the most appropriate template from templates/ directory. Document your choice in an ADR.
3. Generate a complete and valid business.json config based on the collected data and the chosen template schema.
4. Depending on the business type, populate as needed: blog posts, products, projects, services.
5. Save the business config to the database using upsertSiteConfig("${slugifiedSubdomain}", config).
6. Update the business status to 'active' when done: updateSiteStatus("${slugifiedSubdomain}", "active").
7. Update this task status to 'done' and write a short result summary.`;

    const task = await createTask({
      domain: slugifiedSubdomain,
      template: chosenTemplate,
      location: "admin:administration/businesses",
      page: "administration",
      section: "businesses",
      isAdminPanel: true,
      description: taskDescription,
      isSuperAdmin: true,
    });

    return json({ site, task }, 201);
  } catch (error: any) {
    if (error?.message?.includes("unique") || error?.code === "23505") {
      return json({ error: "A business with this subdomain already exists" }, 409);
    }
    (locals.logger ?? logger).error({ err: error }, "POST /api/admin/businesses failed");
    return json({ error: "Failed to create business" }, 500);
  }
};
