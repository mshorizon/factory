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
}

export interface AboutTimelineProps {
  timeline: TimelineItem[];
  stats?: StatItem[];
  cta?: string;
  ctaHref?: string;
  className?: string;
}
