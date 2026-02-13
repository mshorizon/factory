"use client";

import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent } from "../../atoms/Card";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { AboutStoryProps } from "./types";

export function AboutStory({
  story,
  stats,
  commitment,
  image,
  cta,
  ctaHref = "/contact",
  whyChooseUs,
  className,
}: AboutStoryProps) {
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
            </div>
          </ScrollReveal>
        )}

        <div className="space-y-6">
          {story && (
            <ScrollReveal delay={0.1} direction="up">
              <h3 className="text-xl font-semibold text-foreground mb-3" data-field="story.title">{story.title}</h3>
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
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8" staggerDelay={0.1}>
            {stats.map((stat, index) => (
              <StaggerItem key={index} direction="up" distance={20}>
                <div className="text-center" data-field={`stats.${index}`}>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2" data-field={`stats.${index}.value`}>{stat.value}</div>
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
