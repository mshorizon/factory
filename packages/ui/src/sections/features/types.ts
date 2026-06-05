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

export interface FeaturesNumberedSplitProps extends FeaturesGridProps {
  /** Small uppercase eyebrow rendered above the heading (e.g. "Filozofia"). */
  badge?: string;
  /** Section heading rendered inside the left column. */
  title?: string;
  /** Image URL shown in the right column. */
  image?: string;
}
