export interface BeforeAfterPair {
  title: string;
  before: string;
  after: string;
  description?: string;
}

export interface GalleryBAProps {
  pairs: BeforeAfterPair[];
  className?: string;
}
