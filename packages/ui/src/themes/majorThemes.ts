/**
 * Major Theme variant mappings.
 * Each major theme defines default section variants for visual consistency.
 * Users can override individual variants per section in the admin panel.
 */
export const MAJOR_THEME_DEFAULTS: Record<string, Record<string, string>> = {
  specialist: {
    hero: "split",
    services: "darkCards",
    categories: "carousel",
    about: "story",
    "about-summary": "default",
    contact: "split",
    testimonials: "default",
    faq: "default",
    features: "default",
    ctaBanner: "default",
    process: "default",
    pricing: "default",
    project: "grid",
    blog: "default",
    shop: "grid",
    gallery: "default",
    booking: "default",
    comparison: "default",
    team: "default",
  },
  "portfolio-tech": {
    hero: "gradient",
    services: "featured",
    categories: "featured",
    about: "story",
    "about-summary": "default",
    contact: "split",
    testimonials: "default",
    faq: "default",
    features: "compact",
    ctaBanner: "default",
    process: "visual",
    pricing: "default",
    project: "carousel",
    blog: "default",
    shop: "grid",
    gallery: "default",
    booking: "default",
    comparison: "default",
    team: "default",
  },
};

/**
 * Get the default variant for a section type under a given major theme.
 */
export function getMajorThemeVariant(
  majorTheme: string | undefined,
  sectionType: string
): string | undefined {
  if (!majorTheme) return undefined;
  return MAJOR_THEME_DEFAULTS[majorTheme]?.[sectionType];
}

/**
 * Check if a section's variant is overridden from the major theme default.
 */
export function isVariantOverridden(
  majorTheme: string | undefined,
  sectionType: string,
  sectionVariant: string | undefined
): boolean {
  if (!majorTheme || !sectionVariant) return false;
  const defaultVariant = MAJOR_THEME_DEFAULTS[majorTheme]?.[sectionType];
  if (!defaultVariant) return false;
  return sectionVariant !== defaultVariant;
}
