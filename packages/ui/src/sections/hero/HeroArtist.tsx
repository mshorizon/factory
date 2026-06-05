"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

export function HeroArtist({
  title,
  subtitle,
  image,
  className,
  isHomePage = false,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative z-0 bg-background flex items-center justify-center",
        isHomePage && "min-h-screen",
        className
      )}
    >
      <div className="container mx-auto flex flex-col items-center text-center">
        {image && (
          <ScrollReveal delay={0} direction="up" distance={20}>
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-radius overflow-hidden mb-spacing-xl shadow-md">
              <img
                src={image}
                alt=""
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                data-field="image"
              />
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal delay={0.1} direction="up">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-heading mb-spacing-lg tracking-tight text-foreground leading-tight"
            data-field="header.title"
          >
            {title}
          </h1>
        </ScrollReveal>

        {subtitle && (
          <ScrollReveal delay={0.2} direction="up">
            <p
              className="text-base md:text-lg text-muted max-w-lg"
              data-field="header.subtitle"
            >
              {subtitle}
            </p>
          </ScrollReveal>
        )}
      </div>

      <div className="absolute bottom-spacing-xl left-1/2 -translate-x-1/2 flex flex-col items-center gap-spacing-xs text-muted">
        <span className="text-xs uppercase tracking-widest leading-none">
          Scroll
        </span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </div>
    </section>
  );
}
