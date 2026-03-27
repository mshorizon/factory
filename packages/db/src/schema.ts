import { pgTable, serial, text, jsonb, timestamp, integer, unique, boolean, bigint } from "drizzle-orm/pg-core";

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  subdomain: text("subdomain").notNull().unique(),
  businessName: text("business_name").notNull(),
  industry: text("industry"),
  config: jsonb("config").notNull(),
  translations: jsonb("translations").$type<Record<string, Record<string, unknown>>>().default({}),
  umamiWebsiteId: text("umami_website_id"),
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
  lang: text("lang").notNull().default("en"), // "en" | "pl"
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
  uniqueSlugPerSiteLang: unique().on(table.siteId, table.slug, table.lang),
}));

export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: 'cascade' }),

  // Content
  slug: text("slug").notNull(),
  lang: text("lang").notNull().default("en"), // "en" | "pl"
  title: text("title").notNull(),
  description: text("description"),
  image: text("image"),

  // Metadata
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().default([]),

  // Publishing
  status: text("status").notNull().default("draft"), // "draft" | "published"
  publishedAt: timestamp("published_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueSlugPerSiteLang: unique().on(table.siteId, table.slug, table.lang),
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

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

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: 'cascade' }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

// --- Monitoring ---

export const healthChecks = pgTable("health_checks", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").references(() => sites.id, { onDelete: 'cascade' }),
  status: text("status").notNull(), // "healthy" | "degraded" | "unhealthy"
  checks: jsonb("checks").notNull(), // { database: { status, latencyMs }, r2: { status, latencyMs } }
  latencyMs: integer("latency_ms"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export type HealthCheck = typeof healthChecks.$inferSelect;
export type NewHealthCheck = typeof healthChecks.$inferInsert;

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").references(() => sites.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // "health_check_failure" | "5xx_threshold"
  channel: text("channel").notNull(), // "email" | "slack"
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

// --- Auth ---

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // "admin" | "super-admin"
  businessId: text("business_id"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  ipAddress: text("ip_address"),
  success: boolean("success").notNull().default(false),
  attemptedAt: timestamp("created_at").defaultNow().notNull(),
});

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type NewLoginAttempt = typeof loginAttempts.$inferInsert;
