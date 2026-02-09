"use client";

import { MapPin } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServiceAreaProps } from "./types";

export function ServiceArea({ areas, className }: ServiceAreaProps) {
  return (
    <StaggerContainer
      className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}
      staggerDelay={0.08}
    >
      {areas.map((area, index) => (
        <StaggerItem key={index} direction="up" distance={20}>
          <div
            className="flex items-center gap-3 rounded-radius border border-border bg-background px-4 py-3 transition-colors hover:border-primary/50"
            data-field={`areas.${index}`}
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm font-medium text-foreground">{area}</span>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
