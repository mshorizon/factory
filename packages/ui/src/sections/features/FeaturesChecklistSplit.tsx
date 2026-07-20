"use client";

import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import type { FeaturesChecklistSplitProps } from "./types";

export function FeaturesChecklistSplit({
  items,
  title,
  secondaryTitle,
  secondaryItems = [],
  className,
}: FeaturesChecklistSplitProps) {
  return (
    <div
      className={cn(
        "rounded-radius-secondary bg-card p-spacing-2xl md:p-spacing-3xl shadow-lg shadow-primary/10",
        className
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-2xl lg:gap-spacing-3xl">
        <div>
          {title ? (
            <h3
              className="text-lg font-bold font-heading text-foreground mb-spacing-lg"
              data-field="header.title"
            >
              {title}
            </h3>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-sm">
            {items.map((item, index) => (
              <span
                key={index}
                className="inline-flex w-fit items-center gap-spacing-xs rounded-radius border border-border bg-background px-spacing-md py-spacing-xs text-sm font-medium text-foreground"
                data-field={`items.${index}.title`}
              >
                <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                {item.title}
              </span>
            ))}
          </div>
        </div>
        <div>
          {secondaryTitle ? (
            <h3 className="text-lg font-bold font-heading text-foreground mb-spacing-lg">
              {secondaryTitle}
            </h3>
          ) : null}
          <ul className="flex flex-col">
            {secondaryItems.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-spacing-sm py-spacing-md border-b border-border last:border-b-0"
              >
                <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <span className="text-sm text-foreground leading-relaxed">
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
