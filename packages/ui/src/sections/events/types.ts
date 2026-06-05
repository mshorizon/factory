export interface EventItem {
  title: string;
  description: string;
  image?: string;
  dateStart?: string;
  dateEnd?: string;
  href?: string;
  /** Category tag shown as a filled badge (uses the first entry of `tags`). */
  tags?: string[];
  /** Short note shown top-right of the card (e.g. "Limited seats"). */
  meta?: string;
  /** Per-item CTA label. */
  linkLabel?: string;
}

export interface EventsDefaultProps {
  items: EventItem[];
  className?: string;
}

export interface EventsCardsProps {
  badge?: string;
  title?: string;
  items: EventItem[];
  /** Fallback CTA label when an item has no `linkLabel`. */
  linkLabel?: string;
  className?: string;
}
