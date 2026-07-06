"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
  ChefHat,
  PackageCheck,
  Utensils,
  Phone,
  Banknote,
  Smartphone,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";

type OrderStatus =
  | "pending" | "accepted" | "paid" | "preparing" | "ready" | "completed" | "rejected" | "cancelled";

type PaymentMethod = "online" | "cash" | "card_on_site";

interface OrderItem {
  id: number;
  title: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image?: string | null;
  customizationLabels?: Record<string, string> | null;
}

interface OrderData {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod | null;
  fulfillmentType: "delivery" | "pickup" | "dine_in" | null;
  tableNumber: string | null;
  pickupTime: string | null;
  customerFirstName: string;
  customerLastName: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  paymentLinkUrl: string | null;
  estimatedReadyAt: string | null;
  acceptedAt: string | null;
  paidAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  notes: string | null;
  customerNotes: string | null;
}

export interface OrderStatusLabels {
  orderLabel: string;
  stagePending: string;
  stageAccepted: string;
  stagePaid: string;
  stagePreparing: string;
  stageReady: string;
  stageCompleted: string;
  pendingTitle: string;
  pendingDescription: string;
  placedAtLabel: string;
  autoRefreshNote: string;
  callRestaurantLabel: string;
  acceptedOnlineText: string;
  payButtonLabel: string;
  paymentEmailNote: string;
  acceptedOfflineText: string;
  paidText: string;
  etaLabel: string;
  readyDelivery: string;
  readyPickup: string;
  readyDineIn: string;
  completedText: string;
  rejectedTitle: string;
  cancelledTitle: string;
  notChargedNote: string;
  summaryTitle: string;
  notesLabel: string;
  subtotalLabel: string;
  shippingLabel: string;
  totalLabel: string;
  paymentMethodLabel: string;
  paymentOnline: string;
  paymentCash: string;
  paymentCardOnSite: string;
  fulfillmentDelivery: string;
  fulfillmentPickup: string;
  fulfillmentPickupAt: string;
  fulfillmentDineIn: string;
}

const DEFAULT_LABELS: OrderStatusLabels = {
  orderLabel: "Zamówienie",
  stagePending: "Otrzymane",
  stageAccepted: "Przyjęte",
  stagePaid: "Opłacone",
  stagePreparing: "W przygotowaniu",
  stageReady: "Gotowe",
  stageCompleted: "Zakończone",
  pendingTitle: "Czekamy na potwierdzenie restauracji",
  pendingDescription:
    "Twoje zamówienie dotarło do restauracji. Zwykle potwierdzenie zajmuje kilka minut.",
  placedAtLabel: "Złożone o",
  autoRefreshNote: "Ta strona odświeża się automatycznie.",
  callRestaurantLabel: "Zadzwoń do restauracji",
  acceptedOnlineText:
    "Zamówienie przyjęte. Aby przejść do przygotowania, opłać je poniżej.",
  payButtonLabel: "Zapłać",
  paymentEmailNote: "Link do płatności został też wysłany na Twój e-mail.",
  acceptedOfflineText:
    "Restauracja przyjęła Twoje zamówienie i zaraz zacznie je przygotowywać.",
  paidText: "Otrzymaliśmy płatność. Restauracja ustala czas przygotowania.",
  etaLabel: "Szacowany czas gotowości",
  readyDelivery: "Zamówienie właśnie wyrusza w drogę.",
  readyPickup: "Zamówienie czeka na odbiór.",
  readyDineIn: "Zamówienie trafia na Twój stolik.",
  completedText: "Dziękujemy za zamówienie! Zapraszamy ponownie.",
  rejectedTitle: "Zamówienie odrzucone",
  cancelledTitle: "Zamówienie anulowane",
  notChargedNote: "Płatność nie została pobrana.",
  summaryTitle: "Podsumowanie",
  notesLabel: "Uwagi",
  subtotalLabel: "Wartość zamówienia",
  shippingLabel: "Dostawa",
  totalLabel: "Razem",
  paymentMethodLabel: "Płatność",
  paymentOnline: "Online (BLIK / karta)",
  paymentCash: "Gotówka przy odbiorze",
  paymentCardOnSite: "Karta przy odbiorze",
  fulfillmentDelivery: "Dostawa pod wskazany adres",
  fulfillmentPickup: "Odbiór osobisty",
  fulfillmentPickupAt: "Odbiór osobisty:",
  fulfillmentDineIn: "W lokalu — stolik",
};

interface Props {
  orderToken: string;
  initialOrder: OrderData;
  initialItems: OrderItem[];
  /** Restaurant phone number — shown while the order waits for acceptance. */
  restaurantPhone?: string;
  labels?: Partial<OrderStatusLabels>;
}

function formatPrice(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency === "PLN" ? "zł" : currency}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export function OrderStatusContent({
  orderToken,
  initialOrder,
  initialItems,
  restaurantPhone,
  labels: labelOverrides,
}: Props) {
  const [order, setOrder] = useState<OrderData>(initialOrder);
  const [items] = useState<OrderItem[]>(initialItems);
  const L: OrderStatusLabels = { ...DEFAULT_LABELS, ...labelOverrides };

  useEffect(() => {
    let cancelled = false;
    const finalStates = new Set<OrderStatus>(["completed", "rejected", "cancelled"]);
    const tick = async () => {
      if (cancelled) return;
      if (finalStates.has(order.status)) return;
      try {
        // Merge current query params so the ?business= dev override reaches the API
        const params = new URLSearchParams(window.location.search);
        params.set("token", orderToken);
        const res = await fetch(`/api/order/status?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.order) setOrder(data.order);
        }
      } catch {}
    };
    const id = window.setInterval(tick, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderToken, order.status]);

  const isOnlinePayment = order.paymentMethod === "online";
  const isRejected = order.status === "rejected" || order.status === "cancelled";
  const isPending = order.status === "pending";

  // Offline payments skip the "paid" stage entirely.
  const stages: { key: OrderStatus; label: string; icon: typeof Clock }[] = [
    { key: "pending", label: L.stagePending, icon: Clock },
    { key: "accepted", label: L.stageAccepted, icon: CheckCircle2 },
    ...(isOnlinePayment ? [{ key: "paid" as OrderStatus, label: L.stagePaid, icon: CreditCard }] : []),
    { key: "preparing", label: L.stagePreparing, icon: ChefHat },
    { key: "ready", label: L.stageReady, icon: PackageCheck },
    { key: "completed", label: L.stageCompleted, icon: Utensils },
  ];

  const statusOrder: OrderStatus[] = ["pending", "accepted", "paid", "preparing", "ready", "completed"];
  const statusRank = statusOrder.indexOf(order.status);
  const activeIdx = stages.reduce(
    (acc, stage, idx) => (statusOrder.indexOf(stage.key) <= statusRank ? idx : acc),
    0
  );

  const fulfillmentText = (() => {
    switch (order.fulfillmentType) {
      case "delivery":
        return L.fulfillmentDelivery;
      case "pickup":
        return order.pickupTime
          ? `${L.fulfillmentPickupAt} ${new Date(order.pickupTime).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}`
          : L.fulfillmentPickup;
      case "dine_in":
        return `${L.fulfillmentDineIn} ${order.tableNumber ?? "—"}`;
      default:
        return "";
    }
  })();

  const paymentMethodText = (() => {
    switch (order.paymentMethod) {
      case "online": return L.paymentOnline;
      case "cash": return L.paymentCash;
      case "card_on_site": return L.paymentCardOnSite;
      default: return null;
    }
  })();

  const telHref = restaurantPhone ? `tel:${restaurantPhone.replace(/\s+/g, "")}` : null;

  return (
    <div className="container mx-auto py-spacing-2xl max-w-3xl px-spacing-md">
      {/* Header */}
      <div className="mb-spacing-xl text-center sm:text-left">
        <p className="text-sm uppercase tracking-widest text-foreground/60">{L.orderLabel}</p>
        <h1 className="text-3xl lg:text-4xl font-heading font-semibold text-foreground mt-spacing-xs">
          {order.orderNumber}
        </h1>
        <p className="text-foreground/70 mt-spacing-xs">{fulfillmentText}</p>
      </div>

      {/* Pending hero — the state the customer stares at the longest */}
      {isPending && (
        <Card className="mb-spacing-lg border-primary/40">
          <CardContent className="flex flex-col items-center py-spacing-xl text-center">
            <span className="relative mb-spacing-md inline-flex h-16 w-16 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" />
              <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary">
                <Clock className="h-7 w-7" aria-hidden="true" />
              </span>
            </span>
            <h2 className="text-2xl font-heading font-semibold text-foreground">
              {L.pendingTitle}
            </h2>
            <p className="mt-spacing-sm max-w-md text-foreground/70">{L.pendingDescription}</p>
            <p className="mt-spacing-sm text-sm text-foreground/60">
              {L.placedAtLabel} <strong className="text-foreground">{formatTime(order.createdAt)}</strong>
            </p>
            <p className="mt-spacing-xs flex items-center gap-spacing-xs text-xs text-foreground/50">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
              {L.autoRefreshNote}
            </p>
            {telHref && (
              <Button asChild variant="outline" className="mt-spacing-md">
                <a href={telHref}>
                  <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                  {L.callRestaurantLabel}
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress tramline */}
      {!isRejected && (
        <div className="mb-spacing-xl">
          <div className="flex items-start">
            {stages.map((stage, idx) => {
              const done = idx <= activeIdx;
              const current = idx === activeIdx;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="flex-1 flex flex-col items-center relative">
                  {idx > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-5 right-1/2 h-px w-full -translate-y-1/2",
                        done ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center h-10 w-10 rounded-full border transition-colors bg-background",
                      done ? "border-primary bg-primary text-on-primary" : "border-border text-foreground/40",
                      current && !isPending && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      current && isPending && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background animate-pulse"
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span
                    className={cn(
                      "mt-spacing-xs text-[10px] sm:text-xs text-center leading-tight",
                      done ? "text-foreground font-medium" : "text-foreground/50"
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status detail card (non-pending states) */}
      {!isPending && (
        <Card className="mb-spacing-lg">
          <CardContent className="space-y-spacing-md py-spacing-lg">
            {order.status === "accepted" && isOnlinePayment && order.paymentLinkUrl && (
              <>
                <p className="text-foreground/80">{L.acceptedOnlineText}</p>
                <Button asChild size="lg" className="w-full">
                  <a href={order.paymentLinkUrl}>
                    <CreditCard className="mr-2 h-5 w-5" aria-hidden="true" />
                    {L.payButtonLabel} {formatPrice(order.total, order.currency)}
                  </a>
                </Button>
                <p className="text-xs text-foreground/60">{L.paymentEmailNote}</p>
              </>
            )}

            {order.status === "accepted" && !isOnlinePayment && (
              <div className="flex items-start gap-spacing-sm">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-foreground/80">{L.acceptedOfflineText}</p>
                  {paymentMethodText && (
                    <p className="text-sm text-foreground/60 mt-spacing-xs">
                      {L.paymentMethodLabel}: {paymentMethodText}
                    </p>
                  )}
                </div>
              </div>
            )}

            {order.status === "paid" && <p className="text-foreground/80">{L.paidText}</p>}

            {order.status === "preparing" && (
              <>
                <div className="flex items-center gap-spacing-sm text-primary">
                  <ChefHat className="h-6 w-6" aria-hidden="true" />
                  <span className="text-xl font-heading font-semibold">{L.stagePreparing}</span>
                </div>
                {order.estimatedReadyAt && (
                  <p className="text-lg">
                    {L.etaLabel}:{" "}
                    <strong className="text-primary">{formatTime(order.estimatedReadyAt)}</strong>
                  </p>
                )}
              </>
            )}

            {order.status === "ready" && (
              <>
                <div className="flex items-center gap-spacing-sm text-primary">
                  <PackageCheck className="h-6 w-6" aria-hidden="true" />
                  <span className="text-xl font-heading font-semibold">{L.stageReady}!</span>
                </div>
                <p className="text-foreground/80">
                  {order.fulfillmentType === "delivery"
                    ? L.readyDelivery
                    : order.fulfillmentType === "pickup"
                    ? L.readyPickup
                    : L.readyDineIn}
                </p>
              </>
            )}

            {order.status === "completed" && (
              <p className="text-foreground/80">{L.completedText}</p>
            )}

            {isRejected && (
              <>
                <div className="flex items-center gap-spacing-sm text-destructive">
                  <XCircle className="h-6 w-6" aria-hidden="true" />
                  <span className="text-xl font-heading font-semibold">
                    {order.status === "rejected" ? L.rejectedTitle : L.cancelledTitle}
                  </span>
                </div>
                {order.notes && <p className="text-foreground/80">{order.notes}</p>}
                {isOnlinePayment && (
                  <p className="text-foreground/60 text-sm">{L.notChargedNote}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items summary */}
      <Card>
        <CardHeader>
          <CardTitle>{L.summaryTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-spacing-sm">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-spacing-sm py-spacing-xs border-b border-border/60 last:border-0"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-12 h-12 rounded-radius object-cover"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.customizationLabels && (
                    <p className="text-xs text-foreground/60">
                      {Object.entries(item.customizationLabels).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-sm text-foreground/70">{item.quantity}×</span>
                <span className="text-sm font-medium">{formatPrice(item.total, order.currency)}</span>
              </div>
            ))}
            {order.customerNotes && (
              <div className="text-sm text-foreground/70 italic">
                {L.notesLabel}: {order.customerNotes}
              </div>
            )}
            <div className="space-y-spacing-xs pt-spacing-sm">
              {order.shippingCost > 0 && (
                <>
                  <div className="flex justify-between text-sm text-foreground/70">
                    <span>{L.subtotalLabel}</span>
                    <span>{formatPrice(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-foreground/70">
                    <span>{L.shippingLabel}</span>
                    <span>{formatPrice(order.shippingCost, order.currency)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-semibold">
                <span>{L.totalLabel}</span>
                <span className="text-primary">{formatPrice(order.total, order.currency)}</span>
              </div>
              {paymentMethodText && (
                <div className="flex justify-between text-sm text-foreground/60 pt-spacing-xs border-t border-border/60">
                  <span>{L.paymentMethodLabel}</span>
                  <span className="flex items-center gap-spacing-xs">
                    {order.paymentMethod === "cash" ? (
                      <Banknote className="h-4 w-4" aria-hidden="true" />
                    ) : order.paymentMethod === "card_on_site" ? (
                      <CreditCard className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Smartphone className="h-4 w-4" aria-hidden="true" />
                    )}
                    {paymentMethodText}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
