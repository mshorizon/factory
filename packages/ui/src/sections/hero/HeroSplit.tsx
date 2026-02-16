"use client";

import { ArrowRight, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { HeroProps } from "./types";

function DottedGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn("absolute pointer-events-none", className)}
      style={{
        width: "120px",
        height: "120px",
        backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: "12px 12px",
        opacity: 0.3,
      }}
    />
  );
}

export function HeroSplit({
  title,
  subtitle,
  badge,
  cta,
  secondaryCta,
  image,
  backgroundImage,
  testimonial,
  testimonials,
  children,
  className,
}: HeroProps) {
  const heroImage = image || backgroundImage;
  const allTestimonials = testimonials || (testimonial ? [testimonial] : []);

  return (
    <section
      className={cn(
        "relative z-0 bg-background min-h-[80vh] flex flex-col justify-center",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content Side */}
          <div className="flex flex-col justify-center py-12 lg:py-24">
            {badge && (
              <ScrollReveal delay={0} direction="up">
                <Badge variant="accent" className="mb-4 text-sm px-4 py-1 w-fit" data-field="header.badge">
                  {badge}
                </Badge>
              </ScrollReveal>
            )}
            <ScrollReveal delay={0.1} direction="up">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-foreground" data-field="header.title">
                {title}
              </h1>
            </ScrollReveal>
            {subtitle && (
              <ScrollReveal delay={0.2} direction="up">
                <p className="text-lg md:text-xl text-muted mb-8 max-w-lg" data-field="header.subtitle">
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

          {/* Image Side */}
          {heroImage && (
            <ScrollReveal delay={0.2} direction="right" distance={50}>
              <div className="space-y-6">
                <div className="relative lg:h-[500px] h-[350px]" data-field="image">
                  <div className="relative w-full h-full rounded-radius overflow-hidden">
                    <img
                      src={heroImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Testimonial below image */}
                {allTestimonials.length > 0 && (
                  <div className="flex items-start gap-4" data-field="testimonial">
                    <div className="flex-shrink-0">
                      <div className="flex gap-0.5 mb-1">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">{allTestimonials[0].title}</h3>
                      <p className="text-sm text-muted">&ldquo;{allTestimonials[0].quote}&rdquo;</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
}
