import { ArrowLeft, ShoppingBag } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { useCart } from "../../store/useCart";
import type { CheckoutPageContentProps } from "./types";

export function CheckoutPageContent({
  emptyCartMessage = "Your cart is empty",
  continueShoppingLabel = "Continue Shopping",
  pageTitle = "Checkout",
  backToCartLabel = "Back to cart",
  backToCartHref = "/cart",
  contactSectionTitle = "Contact Information",
  emailLabel = "Email",
  emailPlaceholder = "your@email.com",
  phoneLabel = "Phone",
  phonePlaceholder = "+48 123 456 789",
  shippingSectionTitle = "Shipping Address",
  firstNameLabel = "First Name",
  firstNamePlaceholder = "Jan",
  lastNameLabel = "Last Name",
  lastNamePlaceholder = "Kowalski",
  addressLabel = "Address",
  addressPlaceholder = "ul. Przykładowa 12/3",
  cityLabel = "City",
  cityPlaceholder = "Warszawa",
  postalCodeLabel = "Postal Code",
  postalCodePlaceholder = "00-001",
  orderSummaryTitle = "Order Summary",
  subtotalLabel = "Subtotal",
  shippingLabel = "Shipping",
  shippingValue = "Free",
  totalLabel = "Total",
  placeOrderLabel = "Place Order",
  currency = "zł",
  className,
}: CheckoutPageContentProps) {
  const { items, getTotalPrice } = useCart();
  const totalPrice = getTotalPrice();

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

  return (
    <div className={cn("container mx-auto py-spacing-2xl", className)}>
      <Button asChild variant="ghost" className="mb-spacing-lg">
        <a href={backToCartHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backToCartLabel}
        </a>
      </Button>

      <div className="grid gap-spacing-2xl lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-spacing-lg">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{contactSectionTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-spacing-md">
              <div className="space-y-spacing-xs">
                <Label htmlFor="email">{emailLabel}</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={emailPlaceholder}
                  required
                />
              </div>
              <div className="space-y-spacing-xs">
                <Label htmlFor="phone">{phoneLabel}</Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder={phonePlaceholder}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>{shippingSectionTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-spacing-md">
              <div className="grid gap-spacing-md sm:grid-cols-2">
                <div className="space-y-spacing-xs">
                  <Label htmlFor="firstName">{firstNameLabel}</Label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder={firstNamePlaceholder}
                    required
                  />
                </div>
                <div className="space-y-spacing-xs">
                  <Label htmlFor="lastName">{lastNameLabel}</Label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder={lastNamePlaceholder}
                    required
                  />
                </div>
              </div>
              <div className="space-y-spacing-xs">
                <Label htmlFor="address">{addressLabel}</Label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  placeholder={addressPlaceholder}
                  required
                />
              </div>
              <div className="grid gap-spacing-md sm:grid-cols-2">
                <div className="space-y-spacing-xs">
                  <Label htmlFor="city">{cityLabel}</Label>
                  <Input
                    type="text"
                    id="city"
                    name="city"
                    placeholder={cityPlaceholder}
                    required
                  />
                </div>
                <div className="space-y-spacing-xs">
                  <Label htmlFor="postalCode">{postalCodeLabel}</Label>
                  <Input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    placeholder={postalCodePlaceholder}
                    required
                  />
                </div>
              </div>
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
                  <div
                    key={item.cartKey}
                    className="flex gap-spacing-sm"
                  >
                    {item.image && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-radius overflow-hidden bg-muted">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      {item.customizationLabels && (
                        <p className="text-xs text-foreground/60">
                          {Object.entries(item.customizationLabels)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(" · ")}
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
                  <span>{shippingValue}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>{totalLabel}</span>
                  <span className="text-primary">{totalPrice.toFixed(2)} {currency}</span>
                </div>
              </div>
              <Button className="w-full" size="lg">
                {placeOrderLabel}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
