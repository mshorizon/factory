"use client";

import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServicesProps } from "./types";

export function ServicesImageGrid({ items, className }: ServicesProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-6", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => (
        <StaggerItem key={index} direction="up" distance={30}>
          <div
            className="group relative aspect-[4/3] overflow-hidden rounded-radius"
            data-field={`items.${index}`}
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
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
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
