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
  /**
   * Integrates the image with the page instead of rendering a hard-edged card.
   * "feather" softly fades all four edges into the background (mirrors the
   * about-section feather); "soft" replaces hard edges with an ambient shadow.
   * Omit for the default flush-cropped image.
   */
  imageBlend?: "feather" | "soft";
}
