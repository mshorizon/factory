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
}
