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
      className={cn("grid md:grid-cols-2 gap-6", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => {
        const IconComponent = iconMap[item.icon || ""] || Zap;
        return (
          <StaggerItem key={index} direction="up" distance={30}>
            <Card className="h-full flex flex-col" data-field={`items.${index}`}>
              <CardHeader className="flex-1">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-radius bg-secondary">
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
                <div className="px-6 pb-6">
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
