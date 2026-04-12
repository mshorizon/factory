"use client";

import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { TestimonialsGridProps } from "./types";

export function TestimonialsCentered({ items, className, sectionTitle, sectionDescription }: TestimonialsGridProps) {
  const item = items[0];
  if (!item) return null;

  const parseAuthor = (title: string) => {
    const parts = title.split(" -- ");
    if (parts.length === 2) return { name: parts[0], role: parts[1] };
    const commaParts = title.split(", ");
    if (commaParts.length === 2) return { name: commaParts[0], role: commaParts[1] };
    return { name: title, role: "" };
  };

  const author = parseAuthor(item.title);

  return (
    <div className={cn("flex flex-col items-center text-center max-w-3xl mx-auto", className)}>
      {/* Section title & description */}
      {sectionTitle && (
        <ScrollReveal delay={0} direction="up" distance={20}>
          <h2 className="text-[2.5rem] leading-tight font-heading text-foreground mb-spacing-md">
            {sectionTitle}
          </h2>
        </ScrollReveal>
      )}
      {sectionDescription && (
        <ScrollReveal delay={0.05} direction="up" distance={20}>
          <p className="text-base font-sans text-muted mb-spacing-3xl">
            {sectionDescription}
          </p>
        </ScrollReveal>
      )}

      {/* Quote marks */}
      <ScrollReveal delay={sectionTitle ? 0.1 : 0} direction="up" distance={20}>
        <svg
          className="w-14 h-14 text-primary mb-spacing-lg"
          viewBox="0 0 48 48"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 22c-1.1 0-2-.9-2-2 0-4.4 3.6-8 8-8h1c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1h-1C11.37 8 6 13.37 6 20v18c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V24c0-1.1-.9-2-2-2H12zm24 0c-1.1 0-2-.9-2-2 0-4.4 3.6-8 8-8h1c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1h-1C35.37 8 30 13.37 30 20v18c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V24c0-1.1-.9-2-2-2H36z" />
        </svg>
      </ScrollReveal>

      {/* Quote text */}
      <ScrollReveal delay={sectionTitle ? 0.15 : 0.1} direction="up" distance={20}>
        <blockquote
          className="text-2xl md:text-3xl lg:text-4xl font-heading text-foreground leading-snug mb-spacing-2xl"
          data-field="items.0.description"
        >
          {item.description}
        </blockquote>
      </ScrollReveal>

      {/* Author */}
      <ScrollReveal delay={sectionTitle ? 0.2 : 0.2} direction="up" distance={20}>
        <div className="flex flex-col items-center gap-spacing-sm">
          {item.image && (
            <img
              src={item.image}
              alt={author.name}
              className="w-14 h-14 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="text-center">
            <p
              className="font-medium text-foreground"
              data-field="items.0.title"
            >
              {author.name}
            </p>
            {author.role && (
              <p className="text-sm text-muted">{author.role}</p>
            )}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
