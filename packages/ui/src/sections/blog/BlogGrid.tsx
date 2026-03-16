"use client";

import { cn } from "../../lib/utils";
import { Card } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { BlogGridProps } from "./types";

export function BlogGrid({ posts, ctaLabel, className }: BlogGridProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-2 gap-spacing-2xl", className)}
      staggerDelay={0.12}
    >
      {posts.map((post, index) => {
        // Alternate left/right for 2-column grid
        const direction = index % 2 === 0 ? "left" : "right";
        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <Card
            className="overflow-hidden h-full flex flex-col"
            data-field={`blogPosts.${index}`}
          >
            {post.image && (
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}
            <div className="p-spacing-lg flex flex-col flex-1">
              {post.date && (
                <span
                  className="text-xs text-muted mb-spacing-xs"
                  data-field={`blogPosts.${index}.date`}
                >
                  {post.date}
                </span>
              )}
              <h3
                className="text-lg font-semibold text-foreground mb-spacing-xs"
                data-field={`blogPosts.${index}.title`}
              >
                {post.title}
              </h3>
              <p
                className="text-sm text-muted leading-relaxed flex-1"
                data-field={`blogPosts.${index}.description`}
              >
                {post.description}
              </p>
              {ctaLabel && (
                <a
                  href={post.href || "#"}
                  className="mt-spacing-md inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {ctaLabel}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
              )}
            </div>
          </Card>
        </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
