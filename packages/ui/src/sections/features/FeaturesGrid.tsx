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
  ArrowUpRight,
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
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-spacing-lg", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => {
        const IconComponent = iconMap[item.icon || ""] || Zap;
        const direction = index % 2 === 0 ? "left" : "right";

        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <Card
              className="h-full flex flex-col !rounded-radius-secondary group hover:brightness-[0.98] transition-all"
              data-field={`items.${index}`}
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
              {item.linkHref && (
                <div className="px-spacing-lg pb-6">
                  <a
                    href={item.linkHref}
                    className="inline-flex items-center gap-1.5 text-base font-semibold transition-all group-hover:gap-2"
                    style={{ color: "var(--primary-dark)" }}
                  >
                    <span>{item.linkLabel || "Learn more"}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
