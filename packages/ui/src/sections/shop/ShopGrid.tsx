import { cn } from "../../lib/utils";
import { SectionHeader } from "../../atoms/SectionHeader";
import { ProductCard } from "./ProductCard";
import { useCart } from "../../store/useCart";
import type { ShopGridProps } from "./types";

export function ShopGrid({
  header,
  products,
  ctaLabel = "Add to Cart",
  currency = "$",
  outOfStockLabel = "Out of Stock",
  outOfStockCtaLabel,
  outOfStockCtaHref,
  onAddToCart,
  className,
}: ShopGridProps) {
  const addItem = useCart((state) => state.addItem);

  const handleAddToCart = onAddToCart || addItem;

  return (
    <section className={cn("py-16 lg:py-24", className)}>
      <div className="container mx-auto">
        {header && (
          <SectionHeader
            badge={header.badge}
            title={header.title}
            subtitle={header.subtitle}
            className="mb-12"
          />
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              ctaLabel={ctaLabel}
              currency={currency}
              outOfStockLabel={outOfStockLabel}
              outOfStockCtaLabel={outOfStockCtaLabel}
              outOfStockCtaHref={outOfStockCtaHref}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
