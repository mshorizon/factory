"use client";

import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { TestimonialsGridProps } from "./types";

function getAvatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=random&color=fff&bold=true`;
}

export function TestimonialsCentered({ items, className }: TestimonialsGridProps) {
  const item = items[0];
  if (!item) return null;

  return (
    <div className={cn("flex flex-col items-center text-center max-w-3xl mx-auto", className)}>
      {/* Quote icon */}
      <ScrollReveal delay={0} direction="up" distance={20}>
        <svg
          className="w-14 h-14 text-primary mb-spacing-lg"
          viewBox="0 0 48 48"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 22c-1.1 0-2-.9-2-2 0-4.4 3.6-8 8-8h1c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1h-1C11.37 8 6 13.37 6 20v18c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V24c0-1.1-.9-2-2-2H12zm24 0c-1.1 0-2-.9-2-2 0-4.4 3.6-8 8-8h1c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1h-1C35.37 8 30 13.37 30 20v18c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V24c0-1.1-.9-2-2-2H36z" />
        </svg>
      </ScrollReveal>

      {/* Title - 40px primary (heading) font */}
      {item.title && (
        <ScrollReveal delay={0.1} direction="up" distance={20}>
          <h3
            className="text-[2.5rem] leading-tight font-heading text-foreground mb-spacing-lg"
            data-field="items.0.title"
          >
            {item.title}
          </h3>
        </ScrollReveal>
      )}

      {/* Description - 16px secondary (sans) font */}
      {item.description && (
        <ScrollReveal delay={0.2} direction="up" distance={20}>
          <p
            className="text-base font-sans text-muted leading-relaxed mb-spacing-2xl"
            data-field="items.0.description"
          >
            {item.description}
          </p>
        </ScrollReveal>
      )}

      {/* Author */}
      {item.author && (
        <ScrollReveal delay={0.3} direction="up" distance={20}>
          <div className="flex flex-col items-center gap-spacing-sm">
            <img
              src={item.image || getAvatarUrl(item.author)}
              alt={item.author}
              className="w-14 h-14 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="text-center">
              <p
                className="font-medium text-foreground"
                data-field="items.0.author"
              >
                {item.author}
              </p>
              {item.role && (
                <p className="text-sm text-muted">{item.role}</p>
              )}
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
