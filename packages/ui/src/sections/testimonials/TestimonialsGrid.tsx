"use client";

import { Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardHeader, CardContent } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TestimonialsGridProps } from "./types";

export function TestimonialsGrid({ items, className }: TestimonialsGridProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg", className)}
      staggerDelay={0.12}
    >
      {items.map((item, index) => {
        // Varied directions for 3-column grid: left, up, right pattern
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];
        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <Card className="h-full" data-field={`items.${index}`}>
            <CardHeader className="pb-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-primary text-primary"
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <p
                className="text-sm text-muted italic leading-relaxed"
                data-field={`items.${index}.description`}
              >
                &ldquo;{item.description}&rdquo;
              </p>
              <p
                className="mt-spacing-md text-sm font-semibold text-foreground"
                data-field={`items.${index}.title`}
              >
                {item.title}
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
