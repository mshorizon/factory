import { ShoppingCart } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";
import type { ProductCardProps } from "./types";

export function ProductCard({
  product,
  ctaLabel = "Add to Cart",
  currency = "zł",
  outOfStockLabel = "Out of Stock",
  onAddToCart,
  className,
}: ProductCardProps) {
  const { title, description, price, image, category, attributes, inStock = true } = product;

  const handleAddToCart = () => {
    if (onAddToCart && inStock) {
      onAddToCart(product);
    }
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
        !inStock && "opacity-75",
        className
      )}
    >
      {image && (
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Badge variant="secondary">{outOfStockLabel}</Badge>
            </div>
          )}
        </div>
      )}
      <CardHeader className="pb-2">
        {category && (
          <Badge variant="outline" className="w-fit mb-2 text-xs">
            {category}
          </Badge>
        )}
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        {attributes && attributes.length > 0 && (
          <ul className="space-y-1 text-sm text-foreground/70">
            {attributes.map((attr, index) => (
              <li key={index} className="flex justify-between">
                <span className="font-medium">{attr.key}:</span>
                <span>{attr.value}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-2xl font-bold text-primary">
          {price.toFixed(2)} {currency}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {ctaLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
