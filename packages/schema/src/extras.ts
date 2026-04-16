/**
 * Supplementary types not expressed in the JSON schema.
 * Variant unions, cart runtime types, and convenience aliases.
 */

// Section variant unions (not in schema — these constrain component rendering)
export type HeroVariant = "default" | "split" | "gradient" | "cards" | "video" | "minimal";
export type ServicesVariant = "grid" | "list";
export type CategoriesVariant = "carousel" | "featured";
export type AboutVariant = "story" | "timeline";
export type ContactVariant = "centered" | "split" | "cta" | "minimal" | "card" | "light-panel";

// Footer call extension
export interface FooterCallExtension {
  type: "call";
  headline: string;
  phone: string;
}
export type FooterExtension = FooterCallExtension;

// Navbar extensions
export interface NavbarUpperBarExtension {
  type: "upper-bar";
}
export type NavbarExtension = NavbarUpperBarExtension;

// Cart item (runtime — has methods, can't be in JSON schema)
export interface CartItem {
  productId: string;
  cartKey: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  customizations?: Record<string, string>;
  customizationLabels?: Record<string, string>;
  productCustomizations?: import("./generated").ProductCustomization[];
}

// Cart store state (runtime — has methods)
export interface CartStore {
  items: CartItem[];
  addItem: (product: import("./generated").Product, customizations?: Record<string, string>) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  updateItemCustomizations: (oldCartKey: string, product: import("./generated").Product, newCustomizations: Record<string, string>) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}
