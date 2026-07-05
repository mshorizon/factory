import { useState, useRef } from "react";
import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { useCart } from "../../store/useCart";
import type { CheckoutPageContentProps } from "./types";

type FulfillmentType = "delivery" | "pickup" | "dine_in";

interface RestaurantCheckoutProps extends CheckoutPageContentProps {
  fulfillmentTypes?: FulfillmentType[];
  deliveryFee?: number; // cents
  minOrderValue?: number; // cents
  notesLabel?: string;
  notesPlaceholder?: string;
  pickupTimeLabel?: string;
  tableNumberLabel?: string;
  tableNumberPlaceholder?: string;
  fulfillmentLabels?: Partial<Record<FulfillmentType, string>>;
}

export function CheckoutPageContent({
  emptyCartMessage = "Twój koszyk jest pusty",
  continueShoppingLabel = "Wróć do menu",
  pageTitle = "Podsumowanie zamówienia",
  backToCartLabel = "Wróć do koszyka",
  backToCartHref = "/cart",
  contactSectionTitle = "Dane kontaktowe",
  emailLabel = "Email",
  emailPlaceholder = "twoj@email.com",
  phoneLabel = "Telefon",
  phonePlaceholder = "+48 123 456 789",
  shippingSectionTitle = "Adres dostawy",
  firstNameLabel = "Imię",
  firstNamePlaceholder = "Jan",
  lastNameLabel = "Nazwisko",
  lastNamePlaceholder = "Kowalski",
  addressLabel = "Adres",
  addressPlaceholder = "ul. Przykładowa 12/3",
  cityLabel = "Miasto",
  cityPlaceholder = "Warszawa",
  postalCodeLabel = "Kod pocztowy",
  postalCodePlaceholder = "00-001",
  orderSummaryTitle = "Podsumowanie",
  subtotalLabel = "Suma częściowa",
  shippingLabel = "Dostawa",
  shippingValue = "Za darmo",
  totalLabel = "Razem",
  placeOrderLabel = "Złóż zamówienie",
  processingLabel = "Przetwarzanie...",
  errorLabel = "Wystąpił błąd",
  currency = "zł",
  className,
  businessId,
  fulfillmentTypes = ["pickup"],
  deliveryFee = 0,
  minOrderValue = 0,
  notesLabel = "Uwagi do zamówienia (opcjonalnie)",
  notesPlaceholder = "np. bez cebuli, dzwonek nie działa...",
  pickupTimeLabel = "Godzina odbioru",
  tableNumberLabel = "Numer stolika",
  tableNumberPlaceholder = "np. 5",
  fulfillmentLabels = {
    delivery: "Dostawa",
    pickup: "Odbiór osobisty",
    dine_in: "W lokalu",
  },
}: RestaurantCheckoutProps) {
  const { items, getTotalPrice, clearCart } = useCart();
  const totalPrice = getTotalPrice();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(fulfillmentTypes[0]);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-spacing-3xl px-spacing-md",
          className
        )}
      >
        <ShoppingBag className="h-16 w-16 text-foreground/30 mb-spacing-md" />
        <p className="text-xl text-foreground/70 mb-spacing-lg">{emptyCartMessage}</p>
        <Button asChild size="lg">
          <a href="/">{continueShoppingLabel}</a>
        </Button>
      </div>
    );
  }

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
        setError("Wypełnij dane kontaktowe");
        setIsSubmitting(false);
        return;
      }

      if (fulfillmentType === "delivery" && (!address || !city || !postalCode)) {
        setError("Uzupełnij adres dostawy");
        setIsSubmitting(false);
        return;
      }

      if (fulfillmentType === "dine_in" && !tableNumber) {
        setError("Podaj numer stolika");
        setIsSubmitting(false);
        return;
      }

      const priceCents = Math.round(totalPrice * 100);
      if (minOrderValue > 0 && priceCents < minOrderValue) {
        setError(`Minimalne zamówienie: ${(minOrderValue / 100).toFixed(2)} ${currency}`);
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          email,
          phone: phone || undefined,
          firstName,
          lastName,
          fulfillmentType,
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
        throw new Error(data.error || "Nie udało się złożyć zamówienia");
      }

      if (data.statusUrl) {
        clearCart();
        window.location.href = data.statusUrl;
        return;
      }
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
        return;
      }
      throw new Error("Brak URL statusu zamówienia");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieoczekiwany błąd");
      setIsSubmitting(false);
    }
  };

  const showDelivery = fulfillmentType === "delivery";
  const showPickup = fulfillmentType === "pickup";
  const showDineIn = fulfillmentType === "dine_in";
  const displayShipping = deliveryFee > 0 && showDelivery
    ? `${(deliveryFee / 100).toFixed(2)} ${currency}`
    : shippingValue;
  const grandTotal = totalPrice + (showDelivery ? deliveryFee / 100 : 0);

  return (
    <div className={cn("container mx-auto py-spacing-2xl", className)}>
      <Button asChild variant="ghost" className="mb-spacing-lg">
        <a href={backToCartHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backToCartLabel}
        </a>
      </Button>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="grid gap-spacing-2xl lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-spacing-lg">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Fulfillment type */}
            {fulfillmentTypes.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sposób realizacji</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-spacing-sm sm:grid-cols-3">
                    {fulfillmentTypes.map((ft) => {
                      const active = fulfillmentType === ft;
                      return (
                        <button
                          key={ft}
                          type="button"
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
                    <Input type="text" id="firstName" name="firstName" placeholder={firstNamePlaceholder} required disabled={isSubmitting} />
                  </div>
                  <div className="space-y-spacing-xs">
                    <Label htmlFor="lastName">{lastNameLabel}</Label>
                    <Input type="text" id="lastName" name="lastName" placeholder={lastNamePlaceholder} required disabled={isSubmitting} />
                  </div>
                </div>
                <div className="space-y-spacing-xs">
                  <Label htmlFor="email">{emailLabel}</Label>
                  <Input type="email" id="email" name="email" placeholder={emailPlaceholder} required disabled={isSubmitting} />
                </div>
                <div className="space-y-spacing-xs">
                  <Label htmlFor="phone">{phoneLabel}</Label>
                  <Input type="tel" id="phone" name="phone" placeholder={phonePlaceholder} disabled={isSubmitting} />
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
                    <Input type="text" id="address" name="address" placeholder={addressPlaceholder} required disabled={isSubmitting} />
                  </div>
                  <div className="grid gap-spacing-md sm:grid-cols-2">
                    <div className="space-y-spacing-xs">
                      <Label htmlFor="city">{cityLabel}</Label>
                      <Input type="text" id="city" name="city" placeholder={cityPlaceholder} required disabled={isSubmitting} />
                    </div>
                    <div className="space-y-spacing-xs">
                      <Label htmlFor="postalCode">{postalCodeLabel}</Label>
                      <Input type="text" id="postalCode" name="postalCode" placeholder={postalCodePlaceholder} required disabled={isSubmitting} />
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
                    <Label htmlFor="pickupTime">Godzina (opcjonalnie)</Label>
                    <Input type="datetime-local" id="pickupTime" name="pickupTime" disabled={isSubmitting} />
                    <p className="text-xs text-foreground/60">Zostaw puste, aby odebrać najszybciej.</p>
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

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{notesLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-spacing-md">
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
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.cartKey} className="flex gap-spacing-sm">
                      {item.image && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-radius overflow-hidden bg-muted">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        {item.customizationLabels && (
                          <p className="text-xs text-foreground/60">
                            {Object.entries(item.customizationLabels).map(([key, val]) => `${key}: ${val}`).join(" · ")}
                          </p>
                        )}
                        <p className="text-sm text-foreground/70">
                          {item.quantity} x {item.price.toFixed(2)} {currency}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {(item.price * item.quantity).toFixed(2)} {currency}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 space-y-spacing-xs">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/70">{subtotalLabel}</span>
                    <span>{totalPrice.toFixed(2)} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/70">{shippingLabel}</span>
                    <span>{displayShipping}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>{totalLabel}</span>
                    <span className="text-primary">{grandTotal.toFixed(2)} {currency}</span>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {processingLabel}
                    </>
                  ) : (
                    placeOrderLabel
                  )}
                </Button>
                <p className="text-xs text-foreground/60 text-center">
                  Po akceptacji restauracji otrzymasz link do płatności e-mailem.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
