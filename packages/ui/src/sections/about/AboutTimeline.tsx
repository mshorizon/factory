import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent } from "../../atoms/Card";
import type { AboutTimelineProps } from "./types";

export function AboutTimeline({
  timeline,
  stats,
  cta,
  ctaHref = "/contact",
  className,
}: AboutTimelineProps) {
  return (
    <div className={cn("space-y-12", className)}>
      {/* Timeline */}
      <section className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-1/2" />

        <div className="space-y-8">
          {timeline.map((item, index) => (
            <div
              key={index}
              className={cn(
                "relative flex items-start gap-6 md:gap-0",
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              )}
            >
              {/* Year marker */}
              <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center md:-translate-x-1/2 z-10">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>

              {/* Content */}
              <div
                className={cn(
                  "ml-16 md:ml-0 md:w-1/2",
                  index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
                )}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <span className="inline-block px-3 py-1 text-sm font-bold text-primary bg-primary/10 rounded-full mb-3">
                      {item.year}
                    </span>
                    <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-muted">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <section>
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <p className="text-muted">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {cta && (
        <div className="text-center">
          <Button asChild size="lg">
            <a href={ctaHref}>{cta}</a>
          </Button>
        </div>
      )}
    </div>
  );
}
