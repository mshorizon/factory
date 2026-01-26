import type { Target, NavLinkV15, FooterColumnV15 } from "@mshorizon/schema";

// Legacy v1.0 FooterLink (for backwards compatibility)
export interface FooterLink {
  label: string;
  href: string;
}

// Type that supports both v1.0 and v1.5 link formats
export type FooterLinkCompat = FooterLink | NavLinkV15;

// Type guard to check if a link is v1.5 format
export function isFooterLinkV15(link: FooterLinkCompat): link is NavLinkV15 {
  return "target" in link;
}

// Helper to get href from either link format
export function getFooterLinkHref(
  link: FooterLinkCompat,
  resolveTarget?: (target: Target) => string
): string {
  if (isFooterLinkV15(link)) {
    return resolveTarget ? resolveTarget(link.target) : "#";
  }
  return link.href;
}

export interface SocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

// Legacy v1.0 FooterColumn
export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

// Type that supports both column formats
export type FooterColumnCompat = FooterColumn | FooterColumnV15;

// Type guard for column
export function isFooterColumnV15(column: FooterColumnCompat): column is FooterColumnV15 {
  return column.links.length > 0 && "target" in column.links[0];
}

export interface FooterProps {
  businessName: string;
  links?: FooterLinkCompat[];
  socialLinks?: SocialLink[];
  copyright?: string;
  tagline?: string;
  columns?: FooterColumnCompat[];
  variant?: "simple" | "multiColumn";
  className?: string;
  // v1.5: Optional target resolver function
  resolveTarget?: (target: Target) => string;
}
