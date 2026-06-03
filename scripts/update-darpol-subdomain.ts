import { initDb } from "../packages/db/src/index.js";
import { getDb } from "../packages/db/src/client.js";
import { eq } from "drizzle-orm";
import { sites, users } from "../packages/db/src/schema.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

const OLD_SUBDOMAIN = "darpol-elektryk";
const NEW_SUBDOMAIN = "dariusz-zielinski-darpol";

async function main() {
  const db = getDb();

  const [existing] = await db
    .select({ id: sites.id, subdomain: sites.subdomain })
    .from(sites)
    .where(eq(sites.subdomain, OLD_SUBDOMAIN))
    .limit(1);

  if (!existing) throw new Error(`Site "${OLD_SUBDOMAIN}" not found`);

  await db
    .update(sites)
    .set({ subdomain: NEW_SUBDOMAIN, updatedAt: new Date() })
    .where(eq(sites.subdomain, OLD_SUBDOMAIN));
  console.log(`✓ sites.subdomain: "${OLD_SUBDOMAIN}" → "${NEW_SUBDOMAIN}"`);

  // Update users linked to this business
  const updatedUsers = await db
    .update(users)
    .set({ businessId: NEW_SUBDOMAIN, updatedAt: new Date() })
    .where(eq(users.businessId, OLD_SUBDOMAIN))
    .returning({ email: users.email });

  if (updatedUsers.length > 0) {
    console.log(`✓ Updated businessId for ${updatedUsers.length} user(s): ${updatedUsers.map(u => u.email).join(", ")}`);
  } else {
    console.log("  (no users had businessId = old subdomain)");
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
