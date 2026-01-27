export interface CategoryItem {
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  href?: string;
}

export interface CategoriesProps {
  items: CategoryItem[];
  exploreLabel?: string;
  className?: string;
}
