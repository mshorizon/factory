"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, CreditCard, XCircle, ChefHat, PackageCheck, Utensils } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";

type OrderStatus =
  | "pending" | "accepted" | "paid" | "preparing" | "ready" | "completed" | "rejected" | "cancelled";

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

interface Props {
  orderToken: string;
  initialOrder: OrderData;
  initialItems: OrderItem[];
}

function formatPrice(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency === "PLN" ? "zł" : currency}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function fulfillmentText(o: OrderData): string {
  switch (o.fulfillmentType) {
    case "delivery": return "Dostawa pod wskazany adres";
    case "pickup": return o.pickupTime
      ? `Odbiór osobisty na ${new Date(o.pickupTime).toLocaleString("pl-PL")}`
      : "Odbiór osobisty";
    case "dine_in": return `W lokalu — stolik ${o.tableNumber ?? "—"}`;
    default: return "";
  }
}

const STAGES: { key: OrderStatus; label: string; icon: any }[] = [
  { key: "pending", label: "Otrzymane", icon: Clock },
  { key: "accepted", label: "Zaakceptowane", icon: CreditCard },
  { key: "paid", label: "Opłacone", icon: CheckCircle2 },
  { key: "preparing", label: "W przygotowaniu", icon: ChefHat },
  { key: "ready", label: "Gotowe", icon: PackageCheck },
  { key: "completed", label: "Zakończone", icon: Utensils },
];

function stageIndex(status: OrderStatus): number {
  const i = STAGES.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

export function OrderStatusContent({ orderToken, initialOrder, initialItems }: Props) {
  const [order, setOrder] = useState<OrderData>(initialOrder);
  const [items] = useState<OrderItem[]>(initialItems);

  useEffect(() => {
    let cancelled = false;
    const finalStates = new Set<OrderStatus>(["completed", "rejected", "cancelled"]);
    const tick = async () => {
      if (cancelled) return;
      if (finalStates.has(order.status)) return;
      try {
        const res = await fetch(`/api/order/status?token=${encodeURIComponent(orderToken)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.order) setOrder(data.order);
        }
      } catch {}
    };
    const id = window.setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderToken, order.status]);

  const isRejected = order.status === "rejected" || order.status === "cancelled";
  const activeIdx = stageIndex(order.status);

  return (
    <div className="container mx-auto py-spacing-2xl max-w-3xl">
      <div className="mb-spacing-2xl">
        <p className="text-sm text-foreground/60">Zamówienie</p>
        <h1 className="text-3xl font-heading font-semibold text-foreground">{order.orderNumber}</h1>
        <p className="text-foreground/70 mt-spacing-xs">{fulfillmentText(order)}</p>
      </div>

      {/* Progress bar */}
      {!isRejected && (
        <div className="mb-spacing-2xl">
          <div className="flex items-center justify-between gap-spacing-xs">
            {STAGES.map((stage, idx) => {
              const done = idx <= activeIdx;
              const current = idx === activeIdx;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="flex-1 flex flex-col items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-full border transition-colors",
                      done ? "border-primary bg-primary text-on-primary" : "border-border text-foreground/40",
                      current && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "mt-spacing-xs text-[10px] sm:text-xs text-center",
                      done ? "text-foreground" : "text-foreground/50"
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

      {/* Status card */}
      <Card className="mb-spacing-lg">
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-spacing-md">
          {order.status === "pending" && (
            <p className="text-foreground/80">
              Otrzymaliśmy Twoje zamówienie. Restauracja właśnie sprawdza, czy może je przyjąć — daj im chwilę.
            </p>
          )}

          {order.status === "accepted" && order.paymentLinkUrl && (
            <>
              <p className="text-foreground/80">
                Zamówienie zaakceptowane. Aby przejść do przygotowania, opłać je poniżej.
              </p>
              <Button asChild size="lg" className="w-full">
                <a href={order.paymentLinkUrl}>Zapłać {formatPrice(order.total, order.currency)}</a>
              </Button>
              <p className="text-xs text-foreground/60">
                Link został też wysłany na Twojego maila.
              </p>
            </>
          )}

          {order.status === "paid" && (
            <p className="text-foreground/80">
              Otrzymaliśmy płatność. Restauracja właśnie ustala czas przygotowania.
            </p>
          )}

          {order.status === "preparing" && (
            <>
              <div className="flex items-center gap-spacing-sm text-primary">
                <ChefHat className="h-6 w-6" />
                <span className="text-xl font-semibold">W przygotowaniu</span>
              </div>
              {order.estimatedReadyAt && (
                <p className="text-lg">
                  Szacowany czas gotowości:{" "}
                  <strong className="text-primary">{formatTime(order.estimatedReadyAt)}</strong>
                </p>
              )}
            </>
          )}

          {order.status === "ready" && (
            <>
              <div className="flex items-center gap-spacing-sm text-primary">
                <PackageCheck className="h-6 w-6" />
                <span className="text-xl font-semibold">Gotowe!</span>
              </div>
              <p className="text-foreground/80">
                {order.fulfillmentType === "delivery"
                  ? "Zamówienie właśnie wyrusza w drogę."
                  : order.fulfillmentType === "pickup"
                  ? "Zamówienie czeka na odbiór."
                  : "Zamówienie trafia na Twój stolik."}
              </p>
            </>
          )}

          {order.status === "completed" && (
            <p className="text-foreground/80">Dziękujemy za zamówienie! Zapraszamy ponownie.</p>
          )}

          {isRejected && (
            <>
              <div className="flex items-center gap-spacing-sm text-destructive">
                <XCircle className="h-6 w-6" />
                <span className="text-xl font-semibold">
                  {order.status === "rejected" ? "Zamówienie odrzucone" : "Zamówienie anulowane"}
                </span>
              </div>
              {order.notes && <p className="text-foreground/80">{order.notes}</p>}
              <p className="text-foreground/60 text-sm">Płatność nie została pobrana.</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-spacing-sm">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-spacing-sm py-spacing-xs border-b border-border last:border-0">
                {item.image && (
                  <img src={item.image} alt={item.title} className="w-12 h-12 rounded-radius object-cover" />
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
              <div className="mt-spacing-sm text-sm text-foreground/70 italic">
                Uwagi: {order.customerNotes}
              </div>
            )}
            <div className="flex justify-between pt-spacing-sm text-base font-semibold">
              <span>Razem</span>
              <span className="text-primary">{formatPrice(order.total, order.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
