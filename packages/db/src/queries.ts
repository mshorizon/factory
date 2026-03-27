import { eq, and, desc, gte, sql, count } from "drizzle-orm";
import { getDb } from "./client.js";
import { sites, blogs, comments, projects, pushSubscriptions, healthChecks, alerts, users, loginAttempts, orders, orderItems } from "./schema.js";
import type { BusinessProfile } from "@mshorizon/schema";
import type { NewBlog, NewComment, NewProject, NewPushSubscription, NewHealthCheck, NewAlert, NewOrder, NewOrderItem } from "./schema.js";

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

export async function updateSiteUmamiId(subdomain: string, umamiWebsiteId: string) {
  const db = getDb();
  await db
    .update(sites)
    .set({ umamiWebsiteId, updatedAt: new Date() })
    .where(eq(sites.subdomain, subdomain));
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

// ========== Blog Queries ==========

export async function getBlogsBySiteId(siteId: number, publishedOnly = true, lang?: string) {
  const db = getDb();
  const conditions = [eq(blogs.siteId, siteId)];
  if (publishedOnly) conditions.push(eq(blogs.status, "published"));
  if (lang) conditions.push(eq(blogs.lang, lang));

  return await db
    .select()
    .from(blogs)
    .where(and(...conditions))
    .orderBy(desc(blogs.publishedAt));
}

export async function getBlogBySlug(siteId: number, slug: string, lang?: string) {
  const db = getDb();
  const conditions = [eq(blogs.siteId, siteId), eq(blogs.slug, slug)];
  if (lang) conditions.push(eq(blogs.lang, lang));

  const [row] = await db
    .select()
    .from(blogs)
    .where(and(...conditions))
    .limit(1);
  return row ?? null;
}

export async function getLatestBlogs(siteId: number, limit = 2, lang?: string) {
  const db = getDb();
  const conditions = [eq(blogs.siteId, siteId), eq(blogs.status, "published")];
  if (lang) conditions.push(eq(blogs.lang, lang));

  return await db
    .select()
    .from(blogs)
    .where(and(...conditions))
    .orderBy(desc(blogs.publishedAt))
    .limit(limit);
}

export async function createBlog(blog: NewBlog) {
  const db = getDb();
  const [newBlog] = await db.insert(blogs).values(blog).returning();
  return newBlog;
}

export async function updateBlog(id: number, blog: Partial<NewBlog>) {
  const db = getDb();
  const [updated] = await db
    .update(blogs)
    .set({ ...blog, updatedAt: new Date() })
    .where(eq(blogs.id, id))
    .returning();
  return updated;
}

export async function deleteBlog(id: number) {
  const db = getDb();
  await db.delete(blogs).where(eq(blogs.id, id));
}

// ========== Project Queries ==========

export async function getProjectsBySiteId(siteId: number, publishedOnly = true, lang?: string) {
  const db = getDb();
  const conditions = [eq(projects.siteId, siteId)];
  if (publishedOnly) conditions.push(eq(projects.status, "published"));
  if (lang) conditions.push(eq(projects.lang, lang));

  return await db
    .select()
    .from(projects)
    .where(and(...conditions))
    .orderBy(desc(projects.publishedAt));
}

export async function getProjectBySlug(siteId: number, slug: string, lang?: string) {
  const db = getDb();
  const conditions = [eq(projects.siteId, siteId), eq(projects.slug, slug)];
  if (lang) conditions.push(eq(projects.lang, lang));

  const [row] = await db
    .select()
    .from(projects)
    .where(and(...conditions))
    .limit(1);
  return row ?? null;
}

export async function createProject(project: NewProject) {
  const db = getDb();
  const [newProject] = await db.insert(projects).values(project).returning();
  return newProject;
}

export async function updateProject(id: number, project: Partial<NewProject>) {
  const db = getDb();
  const [updated] = await db
    .update(projects)
    .set({ ...project, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  return updated;
}

export async function deleteProject(id: number) {
  const db = getDb();
  await db.delete(projects).where(eq(projects.id, id));
}

// ========== Comment Queries ==========

export async function getCommentsByBlogId(blogId: number, approvedOnly = true) {
  const db = getDb();
  let query = db
    .select()
    .from(comments)
    .where(eq(comments.blogId, blogId))
    .orderBy(desc(comments.createdAt));

  if (approvedOnly) {
    query = db
      .select()
      .from(comments)
      .where(and(eq(comments.blogId, blogId), eq(comments.status, "approved")))
      .orderBy(desc(comments.createdAt));
  }

  return await query;
}

export async function getPendingCommentsBySiteId(siteId: number) {
  const db = getDb();
  return await db
    .select({
      comment: comments,
      blog: blogs,
    })
    .from(comments)
    .innerJoin(blogs, eq(comments.blogId, blogs.id))
    .where(and(eq(blogs.siteId, siteId), eq(comments.status, "pending")))
    .orderBy(desc(comments.createdAt));
}

export async function getCommentsBySiteId(siteId: number, status?: string) {
  const db = getDb();
  const conditions = [eq(blogs.siteId, siteId)];

  if (status) {
    conditions.push(eq(comments.status, status));
  }

  return await db
    .select({
      comment: comments,
      blog: blogs,
    })
    .from(comments)
    .innerJoin(blogs, eq(comments.blogId, blogs.id))
    .where(and(...conditions))
    .orderBy(desc(comments.createdAt));
}

export async function createComment(comment: NewComment) {
  const db = getDb();
  const [newComment] = await db.insert(comments).values(comment).returning();
  return newComment;
}

export async function moderateComment(
  id: number,
  status: "approved" | "rejected" | "spam",
  moderatedBy: string
) {
  const db = getDb();
  const [updated] = await db
    .update(comments)
    .set({
      status,
      moderatedBy,
      moderatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(comments.id, id))
    .returning();
  return updated;
}

export async function deleteComment(id: number) {
  const db = getDb();
  await db.delete(comments).where(eq(comments.id, id));
}

// ========== Push Subscription Queries ==========

export async function getPushSubscriptionsBySiteId(siteId: number) {
  const db = getDb();
  return await db
    .select()
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.siteId, siteId), eq(pushSubscriptions.active, true)));
}

export async function upsertPushSubscription(sub: NewPushSubscription) {
  const db = getDb();
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, sub.endpoint))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pushSubscriptions)
      .set({ p256dh: sub.p256dh, auth: sub.auth, active: true })
      .where(eq(pushSubscriptions.endpoint, sub.endpoint));
  } else {
    await db.insert(pushSubscriptions).values(sub);
  }
}

export async function deactivatePushSubscription(endpoint: string) {
  const db = getDb();
  await db
    .update(pushSubscriptions)
    .set({ active: false })
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function deletePushSubscription(endpoint: string) {
  const db = getDb();
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

// ========== Health Check Queries ==========

export async function insertHealthCheck(check: NewHealthCheck) {
  const db = getDb();
  const [row] = await db.insert(healthChecks).values(check).returning();
  return row;
}

export async function getHealthChecksBySiteId(siteId: number, limit = 100) {
  const db = getDb();
  return await db
    .select()
    .from(healthChecks)
    .where(eq(healthChecks.siteId, siteId))
    .orderBy(desc(healthChecks.checkedAt))
    .limit(limit);
}

export async function getLatestHealthCheck(siteId: number) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(healthChecks)
    .where(eq(healthChecks.siteId, siteId))
    .orderBy(desc(healthChecks.checkedAt))
    .limit(1);
  return row ?? null;
}

export async function getHealthCheckStats(siteId: number, hoursBack = 24) {
  const db = getDb();
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(healthChecks)
    .where(and(eq(healthChecks.siteId, siteId), gte(healthChecks.checkedAt, since)))
    .orderBy(desc(healthChecks.checkedAt));

  const total = rows.length;
  if (total === 0) {
    return { total: 0, healthy: 0, degraded: 0, unhealthy: 0, uptimePercent: 100, avgLatencyMs: 0 };
  }

  const healthy = rows.filter((r) => r.status === "healthy").length;
  const degraded = rows.filter((r) => r.status === "degraded").length;
  const unhealthy = rows.filter((r) => r.status === "unhealthy").length;
  const uptimePercent = Math.round(((healthy + degraded) / total) * 10000) / 100;
  const avgLatencyMs = Math.round(
    rows.reduce((sum, r) => sum + (r.latencyMs ?? 0), 0) / total
  );

  return { total, healthy, degraded, unhealthy, uptimePercent, avgLatencyMs };
}

// ========== Alert Queries ==========

export async function insertAlert(alert: NewAlert) {
  const db = getDb();
  const [row] = await db.insert(alerts).values(alert).returning();
  return row;
}

export async function getRecentAlerts(siteId: number, hoursBack = 1) {
  const db = getDb();
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  return await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.siteId, siteId), gte(alerts.sentAt, since)))
    .orderBy(desc(alerts.sentAt));
}

// --- Auth ---

export async function getUserByEmail(email: string) {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return user ?? null;
}

export async function updateUserLastLogin(userId: number) {
  const db = getDb();
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function logLoginAttempt(email: string, ipAddress: string | null, success: boolean) {
  const db = getDb();
  await db.insert(loginAttempts).values({ email: email.toLowerCase(), ipAddress, success });
}

export async function getRecentFailedAttempts(email: string, windowMs: number): Promise<number> {
  const db = getDb();
  const since = new Date(Date.now() - windowMs);
  const [row] = await db
    .select({ count: count() })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email.toLowerCase()),
        eq(loginAttempts.success, false),
        gte(loginAttempts.attemptedAt, since)
      )
    );
  return row?.count ?? 0;
}

// ========== Order Queries ==========

export async function createOrder(order: NewOrder) {
  const db = getDb();
  const [row] = await db.insert(orders).values(order).returning();
  return row;
}

export async function createOrderItems(items: NewOrderItem[]) {
  const db = getDb();
  return await db.insert(orderItems).values(items).returning();
}

export async function getOrderById(id: number) {
  const db = getDb();
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return row ?? null;
}

export async function getOrderByStripeSessionId(sessionId: string) {
  const db = getDb();
  const [row] = await db.select().from(orders).where(eq(orders.stripeSessionId, sessionId)).limit(1);
  return row ?? null;
}

export async function getOrdersBySiteId(siteId: number, status?: string) {
  const db = getDb();
  const conditions = [eq(orders.siteId, siteId)];
  if (status) conditions.push(eq(orders.status, status));
  return await db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt));
}

export async function getOrderItemsByOrderId(orderId: number) {
  const db = getDb();
  return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function updateOrderStatus(
  id: number,
  status: string,
  extraFields?: Partial<NewOrder>,
) {
  const db = getDb();
  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date(), ...extraFields })
    .where(eq(orders.id, id))
    .returning();
  return updated;
}

export async function updateOrderStripeFields(id: number, fields: Partial<NewOrder>) {
  const db = getDb();
  await db.update(orders).set({ ...fields, updatedAt: new Date() }).where(eq(orders.id, id));
}

export async function generateOrderNumber(siteId: number): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];

  const orderNumber = `ORD-${date}-${suffix}`;

  // Check uniqueness (extremely unlikely collision but safe)
  const db = getDb();
  const [existing] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.siteId, siteId), eq(orders.orderNumber, orderNumber)))
    .limit(1);

  if (existing) return generateOrderNumber(siteId); // retry on collision
  return orderNumber;
}
