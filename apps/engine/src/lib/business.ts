// Domain-based business routing
// Maps domains to business IDs from database

import type { BusinessProfileV15 } from "@mshorizon/schema";
import { resolveTheme } from "@mshorizon/ui";
import {
  getAllSubdomains,
  getSiteBySubdomain,
} from "@mshorizon/db";
import type { DraftData } from "./draft-store";

// Supported languages
export const supportedLanguages = ["en", "pl"] as const;
export type Language = (typeof supportedLanguages)[number];
export const defaultLanguage: Language = "pl";

// Parse domain mapping from environment
function getDomainMap(): Record<string, string> {
  try {
    return JSON.parse(import.meta.env.DOMAIN_MAP || "{}");
  } catch {
    return {};
  }
}

const domainMap = getDomainMap();
const defaultBusiness = import.meta.env.DEFAULT_BUSINESS || "barber";
const baseDomain = import.meta.env.BASE_DOMAIN || "";

// Get all available business IDs from database
export async function getAvailableBusinessIds(): Promise<string[]> {
  try {
    return await getAllSubdomains();
  } catch {
    return [];
  }
}

// Extract business ID from hostname (subdomain-based routing)
export async function getBusinessIdFromHost(hostname: string): Promise<string> {
  // Remove port if present
  const host = hostname.split(":")[0];

  // Direct domain match from DOMAIN_MAP env
  if (domainMap[host]) {
    return domainMap[host];
  }

  // Try without www prefix
  const withoutWww = host.replace(/^www\./, "");
  if (domainMap[withoutWww]) {
    return domainMap[withoutWww];
  }

  // Subdomain matching via BASE_DOMAIN (e.g., barber.hazelgrouse.pl or barber.dev.hazelgrouse.pl)
  if (baseDomain) {
    const suffix = `.${baseDomain}`;
    if (host.endsWith(suffix)) {
      const subdomain = host.slice(0, -suffix.length);
      const availableBusinesses = await getAvailableBusinessIds();
      if (subdomain && availableBusinesses.includes(subdomain)) {
        return subdomain;
      }
    }
  }

  // Fallback: first subdomain part (e.g., barber.my-domain.com -> barber)
  const parts = host.split(".");
  if (parts.length >= 2) {
    const subdomain = parts[0];
    const availableBusinesses = await getAvailableBusinessIds();

    if (availableBusinesses.includes(subdomain)) {
      return subdomain;
    }
  }

  return defaultBusiness;
}

// Check if a business ID is valid
export async function isValidBusiness(businessId: string): Promise<boolean> {
  const available = await getAvailableBusinessIds();
  return available.includes(businessId);
}

// Get language from cookie value
export function getLanguageFromCookie(cookieHeader: string | null): Language {
  if (!cookieHeader) return defaultLanguage;
  const match = cookieHeader.match(/lang=(\w+)/);
  if (match && supportedLanguages.includes(match[1] as Language)) {
    return match[1] as Language;
  }
  return defaultLanguage;
}

// Helper to get all business context from request
export async function getBusinessContext(request: Request, draftOverride?: DraftData) {
  const url = new URL(request.url);

  // Allow query param override for testing (e.g., ?business=zakletewdrewnie)
  const queryBusiness = url.searchParams.get("business");
  const businessId = (queryBusiness && (await isValidBusiness(queryBusiness)))
    ? queryBusiness
    : await getBusinessIdFromHost(url.hostname);

  const currentLang = getLanguageFromCookie(request.headers.get("cookie"));

  let normalizedData: BusinessProfileV15;
  let translations: Record<string, any> = {};

  if (draftOverride) {
    normalizedData = draftOverride.businessData as BusinessProfileV15;
    translations = draftOverride.translations[currentLang] || {};
  } else {
    const site = await getSiteBySubdomain(businessId);
    if (!site) {
      throw new Error(`Business not found: ${businessId}`);
    }
    normalizedData = site.config as BusinessProfileV15;
    const allTranslations = (site.translations || {}) as Record<string, Record<string, any>>;
    translations = allTranslations[currentLang] || {};
  }

  // Resolve theme by merging preset with JSON overrides
  const resolvedTheme = resolveTheme(
    normalizedData.theme.preset,
    normalizedData.theme
  );

  return {
    businessId,
    currentLang,
    businessData: normalizedData,
    rawBusinessData: normalizedData,
    theme: resolvedTheme,
    t: translations,
  };
}
