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

export interface ImageDescriptionContent {
  /** First line — small name/title (12px DM Sans by default). */
  name?: string;
  /** Second line — italic subtitle (18px Cormorant Garamond by default). */
  description?: string;
  /** Text color for the overlay. Supplied from JSON since there is no reliable contrasting token over a photo. */
  color?: string;
  /** Override the name line font-family. Full CSS font-family value. */
  nameFontFamily?: string;
  /** Override the description line font-family. Full CSS font-family value. */
  descriptionFontFamily?: string;
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
  /**
   * Optional two-line caption overlaid on the bottom-left corner of the image
   * (name + italic description). Rendered by the ImageDescription atom — mirrors
   * the about-section image caption.
   */
  imageDescription?: ImageDescriptionContent;
}
