import type { APIRoute } from "astro";
import { getSiteBySubdomain, updateSiteUmamiId } from "@mshorizon/db";

const UMAMI_URL = import.meta.env.UMAMI_URL;
const UMAMI_USERNAME = import.meta.env.UMAMI_USERNAME;
const UMAMI_PASSWORD = import.meta.env.UMAMI_PASSWORD;

// Cache token in memory (valid ~24h in Umami)
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Umami login failed (${res.status}): ${text} [user: ${UMAMI_USERNAME}, url: ${UMAMI_URL}]`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000, // 23h
  };
  return data.token;
}

async function umamiRequest(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${UMAMI_URL}/api${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Umami API error on ${path} (${res.status}): ${text}`);
  }
  return res.json();
}

async function getOrCreateWebsite(subdomain: string, domain: string): Promise<string> {
  const site = await getSiteBySubdomain(subdomain);
  if (site?.umamiWebsiteId) return site.umamiWebsiteId;

  const created = await umamiRequest("/websites", {
    method: "POST",
    body: JSON.stringify({ name: subdomain, domain }),
  });

  const websiteId: string = created.id;
  await updateSiteUmamiId(subdomain, websiteId);
  return websiteId;
}

export const GET: APIRoute = async ({ locals, url }) => {
  if (!UMAMI_URL || !UMAMI_USERNAME || !UMAMI_PASSWORD) {
    return new Response(JSON.stringify({ error: "Analytics not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { businessId } = locals;
  const period = url.searchParams.get("period") || "7d";

  const now = Date.now();
  const periods: Record<string, number> = {
    "1d": 86400000,
    "7d": 7 * 86400000,
    "30d": 30 * 86400000,
    "90d": 90 * 86400000,
  };
  const ms = periods[period] ?? periods["7d"];
  const startAt = now - ms;

  try {
    const domain = `${businessId}.hazelgrouse.pl`;
    const websiteId = await getOrCreateWebsite(businessId, domain);

    const baseParams = new URLSearchParams({
      startAt: String(startAt),
      endAt: String(now),
    });
    const pageviewParams = new URLSearchParams({
      startAt: String(startAt),
      endAt: String(now),
      timezone: "Europe/Warsaw",
      unit: "day",
    });

    const [stats, pageviews, pages, referrers, devices, utmSources, utmCampaigns] = await Promise.all([
      umamiRequest(`/websites/${websiteId}/stats?${baseParams}`),
      umamiRequest(`/websites/${websiteId}/pageviews?${pageviewParams}`),
      umamiRequest(`/websites/${websiteId}/metrics?${baseParams}&type=path`),
      umamiRequest(`/websites/${websiteId}/metrics?${baseParams}&type=referrer`),
      umamiRequest(`/websites/${websiteId}/metrics?${baseParams}&type=device`),
      umamiRequest(`/websites/${websiteId}/metrics?${baseParams}&type=utm_source`).catch(() => []),
      umamiRequest(`/websites/${websiteId}/metrics?${baseParams}&type=utm_campaign`).catch(() => []),
    ]);

    return new Response(
      JSON.stringify({ websiteId, stats, pageviews, pages, referrers, devices, utmSources, utmCampaigns }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
