export interface ProjectCard {
  title: string;
  description: string;
  image?: string;
  date?: string;
  metrics?: string[];
}

export interface ProjectGridProps {
  projects: ProjectCard[];
  className?: string;
}

export interface ProjectCarouselProps {
  projects: ProjectCard[];
  className?: string;
}
