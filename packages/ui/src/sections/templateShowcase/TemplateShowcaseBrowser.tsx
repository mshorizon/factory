"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TemplateShowcaseProps } from "./types";

/**
 * Browser-window style showcase: three equal columns, each card framed as a
 * mini browser (chrome header bar with the site name, screenshot body,
 * industry-label footer), with optional pill tags for further industries.
 */
export function TemplateShowcaseBrowser({ templates, pills, className }: TemplateShowcaseProps) {
  return (
    <div className={className}>
      <StaggerContainer className="grid md:grid-cols-3 gap-spacing-lg" staggerDelay={0.1}>
        {templates.map((tpl, index) => (
          <StaggerItem key={index} direction="up" distance={30}>
            <a
              href={tpl.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-radius overflow-hidden bg-card shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="flex items-center justify-between px-spacing-md py-spacing-sm bg-foreground"
                style={tpl.accent ? { backgroundColor: tpl.accent } : undefined}
              >
                <span className="text-sm font-bold text-background truncate">{tpl.name}</span>
                <span className="flex gap-1.5 shrink-0" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full bg-background/30" />
                  <span className="w-2 h-2 rounded-full bg-background/30" />
                  <span className="w-2 h-2 rounded-full bg-background/30" />
                </span>
              </div>

              <div className="aspect-[4/3] overflow-hidden bg-foreground/5">
                <img
                  src={tpl.screenshot}
                  alt={tpl.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>

              <div className="px-spacing-md py-spacing-sm border-t border-foreground/10">
                <span className="font-bold text-foreground">{tpl.tags?.[0] ?? tpl.name}</span>
              </div>
            </a>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {pills && pills.length > 0 && (
        <div className="mt-spacing-2xl flex flex-wrap justify-center gap-spacing-sm max-w-4xl mx-auto">
          {pills.map((pill, i) => (
            <span
              key={i}
              className="px-spacing-md py-spacing-xs rounded-full bg-card shadow-sm text-sm font-semibold text-foreground"
            >
              {pill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
