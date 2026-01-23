import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent } from "../../atoms/Card";
import type { AboutStoryProps } from "./types";

export function AboutStory({
  story,
  stats,
  commitment,
  cta,
  ctaHref = "/contact",
  whyChooseUs,
  className,
}: AboutStoryProps) {
  return (
    <div className={cn("space-y-12", className)}>
      {story && (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">{story.title}</h2>
          <p className="text-muted leading-relaxed">{story.content}</p>
        </section>
      )}

      {stats && stats.length > 0 && (
        <section>
          {whyChooseUs && (
            <h2 className="text-2xl font-bold text-foreground mb-6">{whyChooseUs}</h2>
          )}
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

      {commitment && (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">{commitment.title}</h2>
          <p className="text-muted leading-relaxed mb-6">{commitment.content}</p>
          {cta && (
            <Button asChild size="lg">
              <a href={ctaHref}>{cta}</a>
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
