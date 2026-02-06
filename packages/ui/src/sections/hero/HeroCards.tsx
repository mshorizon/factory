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
}: HeroProps) {
  const heroImage = image || backgroundImage;

  return (
    <section
      className={cn(
        "relative z-0 min-h-screen bg-primary/5 flex items-center py-16 md:py-24",
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

      <div className="relative container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Main content card */}
          <ScrollReveal delay={0} direction="up">
            <div className="relative">
              {/* Stacked card effect */}
              <div className="absolute inset-0 bg-background rounded-radius rotate-3 shadow-xl -z-10" />
              <div className="absolute inset-0 bg-background rounded-radius -rotate-2 shadow-lg -z-20" />

              <div className="bg-background rounded-radius shadow-2xl p-8 md:p-12">
                {badge && (
                  <Badge variant="accent" className="mb-4 text-sm px-4 py-1" data-field="header.badge">
                    {badge}
                  </Badge>
                )}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-foreground" data-field="header.title">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-lg md:text-xl text-muted mb-8" data-field="header.subtitle">
                    {subtitle}
                  </p>
                )}
                {(cta || secondaryCta) && (
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
