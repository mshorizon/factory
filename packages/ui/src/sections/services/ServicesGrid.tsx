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
          <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 h-full">
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
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
