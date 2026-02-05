import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  subdomain: text("subdomain").notNull().unique(),
  businessName: text("business_name").notNull(),
  industry: text("industry"),
  config: jsonb("config").notNull(),
  translations: jsonb("translations").$type<Record<string, Record<string, unknown>>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
