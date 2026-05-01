import type { APIRoute } from "astro";
import { getAllSites } from "@mshorizon/db";

const forbidden = () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.auth || locals.auth.role !== "super-admin") return forbidden();
  try {
    const sites = await getAllSites();
    return json({ sites: sites.map((s) => ({ id: s.id, subdomain: s.subdomain, businessName: s.businessName, industry: s.industry, status: s.status })) });
  } catch {
    return json({ error: "Failed to load sites" }, 500);
  }
};
