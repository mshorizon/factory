"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../atoms/Card";
import { Button } from "../../atoms/Button";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { PricingDefaultProps } from "./types";

export function PricingDefault({ tiers, className }: PricingDefaultProps) {
  return (
    <StaggerContainer
      className={cn(
        "grid gap-spacing-lg",
        tiers.length === 3 ? "md:grid-cols-3" : tiers.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1",
        className
      )}
      staggerDelay={0.15}
    >
      {tiers.map((tier, index) => (
        <StaggerItem key={index} direction="up" distance={30}>
          <Card
            className={cn(
              "h-full flex flex-col relative",
              tier.highlighted && "border-primary ring-2 ring-primary/20 scale-[1.02]"
            )}
            data-field={`pricingTiers.${index}`}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-on-primary text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  {tier.badge}
                </span>
              </div>
            )}
            <CardHeader className={cn("text-center", tier.badge && "pt-8")}>
              <CardDescription className="text-base font-medium" data-field={`pricingTiers.${index}.name`}>
                {tier.name}
              </CardDescription>
              <div className="mt-2" data-field={`pricingTiers.${index}.price`}>
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                {tier.period && (
                  <span className="text-muted ml-1">/{tier.period}</span>
                )}
              </div>
              {tier.description && (
                <CardDescription className="mt-2" data-field={`pricingTiers.${index}.description`}>
                  {tier.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              {tier.features && tier.features.length > 0 && (
                <ul className="space-y-3">
                  {tier.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2.5">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            {tier.cta && (
              <CardFooter className="justify-center pb-spacing-lg">
                <Button
                  variant={tier.highlighted ? "default" : "outline"}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <a href={tier.cta.href || "/contact"}>{tier.cta.label}</a>
                </Button>
              </CardFooter>
            )}
          </Card>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
