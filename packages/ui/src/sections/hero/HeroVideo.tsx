"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

export function HeroVideo({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  backgroundImage,
  children,
  className,
  isHomePage = false,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative z-0 flex items-end",
        isHomePage ? "py-spacing-section" : "py-spacing-section-sm",
        className
      )}
    >
      {/* Full-bleed background image */}
      {backgroundImage && (
        <div
          className="absolute inset-0"
          data-field="backgroundImage"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Gradient overlay from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Content pinned to bottom */}
      <div className="relative container mx-auto">
        {badge && (
          <ScrollReveal delay={0} direction="up">
            <Badge
              variant="accent"
              className="mb-spacing-md text-sm px-spacing-md py-spacing-sm backdrop-blur-sm bg-background/30 border border-foreground/10"
              data-field="header.badge"
            >
              {badge}
            </Badge>
          </ScrollReveal>
        )}
        <ScrollReveal delay={0.1} direction="up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-spacing-md tracking-tight text-foreground max-w-3xl" data-field="header.title">
            {title}
          </h1>
        </ScrollReveal>
        {subtitle && (
          <ScrollReveal delay={0.2} direction="up">
            <p className="text-lg md:text-xl text-muted mb-spacing-2xl max-w-2xl" data-field="header.subtitle">
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
    </section>
  );
}
