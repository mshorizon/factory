"use client";

import * as React from "react";
import {
  Search, Lightbulb, Plug, Gauge, Code, CheckCircle, Zap,
  PenTool, Rocket, Shield, Settings, BarChart,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ProcessStepsProps } from "./types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search, lightbulb: Lightbulb, plug: Plug, gauge: Gauge,
  code: Code, "check-circle": CheckCircle, zap: Zap,
  "pen-tool": PenTool, rocket: Rocket, shield: Shield,
  settings: Settings, "bar-chart": BarChart,
};

export function ProcessVisual({ steps, className }: ProcessStepsProps) {
  return (
    <div className={cn("space-y-spacing-xl", className)}>
      {steps.map((step, index) => {
        const IconComponent = iconMap[step.icon || ""] || CheckCircle;
        const isEven = index % 2 === 0;

        return (
          <StaggerContainer key={index} staggerDelay={0.1} className="w-full">
            <StaggerItem direction={isEven ? "left" : "right"} distance={40}>
              <Card
                className="overflow-hidden !rounded-[1.25rem] border-border/50"
                data-field={`steps.${index}`}
              >
                <div className={cn(
                  "grid md:grid-cols-[1fr,1.2fr] gap-0",
                  !isEven && "md:grid-cols-[1.2fr,1fr]"
                )}>
                  {/* Content side */}
                  <div className={cn(
                    "p-spacing-2xl flex flex-col justify-center",
                    !isEven && "md:order-2"
                  )}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <span className="text-lg font-bold text-primary" data-field={`steps.${index}.number`}>
                          {step.number}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-primary/20" />
                    </div>
                    <CardTitle className="text-2xl mb-3" data-field={`steps.${index}.title`}>
                      {step.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed" data-field={`steps.${index}.description`}>
                      {step.description}
                    </CardDescription>
                  </div>

                  {/* Visual side - colored card with icon and decorative elements */}
                  <div className={cn(
                    "relative bg-primary/5 p-spacing-2xl flex items-center justify-center min-h-[240px] overflow-hidden",
                    !isEven && "md:order-1"
                  )}>
                    {/* Decorative blurs */}
                    <div className="absolute top-1/4 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-1/4 -left-8 w-24 h-24 bg-primary/15 rounded-full blur-2xl" />

                    {/* Visual content */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/10">
                        <IconComponent className="h-10 w-10 text-primary" />
                      </div>

                      {/* Step indicator badges */}
                      {step.badges && (step.badges as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center max-w-[260px]">
                          {(step.badges as string[]).map((badge: string, bIdx: number) => (
                            <span
                              key={bIdx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-muted"
                            >
                              <CheckCircle className="h-3 w-3 text-primary" />
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        );
      })}
    </div>
  );
}
