"use client";

import { ArrowRight, Star, Phone } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { SafeImage } from "../../atoms/SafeImage.js";
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
  hideDots = false,
  badgeLayout = "row",
}: HeroProps & { phone?: string }) {
  const heroImage = image || backgroundImage;
  const allTestimonials = testimonials || (testimonial ? [testimonial] : []);
  const badgeColor = hideDots
    ? "var(--primary-light)"
    : background === "dark" ? "var(--primary)" : "var(--primary-dark)";

  return (
    <section
      className={cn(
        "relative z-0 flex items-center",
        background !== "transparent" && !hideDots && "bg-background",
        className
      )}
    >
      <div className="container mx-auto flex flex-col gap-spacing-section">
        <div className={cn(
          "grid gap-spacing-2xl lg:gap-16 items-center",
          // portfolio-law: lock image column to 444px so it actually reaches max size
          hideDots ? "lg:grid-cols-[1fr_444px]" : "lg:grid-cols-[65fr_35fr]"
        )}>
          {/* Content Side */}
          <div className="flex flex-col justify-center">
            {badge && (
              <ScrollReveal delay={0} direction="up">
                <div className={cn(
                  "flex gap-spacing-sm mb-spacing-lg",
                  badgeLayout === "column" ? "flex-col items-start" : "flex-row items-center"
                )}>
                  {/* Decorative line — horizontal 32px in column layout (lawfolio style), wider horizontal in row layout */}
                  <div
                    className={badgeLayout === "column" ? "w-8 h-[2px]" : "w-12 h-[2px]"}
                    style={{ backgroundColor: badgeColor }}
                  />
                  <Badge
                    variant="accent"
                    className={cn(
                      "font-medium uppercase",
                      hideDots ? "text-[14px] tracking-[.05rem]" : "text-base tracking-wide",
                      // portfolio-law: badge sits flush with the decorative line, no padding
                      hideDots ? "px-0 py-0" : "px-spacing-md py-1.5"
                    )}
                    data-field="header.badge"
                    style={{ color: badgeColor }}
                  >
                    {badge}
                  </Badge>
                </div>
              </ScrollReveal>
            )}
            <ScrollReveal delay={0.1} direction="up">
              <h1 className="text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.1] font-semibold tracking-tight text-foreground mb-spacing-lg font-heading" data-field="header.title">
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
                  {cta && phone ? (
                    <Button
                      asChild
                      size="xl"
                      variant={cta.variant || "default"}
                      className="shadow-lg shadow-primary/25 h-16 pl-8 pr-3 text-base font-semibold hover:brightness-90 transition-all group"
                      data-field="cta"
                    >
                      <a href={cta.href} className="flex items-center gap-spacing-md" onClick={() => (window as any).umami?.track('cta-click', { section: 'hero', label: cta.label })}>
                        <span className="text-lg font-bold tracking-wide">
                          {phone}
                        </span>
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                          <Phone className="h-5 w-5 text-[#16181D] fill-[#16181D] group-hover:animate-wiggle" />
                        </div>
                      </a>
                    </Button>
                  ) : cta ? (
                    <Button
                      asChild
                      size="xl"
                      variant={cta.variant || "default"}
                      className={cn(
                        "shadow-lg shadow-primary/25 h-14 px-8 text-base font-semibold hover:brightness-90 transition-all group",
                        // portfolio-law (hideDots) hero CTA uses primaryLight tint + pill rounding
                        hideDots && "bg-primary-light hover:bg-primary-light/90 !rounded-full"
                      )}
                      data-field="cta"
                    >
                      <a href={cta.href} className="flex items-center gap-spacing-sm" onClick={() => (window as any).umami?.track('cta-click', { section: 'hero', label: cta.label })}>
                        <span>{cta.label}</span>
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </a>
                    </Button>
                  ) : null}
                  {secondaryCta && (
                    <Button
                      asChild
                      size="xl"
                      variant="ghost"
                      className="h-16 px-spacing-2xl text-base font-semibold border-2 border-border text-muted hover:bg-white hover:border-white hover:text-[#16181D] transition-all"
                      data-field="secondaryCta"
                    >
                      <a href={secondaryCta.href} className="hover:!text-[#16181D]" onClick={() => (window as any).umami?.track('cta-click', { section: 'hero-secondary', label: secondaryCta.label })}>{secondaryCta.label}</a>
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
              <div className={cn(
                "w-full mx-auto lg:ml-auto lg:mr-0",
                hideDots ? "max-w-[444px]" : "max-w-[384px]"
              )}>
                <div className={cn(
                  "relative w-full",
                  hideDots ? "h-[260px] sm:h-[320px] lg:h-[360px] max-h-[360px]" : "h-[300px] sm:h-[380px] lg:h-[460px]"
                )} data-field="image">
                  {/* Dots BEHIND image (z-index) */}
                  {!hideDots && (
                    <>
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
                    </>
                  )}

                  {/* Image on top */}
                  <div
                    className={cn(
                      "relative w-full h-full overflow-hidden z-10",
                      hideDots && "rounded-radius"
                    )}
                    style={!hideDots ? {
                      borderRadius: "var(--radius-secondary) 100px var(--radius-secondary) 100px"
                    } : undefined}
                  >
                    <SafeImage
                      src={heroImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
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
                    <SafeImage
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
                    <p className="text-xl font-bold font-heading text-foreground leading-tight">{testimonialItem.title}</p>
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
