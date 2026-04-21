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

export interface AboutStoryProps {
  badge?: string;
  title?: string;
  story?: StoryContent;
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
}
