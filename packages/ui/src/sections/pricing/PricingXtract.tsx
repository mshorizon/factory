"use client";

import * as React from "react";
import { Check, Zap, Crown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";

interface PricingXtractProps {
  tiers: Array<{
    name: string;
    price: string;
    period?: string;
    description?: string;
    features?: string[];
    cta?: { label: string; href: string };
    highlighted?: boolean;
    badge?: string;
    annualPrice?: string;
    icon?: string;
  }>;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  zap: Zap,
  bolt: Zap,
  crown: Crown,
};

export function PricingXtract({ tiers, className }: PricingXtractProps) {
  const [isAnnual, setIsAnnual] = React.useState(true);

  return (
    <div className={cn("space-y-spacing-xl", className)}>
      {/* Monthly/Annually Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm", !isAnnual ? "text-foreground" : "text-muted")}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isAnnual}
          onClick={() => setIsAnnual(!isAnnual)}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors",
            isAnnual ? "bg-primary" : "bg-foreground/20"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
              isAnnual && "translate-x-6"
            )}
          />
        </button>
        <span className={cn("text-sm", isAnnual ? "text-foreground" : "text-muted")}>
          Annually
        </span>
      </div>

      {/* Pricing Cards */}
      <StaggerContainer
        className={cn(
          "grid grid-cols-1 md:grid-cols-3 gap-spacing-lg"
        )}
        staggerDelay={0.15}
      >
        {tiers.map((tier, index) => {
          const IconComponent = iconMap[tier.icon || ""] || Zap;
          const displayPrice =
            isAnnual && tier.annualPrice ? tier.annualPrice : tier.price;

          return (
            <StaggerItem key={index} direction="up" distance={30}>
              <div
                className={cn(
                  "rounded-lg border border-border/15 p-6 relative overflow-hidden h-full flex flex-col"
                )}
                style={{
                  background: tier.highlighted
                    ? "radial-gradient(50% 50% at 52% 0%, color-mix(in srgb, var(--primary) 45%, transparent) 0%, transparent 100%)"
                    : "radial-gradient(50% 50% at 50% 100%, color-mix(in srgb, var(--primary) 30%, transparent) 0%, transparent 100%)",
                }}
                data-field={`pricingTiers.${index}`}
              >
                {/* Card Header */}
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-foreground" />
                  <span
                    className="text-xl font-bold text-muted"
                    data-field={`pricingTiers.${index}.name`}
                  >
                    {tier.name}
                  </span>
                  {tier.highlighted && tier.badge && (
                    <span className="ml-auto text-xs px-3 py-2 rounded-md bg-foreground/10 text-foreground border border-border/30">
                      {tier.badge}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-4" data-field={`pricingTiers.${index}.price`}>
                  <span className="text-4xl font-normal text-foreground">
                    {displayPrice}
                  </span>
                  {tier.period && (
                    <span className="text-base font-normal text-muted">
                      /{tier.period}
                    </span>
                  )}
                </div>

                {/* Description */}
                {tier.description && (
                  <p
                    className="text-sm text-muted mt-2"
                    data-field={`pricingTiers.${index}.description`}
                  >
                    {tier.description}
                  </p>
                )}

                {/* Features */}
                {tier.features && tier.features.length > 0 && (
                  <div className="mt-6 flex-1">
                    <span className="text-sm text-muted font-medium mb-3 block">
                      What&apos;s Included:
                    </span>
                    <ul className="space-y-2.5">
                      {tier.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-foreground shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA */}
                {tier.cta && (
                  <div className="mt-auto pt-6">
                    <Button
                      variant={tier.highlighted ? "default" : "outline"}
                      className={cn(
                        "w-full !rounded-lg",
                        !tier.highlighted && "text-foreground border-border/20 hover:bg-foreground/5"
                      )}
                      asChild
                    >
                      <a href={tier.cta.href || "/contact"}>{tier.cta.label}</a>
                    </Button>
                  </div>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
