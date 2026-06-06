export interface ServiceItem {
  id?: string;
  slug?: string;
  title: string;
  description: string;
  price?: string;
  icon?: string;
  image?: string;
  tags?: string[];
  metric?: string;
  metricLabel?: string;
  href?: string;
  linkLabel?: string;
  category?: string;
}

export interface ServiceCategory {
  id: string;
  label: string;
}

export interface ServicesProps {
  items: ServiceItem[];
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  /** Optional category tabs rendered above the list; selecting one filters items by item.category. */
  categories?: ServiceCategory[];
  /** Optional id of the category tab selected by default. Falls back to the first tab. */
  defaultCategory?: string;
  /** Minimal variant — portfolio-law-style cards (borderless, primaryLight accent line, larger details link). */
  minimal?: boolean;
  /** Label for the per-card details link (translatable). */
  detailsLabel?: string;
  /** When provided, renders as first stagger item (col-span-full) above the cards. */
  title?: string;
  /** Render lucide icons from item.icon in primary color above each service card's accent line. */
  showIcons?: boolean;
  /** Number of columns for the list layout (1, 2, or 3). Defaults to 1 (single column). */
  columns?: number;
}
