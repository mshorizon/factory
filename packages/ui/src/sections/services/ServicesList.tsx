"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServicesProps } from "./types";

export function ServicesList({
  items,
  ctaLabel,
  ctaHref = "/contact",
  className,
  categories,
  columns = 1,
}: ServicesProps) {
  const hasTabs = !!categories && categories.length > 0;
  const [activeCategory, setActiveCategory] = useState(hasTabs ? categories![0].id : "");

  // Keep each item's original index so data-field mapping stays correct when filtered.
  const visiblePairs = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !hasTabs || item.category === activeCategory);

  // Static class map so Tailwind JIT can detect the grid-cols utilities.
  const layoutClass = columns >= 3
    ? "grid grid-cols-1 md:grid-cols-3 gap-spacing-md"
    : columns === 2
      ? "grid grid-cols-1 md:grid-cols-2 gap-spacing-md"
      : "space-y-spacing-md";

  return (
    <div className={className}>
      {hasTabs && (
        <div className="flex flex-wrap justify-center gap-spacing-xs mb-spacing-2xl" role="tablist">
          {categories!.map((cat) => {
            const active = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "services-tab px-spacing-lg py-spacing-xs text-sm font-medium rounded-radius transition-colors",
                  active
                    ? "bg-primary text-on-primary"
                    : "text-muted hover:text-foreground"
                )}
                data-active={active ? "1" : undefined}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}
      <StaggerContainer key={activeCategory} className={layoutClass} staggerDelay={0.1}>
        {visiblePairs.map(({ item, index }, renderIndex) => {
        // Alternate left/right for list items
        const direction = renderIndex % 2 === 0 ? "left" : "right";
        return (
        <StaggerItem key={index} direction={direction} distance={20}>
          <a href={`/services/${item.slug || item.id}`} className="services-list-item group flex flex-col md:flex-row md:items-center justify-between gap-spacing-md p-spacing-lg bg-background border border-border rounded-radius-secondary hover:shadow-lg hover:border-primary/20 transition-all block cursor-pointer" data-field={`items.${index}`}>
            <div className="flex-1">
              <div className="flex items-center gap-spacing-sm mb-spacing-xs">
                <h3 className="text-xl font-semibold font-heading text-foreground group-hover:text-primary transition-colors" data-field={`items.${index}.title`}>
                  {item.title}
                </h3>
                {item.price && (
                  <span className="px-3 py-1 text-sm font-bold text-primary bg-primary/10 rounded-full" data-field={`items.${index}.price`}>
                    {item.price}
                  </span>
                )}
              </div>
              <p className="text-muted" data-field={`items.${index}.description`}>{item.description}</p>
            </div>
            {ctaLabel && (
              <div className="shrink-0 flex items-center gap-spacing-xs text-muted group-hover:text-primary transition-colors">
                <span>{ctaLabel}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </a>
        </StaggerItem>
        );
      })}
      </StaggerContainer>
    </div>
  );
}
