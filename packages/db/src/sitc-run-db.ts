/**
 * Run-scoped DB adapters for SITC (DESIGN §13.2).
 *
 * sitc-core stays driver-free: it defines the `RunDbSeedFn` contract and calls
 * it. This module provides the prod implementation — a fresh postgres client
 * pointed at the ISOLATED run DB (never the shared dev singleton in client.ts),
 * plus a `SqlExec` for provision/teardown (orchestrator/run-db.ts).
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { sites } from "./schema.js";
import { eq } from "drizzle-orm";
import type { BusinessProfile } from "@mshorizon/schema";

/**
 * Seed a run's working profile into its isolated DB. Matches sitc-core's
 * `RunDbSeedFn` shape so it can be passed straight to `seedRunDb({ seed })`.
 * Opens (and closes) a dedicated client so it never touches the dev singleton.
 */
export async function seedRunProfile(args: {
  runDbUrl: string;
  businessId: string;
  profile: BusinessProfile;
}): Promise<void> {
  const client = postgres(args.runDbUrl, { max: 1 });
  try {
    const db = drizzle(client, { schema });
    const cfg = args.profile as unknown as Record<string, unknown>;
    const businessName = (args.profile as any)?.business?.name ?? args.businessId;
    const industry = (args.profile as any)?.business?.industry ?? null;

    const [existing] = await db.select().from(sites).where(eq(sites.subdomain, args.businessId)).limit(1);
    if (existing) {
      await db
        .update(sites)
        .set({ config: cfg as any, businessName, industry, updatedAt: new Date() })
        .where(eq(sites.subdomain, args.businessId));
    } else {
      await db.insert(sites).values({
        subdomain: args.businessId,
        businessName,
        industry,
        config: cfg as any,
        translations: {},
      });
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

/**
 * A `SqlExec` (sitc-core orchestrator/run-db.ts) backed by a one-shot admin
 * client. Used for CREATE/DROP DATABASE — runs outside any transaction.
 * Gated on an explicit operator run (never invoked against prod here).
 */
export function createSqlExec(adminUrl: string): { query(sql: string): Promise<unknown>; close(): Promise<void> } {
  const client = postgres(adminUrl, { max: 1 });
  return {
    async query(raw: string) {
      return client.unsafe(raw);
    },
    async close() {
      await client.end({ timeout: 5 });
    },
  };
}
