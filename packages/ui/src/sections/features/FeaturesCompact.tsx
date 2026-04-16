"use client";

import * as React from "react";
import {
  Zap, Shield, Clock, Award, CheckCircle, Wrench, Heart,
  DollarSign, Star, Phone, Users, ThumbsUp, BadgeCheck,
  Timer, Wallet, ShieldCheck, Bolt, Plug, Lightbulb, Gauge,
  CreditCard, MessageCircle, Headphones, Rocket, Hammer, ArrowUpRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FeaturesGridProps } from "./types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap, shield: Shield, clock: Clock, award: Award,
  "check-circle": CheckCircle, wrench: Wrench, heart: Heart,
  "dollar-sign": DollarSign, star: Star, phone: Phone,
  users: Users, "thumbs-up": ThumbsUp, "badge-check": BadgeCheck,
  timer: Timer, wallet: Wallet, "shield-check": ShieldCheck,
  bolt: Bolt, plug: Plug, lightbulb: Lightbulb, gauge: Gauge,
  "credit-card": CreditCard, "message-circle": MessageCircle,
  headphones: Headphones, rocket: Rocket, hammer: Hammer,
};

export function FeaturesCompact({ items, className }: FeaturesGridProps) {
  return (
    <StaggerContainer
      className={cn("grid sm:grid-cols-2 lg:grid-cols-3 gap-spacing-lg", className)}
      staggerDelay={0.08}
    >
      {items.map((item, index) => {
        const IconComponent = iconMap[item.icon || ""] || Zap;
        const directions = ["left", "up", "right", "left", "up", "right"] as const;
        const direction = directions[index % 6];

        return (
          <StaggerItem key={index} direction={direction} distance={25}>
            <Card
              className="group h-full flex flex-col !rounded-[1.25rem] border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              data-field={`items.${index}`}
            >
              <CardHeader className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light transition-colors">
                    <IconComponent className="h-[18px] w-[18px] text-white" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div>
                  <CardTitle className="text-lg mb-2" data-field={`items.${index}.title`}>
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed" data-field={`items.${index}.description`}>
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
              {item.linkHref && (
                <div className="px-spacing-lg pb-6">
                  <a
                    href={item.linkHref}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2"
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
