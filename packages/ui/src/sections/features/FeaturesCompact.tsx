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
              className="group h-full !rounded-[1.25rem] border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              data-field={`items.${index}`}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-6 w-6 text-primary" />
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
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
