"use client";

import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { pageSurfaceVars } from "../../lib/pageSurface";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { ComparisonTripleProps, ComparisonColumn } from "./types";

function ColumnHeader({ column }: { column: ComparisonColumn }) {
  return (
    <div className="flex flex-col items-center gap-spacing-xs">
      {column.badge && (
        <span
          className="rounded-full px-3 py-1 text-xs font-bold text-on-primary"
          style={{ background: "color-mix(in srgb, var(--text-on-primary) 22%, transparent)" }}
        >
          {column.badge}
        </span>
      )}
      <span className="font-bold text-base">{column.title}</span>
    </div>
  );
}

export function ComparisonTriple({ criteria = [], columns = [], className }: ComparisonTripleProps) {
  const hlIndex = columns.findIndex((c) => c.highlighted);
  const gridTemplate = {
    gridTemplateColumns: `1.1fr repeat(${columns.length}, 1fr)`,
    gridTemplateRows: `repeat(${criteria.length + 1}, auto)`,
  };

  return (
    <ScrollReveal className={className}>
      {/* Desktop: table-like grid */}
      <div className="hidden lg:grid relative" style={gridTemplate}>
        {/* Elevated backdrop behind the highlighted column */}
        {hlIndex >= 0 && (
          <div
            aria-hidden="true"
            className="bg-card rounded-2xl shadow-2xl -my-spacing-lg z-0"
            style={{ ...pageSurfaceVars, gridColumn: hlIndex + 2, gridRow: "1 / -1" }}
          />
        )}

        {/* Header row */}
        <div className="z-10 py-spacing-md" style={{ gridColumn: 1, gridRow: 1 }} aria-hidden="true" />
        {columns.map((column, ci) => (
          <div
            key={`h-${ci}`}
            className={cn(
              "z-10 flex items-center justify-center py-spacing-md px-spacing-md text-center",
              column.highlighted
                ? "bg-primary text-on-primary rounded-t-2xl -mt-spacing-lg"
                : "text-foreground"
            )}
            style={{ gridColumn: ci + 2, gridRow: 1 }}
            data-field={`comparisonColumns.${ci}.title`}
          >
            <ColumnHeader column={column} />
          </div>
        ))}

        {/* Criteria rows */}
        {criteria.map((criterion, ri) => (
          <div key={`r-${ri}`} className="contents">
            <div
              className="z-10 flex items-center py-spacing-md pr-spacing-md text-sm text-muted border-t border-border"
              style={{ gridColumn: 1, gridRow: ri + 2 }}
              data-field={`criteria.${ri}`}
            >
              {criterion}
            </div>
            {columns.map((column, ci) => (
              <div
                key={`c-${ri}-${ci}`}
                className={cn(
                  "z-10 flex items-center justify-center gap-spacing-xs py-spacing-md px-spacing-md text-center text-sm",
                  column.highlighted
                    ? cn("font-bold text-foreground", ri > 0 && "border-t border-border")
                    : "text-muted border-t border-border"
                )}
                style={column.highlighted ? { ...pageSurfaceVars, gridColumn: ci + 2, gridRow: ri + 2 } : { gridColumn: ci + 2, gridRow: ri + 2 }}
                data-field={`comparisonColumns.${ci}.values.${ri}`}
              >
                {column.highlighted && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={3} />}
                <span>{column.values?.[ri]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Mobile: stacked column cards */}
      <div className="lg:hidden flex flex-col gap-spacing-lg">
        {columns.map((column, ci) => (
          <div
            key={ci}
            className={cn(
              "rounded-2xl overflow-hidden",
              column.highlighted ? "bg-card shadow-xl" : "border border-border"
            )}
            style={column.highlighted ? pageSurfaceVars : undefined}
            data-field={`comparisonColumns.${ci}`}
          >
            <div
              className={cn(
                "py-spacing-md px-spacing-lg text-center",
                column.highlighted ? "bg-primary text-on-primary" : "text-foreground border-b border-border"
              )}
            >
              <ColumnHeader column={column} />
            </div>
            <div className="p-spacing-lg flex flex-col">
              {criteria.map((criterion, ri) => (
                <div
                  key={ri}
                  className={cn("py-spacing-sm flex flex-col gap-0.5", ri > 0 && "border-t border-border")}
                >
                  <span className="text-xs uppercase tracking-wide text-muted">{criterion}</span>
                  <span
                    className={cn(
                      "text-sm flex items-center gap-spacing-xs",
                      column.highlighted ? "font-bold text-foreground" : "text-muted"
                    )}
                  >
                    {column.highlighted && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={3} />}
                    {column.values?.[ri]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollReveal>
  );
}
