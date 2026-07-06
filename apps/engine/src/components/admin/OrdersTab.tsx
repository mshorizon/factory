import React, { useEffect, useState, useCallback, useRef } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package,
  Eye,
  ArrowLeft,
  Truck,
  XCircle,
  CreditCard,
  Clock,
  ChefHat,
  PackageCheck,
  Check,
  Copy,
  MapPin,
  Home,
  Utensils,
} from "lucide-react";
import { UniversalList } from "./UniversalList";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string | null;
  orderToken: string | null;
  fulfillmentType: string | null;
  pickupTime: string | null;
  tableNumber: string | null;
  customerNotes: string | null;
  estimatedReadyAt: string | null;
  paymentLinkUrl: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  customerEmail: string;
  customerPhone: string | null;
  customerFirstName: string;
  customerLastName: string;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  notes: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

interface OrderItem {
  id: number;
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  total: number;
  image: string | null;
  customizationLabels: Record<string, string> | null;
}

const STATUS_FILTERS = [
  { label: "Wszystkie", value: "" },
  { label: "Do akceptacji", value: "pending" },
  { label: "Oczekują płatności", value: "accepted" },
  { label: "Opłacone", value: "paid" },
  { label: "W przygotowaniu", value: "preparing" },
  { label: "Gotowe", value: "ready" },
  { label: "Zakończone", value: "completed" },
  { label: "Odrzucone/Anulowane", value: "rejected" },
];

const STATUS_BADGE: Record<string, { variant: string; label: string }> = {
  pending: { variant: "outline", label: "Do akceptacji" },
  accepted: { variant: "outline", label: "Oczekuje płatności" },
  paid: { variant: "default", label: "Opłacone" },
  preparing: { variant: "default", label: "W przygotowaniu" },
  ready: { variant: "default", label: "Gotowe" },
  completed: { variant: "secondary", label: "Zakończone" },
  shipped: { variant: "secondary", label: "Wysłane" },
  rejected: { variant: "destructive", label: "Odrzucone" },
  cancelled: { variant: "destructive", label: "Anulowane" },
};

const FULFILLMENT_LABEL: Record<string, { label: string; icon: any }> = {
  delivery: { label: "Dostawa", icon: Home },
  pickup: { label: "Odbiór", icon: MapPin },
  dine_in: { label: "W lokalu", icon: Utensils },
};

const PAYMENT_LABEL: Record<string, string> = {
  online: "Online (Stripe)",
  cash: "Gotówka przy odbiorze",
  card_on_site: "Karta przy odbiorze",
};

function isOfflinePayment(order: Order): boolean {
  return !!order.paymentMethod && order.paymentMethod !== "online";
}

// "accepted" means different things per payment method: online waits for the
// customer to pay, offline goes straight to preparation.
function statusBadge(order: Order): { variant: string; label: string } {
  if (order.status === "accepted" && isOfflinePayment(order)) {
    return { variant: "default", label: "Przyjęte — do przygotowania" };
  }
  return STATUS_BADGE[order.status] || STATUS_BADGE.pending;
}

function formatPrice(cents: number, currency = "PLN"): string {
  return `${(cents / 100).toFixed(2)} ${currency === "PLN" ? "zł" : currency}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

interface OrdersTabProps {
  businessId: string;
  prepTimePresets?: number[];
}

export function OrdersTab({ businessId, prepTimePresets = [15, 30, 45, 60] }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showEtaForm, setShowEtaForm] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);
  const pollingRef = useRef<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({ business: businessId });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders/list?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOrders(json.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }, [businessId, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Poll every 15s for real-time updates
  useEffect(() => {
    pollingRef.current = window.setInterval(() => {
      fetchOrders();
      if (selectedOrder) reloadSelected();
    }, 15_000);
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrders, selectedOrder?.id]);

  const reloadSelected = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`);
      const json = await res.json();
      if (res.ok) {
        setSelectedOrder(json.order);
        setOrderItems(json.items || []);
      }
    } catch {}
  };

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    setShowRejectForm(false);
    setShowEtaForm(false);
    setRejectReason("");
    setEtaMinutes("");
    setLinkCopied(false);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`);
      const json = await res.json();
      if (res.ok) setOrderItems(json.items || []);
    } catch {} finally {
      setDetailLoading(false);
    }
  };

  const callAction = async (endpoint: string, body: Record<string, unknown>) => {
    setActionBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Błąd akcji");
      if (json.order) setSelectedOrder(json.order);
      await fetchOrders();
      return json;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nieznany błąd");
      return null;
    } finally {
      setActionBusy(false);
    }
  };

  const acceptOrder = async (orderId: number) => {
    await callAction("/api/admin/orders/accept", { orderId });
  };

  const rejectOrder = async (orderId: number) => {
    await callAction("/api/admin/orders/reject", { orderId, reason: rejectReason || undefined });
    setShowRejectForm(false);
    setRejectReason("");
  };

  const setEta = async (orderId: number, minutes: number) => {
    if (!minutes || minutes < 1) return;
    await callAction("/api/admin/orders/set-eta", { orderId, minutes });
    setShowEtaForm(false);
    setEtaMinutes("");
  };

  const markReady = async (orderId: number) => {
    await callAction("/api/admin/orders/mark-ready", { orderId });
  };

  const markCompleted = async (orderId: number) => {
    await callAction("/api/admin/orders/mark-completed", { orderId });
  };

  // Detail view
  if (selectedOrder) {
    const badge = statusBadge(selectedOrder);
    const offlinePayment = isOfflinePayment(selectedOrder);
    const fulfillment = selectedOrder.fulfillmentType
      ? FULFILLMENT_LABEL[selectedOrder.fulfillmentType]
      : undefined;
    const FulfillmentIcon = fulfillment?.icon ?? Package;

    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do listy
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Zamówienie {selectedOrder.orderNumber}</h2>
            <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.createdAt)}</p>
          </div>
          <Badge variant={badge.variant as any}>{badge.label}</Badge>
        </div>

        {/* Fulfillment */}
        {fulfillment && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Sposób realizacji</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 text-sm">
              <div className="flex items-center gap-2">
                <FulfillmentIcon className="h-4 w-4" />
                <span className="font-medium">{fulfillment.label}</span>
              </div>
              {selectedOrder.fulfillmentType === "pickup" && selectedOrder.pickupTime && (
                <p className="mt-1 text-muted-foreground">
                  Godzina odbioru: {new Date(selectedOrder.pickupTime).toLocaleString("pl-PL")}
                </p>
              )}
              {selectedOrder.fulfillmentType === "dine_in" && selectedOrder.tableNumber && (
                <p className="mt-1 text-muted-foreground">Stolik: {selectedOrder.tableNumber}</p>
              )}
              {selectedOrder.estimatedReadyAt && (
                <p className="mt-1 text-muted-foreground">
                  Szacowana gotowość: <strong>{formatTime(selectedOrder.estimatedReadyAt)}</strong>
                </p>
              )}
              {selectedOrder.paymentMethod && (
                <p className="mt-1 text-muted-foreground">
                  Płatność: <strong>{PAYMENT_LABEL[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Customer */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Klient</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 text-sm space-y-1">
              <p className="font-medium">{selectedOrder.customerFirstName} {selectedOrder.customerLastName}</p>
              <p className="text-muted-foreground">{selectedOrder.customerEmail}</p>
              {selectedOrder.customerPhone && <p className="text-muted-foreground">{selectedOrder.customerPhone}</p>}
            </CardContent>
          </Card>

          {/* Address (delivery only) */}
          {selectedOrder.fulfillmentType === "delivery" && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-medium">Adres dostawy</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 text-sm space-y-1">
                <p>{selectedOrder.shippingAddress}</p>
                <p>{selectedOrder.shippingPostalCode} {selectedOrder.shippingCity}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Customer notes */}
        {selectedOrder.customerNotes && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Uwagi klienta</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 text-sm italic text-muted-foreground">
              {selectedOrder.customerNotes}
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium">Produkty</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {detailLoading ? (
              <p className="text-sm text-muted-foreground py-4">Ładowanie...</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.customizationLabels && (
                        <p className="text-xs text-muted-foreground">
                          {Object.entries(item.customizationLabels).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{item.quantity}x</span>
                    <span className="text-sm font-medium tabular-nums">{formatPrice(item.total, selectedOrder.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-semibold">
                  <span>Razem</span>
                  <span>{formatPrice(selectedOrder.total, selectedOrder.currency)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment link (after accept) */}
        {selectedOrder.status === "accepted" && selectedOrder.paymentLinkUrl && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Link do płatności</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 flex items-center gap-2">
              <Input readOnly value={selectedOrder.paymentLinkUrl} className="text-xs" />
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(selectedOrder.paymentLinkUrl!);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 1500);
                  } catch {}
                }}
              >
                {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium">Akcje</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            {selectedOrder.status === "pending" && !showRejectForm && (
              <div className="flex gap-2">
                <Button size="sm" disabled={actionBusy} onClick={() => acceptOrder(selectedOrder.id)}>
                  <Check className="mr-2 h-3.5 w-3.5" />
                  {offlinePayment ? "Akceptuj zamówienie" : "Akceptuj (wyślij link do płatności)"}
                </Button>
                <Button size="sm" variant="destructive" disabled={actionBusy} onClick={() => setShowRejectForm(true)}>
                  <XCircle className="mr-2 h-3.5 w-3.5" /> Odrzuć
                </Button>
              </div>
            )}

            {selectedOrder.status === "pending" && showRejectForm && (
              <div className="space-y-2">
                <Input
                  placeholder="Powód (opcjonalnie, widoczny dla klienta)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" disabled={actionBusy} onClick={() => rejectOrder(selectedOrder.id)}>
                    Potwierdź odrzucenie
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>
                    Anuluj
                  </Button>
                </div>
              </div>
            )}

            {selectedOrder.status === "accepted" && !offlinePayment && (
              <>
                <p className="text-sm text-muted-foreground">Czekamy aż klient opłaci zamówienie.</p>
                <Button size="sm" variant="destructive" disabled={actionBusy} onClick={() => callAction("/api/admin/orders/reject", { orderId: selectedOrder.id, reason: "Anulowane" })}>
                  <XCircle className="mr-2 h-3.5 w-3.5" /> Anuluj
                </Button>
              </>
            )}

            {selectedOrder.status === "accepted" && offlinePayment && !showEtaForm && (
              <>
                <p className="text-sm">Zamówienie przyjęte (płatność przy odbiorze) — ustaw czas przygotowania:</p>
                <div className="flex flex-wrap gap-2">
                  {prepTimePresets.map((m) => (
                    <Button key={m} size="sm" disabled={actionBusy} onClick={() => setEta(selectedOrder.id, m)}>
                      {m} min
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setShowEtaForm(true)}>
                    Inny...
                  </Button>
                </div>
              </>
            )}

            {selectedOrder.status === "accepted" && offlinePayment && showEtaForm && (
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Minuty"
                  value={etaMinutes}
                  onChange={(e) => setEtaMinutes(e.target.value)}
                  className="w-24"
                />
                <Button size="sm" disabled={actionBusy} onClick={() => setEta(selectedOrder.id, parseInt(etaMinutes, 10))}>
                  Ustaw
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowEtaForm(false)}>
                  Anuluj
                </Button>
              </div>
            )}

            {selectedOrder.status === "paid" && !showEtaForm && (
              <>
                <p className="text-sm">Klient zapłacił — ustaw czas przygotowania:</p>
                <div className="flex flex-wrap gap-2">
                  {prepTimePresets.map((m) => (
                    <Button key={m} size="sm" disabled={actionBusy} onClick={() => setEta(selectedOrder.id, m)}>
                      {m} min
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setShowEtaForm(true)}>
                    Inny...
                  </Button>
                </div>
              </>
            )}

            {selectedOrder.status === "paid" && showEtaForm && (
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Minuty"
                  value={etaMinutes}
                  onChange={(e) => setEtaMinutes(e.target.value)}
                  className="w-24"
                />
                <Button size="sm" disabled={actionBusy} onClick={() => setEta(selectedOrder.id, parseInt(etaMinutes, 10))}>
                  Ustaw
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowEtaForm(false)}>
                  Anuluj
                </Button>
              </div>
            )}

            {selectedOrder.status === "preparing" && (
              <div className="flex gap-2 flex-wrap items-center">
                <p className="text-sm">
                  Gotowe do: <strong>{formatTime(selectedOrder.estimatedReadyAt)}</strong>
                </p>
                <Button size="sm" disabled={actionBusy} onClick={() => markReady(selectedOrder.id)}>
                  <PackageCheck className="mr-2 h-3.5 w-3.5" /> Oznacz jako gotowe
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowEtaForm(true)}>
                  Zmień czas
                </Button>
              </div>
            )}

            {selectedOrder.status === "preparing" && showEtaForm && (
              <div className="flex gap-2 items-center flex-wrap">
                {prepTimePresets.map((m) => (
                  <Button key={m} size="sm" variant="outline" disabled={actionBusy} onClick={() => setEta(selectedOrder.id, m)}>
                    +{m} min
                  </Button>
                ))}
              </div>
            )}

            {selectedOrder.status === "ready" && (
              <Button size="sm" disabled={actionBusy} onClick={() => markCompleted(selectedOrder.id)}>
                <Utensils className="mr-2 h-3.5 w-3.5" /> Oznacz jako zakończone
              </Button>
            )}

            {(selectedOrder.status === "completed" ||
              selectedOrder.status === "rejected" ||
              selectedOrder.status === "cancelled" ||
              selectedOrder.status === "shipped") && (
              <p className="text-sm text-muted-foreground">Brak dostępnych akcji</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  const columns: ColumnDef<Order, unknown>[] = [
    {
      accessorKey: "orderNumber",
      header: "Nr zamówienia",
      cell: ({ row }) => (
        <span className="font-medium font-mono text-xs">{row.original.orderNumber}</span>
      ),
    },
    {
      id: "customer",
      header: "Klient",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.customerFirstName} {row.original.customerLastName}
          </div>
          <div className="text-xs text-muted-foreground">{row.original.customerEmail}</div>
        </div>
      ),
    },
    {
      id: "fulfillment",
      header: "Typ",
      cell: ({ row }) => {
        const ft = row.original.fulfillmentType;
        if (!ft) return <span className="text-xs text-muted-foreground">—</span>;
        const f = FULFILLMENT_LABEL[ft];
        if (!f) return <span className="text-xs">{ft}</span>;
        const Icon = f.icon;
        return (
          <div className="flex items-center gap-1 text-xs">
            <Icon className="h-3 w-3" />
            {f.label}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const badge = statusBadge(row.original);
        return <Badge variant={badge.variant as any} className="text-xs">{badge.label}</Badge>;
      },
    },
    {
      accessorKey: "total",
      header: "Kwota",
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">
          {formatPrice(row.original.total, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];

  return (
    <UniversalList<Order>
      title="Zamówienia"
      subtitle={`${orders.length} zamówień · auto-odświeżanie co 15s`}
      data={orders}
      columns={columns}
      loading={loading}
      loadingLabel="Ładowanie..."
      error={error}
      emptyIcon={Package}
      emptyTitle="Brak zamówień"
      getRowId={(row) => row.id}
      toolbarExtras={
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      }
      rowActions={[
        {
          label: "View",
          icon: Eye,
          iconOnly: true,
          onClick: (order) => viewOrder(order),
        },
      ]}
    />
  );
}
