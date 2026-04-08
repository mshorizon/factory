"use client";

import * as React from "react";
import { Linkedin } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "../../atoms/Card";
import { SafeImage } from "../../atoms/SafeImage.js";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TeamGridProps } from "./types";

export function TeamGrid({ members, className }: TeamGridProps) {
  return (
    <StaggerContainer
      className={cn("grid sm:grid-cols-2 lg:grid-cols-3 gap-spacing-lg", className)}
      staggerDelay={0.08}
    >
      {members.map((member, index) => {
        const directions = ["left", "up", "right", "left", "up", "right"] as const;
        const direction = directions[index % 6];

        return (
          <StaggerItem key={index} direction={direction} distance={25}>
            <Card
              className="group h-full !rounded-[1.25rem] border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              data-field={`members.${index}`}
            >
              <CardHeader className="flex flex-col items-center text-center space-y-4">
                {member.image ? (
                  <SafeImage
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all"
                    data-field={`members.${index}.image`}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary group-hover:bg-primary/20 transition-colors"
                    data-field={`members.${index}.image`}
                  >
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}

                <div className="space-y-1">
                  <CardTitle
                    className="text-lg"
                    data-field={`members.${index}.name`}
                  >
                    {member.name}
                  </CardTitle>
                  <CardDescription data-field={`members.${index}.role`}>
                    {member.role}
                  </CardDescription>
                </div>

                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    aria-label={`${member.name} on LinkedIn`}
                    data-field={`members.${index}.linkedin`}
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
              </CardHeader>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
