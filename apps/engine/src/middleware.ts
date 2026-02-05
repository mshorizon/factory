import { defineMiddleware } from "astro:middleware";
import {
  getBusinessContext,
  getAvailableBusinessIds,
  getBusinessIdFromHost,
  isValidBusiness,
} from "./lib/business";
import { getDraft } from "./lib/draft-store";

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals } = context;
  const url = new URL(request.url);

  // Check if this is a preview request from the admin iframe
  const isPreview = url.searchParams.get("_preview") === "1";

  // Resolve businessId the same way getBusinessContext does
  const queryBusiness = url.searchParams.get("business");
  const businessId = (queryBusiness && isValidBusiness(queryBusiness))
    ? queryBusiness
    : getBusinessIdFromHost(url.hostname);

  // If preview mode, check for an in-memory draft
  const draft = isPreview ? getDraft(businessId) : undefined;

  // Get business context (handles v1.0 to v1.5 normalization)
  const ctx = getBusinessContext(request, draft);

  // Store in locals for access in pages
  locals.businessId = ctx.businessId;
  locals.currentLang = ctx.currentLang;
  locals.businessData = ctx.businessData;
  locals.theme = ctx.theme;
  locals.t = ctx.t;
  locals.availableBusinesses = getAvailableBusinessIds();

  return next();
});
