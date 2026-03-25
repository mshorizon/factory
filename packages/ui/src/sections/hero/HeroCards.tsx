"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

export function HeroCards({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  image,
  backgroundImage,
  children,
  className,
  isHomePage = false,
}: HeroProps) {
  const heroImage = image || backgroundImage;

  return (
    <section
      className={cn(
        "relative z-0 bg-primary/5 flex items-center",
        isHomePage ? "py-spacing-section" : "py-spacing-section-sm",
        className
      )}
    >
      {/* Subtle pattern background */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative container mx-auto">
        <div className="grid lg:grid-cols-2 gap-spacing-2xl lg:gap-spacing-3xl items-center">
          {/* Main content card */}
          <ScrollReveal delay={0} direction="up">
            <div className="relative">
              {/* Stacked card effect */}
              <div className="absolute inset-0 bg-background rounded-radius rotate-3 shadow-xl -z-10" />
              <div className="absolute inset-0 bg-background rounded-radius -rotate-2 shadow-lg -z-20" />

              <div className="bg-background rounded-radius shadow-2xl p-spacing-2xl md:p-spacing-3xl">
                {badge && (
                  <Badge variant="accent" className="mb-spacing-md text-sm px-spacing-md py-1" data-field="header.badge">
                    {badge}
                  </Badge>
                )}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-spacing-lg tracking-tight text-foreground" data-field="header.title">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-lg md:text-xl text-muted mb-spacing-2xl" data-field="header.subtitle">
                    {subtitle}
                  </p>
                )}
                {(cta || secondaryCta) && (
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
                )}
                {children}
              </div>
            </div>
          </ScrollReveal>

          {/* Image card (if provided) */}
          {heroImage && (
            <ScrollReveal delay={0.2} direction="right" distance={50}>
              <div className="relative lg:h-[500px] h-[350px]">
                <div className="absolute inset-4 bg-primary/10 rounded-radius -rotate-6" />
                <div className="absolute inset-0 rounded-radius overflow-hidden shadow-2xl" data-field="image">
                  <img
                    src={heroImage}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
}
