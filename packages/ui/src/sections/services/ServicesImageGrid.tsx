"use client";

import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServicesProps } from "./types";

export function ServicesImageGrid({ items, className }: ServicesProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg", className)}
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
            className="group relative h-[300px] overflow-hidden rounded-radius-secondary block cursor-pointer"
            data-field={`items.${index}`}
          >
            {item.image && (
              <SafeImage
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                decoding="async"
              />
            )}

            {/* Black overlay at bottom - expands on hover */}
            <div className="absolute left-0 right-0 bottom-0 bg-black px-spacing-lg pt-6 pb-3 transition-all duration-500 ease-out">
              <div className="flex items-start justify-between gap-spacing-md mb-3">
                <h3
                  className="text-xl font-semibold text-white leading-tight"
                  data-field={`items.${index}.title`}
                >
                  {item.title}
                </h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </div>

              {/* Description - hidden initially, fades in on hover */}
              <p
                className="text-white/80 text-sm leading-relaxed max-h-0 opacity-0 overflow-hidden transition-all duration-500 ease-out group-hover:max-h-32 group-hover:opacity-100"
                data-field={`items.${index}.description`}
              >
                {item.description}
              </p>
            </div>
          </a>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
