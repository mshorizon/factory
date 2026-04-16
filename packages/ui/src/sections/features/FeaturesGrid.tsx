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
  BadgeCheck,
  Timer,
  Wallet,
  ShieldCheck,
  Bolt,
  Plug,
  Lightbulb,
  Gauge,
  CreditCard,
  MessageCircle,
  Headphones,
  Rocket,
  Hammer,
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
  "badge-check": BadgeCheck,
  timer: Timer,
  wallet: Wallet,
  "shield-check": ShieldCheck,
  bolt: Bolt,
  plug: Plug,
  lightbulb: Lightbulb,
  gauge: Gauge,
  "credit-card": CreditCard,
  "message-circle": MessageCircle,
  headphones: Headphones,
  rocket: Rocket,
  hammer: Hammer,
};

export function FeaturesGrid({ items, className }: FeaturesGridProps) {
  const handleCardClick = (href: string) => {
    window.location.href = href;
  };

  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-spacing-lg", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => {
        const IconComponent = iconMap[item.icon || ""] || Zap;
        // Alternate directions: left for even (0,2,4), right for odd (1,3,5)
        const direction = index % 2 === 0 ? "left" : "right";
        const linkHref = item.linkHref || "/contact";

        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <Card
              className="h-full flex flex-col !rounded-radius-secondary cursor-pointer group hover:brightness-[0.98] transition-all"
              data-field={`items.${index}`}
              onClick={() => handleCardClick(linkHref)}
            >
              <CardHeader className="flex-1">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light">
                  <IconComponent className="h-[18px] w-[18px] text-white" />
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
                  <div className="inline-flex items-center gap-1.5 text-base font-semibold" style={{ color: 'var(--primary-dark)' }}>
                    <span>{item.linkLabel}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              )}
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
