"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServicesProps } from "./types";

export function ServicesDarkCards({ items, className }: ServicesProps) {
  return (
    <StaggerContainer
      className={cn("grid grid-cols-1 gap-4", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => (
        <StaggerItem key={index} direction="up" distance={30}>
          <div
            className="group relative flex items-end justify-between gap-4 rounded-radius bg-secondary p-6 min-h-[250px] overflow-hidden transition-all cursor-pointer"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
              </>
            )}
            <h3
              className="relative z-10 text-xl font-semibold text-foreground"
              data-field={`items.${index}.title`}
            >
              {item.title}
            </h3>
            <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-on-primary transition-transform group-hover:scale-110">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
