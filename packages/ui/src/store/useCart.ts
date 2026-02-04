import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, CartItem, CartStore } from "@mshorizon/schema";

function getCartKey(
  productId: string,
  customizations?: Record<string, string>
): string {
  if (!customizations || Object.keys(customizations).length === 0) {
    return productId;
  }
  const sorted = Object.keys(customizations)
    .sort()
    .map((k) => `${k}:${customizations[k]}`)
    .join("|");
  return `${productId}__${sorted}`;
}

function calculatePrice(
  product: Product,
  customizations?: Record<string, string>
): number {
  if (!customizations || !product.customizations) return product.price;

  let total = product.price;
  for (const group of product.customizations) {
    const selectedValue = customizations[group.id];
    if (!selectedValue) continue;
    const option = group.options.find((o) => o.value === selectedValue);
    if (option?.priceModifier) {
      total += option.priceModifier;
    }
  }
  return total;
}

function getCustomizationLabels(
  product: Product,
  customizations?: Record<string, string>
): Record<string, string> | undefined {
  if (!customizations || !product.customizations) return undefined;

  const labels: Record<string, string> = {};
  for (const group of product.customizations) {
    const selectedValue = customizations[group.id];
    if (!selectedValue) continue;
    const option = group.options.find((o) => o.value === selectedValue);
    if (option) {
      labels[group.label] = option.label;
    }
  }
  return Object.keys(labels).length > 0 ? labels : undefined;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, customizations?: Record<string, string>) => {
        const { items } = get();
        const cartKey = getCartKey(product.id, customizations);
        const existingItem = items.find((item) => item.cartKey === cartKey);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.cartKey === cartKey
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          const newItem: CartItem = {
            productId: product.id,
            cartKey,
            title: product.title,
            price: calculatePrice(product, customizations),
            image: product.image,
            quantity: 1,
            customizations,
            customizationLabels: getCustomizationLabels(product, customizations),
            productCustomizations: product.customizations,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (cartKey: string) => {
        const { items } = get();
        set({ items: items.filter((item) => item.cartKey !== cartKey) });
      },

      updateItemCustomizations: (
        oldCartKey: string,
        product: Product,
        newCustomizations: Record<string, string>
      ) => {
        const { items } = get();
        const oldIndex = items.findIndex((item) => item.cartKey === oldCartKey);
        if (oldIndex === -1) return;

        const oldItem = items[oldIndex];
        const newCartKey = getCartKey(product.id, newCustomizations);
        const newPrice = calculatePrice(product, newCustomizations);
        const newLabels = getCustomizationLabels(product, newCustomizations);

        if (newCartKey === oldCartKey) {
          // Same key — just update price/labels in case options changed price modifiers
          set({
            items: items.map((item) =>
              item.cartKey === oldCartKey
                ? { ...item, price: newPrice, customizations: newCustomizations, customizationLabels: newLabels }
                : item
            ),
          });
          return;
        }

        const existingTarget = items.find(
          (item) => item.cartKey === newCartKey && item.cartKey !== oldCartKey
        );

        if (existingTarget) {
          // Merge into existing item with same customization combo
          set({
            items: items
              .map((item) => {
                if (item.cartKey === newCartKey) {
                  return { ...item, quantity: item.quantity + oldItem.quantity };
                }
                return item;
              })
              .filter((item) => item.cartKey !== oldCartKey),
          });
        } else {
          // Update in-place with new key
          set({
            items: items.map((item) =>
              item.cartKey === oldCartKey
                ? {
                    ...item,
                    cartKey: newCartKey,
                    price: newPrice,
                    customizations: newCustomizations,
                    customizationLabels: newLabels,
                    productCustomizations: product.customizations,
                  }
                : item
            ),
          });
        }
      },

      updateQuantity: (cartKey: string, quantity: number) => {
        const { items } = get();
        if (quantity <= 0) {
          set({ items: items.filter((item) => item.cartKey !== cartKey) });
        } else {
          set({
            items: items.map((item) =>
              item.cartKey === cartKey ? { ...item, quantity } : item
            ),
          });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "mshorizon-cart",
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) {
          const state = persisted as { items?: CartItem[] };
          if (state.items) {
            state.items = state.items.map((item) => ({
              ...item,
              cartKey: item.cartKey || item.productId,
            }));
          }
        }
        return persisted as CartStore;
      },
    }
  )
);
