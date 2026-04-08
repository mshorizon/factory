"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { GalleryItem } from "./types";

export interface GalleryShowcaseProps {
  items: GalleryItem[];
  exploreLabel?: string;
  exploreHref?: string;
  className?: string;
}

export function GalleryShowcase({
  items,
  exploreLabel = "View All",
  exploreHref,
  className,
}: GalleryShowcaseProps) {
  return (
    <div className={cn("space-y-spacing-lg", className)}>
      {items.map((item, index) => (
        <ScrollReveal key={index} delay={index * 0.1} direction="up" distance={30}>
          <a
            href={item.description || "#"}
            className="group block relative bg-surface-alt rounded-radius overflow-hidden transition-shadow hover:shadow-lg"
            data-field={`items.${index}`}
          >
            {/* Badge */}
            {item.title && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-background rounded-full px-3 py-1.5 text-sm text-foreground shadow-sm">
                <span className="text-foreground/60">$</span>
                <span>For sale</span>
              </div>
            )}

            {/* Image */}
            <div className="flex items-center justify-center p-spacing-xl md:p-spacing-3xl min-h-[300px] md:min-h-[400px]">
              <SafeImage
                src={item.image}
                alt={item.title}
                className="max-h-[350px] md:max-h-[450px] w-auto object-contain rounded-sm shadow-md transition-transform duration-500 group-hover:scale-[1.02]"
                loading={index < 2 ? "eager" : "lazy"}
              />
            </div>

            {/* Info bar */}
            <div className="flex items-end justify-between p-spacing-lg pt-0">
              <div>
                <h3
                  className="text-lg font-medium text-foreground"
                  data-field={`items.${index}.title`}
                >
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-foreground" />
              </div>
            </div>
          </a>
        </ScrollReveal>
      ))}

      {exploreHref && (
        <ScrollReveal delay={0.3} direction="up">
          <a
            href={exploreHref}
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
          >
            <span>{exploreLabel}</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </ScrollReveal>
      )}
    </div>
  );
}
