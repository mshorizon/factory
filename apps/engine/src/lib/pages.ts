import type { BusinessProfile, Page, Section, SectionType } from "@mshorizon/schema";

// Default variant for each section type
const DEFAULT_VARIANTS: Record<SectionType, string> = {
  hero: "default",
  services: "grid",
  about: "story",
  contact: "centered",
};

/**
 * Get pages array from business data
 */
export function getPages(businessData: BusinessProfile): Page[] {
  return businessData.pages || [];
}

/**
 * Find a page by its slug
 */
export function findPageBySlug(
  businessData: BusinessProfile,
  slug: string
): Page | undefined {
  const pages = getPages(businessData);
  // Normalize slug - treat empty/undefined as "index"
  const normalizedSlug = slug || "index";
  return pages.find((p) => p.slug === normalizedSlug);
}

/**
 * Get all valid slugs for static path generation
 */
export function getAllSlugs(businessData: BusinessProfile): string[] {
  const pages = getPages(businessData);
  return pages.map((p) => p.slug);
}

/**
 * Get variant for a section with default fallback
 */
export function getSectionVariant(section: Section): string {
  return section.variant || DEFAULT_VARIANTS[section.type] || "default";
}

/**
 * Get layout configuration with defaults
 */
export function getLayoutConfig(businessData: BusinessProfile) {
  const layout = businessData.layout || {};
  return {
    navbar: {
      variant: layout.navbar?.variant || "standard",
    },
    footer: {
      variant: layout.footer?.variant || "simple",
      copyright: layout.footer?.copyright,
      tagline: layout.footer?.tagline,
      links: layout.footer?.links || [],
      columns: layout.footer?.columns || [],
    },
  };
}

/**
 * Get navigation links from pages array
 * The order in pages array determines navbar order
 */
export function getNavLinks(businessData: BusinessProfile): { label: string; href: string }[] {
  return businessData.pages.map((page) => ({
    label: page.title,
    href: page.slug === "index" ? "/" : `/${page.slug}`,
  }));
}
