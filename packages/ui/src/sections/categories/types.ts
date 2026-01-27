export interface CategoryItem {
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  href?: string;
}

export interface CategoriesProps {
  items: CategoryItem[];
  className?: string;
}
