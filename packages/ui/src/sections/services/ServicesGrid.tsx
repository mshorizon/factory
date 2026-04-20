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
  minimal = false,
  detailsLabel = "Zobacz szczegóły",
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
            <Card
              className={cn(
                "group hover:shadow-lg transition-all hover:-translate-y-1 h-full p-spacing-lg flex flex-col cursor-pointer",
                // minimal variant = portfolio-law/lawfolio style: no border, accent line in primaryLight, larger rounding
                minimal ? "!border-0 !rounded-radius" : "!rounded-radius-secondary"
              )}
            >
              <span
                className={cn(
                  "block h-[2px] mb-spacing-md",
                  minimal ? "w-8 bg-primary-light" : "w-10 bg-primary"
                )}
              />
              <h3 className="text-2xl font-heading text-foreground mb-spacing-sm" data-field={`items.${index}.title`}>
                {item.title}
              </h3>
              <p className="text-base font-body text-muted mb-spacing-md flex-1" data-field={`items.${index}.description`}>
                {item.description}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-medium text-foreground group-hover:gap-2.5 transition-all",
                  minimal ? "text-base no-underline" : "text-sm underline underline-offset-4"
                )}
              >
                {detailsLabel}
                <ArrowUpRight className={cn(minimal ? "h-5 w-5" : "h-4 w-4")} />
              </span>
            </Card>
          </a>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
