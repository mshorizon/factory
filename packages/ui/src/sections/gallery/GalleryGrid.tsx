"use client";

import { cn } from "../../lib/utils";
import { Card, CardContent } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { GalleryGridProps } from "./types";

export function GalleryGrid({ items, className }: GalleryGridProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-6", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => (
        <StaggerItem key={index} direction="up" distance={30}>
          <Card
            className="group overflow-hidden"
            data-field={`items.${index}`}
          >
            <CardContent className="p-0">
              <div className="aspect-[3/2] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3
                  className="font-semibold text-foreground"
                  data-field={`items.${index}.title`}
                >
                  {item.title}
                </h3>
                {item.description && (
                  <p
                    className="mt-1 text-sm text-muted"
                    data-field={`items.${index}.description`}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
