export interface GalleryItem {
  title: string;
  description?: string;
  image: string;
}

export interface GalleryGridProps {
  items: GalleryItem[];
  className?: string;
}
