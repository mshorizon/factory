export interface StatItem {
  value: string;
  label: string;
}

export interface TimelineItem {
  year: string;
  title: string;
  description?: string;
}

export interface StoryContent {
  title?: string;
  content?: string;
}

export interface SignatureRow {
  /** Rendered in uppercase. */
  text?: string;
  /** Optional flag image URL. When omitted, the theme navLogoFlag gradient is used. */
  flag?: string;
}

export interface AboutStoryProps {
  badge?: string;
  title?: string;
  story?: StoryContent;
  signature?: SignatureRow;
  stats?: StatItem[];
  commitment?: StoryContent;
  image?: string;
  cta?: string;
  ctaHref?: string;
  whyChooseUs?: string;
  experienceBadge?: string;
  experienceBadgeLabel?: string;
  className?: string;
  background?: string;
  imagePosition?: "left" | "right";
  ctaVariant?: "accent" | "primaryLight";
  /** When false, renders the image with square corners. Defaults to true (rounded). */
  imageRounded?: boolean;
  /** Overrides the font-family of the body/story content. Full CSS font-family value. */
  contentFontFamily?: string;
  /** Overrides the font-size of the body/story content. Full CSS length value, e.g. "18px". */
  contentFontSize?: string;
}

export interface QuotePanel {
  text?: string;
  author?: string;
  /** Optional flag image URL. When omitted, the theme navLogoFlag gradient bar is used. */
  flag?: string;
  note?: string;
}

export interface AboutQuoteSplitProps {
  badge?: string;
  title?: string;
  story?: StoryContent;
  stats?: StatItem[];
  quote?: QuotePanel;
  cta?: string;
  ctaHref?: string;
  className?: string;
  background?: string;
}

export interface CareerItem {
  year: string;
  title: string;
  company?: string;
  description?: string;
}

export interface AboutCareerProps {
  title?: string;
  items: CareerItem[];
  className?: string;
}

export interface AboutTimelineProps {
  timeline: TimelineItem[];
  stats?: StatItem[];
  cta?: string;
  ctaHref?: string;
  className?: string;
}

export interface AboutSummaryProps {
  badge?: string;
  title?: string;
  description?: string;
  image?: string;
  experienceYears?: string;
  experienceLabel?: string;
  cta?: string;
  ctaHref?: string;
  stats?: StatItem[];
  className?: string;
  background?: string;
  hideDots?: boolean;
  badgeVariant?: "accent" | "outlined" | "text";
  badgeColor?: string;
  descriptionColor?: string;
  ctaColor?: string;
  statsInverted?: boolean;
  imagePaddingY?: string;
  ctaPaddingBottom?: string;
}
