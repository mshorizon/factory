"use client";

import * as React from "react";
import {
  Zap,
  Heart,
  Clock,
  Wallet,
  Gauge,
  Rocket,
  Shield,
  Users,
  Lightbulb,
  Code,
  Search,
  Plug,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { FeaturesGridProps } from "./types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  heart: Heart,
  clock: Clock,
  wallet: Wallet,
  gauge: Gauge,
  rocket: Rocket,
  shield: Shield,
  users: Users,
  lightbulb: Lightbulb,
  code: Code,
  search: Search,
  plug: Plug,
  eye: Eye,
};

export function FeaturesGradient({ items, className }: FeaturesGridProps) {
  return (
    <StaggerContainer
      className={cn(
        "grid sm:grid-cols-2 lg:grid-cols-3 gap-spacing-lg",
        className
      )}
      staggerDelay={0.08}
    >
      {items.map((item, index) => {
        const IconComponent = iconMap[item.icon || ""] || Zap;
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];

        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <div
              className="group rounded-lg border border-border/30 p-5 md:px-8 md:py-5 h-full flex flex-col text-left"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--primary) 35%, transparent) 0%, transparent 70%)",
              }}
              data-field={`items.${index}`}
            >
              <div className="mb-spacing-md flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light">
                  <IconComponent className="h-[18px] w-[18px] text-white" />
                </div>
              </div>

              <h3
                className="text-xl font-bold font-heading text-foreground mb-spacing-sm"
                data-field={`items.${index}.title`}
              >
                {item.title}
              </h3>

              <p
                className="text-sm text-muted leading-relaxed flex-1"
                data-field={`items.${index}.description`}
              >
                {item.description}
              </p>

              {item.linkHref && (
                <div className="mt-spacing-md">
                  <a
                    href={item.linkHref}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: "var(--primary-dark)" }}
                  >
                    <span>{item.linkLabel || "Learn more"}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              )}
            </div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
