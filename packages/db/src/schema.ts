import { pgTable, serial, text, jsonb, timestamp, integer, unique } from "drizzle-orm/pg-core";

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

export const blogs = pgTable("blogs", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: 'cascade' }),

  // Content
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  image: text("image"),

  // Metadata
  author: text("author"),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().default([]),

  // Publishing
  status: text("status").notNull().default("draft"), // "draft" | "published"
  publishedAt: timestamp("published_at"),

  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueSlugPerSite: unique().on(table.siteId, table.slug),
}));

export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  blogId: integer("blog_id").notNull().references(() => blogs.id, { onDelete: 'cascade' }),

  // Content
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),

  // Moderation
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "spam"
  moderatedBy: text("moderated_by"),
  moderatedAt: timestamp("moderated_at"),

  // Spam detection
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export const clientUsers = pgTable("client_users", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("owner"), // "owner" | "manager"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueEmailPerSite: unique().on(table.siteId, table.email),
}));

export type ClientUser = typeof clientUsers.$inferSelect;
export type NewClientUser = typeof clientUsers.$inferInsert;

export const clientSessions = pgTable("client_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => clientUsers.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClientSession = typeof clientSessions.$inferSelect;
export type NewClientSession = typeof clientSessions.$inferInsert;
