// Domain-based business routing
// Maps domains to business IDs from data/ folder

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
const defaultBusiness = import.meta.env.DEFAULT_BUSINESS || "honey-worker";

// Import all business data, themes, and translations
const businessDataFiles = import.meta.glob("../../../../data/*/*.json", { eager: true });
const translationFiles = import.meta.glob("../../../../data/*/translations/*.json", { eager: true });

// Helper to get file content
function getJsonFile(pattern: string, files: Record<string, any>): any {
  const key = Object.keys(files).find((k) => k.includes(pattern));
  return key ? (files[key] as any).default : null;
}

// Get business ID from cookie
export function getBusinessIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/business=([^;]+)/);
  return match ? match[1] : null;
}

// Extract business ID from hostname, cookie, or query param
export function getBusinessIdFromRequest(request: Request): string {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("cookie");

  // 1. Check query param first (for switching)
  const queryBusiness = url.searchParams.get("business");
  if (queryBusiness && getBusinessData(queryBusiness)) {
    return queryBusiness;
  }

  // 2. Check cookie
  const cookieBusiness = getBusinessIdFromCookie(cookieHeader);
  if (cookieBusiness && getBusinessData(cookieBusiness)) {
    return cookieBusiness;
  }

  // 3. Fall back to hostname-based routing
  return getBusinessIdFromHost(url.hostname);
}

// Extract business ID from hostname
export function getBusinessIdFromHost(hostname: string): string {
  // Remove port if present
  const host = hostname.split(":")[0];

  // Direct domain match
  if (domainMap[host]) {
    return domainMap[host];
  }

  // Try without www prefix
  const withoutWww = host.replace(/^www\./, "");
  if (domainMap[withoutWww]) {
    return domainMap[withoutWww];
  }

  // Try subdomain matching (e.g., barber.example.com -> barber)
  const subdomain = host.split(".")[0];
  const availableBusinesses = Object.keys(businessDataFiles)
    .map((k) => k.match(/\/data\/([^/]+)\//)?.[1])
    .filter(Boolean);

  if (availableBusinesses.includes(subdomain)) {
    return subdomain;
  }

  return defaultBusiness;
}

// Load business data for a specific business ID
export function getBusinessData(businessId: string) {
  return getJsonFile(`/${businessId}/${businessId}.json`, businessDataFiles);
}

// Load theme for a specific business ID
export function getTheme(businessId: string) {
  return getJsonFile(`/${businessId}/theme.json`, businessDataFiles);
}

// Load translations for a specific business and language
export function getTranslations(businessId: string, lang: Language = defaultLanguage): Record<string, any> {
  const validLang = supportedLanguages.includes(lang) ? lang : defaultLanguage;
  return getJsonFile(`/${businessId}/translations/${validLang}.json`, translationFiles) || {};
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

// Get all available businesses (id and name)
export function getAllBusinesses(): { id: string; name: string }[] {
  const businessIds = new Set<string>();

  // Extract unique business IDs from the glob pattern
  Object.keys(businessDataFiles).forEach((key) => {
    const match = key.match(/\/data\/([^/]+)\//);
    if (match) {
      businessIds.add(match[1]);
    }
  });

  // Map to objects with id and name
  return Array.from(businessIds)
    .map((id) => {
      const data = getBusinessData(id);
      return data ? { id, name: data.name } : null;
    })
    .filter((b): b is { id: string; name: string } => b !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Helper to get all business context from request
export function getBusinessContext(request: Request) {
  const businessId = getBusinessIdFromRequest(request);
  const currentLang = getLanguageFromCookie(request.headers.get("cookie"));

  return {
    businessId,
    currentLang,
    businessData: getBusinessData(businessId),
    theme: getTheme(businessId),
    t: getTranslations(businessId, currentLang),
    allBusinesses: getAllBusinesses(),
  };
}
