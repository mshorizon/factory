"use client";

import { MapPin } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServiceAreaProps } from "./types";

export function ServiceArea({ areas, stats, className }: ServiceAreaProps) {
  return (
    <div className={cn("space-y-12", className)}>
      <StaggerContainer
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        staggerDelay={0.08}
      >
        {areas.map((area, index) => {
          // Varied directions for 4-column grid
          const directions = ["left", "up", "up", "right"] as const;
          const direction = directions[index % 4];
          return (
          <StaggerItem key={index} direction={direction} distance={20}>
            <div
              className="flex items-center gap-3 rounded-radius border border-border bg-background px-4 py-3 transition-colors hover:border-primary/50"
              data-field={`areas.${index}`}
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-medium text-foreground">{area}</span>
            </div>
          </StaggerItem>
          );
        })}
      </StaggerContainer>

      {stats && stats.length > 0 && (
        <StaggerContainer
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          staggerDelay={0.1}
        >
          {stats.map((stat, index) => {
            // Varied directions for 4-column grid
            const directions = ["left", "up", "up", "right"] as const;
            const direction = directions[index % 4];
            return (
            <StaggerItem key={index} direction={direction} distance={20}>
              <div className="text-center" data-field={`stats.${index}`}>
                <div
                  className="text-4xl md:text-5xl font-bold text-primary mb-2"
                  data-field={`stats.${index}.value`}
                >
                  {stat.value}
                </div>
                <p
                  className="text-sm text-muted"
                  data-field={`stats.${index}.label`}
                >
                  {stat.label}
                </p>
              </div>
            </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
