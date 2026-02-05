import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let dbUrl: string | undefined;

export function initDb(url: string) {
  dbUrl = url;
}

export function getDb() {
  if (!db) {
    const url = dbUrl || process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    client = postgres(url);
    db = drizzle(client, { schema });
  }
  return db;
}
