"use client";

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
}: ServicesProps) {
  return (
    <StaggerContainer className={cn("space-y-spacing-md", className)} staggerDelay={0.1}>
      {items.map((item, index) => {
        // Alternate left/right for list items
        const direction = index % 2 === 0 ? "left" : "right";
        return (
        <StaggerItem key={index} direction={direction} distance={20}>
          <a href={`/services/${item.slug || item.id}`} className="group flex flex-col md:flex-row md:items-center justify-between gap-spacing-md p-spacing-lg bg-background border border-border rounded-radius-secondary hover:shadow-lg hover:border-primary/20 transition-all block cursor-pointer" data-field={`items.${index}`}>
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
  );
}
