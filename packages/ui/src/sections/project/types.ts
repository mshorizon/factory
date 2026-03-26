export interface ProjectCard {
  title: string;
  description: string;
  image?: string;
  date?: string;
}

export interface ProjectGridProps {
  projects: ProjectCard[];
  className?: string;
}
