"use client";

import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { AboutCareerProps } from "./types";

export function AboutCareer({ title, items, className }: AboutCareerProps) {
  return (
    <div className={cn("space-y-spacing-3xl", className)}>
      {title && (
        <ScrollReveal delay={0} direction="up" distance={20}>
          <h2 className="text-[2.5rem] leading-tight text-foreground font-heading mb-spacing-2xl">
            {title}
          </h2>
        </ScrollReveal>
      )}

      <StaggerContainer className="space-y-spacing-lg" staggerDelay={0.1}>
        {items.map((item, index) => (
          <StaggerItem key={index} direction="up" distance={20}>
            <div className="bg-card rounded-radius p-spacing-2xl">
              {/* Badge line above title */}
              <span className="block w-8 h-[2px] bg-primary mb-spacing-sm" />

              {/* Title (left) + Year (right) */}
              <div className="flex items-start justify-between gap-spacing-lg">
                <h3
                  className="text-[24px] font-bold font-heading text-foreground leading-snug"
                  data-field={`timeline.${index}.title`}
                >
                  {item.title}
                </h3>
                <span
                  className="text-sm text-muted font-medium tracking-wide flex-shrink-0"
                  data-field={`timeline.${index}.year`}
                >
                  {item.year}
                </span>
              </div>

              {/* Company + Description */}
              {(item.company || item.description) && (
                <div className="mt-spacing-sm space-y-spacing-sm">
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
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
