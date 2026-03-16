"use client";

import { Shield, Clock, Award, CheckCircle, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TrustBarProps } from "./types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  clock: Clock,
  award: Award,
  "check-circle": CheckCircle,
};

export function TrustBar({ trustSignals, googleRating, className }: TrustBarProps) {
  return (
    <div className={cn("rounded-radius bg-primary/5 px-spacing-lg py-spacing-2xl", className)}>
      <StaggerContainer
        className="flex flex-wrap items-center justify-center gap-spacing-2xl"
        staggerDelay={0.1}
      >
        {googleRating && (
          <StaggerItem direction="up" distance={20}>
            <div className="flex items-center gap-spacing-xs" data-field="googleRating">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5",
                      i < Math.floor(googleRating.score)
                        ? "fill-primary text-primary"
                        : i < googleRating.score
                          ? "fill-primary/50 text-primary"
                          : "text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-foreground">{googleRating.score}</span>
              <span className="text-sm text-muted">({googleRating.count} reviews)</span>
            </div>
          </StaggerItem>
        )}
        {trustSignals?.map((signal, index) => {
          const IconComponent = iconMap[signal.icon] || CheckCircle;
          // Alternate directions for trust signals
          const direction = index % 2 === 0 ? "left" : "right";
          return (
            <StaggerItem key={index} direction={direction} distance={20}>
              <div
                className="flex items-center gap-spacing-xs"
                data-field={`trustSignals.${index}`}
              >
                <IconComponent className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{signal.text}</span>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
