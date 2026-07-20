"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import { ImageDescription } from "../../atoms/ImageDescription";
import type { FeaturesNumberedSplitProps } from "./types";

export function FeaturesNumberedSplit({
  items,
  badge,
  title,
  image,
  imageBlend,
  imageBorder,
  imageDescription,
  marker = "number",
  imageShadow,
  className,
}: FeaturesNumberedSplitProps) {
  // Mirror the about-section blend modes. "feather" crosses two linear-gradient
  // mask layers (intersected) so all four edges dissolve into the page rather
  // than sitting on top of it as a hard-cropped card; "soft" swaps the crop for
  // a large low-opacity ambient shadow.
  const edgeFeather =
    "linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%), " +
    "linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%)";
  // `imageBorder` (the about-section "border line" frame) takes precedence and
  // suppresses the blend masks — the image sits as a clean photo inside an
  // almost-transparent text-color border with a padding mat.
  const imageStyle = imageBorder
    ? undefined
    : imageBlend === "feather"
      ? {
          WebkitMaskImage: edgeFeather,
          WebkitMaskComposite: "source-in",
          maskImage: edgeFeather,
          maskComposite: "intersect" as const,
        }
      : imageBlend === "soft"
        ? { boxShadow: "0 30px 60px -25px rgba(0, 0, 0, 0.45)" }
        : undefined;
  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-spacing-2xl lg:gap-spacing-3xl items-stretch",
        className
      )}
    >
      {/* Left column: eyebrow + heading + numbered list */}
      <div className="flex flex-col">
        {badge && (
          <span
            data-reveal
            className="text-[14px] tracking-[.05rem] uppercase font-medium text-primary mb-spacing-md"
            data-field="header.badge"
          >
            {badge}
          </span>
        )}
        {title && (
          <h2
            data-reveal
            data-reveal-delay="100"
            className="text-3xl md:text-4xl lg:text-5xl text-foreground font-heading mb-spacing-2xl"
            data-field="header.title"
          >
            {title}
          </h2>
        )}

        <StaggerContainer className="flex flex-col" staggerDelay={0.08}>
          {items.map((item, index) => (
            <StaggerItem key={index} direction="up" distance={20}>
              <div
                className="group flex items-start gap-spacing-lg py-spacing-lg px-spacing-md -mx-spacing-md rounded-radius"
                data-field={`items.${index}`}
              >
                {marker === "check" ? (
                  <span className="flex-shrink-0 mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-light">
                    <Check className="h-4 w-4 text-primary" strokeWidth={3} />
                  </span>
                ) : (
                  <span
                    className="flex-shrink-0 text-6xl font-semibold text-primary-dark tabular-nums leading-none"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
                <div className="flex flex-col gap-spacing-xs">
                  <h3
                    className="text-lg font-heading text-foreground transition-colors duration-300 group-hover:text-primary"
                    data-field={`items.${index}.title`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm text-muted leading-relaxed"
                    data-field={`items.${index}.description`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Right column: image */}
      {image && (
        <div
          data-reveal
          data-reveal-delay="150"
          className={cn(
            "relative h-full min-h-[320px] lg:min-h-full overflow-hidden",
            // A feathered image has no hard edge, so a corner radius is moot —
            // drop it to match the about-section feather look. The `imageBorder`
            // frame (see below) is also a square, edge-to-edge crop with no radius.
            !imageBorder && imageBlend !== "feather" && "rounded-radius"
          )}
          // A primary-light ambient shadow sits behind the image. It lives on this
          // wrapper (not the <img>) because the wrapper's overflow-hidden would
          // otherwise clip a shadow drawn on the image itself.
          style={
            imageShadow === "primary-light"
              ? {
                  boxShadow:
                    "0 30px 60px -20px color-mix(in srgb, var(--primary-light) 55%, transparent)",
                }
              : undefined
          }
        >
          <div className="relative h-full w-full">
            <img
              src={image}
              alt={title || ""}
              className="absolute inset-0 h-full w-full object-cover"
              style={imageStyle}
              loading="lazy"
            />
            {imageDescription && (imageDescription.name || imageDescription.description) && (
              <ImageDescription
                {...imageDescription}
                className="absolute bottom-0 left-0"
              />
            )}
          </div>
          {/* Inner border — a translucent line so its color blends with the
              image beneath (mirrors the services-list side image). */}
          {imageBorder && (
            <div className="pointer-events-none absolute inset-0 border border-white/20" />
          )}
        </div>
      )}
    </div>
  );
}
