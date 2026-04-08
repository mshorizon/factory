"use client";

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
        isHomePage ? "pt-spacing-section pb-spacing-xl" : "pt-spacing-section-sm pb-spacing-xl",
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
    </section>
  );
}
