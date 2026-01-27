import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CategoriesProps } from "./types";

export function CategoriesFeatured({ items, className }: CategoriesProps) {
  // Take first 3 items for featured display
  const featuredItems = items.slice(0, 3);

  return (
    <div
      className={cn(
        "grid gap-6",
        featuredItems.length === 1 && "grid-cols-1",
        featuredItems.length === 2 && "grid-cols-1 md:grid-cols-2",
        featuredItems.length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {featuredItems.map((item, index) => (
        <a
          key={index}
          href={item.href || "#"}
          className="group relative overflow-hidden rounded-radius min-h-[280px] flex items-end"
        >
          {/* Background image or gradient */}
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-6 w-full">
            {item.icon && (
              <span className="text-3xl mb-3 block">{item.icon}</span>
            )}
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-white/80 text-sm mb-4 line-clamp-2">
                {item.description}
              </p>
            )}
            <span className="inline-flex items-center text-sm font-medium text-white group-hover:text-primary transition-colors">
              Explore
              <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
