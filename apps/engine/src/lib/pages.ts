import type { BusinessProfileV15, PageV15, Section, SectionType, SectionV15, SectionHeader } from "@mshorizon/schema";

// Default variant for each section type
const DEFAULT_VARIANTS: Record<SectionType, string> = {
  hero: "default",
  services: "grid",
  about: "story",
  contact: "centered",
};

/**
 * Get pages object from business data (v1.5 format)
 */
export function getPages(businessData: BusinessProfileV15): Record<string, PageV15> {
  return businessData.pages || {};
}

/**
 * Find a page by its slug (v1.5 format - pages is an object keyed by slug)
 */
export function findPageBySlug(
  businessData: BusinessProfileV15,
  slug: string
): PageV15 | undefined {
  const pages = getPages(businessData);
  // Normalize slug - treat empty/undefined as "home"
  const normalizedSlug = slug || "home";
  return pages[normalizedSlug];
}

/**
 * Get all valid slugs for static path generation
 */
export function getAllSlugs(businessData: BusinessProfileV15): string[] {
  const pages = getPages(businessData);
  return Object.keys(pages);
}

/**
 * Get variant for a section with default fallback
 */
export function getSectionVariant(section: Section | SectionV15): string {
  return section.variant || DEFAULT_VARIANTS[section.type] || "default";
}

/**
 * Get layout configuration with defaults
 */
export function getLayoutConfig(businessData: BusinessProfileV15) {
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
 * Get navigation links from pages object
 * Returns links in a consistent order (home first, then alphabetical)
 */
export function getNavLinks(businessData: BusinessProfileV15): { label: string; href: string }[] {
  const pages = getPages(businessData);
  const slugs = Object.keys(pages);

  // Sort: home first, then alphabetically
  slugs.sort((a, b) => {
    if (a === "home") return -1;
    if (b === "home") return 1;
    return a.localeCompare(b);
  });

  return slugs.map((slug) => ({
    label: pages[slug].title,
    href: slug === "home" ? "/" : `/${slug}`,
  }));
}

// Type that covers both v1.0 Section and v1.5 SectionV15
type SectionCompat = Section | SectionV15;

/**
 * Extract header information from either v1.0 or v1.5 section format
 * v1.0: badge, title, subtitle at top level
 * v1.5: header object with badge, title, subtitle
 */
export function getSectionHeader(section: SectionCompat): SectionHeader {
  // Check if v1.5 format (has header object)
  if ('header' in section && section.header) {
    return section.header;
  }
  // v1.0 format - extract from top level
  return {
    badge: (section as Section).badge,
    title: (section as Section).title,
    subtitle: (section as Section).subtitle,
  };
}
