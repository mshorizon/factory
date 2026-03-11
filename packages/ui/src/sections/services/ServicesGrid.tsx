"use client";

import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServicesProps } from "./types";

export function ServicesGrid({
  items,
  ctaLabel,
  ctaHref = "/contact",
  className,
}: ServicesProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 lg:grid-cols-4 gap-6", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => (
        <StaggerItem key={index} direction="up" distance={30}>
          <a href={`/services/${item.slug || item.id}`} className="block h-full cursor-pointer" data-field={`items.${index}`}>
            <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 h-full">
              <CardHeader>
                <CardTitle data-field={`items.${index}.title`}>{item.title}</CardTitle>
                <CardDescription data-field={`items.${index}.description`}>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {item.price && <p className="text-2xl font-bold text-primary" data-field={`items.${index}.price`}>{item.price}</p>}
                {ctaLabel && (
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full pointer-events-none">
                    <span>{ctaLabel}</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          </a>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
