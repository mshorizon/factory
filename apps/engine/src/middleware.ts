import { defineMiddleware } from "astro:middleware";
import {
  getBusinessContext,
  getAvailableBusinessIds,
  getBusinessIdFromHost,
  isValidBusiness,
} from "./lib/business";
import { getDraft } from "./lib/draft-store";
import { initDb, getSiteBySubdomain, getClientSessionWithUser } from "@mshorizon/db";
import { initR2 } from "./lib/r2";
import { SESSION_COOKIE } from "./lib/client-auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals } = context;
  const url = new URL(request.url);

  // Bridge Astro's import.meta.env into the DB package (Vite doesn't expose .env to process.env)
  initDb(import.meta.env.DATABASE_URL);

  // Initialize R2 client for Cloudflare object storage
  initR2({
    endpoint: import.meta.env.R2_ENDPOINT,
    accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
    bucketName: import.meta.env.R2_BUCKET_NAME,
    publicUrl: import.meta.env.R2_PUBLIC_DOMAIN,
  });

  // Check if this is a preview request from the admin iframe
  const isPreview = url.searchParams.get("_preview") === "1";

  // Resolve businessId the same way getBusinessContext does
  const queryBusiness = url.searchParams.get("business");
  const businessId = (queryBusiness && (await isValidBusiness(queryBusiness)))
    ? queryBusiness
    : await getBusinessIdFromHost(url.hostname);

  // If preview mode, check for an in-memory draft
  const draft = isPreview ? getDraft(businessId) : undefined;

  // Get business context (all data from DB)
  const ctx = await getBusinessContext(request, draft);

  // Get full site object for blog queries
  const site = await getSiteBySubdomain(ctx.businessId);

  // Store in locals for access in pages
  locals.businessId = ctx.businessId;
  locals.currentLang = ctx.currentLang;
  locals.businessData = ctx.businessData;
  locals.theme = ctx.theme;
  locals.t = ctx.t;
  locals.availableBusinesses = await getAvailableBusinessIds();
  locals.site = site;

  // Resolve client session (for /client/* routes)
  locals.clientUser = null;
  const sessionToken = request.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1]
    ?.trim();

  if (sessionToken) {
    const row = await getClientSessionWithUser(sessionToken);
    if (row && row.session.expiresAt > new Date()) {
      // Ensure the session belongs to the current site
      if (site && row.user.siteId === site.id) {
        locals.clientUser = row.user;
      }
    }
  }

  return next();
});
