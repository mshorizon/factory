"use client";

import * as React from "react";
import {
  Zap,
  Shield,
  Clock,
  Award,
  CheckCircle,
  Wrench,
  Heart,
  DollarSign,
  Star,
  Phone,
  Users,
  ThumbsUp,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FeaturesGridProps } from "./types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  shield: Shield,
  clock: Clock,
  award: Award,
  "check-circle": CheckCircle,
  wrench: Wrench,
  heart: Heart,
  "dollar-sign": DollarSign,
  star: Star,
  phone: Phone,
  users: Users,
  "thumbs-up": ThumbsUp,
};

export function FeaturesGrid({ items, className }: FeaturesGridProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-spacing-lg", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => {
        const IconComponent = iconMap[item.icon || ""] || Zap;
        // Alternate directions: left for even (0,2,4), right for odd (1,3,5)
        const direction = index % 2 === 0 ? "left" : "right";
        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <Card className="h-full flex flex-col !rounded-radius-secondary" data-field={`items.${index}`}>
              <CardHeader className="flex-1">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-radius-secondary bg-secondary">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <CardTitle data-field={`items.${index}.title`}>
                  {item.title}
                </CardTitle>
                <CardDescription data-field={`items.${index}.description`}>
                  {item.description}
                </CardDescription>
              </CardHeader>
              {item.linkLabel && (
                <div className="px-spacing-lg pb-6">
                  <a
                    href={item.linkHref || "#"}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    {item.linkLabel}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
