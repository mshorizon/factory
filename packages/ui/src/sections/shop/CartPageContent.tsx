import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Pencil } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";
import { useCart } from "../../store/useCart";
import { ProductCustomizationModal } from "./ProductCustomizationModal";
import type { CartPageContentProps } from "./types";
import type { CartItem, Product } from "@mshorizon/schema";

export function CartPageContent({
  emptyCartMessage = "Your cart is empty",
  continueShoppingLabel = "Continue Shopping",
  continueShoppingHref = "/",
  proceedToPaymentLabel = "Proceed to Payment",
  checkoutHref = "/checkout",
  removeLabel = "Remove",
  totalLabel = "Total",
  quantityLabel = "Qty",
  subtotalLabel = "Subtotal",
  editLabel = "Edit",
  orderSummaryLabel = "Order Summary",
  currency = "zł",
  className,
}: CartPageContentProps) {
  const { items, updateQuantity, removeItem, updateItemCustomizations, getTotalPrice } = useCart();
  const totalPrice = getTotalPrice();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4",
          className
        )}
      >
        <ShoppingBag className="h-16 w-16 text-foreground/30 mb-4" />
        <p className="text-xl text-foreground/70 mb-6">{emptyCartMessage}</p>
        <Button asChild size="lg">
          <a href={continueShoppingHref}>
            {continueShoppingLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("container mx-auto px-4 py-8", className)}>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.cartKey} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {item.image && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-radius overflow-hidden bg-muted">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {item.title}
                    </h3>
                    {item.customizationLabels && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-foreground/60">
                          {Object.entries(item.customizationLabels)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(" · ")}
                        </p>
                        {item.productCustomizations && item.productCustomizations.length > 0 && (
                          <button
                            onClick={() => setEditingItem(item)}
                            className="inline-flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 transition-colors"
                            aria-label={editLabel}
                          >
                            <Pencil className="h-3 w-3" />
                            {editLabel}
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-lg font-bold text-primary mt-1">
                      {item.price.toFixed(2)} {currency}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground/70">
                          {quantityLabel}:
                        </span>
                        <div className="flex items-center border border-border rounded-radius">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.cartKey, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.cartKey, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeItem(item.cartKey)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {removeLabel}
                      </Button>
                    </div>
                  </div>
                  {/* Item Subtotal */}
                  <div className="text-right">
                    <p className="text-sm text-foreground/70">{subtotalLabel}</p>
                    <p className="text-lg font-bold text-foreground">
                      {(item.price * item.quantity).toFixed(2)} {currency}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{orderSummaryLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.cartKey}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-foreground/70 truncate pr-2">
                      {item.title} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      {(item.price * item.quantity).toFixed(2)} {currency}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{totalLabel}</span>
                  <span className="text-primary">{totalPrice.toFixed(2)} {currency}</span>
                </div>
              </div>
              <Button asChild className="w-full" size="lg">
                <a href={checkoutHref}>
                  {proceedToPaymentLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href={continueShoppingHref}>{continueShoppingLabel}</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {editingItem && editingItem.productCustomizations && (
        <ProductCustomizationModal
          product={{
            id: editingItem.productId,
            title: editingItem.title,
            price: editingItem.productCustomizations.reduce((base, group) => {
              const selectedValue = editingItem.customizations?.[group.id];
              if (!selectedValue) return base;
              const option = group.options.find((o) => o.value === selectedValue);
              return option?.priceModifier ? base - option.priceModifier : base;
            }, editingItem.price),
            image: editingItem.image,
            customizations: editingItem.productCustomizations,
          } satisfies Product}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
          onConfirm={(product, newCustomizations) => {
            updateItemCustomizations(editingItem.cartKey, product, newCustomizations);
            setEditingItem(null);
          }}
          initialSelections={editingItem.customizations}
          ctaLabel={editLabel}
          currency={currency}
        />
      )}
    </div>
  );
}
