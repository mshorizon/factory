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
      {image && (
        <ScrollReveal delay={0} direction="up">
          <div className="flex justify-center">
            <img
              src={image}
              alt=""
              className="w-full max-w-2xl h-[400px] object-cover rounded-radius shadow-lg"
            />
          </div>
        </ScrollReveal>
      )}

      {story && (
        <ScrollReveal delay={0} direction="up">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">{story.title}</h2>
            <p className="text-muted leading-relaxed">{story.content}</p>
          </section>
        </ScrollReveal>
      )}

      {stats && stats.length > 0 && (
        <ScrollReveal delay={0.1} direction="up">
          <section>
            {whyChooseUs && (
              <h2 className="text-2xl font-bold text-foreground mb-6">{whyChooseUs}</h2>
            )}
            <StaggerContainer className="grid md:grid-cols-3 gap-6" staggerDelay={0.1}>
              {stats.map((stat, index) => (
                <StaggerItem key={index} direction="up" distance={20}>
                  <Card className="text-center hover:shadow-lg transition-shadow h-full">
                    <CardContent className="pt-6">
                      <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                      <p className="text-muted">{stat.label}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        </ScrollReveal>
      )}

      {commitment && (
        <ScrollReveal delay={0.2} direction="up">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">{commitment.title}</h2>
            <p className="text-muted leading-relaxed mb-6">{commitment.content}</p>
            {cta && (
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
