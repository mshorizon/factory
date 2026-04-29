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
}

export interface ServicesProps {
  items: ServiceItem[];
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  /** Minimal variant — portfolio-law-style cards (borderless, primaryLight accent line, larger details link). */
  minimal?: boolean;
  /** Label for the per-card details link (translatable). */
  detailsLabel?: string;
  /** When provided, renders as first stagger item (col-span-full) above the cards. */
  title?: string;
  /** Render lucide icons from item.icon in primary color above each service card's accent line. */
  showIcons?: boolean;
}
