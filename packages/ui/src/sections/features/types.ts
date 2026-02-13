export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface FeaturesGridProps {
  items: FeatureItem[];
  className?: string;
}
