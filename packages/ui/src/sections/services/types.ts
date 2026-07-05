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
  requirements?: string;
  /** When true and priceValue is set, an "Add to cart" button is rendered on the menu row. */
  orderable?: boolean;
  /** Numeric price in the site currency (e.g. 23.5 for "23,50 zł") — used for cart totals. */
  priceValue?: number;
}

export interface ServiceCategory {
  id: string;
  label: string;
}

export interface CategoryGroup {
  id: string;
  label: string;
  categories: string[];
  showSubTabs?: boolean;
}

export interface CategoryImageDescription {
  name?: string;
  description?: string;
  color?: string;
  nameFontFamily?: string;
  descriptionFontFamily?: string;
}

export interface CategoryImage {
  /** Matches a ServiceCategory id or a CategoryGroup id (the effective top-level tab). */
  id: string;
  image: string;
  imageDescription?: CategoryImageDescription;
}

export interface ServicesProps {
  items: ServiceItem[];
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  /** Optional category tabs rendered above the list; selecting one filters items by item.category. */
  categories?: ServiceCategory[];
  /** Optional groups that aggregate multiple categories into one top-level tab. */
  categoryGroups?: CategoryGroup[];
  /** Optional id of the category tab (or group) selected by default. Falls back to the first tab. */
  defaultCategory?: string;
  /** Minimal variant — portfolio-law-style cards (borderless, primaryLight accent line, larger details link). */
  minimal?: boolean;
  /** Label for the per-card details link (translatable). */
  detailsLabel?: string;
  /** When provided, renders as first stagger item (col-span-full) above the cards. */
  title?: string;
  /** Render lucide icons from item.icon in primary color above each service card's accent line. */
  showIcons?: boolean;
  /** Centered icon-badge grid: 4-col, centered content, circular tinted icon badge, no accent line/details link. */
  centered?: boolean;
  /** Bold label prefixing each card's item.requirements note (e.g. 'Wymagane:'). */
  requirementsLabel?: string;
  /** Number of columns for the list layout (1, 2, or 3). Defaults to 1 (single column). */
  columns?: number;
  /**
   * Optional per-tab images (list variant). When present alongside `categories`, the
   * section renders a two-column split: tabs + single-column items on the left, an
   * image with a caption overlay on the right that cross-reveals on tab change.
   * Keyed by the effective top-level tab id (a category id or a group id).
   */
  categoryImages?: CategoryImage[];
}
