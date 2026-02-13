export interface BlogPost {
  title: string;
  description: string;
  image?: string;
  date?: string;
  href?: string;
}

export interface BlogGridProps {
  posts: BlogPost[];
  ctaLabel?: string;
  className?: string;
}
