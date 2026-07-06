import type { Product, ProductAttribute, ProductCustomization, ProductCustomizationOption, SectionHeader } from "@mshorizon/schema";

export type PaymentMethod = "online" | "cash" | "card_on_site";
export type FulfillmentType = "delivery" | "pickup" | "dine_in";

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

export interface CheckoutPageContentProps {
  // Empty state
  emptyCartMessage?: string;
  continueShoppingLabel?: string;
  continueShoppingHref?: string;
  // Items
  editLabel?: string;
  removeItemLabel?: string;
  // Fulfillment
  fulfillmentSectionTitle?: string;
  fulfillmentTypes?: FulfillmentType[];
  fulfillmentLabels?: Partial<Record<FulfillmentType, string>>;
  // Contact section
  contactSectionTitle?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  phoneLabel?: string;
  phonePlaceholder?: string;
  firstNameLabel?: string;
  firstNamePlaceholder?: string;
  lastNameLabel?: string;
  lastNamePlaceholder?: string;
  // Delivery address
  shippingSectionTitle?: string;
  addressLabel?: string;
  addressPlaceholder?: string;
  cityLabel?: string;
  cityPlaceholder?: string;
  postalCodeLabel?: string;
  postalCodePlaceholder?: string;
  // Pickup / dine-in
  pickupTimeLabel?: string;
  pickupTimeHint?: string;
  pickupTimeOptionalLabel?: string;
  tableNumberLabel?: string;
  tableNumberPlaceholder?: string;
  // Payment
  paymentSectionTitle?: string;
  paymentMethods?: PaymentMethod[];
  paymentMethodLabels?: Partial<Record<PaymentMethod, string>>;
  // Notes
  notesLabel?: string;
  notesPlaceholder?: string;
  // Summary
  orderSummaryTitle?: string;
  subtotalLabel?: string;
  shippingLabel?: string;
  shippingValue?: string;
  totalLabel?: string;
  placeOrderLabel?: string;
  processingLabel?: string;
  minOrderLabel?: string;
  submitNoteOnline?: string;
  submitNoteOffline?: string;
  // Validation messages
  errorContactMessage?: string;
  errorAddressMessage?: string;
  errorTableMessage?: string;
  errorSubmitMessage?: string;
  currency?: string;
  className?: string;
  // Business context
  businessId?: string;
  deliveryFee?: number; // cents
  minOrderValue?: number; // cents
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
