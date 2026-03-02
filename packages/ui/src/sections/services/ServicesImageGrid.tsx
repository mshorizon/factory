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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <h3
                className="text-xl font-semibold text-white"
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
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
