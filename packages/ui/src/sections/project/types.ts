export interface ProjectCard {
  title: string;
  description: string;
  image?: string;
  date?: string;
  category?: string;
  readMore?: { label: string; href: string };
  metrics?: string[];
  url?: string;
  cta?: { label: string; href: string };
}

export interface ProjectGridProps {
  projects: ProjectCard[];
  className?: string;
  columns?: 2 | 3;
  footerCta?: { label: string; href: string };
}

export interface ProjectCarouselProps {
  projects: ProjectCard[];
  className?: string;
}
