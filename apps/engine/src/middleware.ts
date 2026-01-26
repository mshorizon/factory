import { defineMiddleware } from "astro:middleware";
import {
  getBusinessContext,
  getAvailableBusinessIds,
} from "./lib/business";

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals } = context;

  // Get business context (handles v1.0 to v1.5 normalization)
  const ctx = getBusinessContext(request);

  // Store in locals for access in pages
  locals.businessId = ctx.businessId;
  locals.currentLang = ctx.currentLang;
  locals.businessData = ctx.businessData;
  locals.theme = ctx.theme;
  locals.t = ctx.t;
  locals.availableBusinesses = getAvailableBusinessIds();

  return next();
});
