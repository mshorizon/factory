import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./client.js";
import { sites, blogs, comments, pushSubscriptions } from "./schema.js";
import type { BusinessProfile } from "@mshorizon/schema";
import type { NewBlog, NewComment, NewPushSubscription } from "./schema.js";

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
