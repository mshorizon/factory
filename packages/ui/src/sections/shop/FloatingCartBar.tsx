"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { useCart } from "../../store/useCart";

interface FloatingCartBarProps {
  cartHref?: string;
  currency?: string;
  label?: string;
  className?: string;
}

export function FloatingCartBar({
  cartHref = "/cart",
  currency = "zł",
  label = "Zobacz koszyk",
  className,
}: FloatingCartBarProps) {
  const totalItems = useCart((s) => s.getTotalItems());
  const totalPrice = useCart((s) => s.getTotalPrice());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || totalItems === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 px-spacing-md pb-spacing-md pointer-events-none",
        className,
      )}
    >
      <a
        href={cartHref}
        className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-spacing-md rounded-radius bg-primary px-spacing-lg py-spacing-md text-on-primary shadow-xl transition-transform hover:scale-[1.02]"
      >
        <div className="flex items-center gap-spacing-sm">
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-primary">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          </div>
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-spacing-xs font-semibold">
          <span>
            {totalPrice.toFixed(2)} {currency}
          </span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </a>
    </div>
  );
}
