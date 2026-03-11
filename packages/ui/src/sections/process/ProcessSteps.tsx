"use client";

import { cn } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ProcessStepsProps } from "./types";

export function ProcessSteps({ steps, className }: ProcessStepsProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative", className)}
      staggerDelay={0.15}
    >
      {steps.map((step, index) => {
        // Varied directions for 4-column grid: left, up, up, right pattern
        const directions = ["left", "up", "up", "right"] as const;
        const direction = directions[index % 4];
        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <div className="relative" data-field={`steps.${index}`}>
            {/* Connecting line on desktop */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30 z-0" />
            )}
            <Card className="relative z-10 h-full text-center">
              <CardHeader>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl font-bold text-primary" data-field={`steps.${index}.number`}>
                    {step.number}
                  </span>
                </div>
                <CardTitle data-field={`steps.${index}.title`}>{step.title}</CardTitle>
                <CardDescription data-field={`steps.${index}.description`}>
                  {step.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
