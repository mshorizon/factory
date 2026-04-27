"use client";

import { ArrowRight, Phone, Calendar, Check, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { ScrollReveal } from "../../animations/ScrollReveal";

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

interface CtaBannerAgencyProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  calendarTitle?: string;
  calendarSubtitle?: string;
  timeSlots?: TimeSlot[];
  trustLabels?: string[];
  className?: string;
}

export function CtaBannerAgency({
  title,
  subtitle,
  badge,
  ctaLabel,
  ctaHref = "/contact",
  secondaryCtaLabel,
  secondaryCtaHref,
  calendarTitle,
  calendarSubtitle,
  timeSlots = [],
  trustLabels = [],
  className,
}: CtaBannerAgencyProps) {
  return (
    <section className={cn("bg-foreground text-background relative overflow-hidden", className)}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/15 rounded-full blur-[140px] -translate-y-1/2 pointer-events-none" />
      <div className="container mx-auto text-center relative z-10">
        {badge && (
          <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold tracking-wide uppercase mb-spacing-lg">
              <Sparkles className="w-3.5 h-3.5" />
              {badge}
            </div>
          </ScrollReveal>
        )}

        {title && (
          <ScrollReveal delay={0.1}>
            <h2 className="text-4xl md:text-6xl font-bold leading-[1.0] mb-spacing-lg font-heading" data-field="header.title">
              {title.split(/(\*[^*]+\*)/g).map((part, i) =>
                part.startsWith("*") && part.endsWith("*") ? (
                  <span key={i} className="text-primary italic font-heading-secondary font-medium">
                    {part.slice(1, -1)}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </h2>
          </ScrollReveal>
        )}

        {subtitle && (
          <ScrollReveal delay={0.15}>
            <p className="text-lg lg:text-xl leading-relaxed text-background/75 max-w-2xl mx-auto mb-spacing-2xl" data-field="header.subtitle">
              {subtitle}
            </p>
          </ScrollReveal>
        )}

        {timeSlots.length > 0 && (
          <ScrollReveal delay={0.2}>
            <div className="bg-background/5 backdrop-blur border border-background/10 rounded-3xl p-spacing-lg lg:p-spacing-2xl max-w-2xl mx-auto mb-spacing-2xl text-left">
              {(calendarTitle || calendarSubtitle) && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    {calendarSubtitle && (
                      <div className="text-[11px] uppercase tracking-wider text-background/60 font-bold">
                        {calendarSubtitle}
                      </div>
                    )}
                    {calendarTitle && (
                      <div className="text-lg font-bold">{calendarTitle}</div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-center py-3 rounded-xl text-sm border",
                      slot.available
                        ? "bg-background/10 border-background/20 hover:bg-primary/20 hover:border-primary/40 cursor-pointer transition-colors"
                        : "bg-background/5 border-background/10 opacity-40 line-through cursor-not-allowed"
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-background/60 font-bold">
                      {slot.date}
                    </div>
                    <div className="font-bold mt-0.5">{slot.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-spacing-2xl">
            {ctaLabel && (
              <Button
                asChild
                size="lg"
                className="!rounded-full h-14 px-8 text-base bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
              >
                <a href={ctaHref}>
                  {ctaLabel}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
            )}
            {secondaryCtaLabel && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="!rounded-full h-14 px-8 text-base border-background/30 text-background hover:bg-background/10 bg-transparent"
              >
                <a href={secondaryCtaHref || "tel:"}>
                  <Phone className="mr-2 w-4 h-4" />
                  {secondaryCtaLabel}
                </a>
              </Button>
            )}
          </div>
        </ScrollReveal>

        {trustLabels.length > 0 && (
          <ScrollReveal delay={0.35}>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-background/65">
              {trustLabels.map((label, i) => (
                <span key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  {label}
                </span>
              ))}
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
