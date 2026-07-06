"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { useCart, useCartHydrated } from "../../store/useCart";

export interface CartFloatingBarProps {
  /** Where the CTA leads — the merged order/checkout page. */
  checkoutHref?: string;
  /** CTA text, e.g. "Zobacz zamówienie". */
  label?: string;
  currency?: string;
  className?: string;
}

/**
 * Persistent mini-cart pinned to the bottom of the viewport. Appears as soon
 * as the cart has items and stays visible on every resolution — independent of
 * the auto-hiding navbar — so after tapping "+" the user always sees their
 * order and the way to complete it. Bumps when the item count changes.
 */
export function CartFloatingBar({
  checkoutHref = "/checkout",
  label = "Zobacz zamówienie",
  currency = "zł",
  className,
}: CartFloatingBarProps) {
  const hydrated = useCartHydrated();
  const totalItems = useCart((s) => s.getTotalItems());
  const totalPrice = useCart((s) => s.getTotalPrice());
  const [bump, setBump] = useState(false);
  const prevCount = useRef(totalItems);

  useEffect(() => {
    if (!hydrated) return;
    if (totalItems !== prevCount.current) {
      prevCount.current = totalItems;
      setBump(true);
      const id = window.setTimeout(() => setBump(false), 400);
      return () => window.clearTimeout(id);
    }
  }, [totalItems, hydrated]);

  const visible = hydrated && totalItems > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className={cn(
            "fixed bottom-0 inset-x-0 z-40 p-spacing-sm sm:p-spacing-md pointer-events-none",
            className
          )}
        >
          <motion.a
            href={checkoutHref}
            animate={bump ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 0.35 }}
            className="pointer-events-auto mx-auto flex w-full max-w-xl items-center justify-between gap-spacing-md rounded-radius bg-primary px-spacing-lg py-spacing-sm text-on-primary shadow-2xl transition-transform hover:scale-[1.01]"
            aria-label={`${label} — ${totalItems}`}
          >
            <span className="flex items-center gap-spacing-sm">
              <span className="relative inline-flex">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -top-2 -right-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[11px] font-bold text-foreground">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              </span>
              <span className="text-sm font-semibold sm:text-base">
                {totalPrice.toFixed(2)} {currency}
              </span>
            </span>
            <span className="flex items-center gap-spacing-xs text-sm font-semibold sm:text-base">
              {label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </motion.a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
