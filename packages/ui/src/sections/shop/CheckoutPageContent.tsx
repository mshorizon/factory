"use client";

import { useState, useRef } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
  Pencil,
  Banknote,
  CreditCard,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { useCart, useCartHydrated } from "../../store/useCart";
import { ProductCustomizationModal } from "./ProductCustomizationModal";
import type { CheckoutPageContentProps, PaymentMethod } from "./types";
import type { CartItem, Product } from "@mshorizon/schema";

type FulfillmentType = "delivery" | "pickup" | "dine_in";

const PAYMENT_ICONS: Record<PaymentMethod, typeof Banknote> = {
  online: Smartphone,
  cash: Banknote,
  card_on_site: CreditCard,
};

export function CheckoutPageContent({
  emptyCartMessage = "Twoje zamówienie jest puste",
  continueShoppingLabel = "Zobacz menu",
  continueShoppingHref = "/",
  // Items section
  itemsSectionTitle = "Twoje zamówienie",
  editLabel = "Zmień",
  removeItemLabel = "Usuń pozycję",
  // Fulfillment
  fulfillmentSectionTitle = "Sposób realizacji",
  fulfillmentTypes = ["pickup"],
  fulfillmentLabels = {
    delivery: "Dostawa",
    pickup: "Odbiór osobisty",
    dine_in: "W lokalu",
  },
  // Contact section
  contactSectionTitle = "Dane kontaktowe",
  emailLabel = "Email",
  emailPlaceholder = "twoj@email.com",
  phoneLabel = "Telefon",
  phonePlaceholder = "+48 123 456 789",
  firstNameLabel = "Imię",
  firstNamePlaceholder = "Jan",
  lastNameLabel = "Nazwisko",
  lastNamePlaceholder = "Kowalski",
  // Delivery address
  shippingSectionTitle = "Adres dostawy",
  addressLabel = "Adres",
  addressPlaceholder = "ul. Przykładowa 12/3",
  cityLabel = "Miasto",
  cityPlaceholder = "Warszawa",
  postalCodeLabel = "Kod pocztowy",
  postalCodePlaceholder = "00-001",
  // Pickup / dine-in
  pickupTimeLabel = "Godzina odbioru",
  pickupTimeHint = "Zostaw puste, aby odebrać najszybciej jak to możliwe.",
  pickupTimeOptionalLabel = "Godzina (opcjonalnie)",
  tableNumberLabel = "Numer stolika",
  tableNumberPlaceholder = "np. 5",
  // Payment
  paymentSectionTitle = "Płatność",
  paymentMethods = ["cash"],
  paymentMethodLabels = {
    online: "Płatność online (BLIK / karta)",
    cash: "Gotówka przy odbiorze",
    card_on_site: "Karta przy odbiorze",
  },
  // Notes
  notesLabel = "Uwagi do zamówienia (opcjonalnie)",
  notesPlaceholder = "np. bez cebuli, dzwonek nie działa...",
  // Summary
  orderSummaryTitle = "Podsumowanie",
  subtotalLabel = "Wartość zamówienia",
  shippingLabel = "Dostawa",
  shippingValue = "Za darmo",
  totalLabel = "Razem",
  placeOrderLabel = "Złóż zamówienie",
  processingLabel = "Przetwarzanie...",
  minOrderLabel = "Minimalna wartość zamówienia",
  submitNoteOnline = "Po akceptacji przez restaurację otrzymasz link do płatności — na tej stronie i e-mailem.",
  submitNoteOffline = "Zapłacisz przy odbiorze zamówienia.",
  // Validation messages
  errorContactMessage = "Wypełnij dane kontaktowe",
  errorAddressMessage = "Uzupełnij adres dostawy",
  errorTableMessage = "Podaj numer stolika",
  errorSubmitMessage = "Nie udało się złożyć zamówienia",
  currency = "zł",
  className,
  businessId,
  deliveryFee = 0,
  minOrderValue = 0,
}: CheckoutPageContentProps) {
  const hydrated = useCartHydrated();
  const {
    items,
    updateQuantity,
    removeItem,
    updateItemCustomizations,
    getTotalPrice,
    clearCart,
  } = useCart();
  const totalPrice = getTotalPrice();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(
    fulfillmentTypes[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    paymentMethods[0]
  );

  if (!hydrated || items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-spacing-3xl px-spacing-md",
          !hydrated && "invisible",
          className
        )}
      >
        <ShoppingBag className="h-16 w-16 text-foreground/30 mb-spacing-md" aria-hidden="true" />
        <p className="text-xl text-foreground/70 mb-spacing-lg">{emptyCartMessage}</p>
        <Button asChild size="lg">
          <a href={continueShoppingHref}>
            {continueShoppingLabel}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    );
  }

  const showDelivery = fulfillmentType === "delivery";
  const showPickup = fulfillmentType === "pickup";
  const showDineIn = fulfillmentType === "dine_in";
  const effectiveDeliveryFee = showDelivery ? deliveryFee : 0;
  const grandTotal = totalPrice + effectiveDeliveryFee / 100;
  const subtotalCents = Math.round(totalPrice * 100);
  const belowMinOrder = minOrderValue > 0 && subtotalCents < minOrderValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const form = formRef.current;
      if (!form) return;

      const formData = new FormData(form);
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const firstName = String(formData.get("firstName") || "").trim();
      const lastName = String(formData.get("lastName") || "").trim();
      const address = String(formData.get("address") || "").trim();
      const city = String(formData.get("city") || "").trim();
      const postalCode = String(formData.get("postalCode") || "").trim();
      const pickupTime = String(formData.get("pickupTime") || "").trim();
      const tableNumber = String(formData.get("tableNumber") || "").trim();
      const customerNotes = String(formData.get("customerNotes") || "").trim();

      if (!email || !firstName || !lastName) {
        setError(errorContactMessage);
        setIsSubmitting(false);
        return;
      }

      if (fulfillmentType === "delivery" && (!address || !city || !postalCode)) {
        setError(errorAddressMessage);
        setIsSubmitting(false);
        return;
      }

      if (fulfillmentType === "dine_in" && !tableNumber) {
        setError(errorTableMessage);
        setIsSubmitting(false);
        return;
      }

      if (belowMinOrder) {
        setError(`${minOrderLabel}: ${(minOrderValue / 100).toFixed(2)} ${currency}`);
        setIsSubmitting(false);
        return;
      }

      // Preserve the query string so the ?business= dev override reaches the API
      const res = await fetch(`/api/checkout${window.location.search}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          email,
          phone: phone || undefined,
          firstName,
          lastName,
          fulfillmentType,
          paymentMethod,
          address: fulfillmentType === "delivery" ? address : undefined,
          city: fulfillmentType === "delivery" ? city : undefined,
          postalCode: fulfillmentType === "delivery" ? postalCode : undefined,
          pickupTime: fulfillmentType === "pickup" && pickupTime ? pickupTime : undefined,
          tableNumber: fulfillmentType === "dine_in" ? tableNumber : undefined,
          customerNotes: customerNotes || undefined,
          items: items.map((item) => ({
            productId: item.productId,
            cartKey: item.cartKey,
            title: item.title,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            customizations: item.customizations,
            customizationLabels: item.customizationLabels,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || errorSubmitMessage);
      }

      if (data.statusUrl) {
        clearCart();
        window.location.href = `${data.statusUrl}${window.location.search}`;
        return;
      }
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
        return;
      }
      throw new Error(errorSubmitMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorSubmitMessage);
      setIsSubmitting(false);
    }
  };

  const submitNote = paymentMethod === "online" ? submitNoteOnline : submitNoteOffline;

  return (
    <div className={cn("container mx-auto py-spacing-lg", className)}>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="grid gap-spacing-xl lg:gap-spacing-2xl lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-spacing-lg">
            {error && (
              <div
                role="alert"
                className="rounded-radius border border-destructive/30 bg-destructive/10 p-spacing-md text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Order items — editable, menu-row style */}
            <Card>
              <CardHeader>
                <CardTitle>{itemsSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border/60">
                  {items.map((item) => (
                    <li key={item.cartKey} className="flex gap-spacing-md py-spacing-md first:pt-0 last:pb-0">
                      {item.image && (
                        <div className="hidden sm:block flex-shrink-0 w-16 h-16 rounded-radius overflow-hidden bg-background/50">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-foreground">
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
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="inline-flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 transition-colors"
                                aria-label={editLabel}
                              >
                                <Pencil className="h-3 w-3" aria-hidden="true" />
                                {editLabel}
                              </button>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-spacing-md mt-spacing-sm">
                          <div className="flex items-center border border-border rounded-radius">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                              aria-label={`${removeItemLabel}: ${item.title}`}
                            >
                              <Minus className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                              aria-label={`+ ${item.title}`}
                            >
                              <Plus className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-foreground/50 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.cartKey)}
                            aria-label={`${removeItemLabel}: ${item.title}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="font-semibold text-foreground">
                          {(item.price * item.quantity).toFixed(2)} {currency}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-foreground/60 mt-0.5">
                            {item.quantity} × {item.price.toFixed(2)} {currency}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Fulfillment type */}
            {fulfillmentTypes.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>{fulfillmentSectionTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-spacing-sm sm:grid-cols-3" role="radiogroup" aria-label={fulfillmentSectionTitle}>
                    {fulfillmentTypes.map((ft) => {
                      const active = fulfillmentType === ft;
                      return (
                        <button
                          key={ft}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setFulfillmentType(ft)}
                          className={cn(
                            "rounded-radius border px-spacing-md py-spacing-sm text-sm font-medium transition-colors",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-foreground/70 hover:border-primary/40"
                          )}
                        >
                          {fulfillmentLabels[ft] || ft}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>{contactSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-spacing-md">
                <div className="grid gap-spacing-md sm:grid-cols-2">
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="firstName">{firstNameLabel}</Label>
                    <Input type="text" id="firstName" name="firstName" placeholder={firstNamePlaceholder} required disabled={isSubmitting} autoComplete="given-name" />
                  </div>
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="lastName">{lastNameLabel}</Label>
                    <Input type="text" id="lastName" name="lastName" placeholder={lastNamePlaceholder} required disabled={isSubmitting} autoComplete="family-name" />
                  </div>
                </div>
                <div className="grid gap-spacing-md sm:grid-cols-2">
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="email">{emailLabel}</Label>
                    <Input type="email" id="email" name="email" placeholder={emailPlaceholder} required disabled={isSubmitting} autoComplete="email" />
                  </div>
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="phone">{phoneLabel}</Label>
                    <Input type="tel" id="phone" name="phone" placeholder={phonePlaceholder} disabled={isSubmitting} autoComplete="tel" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery address */}
            {showDelivery && (
              <Card>
                <CardHeader>
                  <CardTitle>{shippingSectionTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-spacing-md">
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="address">{addressLabel}</Label>
                    <Input type="text" id="address" name="address" placeholder={addressPlaceholder} required disabled={isSubmitting} autoComplete="street-address" />
                  </div>
                  <div className="grid gap-spacing-md sm:grid-cols-2">
                    <div className="space-y-spacing-xs">
                      <Label htmlFor="city">{cityLabel}</Label>
                      <Input type="text" id="city" name="city" placeholder={cityPlaceholder} required disabled={isSubmitting} autoComplete="address-level2" />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label htmlFor="postalCode">{postalCodeLabel}</Label>
                      <Input type="text" id="postalCode" name="postalCode" placeholder={postalCodePlaceholder} required disabled={isSubmitting} autoComplete="postal-code" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pickup time */}
            {showPickup && (
              <Card>
                <CardHeader>
                  <CardTitle>{pickupTimeLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-spacing-md">
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="pickupTime">{pickupTimeOptionalLabel}</Label>
                    <Input type="datetime-local" id="pickupTime" name="pickupTime" disabled={isSubmitting} />
                    <p className="text-xs text-foreground/60">{pickupTimeHint}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dine-in */}
            {showDineIn && (
              <Card>
                <CardHeader>
                  <CardTitle>{tableNumberLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-spacing-md">
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="tableNumber">{tableNumberLabel}</Label>
                    <Input type="text" id="tableNumber" name="tableNumber" placeholder={tableNumberPlaceholder} required disabled={isSubmitting} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment method */}
            <Card>
              <CardHeader>
                <CardTitle>{paymentSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-spacing-sm" role="radiogroup" aria-label={paymentSectionTitle}>
                  {paymentMethods.map((pm) => {
                    const active = paymentMethod === pm;
                    const Icon = PAYMENT_ICONS[pm];
                    return (
                      <button
                        key={pm}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setPaymentMethod(pm)}
                        className={cn(
                          "flex items-center gap-spacing-sm rounded-radius border px-spacing-md py-spacing-sm text-left text-sm font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground/70 hover:border-primary/40"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {paymentMethodLabels[pm] || pm}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{notesLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  id="customerNotes"
                  name="customerNotes"
                  placeholder={notesPlaceholder}
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full rounded-radius border border-border bg-background px-spacing-sm py-spacing-xs text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-spacing-3xl">
              <CardHeader>
                <CardTitle>{orderSummaryTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-spacing-md">
                <div className="space-y-spacing-xs">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/70">{subtotalLabel}</span>
                    <span>{totalPrice.toFixed(2)} {currency}</span>
                  </div>
                  {showDelivery && (
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/70">{shippingLabel}</span>
                      <span>
                        {deliveryFee > 0
                          ? `${(deliveryFee / 100).toFixed(2)} ${currency}`
                          : shippingValue}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-spacing-xs border-t border-border">
                    <span>{totalLabel}</span>
                    <span className="text-primary">{grandTotal.toFixed(2)} {currency}</span>
                  </div>
                </div>
                {belowMinOrder && (
                  <p className="rounded-radius border border-border bg-background/50 p-spacing-sm text-xs text-foreground/70">
                    {minOrderLabel}: {(minOrderValue / 100).toFixed(2)} {currency}
                  </p>
                )}
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || belowMinOrder}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      {processingLabel}
                    </>
                  ) : (
                    placeOrderLabel
                  )}
                </Button>
                <p className="text-xs text-foreground/60 text-center">{submitNote}</p>
                <Button asChild variant="outline" className="w-full">
                  <a href={continueShoppingHref}>{continueShoppingLabel}</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

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
