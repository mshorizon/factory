"use client";

import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Badge } from "../../atoms/Badge";
import { Card, CardContent } from "../../atoms/Card";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { AboutStoryProps } from "./types";

export function AboutStory({
  badge,
  title,
  story,
  stats,
  commitment,
  image,
  cta,
  ctaHref = "/contact",
  whyChooseUs,
  experienceBadge,
  experienceBadgeLabel,
  className,
  background,
}: AboutStoryProps) {
  const badgeColor = background === "dark" ? "var(--primary)" : "var(--primary-dark)";
  return (
    <div className={cn("space-y-12", className)}>
      {/* Split layout: image left, text right */}
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {image && (
          <ScrollReveal delay={0} direction="left" distance={50}>
            <div className="relative">
              <img
                src={image}
                alt=""
                className="w-full h-[400px] lg:h-[500px] object-cover rounded-radius shadow-lg"
                data-field="image"
              />
              {/* Dotted grid decoration */}
              <div
                className="absolute -top-4 -left-4 w-24 h-24 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                  backgroundSize: "8px 8px",
                }}
              />
              <div
                className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                  backgroundSize: "8px 8px",
                }}
              />
              {/* Experience badge overlay */}
              {experienceBadge && (
                <div className="absolute bottom-6 left-6 bg-background/95 backdrop-blur-sm rounded-radius px-5 py-4 shadow-lg flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-on-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{experienceBadge}</div>
                    {experienceBadgeLabel && <div className="text-xs text-muted">{experienceBadgeLabel}</div>}
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        <div className="space-y-6">
          {badge && (
            <ScrollReveal delay={0.05} direction="up">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-12 h-[2px]" style={{ backgroundColor: badgeColor }} />
                <Badge variant="accent" style={{ color: badgeColor }}>{badge}</Badge>
              </div>
            </ScrollReveal>
          )}
          {title && (
            <ScrollReveal delay={0.08} direction="up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading" data-field="header.title">{title}</h2>
            </ScrollReveal>
          )}
          {story && (
            <ScrollReveal delay={0.1} direction="up">
              <p className="text-muted leading-relaxed" data-field="story.content">{story.content}</p>
            </ScrollReveal>
          )}

          {cta && (
            <ScrollReveal delay={0.2} direction="up">
              <Button asChild size="lg">
                <a href={ctaHref}>{cta}</a>
              </Button>
            </ScrollReveal>
          )}
        </div>
      </div>

      {/* Stats row */}
      {stats && stats.length > 0 && (
        <ScrollReveal delay={0.2} direction="up">
          <StaggerContainer className="flex flex-row flex-wrap justify-center gap-8 md:gap-12 py-8" staggerDelay={0.1}>
            {stats.map((stat, index) => (
              <StaggerItem key={index} direction="up" distance={20}>
                <div className="text-center" data-field={`stats.${index}`}>
                  <div className="text-5xl md:text-6xl font-bold text-foreground mb-2 font-heading" data-field={`stats.${index}.value`}>{stat.value}</div>
                  <p className="text-sm text-muted" data-field={`stats.${index}.label`}>{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>
      )}

      {commitment && (
        <ScrollReveal delay={0.3} direction="up">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4" data-field="commitment.title">{commitment.title}</h2>
            <p className="text-muted leading-relaxed mb-6" data-field="commitment.content">{commitment.content}</p>
            {!cta && commitment && (
              <Button asChild size="lg">
                <a href={ctaHref}>{cta}</a>
              </Button>
            )}
          </section>
        </ScrollReveal>
      )}
    </div>
  );
}
