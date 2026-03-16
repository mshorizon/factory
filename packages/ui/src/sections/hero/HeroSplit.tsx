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
  background,
  isHomePage = false,
}: HeroProps & { phone?: string }) {
  const heroImage = image || backgroundImage;
  const allTestimonials = testimonials || (testimonial ? [testimonial] : []);
  const badgeColor = background === "dark" ? "var(--primary)" : "var(--primary-dark)";

  return (
    <section
      className={cn(
        "relative z-0 bg-background flex items-center",
        isHomePage ? "py-spacing-section" : "py-spacing-section-sm",
        className
      )}
    >
      <div className="container mx-auto flex flex-col gap-spacing-section">
        <div className="grid lg:grid-cols-[65fr_35fr] gap-spacing-2xl lg:gap-16 items-center">
          {/* Content Side */}
          <div className="flex flex-col justify-center">
            {badge && (
              <ScrollReveal delay={0} direction="up">
                <div className="flex items-center gap-spacing-sm mb-spacing-lg">
                  {/* Horizontal decorative line */}
                  <div className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
                  <Badge variant="accent" className="text-base font-medium px-spacing-md py-1.5 uppercase tracking-wide" data-field="header.badge" style={{ color: badgeColor }}>
                    {badge}
                  </Badge>
                </div>
              </ScrollReveal>
            )}
            <ScrollReveal delay={0.1} direction="up">
              <h1 className="text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.1] font-semibold tracking-tight text-foreground mb-spacing-lg" data-field="header.title">
                {title}
              </h1>
            </ScrollReveal>
            {subtitle && (
              <ScrollReveal delay={0.2} direction="up">
                <p className="text-base text-muted mb-spacing-2xl max-w-lg leading-relaxed" data-field="header.subtitle">
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
                      className="shadow-lg shadow-primary/25 h-16 pl-8 pr-3 text-base font-semibold hover:brightness-90 transition-all group"
                      data-field="cta"
                    >
                      <a href={cta.href} className="flex items-center gap-spacing-md">
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
                      className="h-16 px-spacing-2xl text-base font-semibold border-2 border-border text-muted hover:bg-white hover:border-white hover:text-[#16181D] transition-all"
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
                    className="absolute top-[26px] -left-[46px] w-[36px] h-[216px] opacity-15 pointer-events-none text-foreground -z-10"
                    style={{
                      backgroundImage: "radial-gradient(circle, currentColor 4px, transparent 4px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <div
                    className="absolute bottom-[26px] -right-[46px] w-[36px] h-[144px] opacity-15 pointer-events-none text-foreground -z-10"
                    style={{
                      backgroundImage: "radial-gradient(circle, currentColor 4px, transparent 4px)",
                      backgroundSize: "18px 18px",
                    }}
                  />

                  {/* Image on top */}
                  <div
                    className="relative w-full h-full overflow-hidden z-10"
                    style={{
                      borderRadius: "var(--radius-secondary) 100px var(--radius-secondary) 100px"
                    }}
                  >
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl max-w-6xl">
            {allTestimonials.slice(0, 2).map((testimonialItem, idx) => (
              <ScrollReveal key={idx} delay={0.4 + idx * 0.1} direction="up">
                <div className="flex items-start gap-5" data-field="testimonial">
                  {/* Avatar image - larger */}
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={testimonialItem.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${idx === 0 ? 'John' : 'Emily'}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-spacing-sm">
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
