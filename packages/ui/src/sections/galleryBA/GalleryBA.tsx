"use client";

import { cn } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { GalleryBAProps } from "./types";

export function GalleryBA({ pairs, className }: GalleryBAProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-8", className)}
      staggerDelay={0.15}
    >
      {pairs.map((pair, index) => {
        // Varied directions for 3-column grid: left, up, right pattern
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];
        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <Card className="overflow-hidden" data-field={`pairs.${index}`}>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-0">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={pair.before}
                    alt={`${pair.title} - Before`}
                    className="h-full w-full object-cover"
                  />
                  <Badge className="absolute bottom-2 left-2" variant="default">
                    Before
                  </Badge>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={pair.after}
                    alt={`${pair.title} - After`}
                    className="h-full w-full object-cover"
                  />
                  <Badge className="absolute bottom-2 left-2" variant="default">
                    After
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardHeader>
              <CardTitle className="text-lg" data-field={`pairs.${index}.title`}>
                {pair.title}
              </CardTitle>
              {pair.description && (
                <CardDescription data-field={`pairs.${index}.description`}>
                  {pair.description}
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
