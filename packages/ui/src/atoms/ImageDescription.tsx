import { cn } from "../lib/utils";

export interface ImageDescriptionProps {
  /** First line — the name/title. Rendered small (12px DM Sans by default). */
  name?: string;
  /** Second line — italic subtitle (always 24px Cormorant Garamond by default). */
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
 * bottom-left corner of an image. Text is left-aligned with 24px horizontal padding.
 * The caption spans the full width of the image and lays a dark gradient anchored
 * at the bottom-left corner behind itself so the text stays legible over any photography. A subtle text-shadow
 * reinforces that legibility without relying on a solid background plate.
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
      className={cn("text-left w-full", className)}
      style={{
        // Uniform 20px vertical / 24px horizontal padding so the two-line caption
        // sits evenly inside the box instead of being crushed by an oversized top pad.
        padding: "20px 24px",
        color,
        textShadow: "0 1px 12px rgba(0,0,0,0.45)",
        // Diagonal gradient anchored at the bottom-left corner (`to top right`)
        // so the darkest region sits under the left-aligned caption text. Boosted
        // opacities keep the copy legible over bright photography.
        background:
          "linear-gradient(to top right, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.8) 40%, transparent 85%)",
      }}
      data-field="imageDescription"
    >
      {name && (
        <div
          style={{
            fontFamily: nameFontFamily,
            // Responsive: stays readable on mobile, caps at the original 12px on larger screens.
            fontSize: "clamp(11px, 3vw, 12px)",
            // Collapse the default line-height so the text div hugs its glyphs
            // instead of carrying extra vertical height.
            lineHeight: 1,
            textTransform: "uppercase",
            opacity: 0.7,
          }}
          data-field="imageDescription.name"
        >
          {name}
        </div>
      )}
      {description && (
        <div
          style={{
            fontFamily: descriptionFontFamily,
            // Always 24px regardless of viewport (fixed, non-responsive).
            fontSize: "24px",
            fontStyle: "italic",
            // Collapse the default line-height so the text div hugs its glyphs
            // instead of carrying extra vertical height.
            lineHeight: 1,
            marginTop: "4px",
          }}
          data-field="imageDescription.description"
        >
          {description}
        </div>
      )}
    </div>
  );
}
