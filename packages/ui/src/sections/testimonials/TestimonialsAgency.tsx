"use client";

import { Star, BadgeCheck, TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { TestimonialsGridProps, TestimonialItem } from "./types";

function parseAuthor(title: string) {
  const parts = title.split(" -- ");
  return { name: parts[0] || title, location: parts[1] || "" };
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).join("").slice(0, 2);
}

export function TestimonialsAgency({ items, className }: TestimonialsGridProps) {
  return (
    <StaggerContainer
      className={cn("grid md:grid-cols-3 gap-6", className)}
      staggerDelay={0.12}
    >
      {items.map((item, index) => {
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];
        const author = parseAuthor(item.title);
        const metric = (item as any).metric;
        const businessName = (item as any).role || author.location;

        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <div
              className="text-left bg-secondary/40 p-spacing-lg rounded-3xl border border-transparent hover:border-primary/30 hover:bg-background hover:shadow-md transition-all flex flex-col h-full"
              data-field={`items.${index}`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1" style={{ color: "#F59E0B" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Zweryfikowane
                </div>
              </div>

              <p
                className="text-base leading-relaxed mb-6 text-foreground/90 flex-1"
                data-field={`items.${index}.description`}
              >
                &bdquo;{item.description}&rdquo;
              </p>

              {metric && (
                <div className="bg-primary/10 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground">{metric}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                {item.image ? (
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                    <img src={item.image} alt={author.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {getInitials(author.name)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-foreground text-sm">
                    {author.name}
                    {author.location && (
                      <span className="font-normal text-muted text-xs"> · {author.location}</span>
                    )}
                  </div>
                  {businessName && businessName !== author.location && (
                    <div className="text-xs text-muted">{businessName}</div>
                  )}
                </div>
              </div>
            </div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
