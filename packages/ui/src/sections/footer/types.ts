import type { Target, Link, FooterColumn } from "@mshorizon/schema";
import type { LanguageOption } from "../../lib/languages";

export type { Link, FooterColumn };

// Helper to get href from a link
export function getFooterLinkHref(
  link: Link,
  resolveTarget?: (target: Target) => string
): string {
  if (link.target && resolveTarget) {
    return resolveTarget(link.target);
  }
  return "#";
}

export interface SocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

export interface FooterProps {
  businessName: string;
  links?: Link[];
  socialLinks?: SocialLink[];
  copyright?: string;
  tagline?: string;
  columns?: FooterColumn[];
  variant?: "simple" | "multiColumn" | "minimal" | "centered" | "branded" | "stacked" | "gradient" | "darkColumns";
  className?: string;
  currentLanguage?: string;
  availableLanguages?: LanguageOption[];
  resolveTarget?: (target: Target) => string;
}
