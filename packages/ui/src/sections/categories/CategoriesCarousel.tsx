import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import type { CategoriesProps } from "./types";

export function CategoriesCarousel({ items, className }: CategoriesProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Horizontal scrollable container */}
      <div className="flex gap-spacing-lg overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href || "#"}
            className="flex-shrink-0 snap-start group"
          >
            <div className="w-64 bg-background border border-border rounded-radius overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1" data-field={`items.${index}`}>
              {/* Image or Icon */}
              {item.image ? (
                <div className="h-40 overflow-hidden" data-field={`items.${index}.image`}>
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="h-40 bg-primary/10 flex items-center justify-center">
                  {item.icon ? (
                    <span className="text-5xl">{item.icon}</span>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20" />
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-spacing-md">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors" data-field={`items.${index}.title`}>
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted mt-1 line-clamp-2" data-field={`items.${index}.description`}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}
