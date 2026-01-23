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

// Helper to get all business context from request
export function getBusinessContext(request: Request) {
  const url = new URL(request.url);
  const businessId = getBusinessIdFromHost(url.hostname);
  const currentLang = getLanguageFromCookie(request.headers.get("cookie"));

  return {
    businessId,
    currentLang,
    businessData: getBusinessData(businessId),
    theme: getTheme(businessId),
    t: getTranslations(businessId, currentLang),
  };
}
