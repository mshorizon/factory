"use client";

import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { TestimonialsGridProps } from "./types";

export function TestimonialsFeatured({ items, className }: TestimonialsGridProps) {
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
    <div className={cn("grid lg:grid-cols-2 gap-spacing-lg items-stretch", className)}>
      {/* Quote side */}
      <ScrollReveal delay={0} direction="left" distance={30}>
        <div className="flex flex-col justify-center h-full py-spacing-3xl">
          <blockquote
            className="text-2xl md:text-3xl lg:text-4xl font-heading text-foreground leading-snug mb-spacing-2xl"
            data-field="items.0.description"
          >
            &ldquo;{item.description}&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            {item.image && (
              <img
                src={item.image}
                alt={author.name}
                className="w-12 h-12 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
            <div>
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
        </div>
      </ScrollReveal>

      {/* Image side */}
      {items[0] && (items as any)[0]?.backgroundImage && (
        <ScrollReveal delay={0.15} direction="right" distance={30}>
          <div className="relative rounded-radius overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-full">
            <img
              src={(items as any)[0].backgroundImage}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
