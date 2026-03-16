"use client";

import { Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TestimonialsGridProps } from "./types";

export function TestimonialsGrid({ items, className }: TestimonialsGridProps) {
  // Extract name and location from title (format: "Name -- Location")
  const parseAuthor = (title: string) => {
    const parts = title.split(' -- ');
    return {
      name: parts[0] || title,
      location: parts[1] || ''
    };
  };

  // Generate avatar URL using UI Avatars service (fallback)
  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=random&color=fff&bold=true`;
  };

  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-x-spacing-lg gap-y-16", className)}
      staggerDelay={0.12}
    >
      {items.map((item, index) => {
        // Varied directions for 3-column grid: left, up, right pattern
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];
        const author = parseAuthor(item.title);

        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <div
            className="relative h-full bg-[#2D2F34] rounded-2xl p-spacing-lg pb-spacing-3xl overflow-visible"
            data-field={`items.${index}`}
          >
            <div className="flex gap-0.5 mb-spacing-md">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-primary text-primary"
                />
              ))}
            </div>
            <p
              className="text-base text-gray-300 leading-relaxed"
              data-field={`items.${index}.description`}
            >
              {item.description}
            </p>

            {/* Author section - positioned absolutely at bottom border */}
            <div className="absolute left-spacing-lg right-spacing-lg -bottom-10 flex items-center gap-spacing-md bg-surface-card dark:bg-white p-spacing-md rounded-xl shadow-lg">
              <img
                src={item.image || getAvatarUrl(author.name)}
                alt={author.name}
                className="w-14 h-14 rounded-full flex-shrink-0 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-foreground dark:text-gray-900 text-base"
                  data-field={`items.${index}.title`}
                >
                  {author.name}
                </p>
                {author.location && (
                  <p className="text-sm text-muted dark:text-gray-600">
                    {author.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
