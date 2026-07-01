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
        // Large TOP padding is intentional: it gives the gradient vertical room to
        // fade fully to transparent above the caption. Without it the box is only as
        // tall as the two text lines, so its top edge lands where the gradient is
        // still partly opaque — producing the visible hard horizontal edge. The
        // extra space is transparent, so it never shows as a solid plate.
        padding: "72px 24px 20px 24px",
        color,
        textShadow: "0 1px 12px rgba(0,0,0,0.45)",
        // Vertical gradient (`to top`) so the fade is uniform across the full width —
        // a diagonal fade leaves one top corner darker than the other, which itself
        // reads as an edge. The dark region is concentrated in the bottom portion
        // (under the text) and is fully transparent by ~65%, well below the top edge
        // thanks to the top padding above, so there is no hard edge.
        background:
          "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 12%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.28) 42%, rgba(0,0,0,0.1) 55%, transparent 68%)",
      }}
      data-field="imageDescription"
    >
      {name && (
        <div
          style={{
            fontFamily: nameFontFamily,
            // Responsive: stays readable on mobile, caps at the original 12px on larger screens.
            fontSize: "clamp(11px, 3vw, 12px)",
            // Lighter weight for a more refined caption.
            fontWeight: 300,
            // Collapse the default line-height so the text div hugs its glyphs
            // instead of carrying extra vertical height.
            lineHeight: 1,
            textTransform: "uppercase",
            // Match the tracking of the "Reservations" badge (Tailwind `tracking-wide` = 0.025em).
            letterSpacing: "0.025em",
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
            // Lighter weight for a more refined caption.
            fontWeight: 300,
            // Collapse the default line-height so the text div hugs its glyphs
            // instead of carrying extra vertical height.
            lineHeight: 1,
            // Larger gap between the name and description lines.
            marginTop: "10px",
          }}
          data-field="imageDescription.description"
        >
          {description}
        </div>
      )}
    </div>
  );
}
