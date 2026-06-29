import { cn } from "../lib/utils";

export interface ImageDescriptionProps {
  /** First line — the name/title. Rendered small (12px DM Sans by default). */
  name?: string;
  /** Second line — italic subtitle (18px Cormorant Garamond by default). */
  description?: string;
  /**
   * Text color. Left to props so the value comes from the business JSON rather than
   * being hardcoded — over a photo there is no reliable contrasting theme token.
   * When omitted the text inherits the surrounding color.
   */
  color?: string;
  /** Override the name line font-family. Full CSS font-family value. */
  nameFontFamily?: string;
  /** Override the description line font-family. Full CSS font-family value. */
  descriptionFontFamily?: string;
  className?: string;
}

/**
 * A small two-line caption (name + italic description) intended to overlay the
 * bottom-left corner of an image. Text is left-aligned with 20px/24px padding.
 * A subtle text-shadow keeps it legible over photography without a background plate.
 */
export function ImageDescription({
  name,
  description,
  color,
  nameFontFamily = "'DM Sans', sans-serif",
  descriptionFontFamily = "'Cormorant Garamond', serif",
  className,
}: ImageDescriptionProps) {
  if (!name && !description) return null;

  return (
    <div
      className={cn("text-left", className)}
      style={{ padding: "20px 24px", color, textShadow: "0 1px 12px rgba(0,0,0,0.45)" }}
      data-field="imageDescription"
    >
      {name && (
        <div
          style={{ fontFamily: nameFontFamily, fontSize: "12px" }}
          data-field="imageDescription.name"
        >
          {name}
        </div>
      )}
      {description && (
        <div
          className="mt-spacing-xs"
          style={{ fontFamily: descriptionFontFamily, fontSize: "18px", fontStyle: "italic" }}
          data-field="imageDescription.description"
        >
          {description}
        </div>
      )}
    </div>
  );
}
