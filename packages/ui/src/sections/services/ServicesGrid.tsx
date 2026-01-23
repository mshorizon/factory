import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../atoms/Card";
import type { ServicesProps } from "./types";

export function ServicesGrid({
  items,
  ctaLabel,
  ctaHref = "/contact",
  className,
}: ServicesProps) {
  return (
    <div className={cn("grid md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {items.map((item, index) => (
        <Card key={index} className="group hover:shadow-lg transition-all hover:-translate-y-1">
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {item.price && <p className="text-2xl font-bold text-primary">{item.price}</p>}
            {ctaLabel && (
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <a href={ctaHref}>{ctaLabel}</a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
