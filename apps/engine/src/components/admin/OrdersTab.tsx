import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Eye,
  ArrowLeft,
  Truck,
  XCircle,
  CreditCard,
  Clock,
} from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  customerEmail: string;
  customerPhone: string | null;
  customerFirstName: string;
  customerLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
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
  { label: "Oczekujące", value: "pending" },
  { label: "Opłacone", value: "paid" },
  { label: "Wysłane", value: "shipped" },
  { label: "Anulowane", value: "cancelled" },
];

const STATUS_BADGE: Record<string, { variant: string; label: string }> = {
  pending: { variant: "outline", label: "Oczekujące" },
  paid: { variant: "default", label: "Opłacone" },
  shipped: { variant: "secondary", label: "Wysłane" },
  cancelled: { variant: "destructive", label: "Anulowane" },
};

function formatPrice(cents: number, currency = "PLN"): string {
  return `${(cents / 100).toFixed(2)} ${currency === "PLN" ? "zł" : currency}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

interface OrdersTabProps {
  businessId: string;
}

export function OrdersTab({ businessId }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
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

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`);
      const json = await res.json();
      if (res.ok) setOrderItems(json.items || []);
    } catch {} finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => prev ? { ...prev, status } : null);
        }
      }
    } catch {}
  };

  // Detail view
  if (selectedOrder) {
    const badge = STATUS_BADGE[selectedOrder.status] || STATUS_BADGE.pending;
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

          {/* Shipping */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Adres dostawy</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 text-sm space-y-1">
              <p>{selectedOrder.shippingAddress}</p>
              <p>{selectedOrder.shippingPostalCode} {selectedOrder.shippingCity}</p>
            </CardContent>
          </Card>
        </div>

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

        {/* Actions */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium">Akcje</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 flex gap-2">
            {selectedOrder.status === "pending" && (
              <>
                <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "paid")}>
                  <CreditCard className="mr-2 h-3.5 w-3.5" /> Oznacz jako opłacone
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedOrder.id, "cancelled")}>
                  <XCircle className="mr-2 h-3.5 w-3.5" /> Anuluj
                </Button>
              </>
            )}
            {selectedOrder.status === "paid" && (
              <>
                <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "shipped")}>
                  <Truck className="mr-2 h-3.5 w-3.5" /> Oznacz jako wysłane
                </Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedOrder.id, "cancelled")}>
                  <XCircle className="mr-2 h-3.5 w-3.5" /> Anuluj
                </Button>
              </>
            )}
            {(selectedOrder.status === "shipped" || selectedOrder.status === "cancelled") && (
              <p className="text-sm text-muted-foreground">Brak dostępnych akcji</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Zamówienia</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{orders.length} zamówień</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1">
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

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Ładowanie...</div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {!loading && !error && (
        <Card>
          <CardContent className="pt-4 pb-2 px-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Nr zamówienia</th>
                    <th className="text-left py-2 pr-4 font-medium">Klient</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-right py-2 pr-4 font-medium">Kwota</th>
                    <th className="text-right py-2 pr-4 font-medium">Data</th>
                    <th className="text-right py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
                    return (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 pr-4 font-medium font-mono text-xs">{order.orderNumber}</td>
                        <td className="py-2.5 pr-4">
                          <div>
                            <span className="font-medium">{order.customerFirstName} {order.customerLastName}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={badge.variant as any} className="text-xs">{badge.label}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums font-medium">
                          {formatPrice(order.total, order.currency)}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-2.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => viewOrder(order)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  Brak zamówień
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
