"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FeaturesNumberedSplitProps } from "./types";

export function FeaturesNumberedSplit({
  items,
  badge,
  title,
  image,
  className,
}: FeaturesNumberedSplitProps) {
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
                className={cn(
                  "flex items-start gap-spacing-lg py-spacing-lg",
                  index > 0 && "border-t border-border/30"
                )}
                data-field={`items.${index}`}
              >
                <span className="flex-shrink-0 text-sm font-semibold text-primary tabular-nums pt-0.5">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-spacing-xs">
                  <h3
                    className="text-lg font-heading text-foreground"
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
          className="relative h-full min-h-[320px] lg:min-h-full overflow-hidden rounded-radius"
        >
          <img
            src={image}
            alt={title || ""}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
