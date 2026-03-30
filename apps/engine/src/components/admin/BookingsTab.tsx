import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Eye,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";

interface Booking {
  id: number;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

const STATUS_FILTERS = [
  { label: "Wszystkie", value: "" },
  { label: "Oczekujące", value: "pending" },
  { label: "Potwierdzone", value: "confirmed" },
  { label: "Zakończone", value: "completed" },
  { label: "Anulowane", value: "cancelled" },
];

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "outline", label: "Oczekująca" },
  confirmed: { variant: "default", label: "Potwierdzona" },
  completed: { variant: "secondary", label: "Zakończona" },
  cancelled: { variant: "destructive", label: "Anulowana" },
};

const MONTHS = [
  "sty", "lut", "mar", "kwi", "maj", "cze",
  "lip", "sie", "wrz", "paź", "lis", "gru",
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

interface BookingsTabProps {
  businessId: string;
}

export function BookingsTab({ businessId }: BookingsTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ business: businessId });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/bookings/list?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setBookings(json.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }, [businessId, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (bookingId: number, status: string) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/bookings/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      if (res.ok) {
        fetchBookings();
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking((prev) => prev ? { ...prev, status } : null);
        }
      }
    } catch {} finally {
      setUpdating(false);
    }
  };

  // Detail view
  if (selectedBooking) {
    const badge = STATUS_BADGE[selectedBooking.status] || STATUS_BADGE.pending;
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do listy
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Rezerwacja #{selectedBooking.id}</h2>
            <p className="text-xs text-muted-foreground">{formatDateTime(selectedBooking.createdAt)}</p>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Appointment */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Wizyta</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{formatDate(selectedBooking.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{selectedBooking.startTime} – {selectedBooking.endTime}</span>
              </div>
              <div className="pt-1 border-t border-border">
                <p className="font-medium">{selectedBooking.serviceName}</p>
                <p className="text-muted-foreground text-xs">{selectedBooking.serviceDuration} min</p>
              </div>
              {selectedBooking.notes && (
                <div className="pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground">{selectedBooking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Klient</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{selectedBooking.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${selectedBooking.customerPhone}`} className="text-primary hover:underline">
                  {selectedBooking.customerPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a href={`mailto:${selectedBooking.customerEmail}`} className="text-primary hover:underline truncate">
                  {selectedBooking.customerEmail}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium">Akcje</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 flex flex-wrap gap-2">
            {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!updating && (
              <>
                {selectedBooking.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedBooking.id, "confirmed")}>
                      <CheckCircle className="mr-2 h-3.5 w-3.5" /> Potwierdź
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedBooking.id, "cancelled")}>
                      <XCircle className="mr-2 h-3.5 w-3.5" /> Anuluj
                    </Button>
                  </>
                )}
                {selectedBooking.status === "confirmed" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedBooking.id, "completed")}>
                      <CheckCircle className="mr-2 h-3.5 w-3.5" /> Zakończ wizytę
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedBooking.id, "cancelled")}>
                      <XCircle className="mr-2 h-3.5 w-3.5" /> Anuluj
                    </Button>
                  </>
                )}
                {(selectedBooking.status === "completed" || selectedBooking.status === "cancelled") && (
                  <p className="text-sm text-muted-foreground">Brak dostępnych akcji</p>
                )}
              </>
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
          <h2 className="text-base font-semibold">Rezerwacje</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{bookings.length} rezerwacji</p>
        </div>
      </div>

      {/* Status filter */}
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

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Ładowanie...
        </div>
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
                    <th className="text-left py-2 pr-4 font-medium">Data i godzina</th>
                    <th className="text-left py-2 pr-4 font-medium">Usługa</th>
                    <th className="text-left py-2 pr-4 font-medium">Klient</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-right py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const badge = STATUS_BADGE[booking.status] || STATUS_BADGE.pending;
                    return (
                      <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 pr-4">
                          <p className="font-medium">{formatDate(booking.date)}</p>
                          <p className="text-xs text-muted-foreground">{booking.startTime} – {booking.endTime}</p>
                        </td>
                        <td className="py-2.5 pr-4">
                          <p className="font-medium">{booking.serviceName}</p>
                          <p className="text-xs text-muted-foreground">{booking.serviceDuration} min</p>
                        </td>
                        <td className="py-2.5 pr-4">
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-xs text-muted-foreground">{booking.customerPhone}</p>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => setSelectedBooking(booking)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  Brak rezerwacji
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
