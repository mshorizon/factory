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
}: HeroProps) {
  const heroImage = image || backgroundImage;

  return (
    <section
      className={cn(
        "relative z-0 min-h-screen bg-background flex items-center",
        className
      )}
    >
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            {/* Decorative accent line */}
            <ScrollReveal delay={0} direction="left" distance={20}>
              <div className="w-24 h-1 bg-primary mb-8" />
            </ScrollReveal>

            <ScrollReveal delay={0.1} direction="up">
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 tracking-tight text-primary leading-none" data-field="header.title">
                {title}
              </h1>
            </ScrollReveal>
            {subtitle && (
              <ScrollReveal delay={0.2} direction="up">
                <p className="text-xl md:text-2xl text-muted mb-12 max-w-xl" data-field="header.subtitle">
                  {subtitle}
                </p>
              </ScrollReveal>
            )}
            {(cta || secondaryCta) && (
              <ScrollReveal delay={0.3} direction="up">
                <div className="flex flex-wrap gap-4">
                  {cta && (
                    <Button
                      asChild
                      size="xl"
                      variant={cta.variant || "default"}
                      className="shadow-lg shadow-primary/25"
                      data-field="cta"
                    >
                      <a href={cta.href}>
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
                      <a href={secondaryCta.href}>{secondaryCta.label}</a>
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
