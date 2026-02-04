// Domain-based business routing
// Maps domains to business IDs from data/ folder

import type { BusinessProfile, BusinessProfileV15 } from "@mshorizon/schema";
import { detectSchemaVersion, adaptV10ToV15 } from "./adapter";
import { resolveTheme } from "@mshorizon/ui";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

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

// Data directory path
const dataDir = join(process.cwd(), "..", "..", "data");

// Read JSON file dynamically (no caching - always fresh)
function readJsonFile(filePath: string): any {
  try {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return null;
}

// Get all available business IDs from data folder
export function getAvailableBusinessIds(): string[] {
  try {
    const entries = readdirSync(dataDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}

// Extract business ID from hostname (subdomain-based routing)
export function getBusinessIdFromHost(hostname: string): string {
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
      const availableBusinesses = getAvailableBusinessIds();
      if (subdomain && availableBusinesses.includes(subdomain)) {
        return subdomain;
      }
    }
  }

  // Fallback: first subdomain part (e.g., barber.my-domain.com -> barber)
  const parts = host.split(".");
  if (parts.length >= 2) {
    const subdomain = parts[0];
    const availableBusinesses = getAvailableBusinessIds();

    if (availableBusinesses.includes(subdomain)) {
      return subdomain;
    }
  }

  return defaultBusiness;
}

// Check if a business ID is valid
export function isValidBusiness(businessId: string): boolean {
  return getAvailableBusinessIds().includes(businessId);
}

// Load business data for a specific business ID (dynamic - always fresh)
export function getBusinessData(businessId: string) {
  return readJsonFile(join(dataDir, businessId, `${businessId}.json`));
}

// Load theme for a specific business ID (dynamic - always fresh)
export function getTheme(businessId: string) {
  return readJsonFile(join(dataDir, businessId, "theme.json"));
}

// Load translations for a specific business and language (dynamic - always fresh)
export function getTranslations(businessId: string, lang: Language = defaultLanguage): Record<string, any> {
  const validLang = supportedLanguages.includes(lang) ? lang : defaultLanguage;
  return readJsonFile(join(dataDir, businessId, "translations", `${validLang}.json`)) || {};
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
export function getBusinessContext(request: Request) {
  const url = new URL(request.url);

  // Allow query param override for testing (e.g., ?business=zakletewdrewnie)
  const queryBusiness = url.searchParams.get("business");
  const businessId = (queryBusiness && isValidBusiness(queryBusiness))
    ? queryBusiness
    : getBusinessIdFromHost(url.hostname);

  const currentLang = getLanguageFromCookie(request.headers.get("cookie"));

  const rawBusinessData = getBusinessData(businessId);
  const rawTheme = getTheme(businessId);

  // Detect schema version and normalize to v1.5
  const version = detectSchemaVersion(rawBusinessData);
  const normalizedData: BusinessProfileV15 =
    version === "1.5"
      ? (rawBusinessData as BusinessProfileV15)
      : adaptV10ToV15(rawBusinessData as BusinessProfile, rawTheme);

  // Resolve theme by merging preset with JSON overrides
  const resolvedTheme = resolveTheme(
    normalizedData.theme.preset,
    normalizedData.theme
  );

  return {
    businessId,
    currentLang,
    businessData: normalizedData,
    // Keep raw data for backwards compatibility during migration
    rawBusinessData,
    theme: resolvedTheme,
    t: getTranslations(businessId, currentLang),
  };
}
