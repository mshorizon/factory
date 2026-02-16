export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
  linkLabel?: string;
  linkHref?: string;
}

export interface FeaturesGridProps {
  items: FeatureItem[];
  className?: string;
}
