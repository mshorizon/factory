"use client";

import * as React from "react";
import {
  Zap, Shield, Clock, Award, CheckCircle, Wrench, Heart,
  DollarSign, Star, Phone, Users, ThumbsUp, BadgeCheck,
  Timer, Wallet, ShieldCheck, Bolt, Plug, Lightbulb, Gauge,
  CreditCard, MessageCircle, Headphones, Rocket, Hammer,
  Monitor, Building, Search, Car, Globe, FileText, Mail,
  Gavel, ClipboardList, Banknote, Home, Code, Eye, ArrowUpRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
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
  monitor: Monitor, building: Building, search: Search, car: Car,
  globe: Globe, "file-text": FileText, mail: Mail, gavel: Gavel,
  "clipboard-list": ClipboardList, banknote: Banknote, home: Home,
  code: Code, eye: Eye,
};

export function FeaturesIconTiles({ items, className }: FeaturesGridProps) {
  return (
    <StaggerContainer
      className={cn("grid grid-cols-2 lg:grid-cols-4 gap-spacing-md", className)}
      staggerDelay={0.07}
    >
      {items.map((item, index) => {
        const IconComponent = iconMap[item.icon || ""] || Zap;
        const directions = ["left", "up", "up", "right"] as const;
        const direction = directions[index % 4];

        return (
          <StaggerItem key={index} direction={direction} distance={20}>
            <div
              className="group flex flex-col gap-spacing-md p-spacing-lg rounded-2xl bg-card border-0 shadow-none h-full"
              data-field={`items.${index}`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light transition-colors">
                <IconComponent className="h-[18px] w-[18px] text-white" />
              </div>
              <div className="flex-1">
                <h3
                  className="font-semibold font-heading text-foreground mb-spacing-xs leading-snug"
                  data-field={`items.${index}.title`}
                >
                  {item.title}
                </h3>
                <p
                  className="hidden lg:block text-sm text-muted leading-relaxed"
                  data-field={`items.${index}.description`}
                >
                  {item.description}
                </p>
              </div>
              {item.linkHref && (
                <a
                  href={item.linkHref}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: "var(--primary-dark)" }}
                >
                  <span>{item.linkLabel || "Learn more"}</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}
            </div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
