"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServicesProps } from "./types";

export function ServicesDarkCards({ items, className }: ServicesProps) {
  return (
    <StaggerContainer
      className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => {
        // Varied directions for 3-column grid: left, up, right pattern
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];
        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <a
            href={`/services/${item.slug || item.id}`}
            className="group relative flex flex-col items-start justify-end gap-2 rounded-radius-secondary bg-secondary p-6 min-h-[280px] overflow-hidden transition-all cursor-pointer hover:shadow-xl block"
            data-field={`items.${index}`}
            style={{
              "--foreground": "var(--dark-foreground)",
              "--muted": "var(--dark-muted)",
            } as React.CSSProperties}
          >
            {item.image && (
              <>
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
              </>
            )}
            <div className="relative z-10 w-full flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3
                  className="text-lg font-semibold text-white mb-1"
                  data-field={`items.${index}.title`}
                >
                  {item.title}
                </h3>
                {item.description && (
                  <p
                    className="text-sm text-white/80 line-clamp-2"
                    data-field={`items.${index}.description`}
                  >
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                <ArrowUpRight className="h-5 w-5 text-white" />
              </div>
            </div>
          </a>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
