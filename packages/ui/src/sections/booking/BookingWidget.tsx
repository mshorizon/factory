"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, User, CheckCircle, ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { Badge } from "../../atoms/Badge";

export interface BookingService {
  id: string;
  name: string;
  duration: number;
  price?: number;
  description?: string;
}

export interface BookingDayHours {
  enabled?: boolean;
  open: string;
  close: string;
}

export interface BookingConfig {
  enabled?: boolean;
  services?: BookingService[];
  hours?: {
    mon?: BookingDayHours;
    tue?: BookingDayHours;
    wed?: BookingDayHours;
    thu?: BookingDayHours;
    fri?: BookingDayHours;
    sat?: BookingDayHours;
    sun?: BookingDayHours;
  };
  slotInterval?: number;
  leadTime?: number;
  maxAdvance?: number;
}

export interface BookingWidgetProps {
  businessId: string;
  config: BookingConfig;
  header?: {
    badge?: string;
    title?: string;
    subtitle?: string;
  };
  className?: string;
}

type Step = "service" | "datetime" | "customer" | "success";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABELS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isDateAvailable(date: Date, hours: BookingConfig["hours"]): boolean {
  const dayKey = DAY_KEYS[date.getDay()];
  const dayHours = hours?.[dayKey];
  if (!dayHours) return false;
  return dayHours.enabled !== false;
}

export function BookingWidget({ businessId, config, header, className }: BookingWidgetProps) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingResult, setBookingResult] = useState<{ bookingId: number } | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const maxAdvance = config.maxAdvance ?? 30;

  // Build list of available dates
  const availableDates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < maxAdvance; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (isDateAvailable(d, config.hours)) {
      availableDates.push(toISODate(d));
    }
  }

  const fetchSlots = useCallback(async (date: string, service: BookingService) => {
    setSlotsLoading(true);
    setSlotsError("");
    setAvailableSlots([]);
    try {
      const params = new URLSearchParams({ date, serviceId: service.id });
      const res = await fetch(`/api/booking/${businessId}/availability?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd pobierania terminów");
      setAvailableSlots(data.slots || []);
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : "Błąd pobierania terminów");
    } finally {
      setSlotsLoading(false);
    }
  }, [businessId]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    if (selectedService) fetchSlots(date, selectedService);
  };

  const handleServiceSelect = (service: BookingService) => {
    setSelectedService(service);
    setSelectedDate("");
    setSelectedTime("");
    setAvailableSlots([]);
    setStep("datetime");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/booking/${businessId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedTime,
          customerName,
          customerPhone,
          customerEmail,
          notes: customerNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd rezerwacji");
      setBookingResult(data);
      setStep("success");
      (window as any).umami?.track("booking-submit");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Błąd rezerwacji");
    } finally {
      setSubmitting(false);
    }
  };

  const services = config.services ?? [];

  if (step === "success" && bookingResult) {
    return (
      <div className={cn("max-w-lg mx-auto text-center py-12 px-4", className)}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Rezerwacja przyjęta!</h2>
        <p className="text-muted mb-6">
          Dziękujemy, <strong>{customerName}</strong>! Twoja rezerwacja została złożona.<br />
          Skontaktujemy się z Tobą w celu potwierdzenia.
        </p>
        <div className="bg-card border border-border rounded-xl p-5 text-left space-y-2 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Usługa</span>
            <span className="font-medium">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Data</span>
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Godzina</span>
            <span className="font-medium">{selectedTime}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Nr rezerwacji</span>
            <span className="font-medium font-mono">#{bookingResult.bookingId}</span>
          </div>
        </div>
        <Button
          onClick={() => {
            setStep("service");
            setSelectedService(null);
            setSelectedDate("");
            setSelectedTime("");
            setCustomerName("");
            setCustomerPhone("");
            setCustomerEmail("");
            setCustomerNotes("");
            setBookingResult(null);
          }}
          variant="outline"
        >
          Zarezerwuj kolejny termin
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {/* Header */}
      {header && (header.badge || header.title || header.subtitle) && (
        <div className="text-center mb-10">
          {header.badge && (
            <Badge className="mb-3">{header.badge}</Badge>
          )}
          {header.title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{header.title}</h2>
          )}
          {header.subtitle && (
            <p className="text-muted text-lg max-w-xl mx-auto">{header.subtitle}</p>
          )}
        </div>
      )}

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[
          { key: "service", label: "Usługa", Icon: Calendar },
          { key: "datetime", label: "Termin", Icon: Clock },
          { key: "customer", label: "Dane", Icon: User },
        ].map(({ key, label, Icon }, i) => {
          const stepOrder = ["service", "datetime", "customer"];
          const currentIndex = stepOrder.indexOf(step);
          const thisIndex = i;
          const isDone = currentIndex > thisIndex;
          const isActive = currentIndex === thisIndex;

          return (
            <div key={key} className="flex items-center gap-2">
              {i > 0 && <div className={cn("h-px w-8 md:w-16 bg-border", isDone && "bg-primary")} />}
              <div className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-colors",
                isActive && "text-primary",
                isDone && "text-primary",
                !isActive && !isDone && "text-muted"
              )}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                  isActive && "border-primary bg-primary text-[var(--color-text-on-primary)]",
                  isDone && "border-primary bg-primary text-[var(--color-text-on-primary)]",
                  !isActive && !isDone && "border-border text-muted"
                )}>
                  {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="hidden sm:block">{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Service selection */}
      {step === "service" && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold mb-4">Wybierz usługę</h3>
          {services.length === 0 && (
            <p className="text-muted text-sm">Brak skonfigurowanych usług.</p>
          )}
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceSelect(service)}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 border-border bg-card",
                "hover:border-primary hover:bg-primary/5 transition-all group"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold group-hover:text-primary transition-colors">{service.name}</p>
                  {service.description && (
                    <p className="text-sm text-muted mt-1 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration} min
                    </span>
                    {service.price !== undefined && (
                      <span className="font-medium text-foreground">
                        {service.price.toLocaleString("pl-PL", { minimumFractionDigits: 0 })} zł
                      </span>
                    )}
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted rotate-180 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === "datetime" && selectedService && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => { setStep("service"); setSelectedDate(""); setSelectedTime(""); }}
              className="text-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-semibold">Wybierz termin</h3>
              <p className="text-sm text-muted">{selectedService.name} · {selectedService.duration} min</p>
            </div>
          </div>

          {/* Date grid */}
          <div className="mb-6">
            <p className="text-sm font-medium text-muted mb-3">Data</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {availableDates.slice(0, 20).map((date) => {
                const d = new Date(date + "T12:00:00");
                const dayIdx = d.getDay();
                const dayLabel = DAY_LABELS[dayIdx];
                const dayNum = d.getDate();
                const monthLabel = MONTH_NAMES[d.getMonth()].slice(0, 3);
                return (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      "py-2.5 px-1 rounded-lg border-2 text-center transition-all text-sm",
                      selectedDate === date
                        ? "border-primary bg-primary text-[var(--color-text-on-primary)] font-semibold"
                        : "border-border bg-card hover:border-primary hover:bg-primary/5"
                    )}
                  >
                    <div className="font-bold text-base">{dayNum}</div>
                    <div className="text-[11px] opacity-75">{dayLabel} {monthLabel}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <p className="text-sm font-medium text-muted mb-3">Godzina — {formatDate(selectedDate)}</p>
              {slotsLoading && (
                <div className="flex items-center gap-2 text-muted text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ładowanie dostępnych godzin...
                </div>
              )}
              {slotsError && (
                <div className="flex items-center gap-2 text-destructive text-sm py-4">
                  <AlertCircle className="w-4 h-4" />
                  {slotsError}
                </div>
              )}
              {!slotsLoading && !slotsError && availableSlots.length === 0 && (
                <p className="text-muted text-sm py-4">Brak wolnych terminów w tym dniu. Wybierz inny dzień.</p>
              )}
              {!slotsLoading && availableSlots.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        "py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                        selectedTime === slot
                          ? "border-primary bg-primary text-[var(--color-text-on-primary)]"
                          : "border-border bg-card hover:border-primary hover:bg-primary/5"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-8">
            <Button
              onClick={() => setStep("customer")}
              disabled={!selectedDate || !selectedTime}
              className="w-full sm:w-auto"
            >
              Dalej — Dane kontaktowe
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Customer info */}
      {step === "customer" && selectedService && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setStep("datetime")}
              className="text-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-semibold">Twoje dane</h3>
              <p className="text-sm text-muted">
                {selectedService.name} · {formatDate(selectedDate)} · {selectedTime}
              </p>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6 text-sm">
            <div className="grid grid-cols-2 gap-y-1.5">
              <span className="text-muted">Usługa</span>
              <span className="font-medium text-right">{selectedService.name}</span>
              <span className="text-muted">Data</span>
              <span className="font-medium text-right">{formatDate(selectedDate)}</span>
              <span className="text-muted">Godzina</span>
              <span className="font-medium text-right">{selectedTime}</span>
              {selectedService.price !== undefined && (
                <>
                  <span className="text-muted">Cena</span>
                  <span className="font-medium text-right">{selectedService.price} zł</span>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="booking-name">Imię i nazwisko *</Label>
              <Input
                id="booking-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jan Kowalski"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="booking-phone">Telefon *</Label>
              <Input
                id="booking-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+48 500 000 000"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="booking-email">Email *</Label>
              <Input
                id="booking-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="jan@example.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="booking-notes">Uwagi (opcjonalnie)</Label>
              <textarea
                id="booking-notes"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Dodatkowe informacje..."
                rows={3}
                className="mt-1 w-full px-3 py-2 text-sm bg-background border border-input rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {submitError && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rezerwuję...</>
              ) : (
                "Zarezerwuj wizytę"
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
