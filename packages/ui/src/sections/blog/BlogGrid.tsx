"use client";

import { CalendarDays, ArrowRight } from "lucide-react";
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
        const direction = index % 2 === 0 ? "left" : "right";
        return (
        <StaggerItem key={index} direction={direction} distance={30}>
          <Card
            className="overflow-hidden h-full flex flex-col !rounded-radius-secondary bg-background"
            data-field={`blogPosts.${index}`}
          >
            {post.image && (
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 rounded-b-radius-secondary"
                />
              </div>
            )}
            <div className="p-spacing-lg flex flex-col flex-1">
              {post.date && (
                <div className="flex items-center gap-1.5 mb-spacing-xs">
                  <CalendarDays className="h-5 w-5 shrink-0" style={{ color: 'var(--primary-dark)' }} />
                  <span
                    className="text-xs text-muted"
                    data-field={`blogPosts.${index}.date`}
                  >
                    {post.date}
                  </span>
                </div>
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
                  className="mt-spacing-md inline-flex items-center gap-1.5 text-base font-semibold"
                  style={{ color: 'var(--primary-dark)' }}
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
