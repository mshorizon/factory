import { eq } from "drizzle-orm";
import { getDb } from "./client.js";
import { sites } from "./schema.js";
import type { BusinessProfile } from "@mshorizon/schema";

export async function getAllSubdomains(): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ subdomain: sites.subdomain })
    .from(sites);
  return rows.map((r) => r.subdomain);
}

export async function getSiteBySubdomain(subdomain: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(sites)
    .where(eq(sites.subdomain, subdomain))
    .limit(1);
  return row ?? null;
}

export async function upsertSiteConfig(
  subdomain: string,
  config: BusinessProfile
) {
  const db = getDb();
  const existing = await getSiteBySubdomain(subdomain);

  if (existing) {
    await db
      .update(sites)
      .set({
        config,
        businessName: config.business.name,
        industry: config.business.industry ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sites.subdomain, subdomain));
  } else {
    await db.insert(sites).values({
      subdomain,
      businessName: config.business.name,
      industry: config.business.industry ?? null,
      config,
      translations: {},
    });
  }
}

export async function updateSiteTranslations(
  subdomain: string,
  translations: Record<string, Record<string, unknown>>
) {
  const db = getDb();

  // Merge with existing translations so partial updates don't lose data
  const existing = await getSiteBySubdomain(subdomain);
  const merged = {
    ...((existing?.translations as Record<string, Record<string, unknown>>) ?? {}),
    ...translations,
  };

  await db
    .update(sites)
    .set({
      translations: merged,
      updatedAt: new Date(),
    })
    .where(eq(sites.subdomain, subdomain));
}
