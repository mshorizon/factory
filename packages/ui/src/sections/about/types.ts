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
  /**
   * Controls the badge treatment above the title. Defaults to "accent" (a short
   * accent line stacked above the badge text). Use "accent-no-line" to drop the
   * line so the badge sits flush at the left edge with no extra spacing.
   */
  badgeVariant?: "accent" | "accent-no-line" | "text";
  imagePosition?: "left" | "right";
  ctaVariant?: "accent" | "primaryLight" | "primary";
  /** When false, renders the image with square corners. Defaults to true (rounded). */
  imageRounded?: boolean;
  /** Overrides the font-family of the body/story content. Full CSS font-family value. */
  contentFontFamily?: string;
  /** Overrides the font-size of the body/story content. Full CSS length value, e.g. "18px". */
  contentFontSize?: string;
  /** Overrides the image width. Full CSS length value, e.g. "560px". Defaults to 448px. */
  imageWidth?: string;
  /** Overrides the image height. Full CSS length value, e.g. "620px". Defaults to 500px. */
  imageHeight?: string;
  /**
   * Visual treatment that integrates the image with the surrounding page instead of
   * letting it float as a shadowed card.
   * - "feather": softly fades the image edges into the background (no hard border / drop shadow).
   * - "soft": replaces the hard drop shadow with a large, low-opacity ambient shadow that grounds the photo.
   * Defaults to the legacy shadowed-card look when omitted.
   */
  imageBlend?: "feather" | "soft";
  /**
   * Label for the mobile-only "Read more" link. On narrow screens the story is
   * collapsed to its first paragraph and the rest is revealed on tap. Defaults to "Read more".
   */
  readMoreLabel?: string;
  /** Optional pull-quote rendered as an italic blockquote with a gold left divider, between the story paragraphs and the CTA. Reuses the QuotePanel shape (text + author). When omitted, nothing renders. */
  quote?: QuotePanel;
  /** CTA button corner shape. 'pill' (default) = fully rounded; 'rect' = 4px radius with uppercase tracked label, matching a formal gold rectangular button. */
  ctaShape?: "pill" | "rect";
  /** When true, the image fills its grid column via absolute positioning — no shadow, no rounding, flush to column edges. Grid becomes a fixed 45/55 split. */
  imageFill?: boolean;
  /** When true (only meaningful with imageFill), wraps the fill image in a thin primary-colored border with a small inset mat, giving a framed-photo look. Defaults to false (flush, no frame). */
  imageFrame?: boolean;
  /**
   * When true, wraps the (non-fill) image in an almost-transparent border tinted with the
   * page text color, inset by a small padding mat so background shows between the image and
   * the border. Replaces the floating drop shadow. Defaults to false.
   */
  imageBorder?: boolean;
  /**
   * Optional two-line caption overlaid on the bottom-left corner of the image
   * (name + italic description). Rendered by the ImageDescription atom.
   */
  imageDescription?: ImageDescriptionContent;
}

export interface ImageDescriptionContent {
  /** First line — small name/title (12px DM Sans by default). */
  name?: string;
  /** Second line — italic subtitle (18px Cormorant Garamond by default). */
  description?: string;
  /** Text color for the overlay. Supplied from JSON since there is no reliable contrasting token over a photo. */
  color?: string;
  /** Override the name line font-family. Full CSS font-family value. */
  nameFontFamily?: string;
  /** Override the description line font-family. Full CSS font-family value. */
  descriptionFontFamily?: string;
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
  /** Overrides the background color of the right-hand quote panel/card. Full CSS color value. */
  cardBackgroundColor?: string;
  /** Badge style. "accent" (default) shows a short leading line; "accent-no-line" omits it. */
  badgeVariant?: "accent" | "accent-no-line";
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
