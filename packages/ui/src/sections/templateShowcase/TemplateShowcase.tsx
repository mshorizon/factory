"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TemplateShowcaseProps } from "./types";

export function TemplateShowcase({ templates, className }: TemplateShowcaseProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-spacing-xl", className)}
      staggerDelay={0.1}
    >
      {templates.map((tpl, index) => (
        <StaggerItem key={index} direction={index % 2 === 0 ? "left" : "right"} distance={30}>
          <div className="group flex flex-col rounded-radius overflow-hidden border border-foreground/10 bg-background shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="relative overflow-hidden aspect-[16/9] bg-foreground/5">
              <img
                src={tpl.screenshot}
                alt={tpl.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex flex-col flex-1 p-spacing-lg gap-spacing-md">
              {tpl.tags && tpl.tags.length > 0 && (
                <div className="flex flex-wrap gap-spacing-xs">
                  {tpl.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-spacing-xs">{tpl.name}</h3>
                <p className="text-foreground/60 text-base leading-relaxed">{tpl.description}</p>
              </div>

              <div className="pt-spacing-xs">
                <a
                  href={tpl.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-spacing-xs px-spacing-lg py-spacing-sm rounded-radius bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors duration-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  Live Demo
                </a>
              </div>
            </div>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
