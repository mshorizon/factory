import type { APIRoute } from "astro";
import { getAllSubdomains, getSiteBySubdomain, updateSiteUmamiId } from "@mshorizon/db";
import logger from "../../../lib/logger";

const UMAMI_URL = import.meta.env.UMAMI_URL;
const UMAMI_USERNAME = import.meta.env.UMAMI_USERNAME;
const UMAMI_PASSWORD = import.meta.env.UMAMI_PASSWORD;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }
  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: UMAMI_USERNAME, password: UMAMI_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Umami login failed (${res.status})`);
  const data = await res.json();
  cachedToken = { token: data.token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
  return data.token;
}

async function umamiRequest(path: string) {
  const token = await getToken();
  const res = await fetch(`${UMAMI_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

export const GET: APIRoute = async ({ url, locals }) => {
  if (!UMAMI_URL || !UMAMI_USERNAME || !UMAMI_PASSWORD) {
    return new Response(JSON.stringify({ error: "Analytics not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const period = url.searchParams.get("period") || "7d";
    const now = Date.now();
    const periods: Record<string, number> = {
      "1d": 86400000, "7d": 7 * 86400000, "30d": 30 * 86400000, "90d": 90 * 86400000,
    };
    const ms = periods[period] ?? periods["7d"];
    const startAt = now - ms;
    const baseParams = new URLSearchParams({ startAt: String(startAt), endAt: String(now) });

    const subdomains = await getAllSubdomains();

    const businesses = await Promise.all(
      subdomains.map(async (subdomain) => {
        const site = await getSiteBySubdomain(subdomain);
        if (!site) return null;

        const config = site.config as any;
        const websiteId = site.umamiWebsiteId;
        if (!websiteId) {
          return {
            subdomain,
            businessName: config?.business?.name || subdomain,
            stats: null,
            error: "No analytics configured",
          };
        }

        try {
          const stats = await umamiRequest(`/websites/${websiteId}/stats?${baseParams}`);
          return {
            subdomain,
            businessName: config?.business?.name || subdomain,
            stats,
          };
        } catch {
          return {
            subdomain,
            businessName: config?.business?.name || subdomain,
            stats: null,
            error: "Failed to fetch",
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ businesses: businesses.filter(Boolean) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    (locals.logger ?? logger).error({ err: error, endpoint: "/api/admin/global-analytics" }, "Error fetching global analytics");
    return new Response(
      JSON.stringify({ error: "Failed to fetch global analytics" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
