import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import type { ServicesProps } from "./types";

export function ServicesList({
  items,
  ctaLabel,
  ctaHref = "/contact",
  className,
}: ServicesProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-background border border-border rounded-radius hover:shadow-lg hover:border-primary/20 transition-all"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              {item.price && (
                <span className="px-3 py-1 text-sm font-bold text-primary bg-primary/10 rounded-full">
                  {item.price}
                </span>
              )}
            </div>
            <p className="text-muted">{item.description}</p>
          </div>
          {ctaLabel && (
            <Button asChild variant="ghost" className="shrink-0">
              <a href={ctaHref} className="flex items-center gap-2">
                {ctaLabel}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
