"use client";

import { cn } from "../../lib/utils";
import { Card } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import { ArrowUpRight } from "lucide-react";
import type { ServicesProps } from "./types";

export function ServicesGrid({
  items,
  ctaLabel,
  ctaHref = "/contact",
  className,
}: ServicesProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => {
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];
        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <a href={`/services/${item.slug || item.id}`} className="block h-full cursor-pointer" data-field={`items.${index}`}>
            <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 h-full !rounded-radius-secondary p-spacing-xl flex flex-col">
              <span className="block w-10 h-[2px] bg-primary mb-spacing-lg" />
              <h3 className="text-2xl font-heading text-foreground mb-spacing-md" data-field={`items.${index}.title`}>
                {item.title}
              </h3>
              <p className="text-base font-body text-muted mb-spacing-xl flex-1" data-field={`items.${index}.description`}>
                {item.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline underline-offset-4 group-hover:gap-2.5 transition-all">
                See more details
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Card>
          </a>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
