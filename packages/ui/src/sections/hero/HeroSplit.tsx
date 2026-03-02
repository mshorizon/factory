"use client";

import { ArrowRight, Star, Phone } from "lucide-react";
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
  phone,
}: HeroProps & { phone?: string }) {
  const heroImage = image || backgroundImage;
  const allTestimonials = testimonials || (testimonial ? [testimonial] : []);

  return (
    <section
      className={cn(
        "relative z-0 bg-background min-h-[600px] lg:h-[1000px] flex items-center pt-[248px] pb-[120px] lg:pt-20 lg:pb-0",
        className
      )}
    >
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-[65fr_35fr] gap-8 lg:gap-16 items-center">
          {/* Content Side */}
          <div className="flex flex-col justify-center">
            {badge && (
              <ScrollReveal delay={0} direction="up">
                <div className="flex items-center gap-3 mb-6">
                  {/* Horizontal decorative line */}
                  <div className="w-12 h-[2px] bg-primary" />
                  <Badge variant="accent" className="text-base font-medium px-4 py-1.5 uppercase tracking-wide" data-field="header.badge">
                    {badge}
                  </Badge>
                </div>
              </ScrollReveal>
            )}
            <ScrollReveal delay={0.1} direction="up">
              <h1 className="text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.1] font-semibold tracking-tight text-foreground mb-6" data-field="header.title">
                {title}
              </h1>
            </ScrollReveal>
            {subtitle && (
              <ScrollReveal delay={0.2} direction="up">
                <p className="text-base text-muted mb-10 max-w-lg leading-relaxed" data-field="header.subtitle">
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
                      className="shadow-lg shadow-primary/25 h-16 pl-8 pr-3 text-base font-semibold hover:brightness-90 transition-all group"
                      data-field="cta"
                    >
                      <a href={cta.href} className="flex items-center gap-4">
                        {/* Phone number on the left */}
                        <span className="text-lg font-bold tracking-wide">
                          {phone || cta.label}
                        </span>
                        {/* White circle with phone icon on the right */}
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                          <Phone className="h-5 w-5 text-[#16181D] fill-[#16181D] group-hover:animate-wiggle" />
                        </div>
                      </a>
                    </Button>
                  )}
                  {secondaryCta && (
                    <Button
                      asChild
                      size="xl"
                      variant="ghost"
                      className="h-16 px-8 text-base font-semibold border-2 border-border text-muted hover:bg-white hover:border-white hover:text-[#16181D] transition-all"
                      data-field="secondaryCta"
                    >
                      <a href={secondaryCta.href} className="hover:!text-[#16181D]">{secondaryCta.label}</a>
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
              <div className="w-full max-w-[384px] mx-auto lg:ml-auto lg:mr-0">
                {/* Image with dots behind (z-index) */}
                <div className="relative w-full h-[300px] sm:h-[380px] lg:h-[460px]" data-field="image">
                  {/* Dots BEHIND image (z-index) - 2x bigger dots, 2x less dense */}
                  <div
                    className="absolute -top-6 -left-6 w-32 h-32 opacity-30 pointer-events-none text-foreground -z-10"
                    style={{
                      backgroundImage: "radial-gradient(circle, currentColor 2px, transparent 2px)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  <div
                    className="absolute -bottom-6 -right-6 w-32 h-32 opacity-30 pointer-events-none text-foreground -z-10"
                    style={{
                      backgroundImage: "radial-gradient(circle, currentColor 2px, transparent 2px)",
                      backgroundSize: "16px 16px",
                    }}
                  />

                  {/* Image on top */}
                  <div className="relative w-full h-full rounded-[100px] overflow-hidden z-10">
                    <img
                      src={heroImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* Person Ratings at bottom - Electria style */}
        {allTestimonials.length > 0 && (
          <div className="mt-40 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 max-w-6xl">
            {allTestimonials.slice(0, 2).map((testimonialItem, idx) => (
              <ScrollReveal key={idx} delay={0.4 + idx * 0.1} direction="up">
                <div className="flex items-start gap-5" data-field="testimonial">
                  {/* Avatar image - larger */}
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${idx === 0 ? 'John' : 'Emily'}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    {/* Stars - gold/yellow */}
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-5 w-5 fill-[#FFC633] text-[#FFC633]" />
                      ))}
                    </div>
                    {/* Title - larger and bold */}
                    <h3 className="text-xl font-bold text-foreground leading-tight">{testimonialItem.title}</h3>
                    {/* Quote - muted */}
                    {testimonialItem.quote && (
                      <p className="text-sm text-muted leading-relaxed">&ldquo;{testimonialItem.quote}&rdquo;</p>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
