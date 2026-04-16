"use client";

import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { AboutCareerProps } from "./types";

export function AboutCareer({ title, items, className }: AboutCareerProps) {
  return (
    <div className={cn("space-y-spacing-3xl", className)}>
      {/* Section header */}
      {title && (
        <ScrollReveal delay={0} direction="up" distance={20}>
          <div className="space-y-spacing-sm">
            <span className="block w-8 h-[2px] bg-primary" />
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{title}</h2>
          </div>
        </ScrollReveal>
      )}

      {/* Career entries */}
      <StaggerContainer className="divide-y divide-border" staggerDelay={0.1}>
        {items.map((item, index) => (
          <StaggerItem key={index} direction="up" distance={20}>
            <div className="py-spacing-2xl grid md:grid-cols-[200px_1fr] gap-spacing-lg md:gap-spacing-2xl">
              {/* Year range */}
              <div className="flex-shrink-0">
                <span className="text-sm text-muted font-medium tracking-wide" data-field={`timeline.${index}.year`}>
                  {item.year}
                </span>
              </div>

              {/* Title + description */}
              <div className="space-y-spacing-sm">
                <h3 className="text-lg font-bold font-heading text-foreground leading-snug" data-field={`timeline.${index}.title`}>
                  {item.title}
                </h3>
                {item.company && (
                  <p className="text-sm text-muted font-medium" data-field={`timeline.${index}.company`}>
                    {item.company}
                  </p>
                )}
                {item.description && (
                  <p className="text-muted leading-relaxed" data-field={`timeline.${index}.description`}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
