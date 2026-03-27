import type { Product, ProductAttribute, ProductCustomization, ProductCustomizationOption, SectionHeader } from "@mshorizon/schema";

export interface ProductCardProps {
  product: Product;
  ctaLabel?: string;
  currency?: string;
  outOfStockLabel?: string;
  outOfStockCtaLabel?: string;
  outOfStockCtaHref?: string;
  onAddToCart?: (product: Product, customizations?: Record<string, string>) => void;
  className?: string;
}

export interface CartButtonProps {
  cartHref?: string;
  label?: string;
  className?: string;
}

export interface CartPageContentProps {
  emptyCartMessage?: string;
  continueShoppingLabel?: string;
  continueShoppingHref?: string;
  proceedToPaymentLabel?: string;
  checkoutHref?: string;
  removeLabel?: string;
  totalLabel?: string;
  quantityLabel?: string;
  subtotalLabel?: string;
  orderSummaryLabel?: string;
  editLabel?: string;
  currency?: string;
  className?: string;
}

export interface CheckoutPageContentProps {
  // Empty state labels
  emptyCartMessage?: string;
  continueShoppingLabel?: string;
  // Page labels
  pageTitle?: string;
  backToCartLabel?: string;
  backToCartHref?: string;
  // Contact section
  contactSectionTitle?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  phoneLabel?: string;
  phonePlaceholder?: string;
  // Shipping section
  shippingSectionTitle?: string;
  firstNameLabel?: string;
  firstNamePlaceholder?: string;
  lastNameLabel?: string;
  lastNamePlaceholder?: string;
  addressLabel?: string;
  addressPlaceholder?: string;
  cityLabel?: string;
  cityPlaceholder?: string;
  postalCodeLabel?: string;
  postalCodePlaceholder?: string;
  // Order summary section
  orderSummaryTitle?: string;
  subtotalLabel?: string;
  shippingLabel?: string;
  shippingValue?: string;
  totalLabel?: string;
  // Submit
  placeOrderLabel?: string;
  processingLabel?: string;
  errorLabel?: string;
  currency?: string;
  className?: string;
  // Business context
  businessId?: string;
}

export interface ShopGridProps {
  header?: SectionHeader;
  products: Product[];
  ctaLabel?: string;
  currency?: string;
  outOfStockLabel?: string;
  outOfStockCtaLabel?: string;
  outOfStockCtaHref?: string;
  onAddToCart?: (product: Product, customizations?: Record<string, string>) => void;
  className?: string;
}

export type { Product, ProductAttribute, ProductCustomization, ProductCustomizationOption };
