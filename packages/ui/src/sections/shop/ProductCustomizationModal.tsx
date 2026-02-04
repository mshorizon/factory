import { useState, useMemo, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ShoppingCart } from "lucide-react";
import { Button } from "../../atoms/Button";
import { Label } from "../../atoms/Label";
import type { Product } from "@mshorizon/schema";

export interface ProductCustomizationModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (product: Product, customizations: Record<string, string>) => void;
  ctaLabel?: string;
  currency?: string;
  initialSelections?: Record<string, string>;
}

export function ProductCustomizationModal({
  product,
  open,
  onOpenChange,
  onConfirm,
  ctaLabel = "Add to Cart",
  currency = "zł",
  initialSelections,
}: ProductCustomizationModalProps) {
  const customizations = product.customizations ?? [];

  function buildDefaults(preselected?: Record<string, string>) {
    const defaults: Record<string, string> = {};
    for (const group of customizations) {
      if (preselected?.[group.id]) {
        defaults[group.id] = preselected[group.id];
      } else if (group.options.length > 0) {
        defaults[group.id] = group.options[0].value;
      }
    }
    return defaults;
  }

  const [selections, setSelections] = useState<Record<string, string>>(() =>
    buildDefaults(initialSelections)
  );

  useEffect(() => {
    if (open) {
      setSelections(buildDefaults(initialSelections));
    }
  }, [open, product.id]);

  const calculatedPrice = useMemo(() => {
    let total = product.price;
    for (const group of customizations) {
      const selectedValue = selections[group.id];
      if (!selectedValue) continue;
      const option = group.options.find((o) => o.value === selectedValue);
      if (option?.priceModifier) {
        total += option.priceModifier;
      }
    }
    return total;
  }, [product.price, customizations, selections]);

  const handleSelect = (groupId: string, value: string) => {
    setSelections((prev) => ({ ...prev, [groupId]: value }));
  };

  const handleConfirm = () => {
    onConfirm(product, selections);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-radius p-6 shadow-lg max-h-[85vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-radius p-1 text-foreground/50 hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>

          <div className="flex gap-4 mb-6">
            {product.image && (
              <div className="flex-shrink-0 w-24 h-24 rounded-radius overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {product.title}
              </Dialog.Title>
              <p className="text-2xl font-bold text-primary mt-1">
                {calculatedPrice.toFixed(2)} {currency}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {customizations.map((group) => (
              <div key={group.id}>
                <Label className="text-sm font-medium text-foreground mb-1.5 block">
                  {group.label}
                  {group.required !== false && (
                    <span className="text-primary ml-0.5">*</span>
                  )}
                </Label>
                <select
                  value={selections[group.id] || ""}
                  onChange={(e) => handleSelect(group.id, e.target.value)}
                  className="w-full rounded-radius border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {group.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                      {option.priceModifier
                        ? ` (+${option.priceModifier.toFixed(2)} ${currency})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button onClick={handleConfirm} className="w-full" size="lg">
              <ShoppingCart className="mr-2 h-4 w-4" />
              {ctaLabel} — {calculatedPrice.toFixed(2)} {currency}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
