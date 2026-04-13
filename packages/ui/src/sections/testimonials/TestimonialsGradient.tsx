"use client";

import { Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TestimonialsGridProps } from "./types";

export function TestimonialsGradient({ items, className }: TestimonialsGridProps) {
  const parseAuthor = (title: string) => {
    const parts = title.split(" -- ");
    if (parts.length === 2) {
      return { name: parts[0], location: parts[1] };
    }
    const commaParts = title.split(", ");
    if (commaParts.length === 2) {
      return { name: commaParts[0], location: commaParts[1] };
    }
    return { name: title, location: "" };
  };

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=random&color=fff&bold=true`;
  };

  return (
    <StaggerContainer
      className={cn(
        "grid md:grid-cols-2 lg:grid-cols-2 gap-spacing-lg",
        className
      )}
      staggerDelay={0.1}
    >
      {items.map((item, index) => {
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];
        const author = parseAuthor(item.title);

        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <div
              className="relative rounded-xl border border-border/20 p-spacing-xl overflow-hidden h-full flex flex-col"
              style={{
                background:
                  "radial-gradient(ellipse at 0% 100%, color-mix(in srgb, var(--primary) 25%, transparent) 0%, transparent 60%)",
              }}
              data-field={`items.${index}`}
            >
              <div className="flex gap-1 mb-spacing-md">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-white fill-white"
                  />
                ))}
              </div>

              <p
                className="text-base text-foreground/90 leading-relaxed mb-spacing-lg flex-1"
                data-field={`items.${index}.description`}
              >
                {item.description}
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={item.image || getAvatarUrl(author.name)}
                  alt={author.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <p
                    className="text-sm font-semibold font-heading text-foreground"
                    data-field={`items.${index}.title`}
                  >
                    {author.name}
                  </p>
                  {author.location && (
                    <p className="text-xs text-muted">{author.location}</p>
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
