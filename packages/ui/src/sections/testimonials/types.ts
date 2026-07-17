export interface TestimonialItem {
  title: string;
  description: string;
  image?: string;
  author?: string;
  role?: string;
  /** Short note rendered alongside the author (e.g. a date like "Maj 2025"). */
  meta?: string;
}

export interface TestimonialsGridProps {
  /** Agency variant: clean white cards without stars/verified-badge/metric (matches minimal designs). */
  clean?: boolean;
  items: TestimonialItem[];
  className?: string;
  sectionTitle?: string;
  sectionDescription?: string;
}

export interface TestimonialsQuotesProps {
  items: TestimonialItem[];
  className?: string;
  /** Optional CTA rendered as an underlined text link below the grid. */
  ctaLabel?: string;
  ctaHref?: string;
}
