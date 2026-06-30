"use client";

import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { GalleryGridProps } from "./types";

/**
 * Editorial mosaic layout: tiles of varied sizes that tile across a 4-column
 * grid. On hover the image scales up and the title/description slide into the
 * bottom-left corner over a gradient scrim. Pattern repeats so it works for
 * any number of items and any niche.
 */
// A 6-tile period that packs perfectly into the 4-column grid (12 cells = 3
// full rows) with grid-flow-row-dense, so the whole grid is filled by images
// with no empty cells: feature (2x2) + two squares fill rows 1-2 cols 3-4,
// two tall tiles fill cols 3-4 of rows 2-3, and the wide tile closes row 3.
const MOSAIC_PATTERN = [
  "col-span-2 row-span-2", // large feature tile
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 md:row-span-2", // tall tile (desktop)
  "col-span-1 md:row-span-2", // tall tile (desktop)
  "col-span-2 row-span-1", // wide tile closes the block
];

export function GalleryMosaic({ items, className }: GalleryGridProps) {
  return (
    <StaggerContainer
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 auto-rows-[140px] md:auto-rows-[200px] gap-spacing-md grid-flow-row-dense",
        className
      )}
      staggerDelay={0.08}
    >
      {items.map((item, index) => (
        <StaggerItem
          key={index}
          direction="up"
          distance={30}
          className={MOSAIC_PATTERN[index % MOSAIC_PATTERN.length]}
        >
          <div
            className="group relative h-full w-full overflow-hidden rounded-radius"
            data-field={`items.${index}`}
          >
            <SafeImage
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              loading={index < 3 ? "eager" : "lazy"}
            />

            {/* Gradient scrim — fades in on hover for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Inner border — a translucent line so its color blends with the image beneath */}
            <div className="pointer-events-none absolute inset-0 rounded-radius border border-white/20" />

            {/* Caption — slides up into the bottom-left corner on hover */}
            <div className="absolute bottom-0 left-0 p-spacing-md translate-y-2 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
              <h3
                className="font-heading font-semibold text-white drop-shadow-sm"
                data-field={`items.${index}.title`}
              >
                {item.title}
              </h3>
              {item.description && (
                <p
                  className="mt-0.5 text-sm text-white/80"
                  data-field={`items.${index}.description`}
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
