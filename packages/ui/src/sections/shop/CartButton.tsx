import { ShoppingCart } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { useCart } from "../../store/useCart";
import type { CartButtonProps } from "./types";

export function CartButton({ cartHref = "/cart", label, className }: CartButtonProps) {
  const totalItems = useCart((state) => state.getTotalItems());

  return (
    <Button
      asChild
      variant="outline"
      size={label ? "default" : "icon"}
      className={cn(
        "relative border border-border hover:border-primary hover:bg-primary/5 transition-colors",
        label ? "px-4 gap-2" : "h-10 w-10",
        className
      )}
    >
      <a href={cartHref} aria-label={`Cart with ${totalItems} items`}>
        <ShoppingCart className="h-5 w-5 text-foreground" />
        {label && <span className="font-medium text-foreground">{label}</span>}
        {totalItems > 0 && (
          <span className={cn(
            "flex items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-on-primary",
            label ? "ml-1 h-5 w-5" : "absolute -top-1.5 -right-1.5 h-5 w-5"
          )}>
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </a>
    </Button>
  );
}
