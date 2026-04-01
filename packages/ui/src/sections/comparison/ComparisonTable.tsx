"use client";

import * as React from "react";
import { X, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ComparisonTableProps } from "./types";

export function ComparisonTable({
  leftTitle,
  rightTitle,
  rows,
  className,
}: ComparisonTableProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-spacing-lg", className)}
      staggerDelay={0.12}
    >
      {/* Left column — Manual Work (negative) */}
      <StaggerItem direction="left" distance={30}>
        <Card className="h-full !rounded-[1.25rem] border-destructive/20 bg-destructive/[0.03] hover:border-destructive/40 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                <X className="h-5 w-5 text-destructive" />
              </div>
              {leftTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl bg-destructive/[0.04] px-4 py-3 transition-colors hover:bg-destructive/[0.08]"
              >
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
                <span className="text-sm leading-relaxed text-foreground/80">
                  {row.left}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Right column — AI Automation (positive) */}
      <StaggerItem direction="right" distance={30}>
        <Card className="h-full !rounded-[1.25rem] border-primary/20 bg-primary/[0.03] hover:border-primary/40 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              {rightTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl bg-primary/[0.04] px-4 py-3 transition-colors hover:bg-primary/[0.08]"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                <span className="text-sm leading-relaxed text-foreground/80">
                  {row.right}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
