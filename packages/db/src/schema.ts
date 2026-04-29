import { pgTable, serial, text, jsonb, timestamp, integer, unique, boolean, bigint, uuid } from "drizzle-orm/pg-core";

export const SITE_STATUSES = ["draft", "released", "suspended"] as const;
export type SiteStatus = typeof SITE_STATUSES[number];

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  subdomain: text("subdomain").notNull().unique(),
  businessName: text("business_name").notNull(),
  industry: text("industry"),
  status: text("status").notNull().default("released"), // SiteStatus
  config: jsonb("config").notNull(),
  translations: jsonb("translations").$type<Record<string, Record<string, unknown>>>().default({}),
  umamiWebsiteId: text("umami_website_id"),
  lastDeployedAt: timestamp("last_deployed_at"),
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
  standalone: boolean("standalone").notNull().default(false), // if true: hidden from /blog listing and blog sections
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

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// --- Orders ---

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: 'cascade' }),

  orderNumber: text("order_number").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "paid" | "shipped" | "cancelled"

  // Customer
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerFirstName: text("customer_first_name").notNull(),
  customerLastName: text("customer_last_name").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingPostalCode: text("shipping_postal_code").notNull(),

  // Money (integers — grosze/cents)
  subtotal: integer("subtotal").notNull(),
  shippingCost: integer("shipping_cost").notNull().default(0),
  total: integer("total").notNull(),
  currency: text("currency").notNull().default("PLN"),

  // Stripe
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),

  // Invoice
  invoiceUrl: text("invoice_url"),

  // Admin notes
  notes: text("notes"),

  // Timestamps
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueOrderPerSite: unique().on(table.siteId, table.orderNumber),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),

  productId: text("product_id").notNull(),
  title: text("title").notNull(),
  unitPrice: integer("unit_price").notNull(), // grosze/cents
  quantity: integer("quantity").notNull(),
  total: integer("total").notNull(), // unitPrice * quantity

  image: text("image"),
  customizations: jsonb("customizations").$type<Record<string, string>>(),
  customizationLabels: jsonb("customization_labels").$type<Record<string, string>>(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// --- Bookings ---

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: 'cascade' }),

  // Service & staff
  serviceId: text("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  serviceDuration: integer("service_duration").notNull().default(60), // minutes
  staffId: text("staff_id"),
  staffName: text("staff_name"),

  // Customer
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),

  // Appointment
  date: text("date").notNull(),       // "2024-03-15"
  startTime: text("start_time").notNull(), // "10:00"
  endTime: text("end_time").notNull(),     // "11:00"

  // Status
  status: text("status").notNull().default("pending"), // "pending" | "confirmed" | "cancelled" | "completed"
  notes: text("notes"),

  // Tokens for confirm/cancel links
  confirmToken: text("confirm_token"),
  cancelToken: text("cancel_token"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

// --- Business Files ---

export const businessFiles = pgTable("business_files", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: 'cascade' }),

  // File info
  name: text("name").notNull(),         // original filename (sanitized)
  originalName: text("original_name").notNull(), // as uploaded by user
  url: text("url").notNull(),           // public R2 URL
  r2Key: text("r2_key").notNull(),      // R2 object key (for deletion)
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),       // bytes

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BusinessFile = typeof businessFiles.$inferSelect;
export type NewBusinessFile = typeof businessFiles.$inferInsert;

// --- Claude Code Tasks ---

export const TASK_STATUSES = ["pending", "in-progress", "on_hold", "done", "failed"] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").notNull().default("pending"), // "pending" | "in-progress" | "done" | "failed"
  domain: text("domain").notNull(),
  template: text("template").notNull(),
  location: text("location").notNull(),   // derived: "admin:{page}/{section}" or "{page}/{section}"
  page: text("page"),                      // e.g. "home", "about", "services" or admin nav group id
  section: text("section"),               // section type from business JSON or admin nav item id
  isAdminPanel: boolean("is_admin_panel").notNull().default(false),
  description: text("description").notNull(),
  clarification: text("clarification"),
  summary: text("summary"),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// --- Strategic Suggestions ---

export const SUGGESTION_CATEGORIES = ["tech_debt", "feature", "marketing", "client_acquisition", "infrastructure"] as const;
export const SUGGESTION_EFFORT = ["s", "m", "l", "xl"] as const;
export const SUGGESTION_STATUSES = ["pending", "accepted", "rejected", "done"] as const;
export type SuggestionCategory = typeof SUGGESTION_CATEGORIES[number];
export type SuggestionEffort = typeof SUGGESTION_EFFORT[number];
export type SuggestionStatus = typeof SUGGESTION_STATUSES[number];

export const strategicSuggestions = pgTable("strategic_suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  rationale: text("rationale").notNull(),
  category: text("category").notNull(), // SuggestionCategory
  priority: integer("priority").notNull(), // 1-5
  effort: text("effort").notNull(), // SuggestionEffort
  status: text("status").notNull().default("pending"), // SuggestionStatus
  createdBy: text("created_by").notNull().default("claude_scheduler"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StrategicSuggestion = typeof strategicSuggestions.$inferSelect;
export type NewStrategicSuggestion = typeof strategicSuggestions.$inferInsert;
