import { defineMiddleware } from "astro:middleware";
import {
  getBusinessIdFromHost,
  getBusinessData,
  getTheme,
  getTranslations,
  getLanguageFromCookie,
  isValidBusiness,
  getAvailableBusinessIds,
  type Language,
} from "./lib/business";

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals } = context;
  const url = new URL(request.url);

  // Extract business ID from subdomain
  const businessId = getBusinessIdFromHost(url.hostname);
  const currentLang = getLanguageFromCookie(request.headers.get("cookie"));

  // Load business data
  const businessData = getBusinessData(businessId);
  const theme = getTheme(businessId);
  const t = getTranslations(businessId, currentLang);

  // Store in locals for access in pages
  locals.businessId = businessId;
  locals.currentLang = currentLang;
  locals.businessData = businessData;
  locals.theme = theme;
  locals.t = t;
  locals.availableBusinesses = getAvailableBusinessIds();

  return next();
});
