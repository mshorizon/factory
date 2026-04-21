"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

export function HeroMinimal({
  title,
  subtitle,
  cta,
  secondaryCta,
  backgroundImage,
  image,
  children,
  className,
  isHomePage = false,
}: HeroProps) {
  const heroImage = image || backgroundImage;

  return (
    <section
      className={cn(
        "relative z-0 bg-background flex items-center",
        className
      )}
    >
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-spacing-3xl items-center">
          {/* Content */}
          <div>
            {/* Decorative accent line */}
            <ScrollReveal delay={0} direction="left" distance={20}>
              <div className="w-24 h-1 bg-primary mb-spacing-2xl" />
            </ScrollReveal>

            <ScrollReveal delay={0.1} direction="up">
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold font-heading mb-spacing-2xl tracking-tight text-foreground leading-none" data-field="header.title">
                {title}
              </h1>
            </ScrollReveal>
            {subtitle && (
              <ScrollReveal delay={0.2} direction="up">
                <p className="text-xl md:text-2xl text-muted mb-spacing-3xl max-w-xl" data-field="header.subtitle">
                  {subtitle}
                </p>
              </ScrollReveal>
            )}
            {(cta || secondaryCta) && (
              <ScrollReveal delay={0.3} direction="up">
                <div className="flex flex-wrap gap-spacing-md">
                  {cta && (
                    <Button
                      asChild
                      size="xl"
                      variant={cta.variant || "default"}
                      className="shadow-lg shadow-primary/25"
                      data-field="cta"
                    >
                      <a href={cta.href} onClick={() => (window as any).umami?.track('cta-click', { section: 'hero', label: cta.label })}>
                        {cta.label}
                        <ArrowRight className="ml-1 h-5 w-5" />
                      </a>
                    </Button>
                  )}
                  {secondaryCta && (
                    <Button
                      asChild
                      size="xl"
                      variant={secondaryCta.variant || "outline"}
                      data-field="secondaryCta"
                    >
                      <a href={secondaryCta.href} onClick={() => (window as any).umami?.track('cta-click', { section: 'hero-secondary', label: secondaryCta.label })}>{secondaryCta.label}</a>
                    </Button>
                  )}
                </div>
              </ScrollReveal>
            )}
            {children}
          </div>

          {/* Image (if provided) */}
          {heroImage && (
            <ScrollReveal delay={0.2} direction="right" distance={50}>
              <div className="relative lg:h-[500px] h-[350px] rounded-radius overflow-hidden" data-field="image">
                <img
                  src={heroImage}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                {/* Decorative overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
}
