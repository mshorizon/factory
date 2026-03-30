# System Rezerwacji (Booking) — Plan Wdrożenia

## Status: MVP zaimplementowany ✅

---

## Faza 1 — Schema i dane ✅

- [x] Dodano do `business.schema.json`:
  - `booking.enabled` (boolean)
  - `booking.services[]` — `id`, `name`, `duration` (min), `price`, `description`
  - `booking.hours` — godziny pracy per dzień tygodnia
  - `booking.slotInterval` — co ile minut generować sloty
  - `booking.leadTime` — min. wyprzedzenie rezerwacji (min)
  - `booking.maxAdvance` — max. wyprzedzenie (dni)
- [x] Dodano definicję `bookingDayHours` do definicji schematu
- [x] Dodano `"booking"` do enum typów sekcji
- [x] Uruchomiono `pnpm generate` w `packages/schema`
- [x] Dodano model `Booking` do bazy danych (Drizzle):
  ```
  id, siteId, serviceId, serviceName, serviceDuration,
  staffId, staffName, customerName, customerPhone, customerEmail,
  date, startTime, endTime,
  status (pending | confirmed | cancelled | completed),
  notes, confirmToken, cancelToken, createdAt, updatedAt
  ```
- [x] `db:push` — tabela `bookings` utworzona w bazie

---

## Faza 2 — API (backend) ✅

- [x] `GET  /api/booking/[businessId]/availability` — zwraca wolne sloty dla podanego dnia/usługi
  - Parametry: `date`, `serviceId`
  - Logika: godziny pracy − istniejące rezerwacje − bufor leadTime
- [x] `POST /api/booking/[businessId]/reserve` — tworzy rezerwację
  - Walidacja: slot wolny, dane klienta, wyprzedzenie
  - Zwraca: `bookingId`, `success`
- [x] `GET  /api/admin/bookings/list` — lista rezerwacji dla właściciela
- [x] `POST /api/admin/bookings/update-status` — zmiana statusu przez właściciela

Pozostałe do zrobienia:
- [ ] `GET  /api/booking/confirm/[bookingId]` — potwierdzenie przez klienta (link z emaila)
- [ ] `POST /api/booking/cancel/[bookingId]` — anulowanie przez klienta

---

## Faza 3 — Powiadomienia email

- [ ] Email do klienta po rezerwacji (potwierdzenie z linkiem confirm/cancel)
- [ ] Email do właściciela biznesu o nowej rezerwacji
- [ ] Email potwierdzający po confirm
- [ ] Email z przypomnieniem (24h przed wizytą) — cron job
- [ ] Email po anulowaniu

---

## Faza 4 — UI klienta (BookingWidget) ✅

- [x] `BookingWidget` — główny wrapper (`packages/ui/src/sections/booking/BookingWidget.tsx`)
- [x] Krok 1: Wybór usługi — karty z nazwą, czasem trwania, ceną
- [x] Krok 2: Wybór daty i godziny
  - Siatka dat (do 20 dni do przodu)
  - Siatka slotów godzinowych pobierana z API
- [x] Krok 3: Dane klienta — imię, telefon, email, opcjonalna notatka
- [x] Krok 4 (połączone): Podsumowanie + przycisk "Zarezerwuj wizytę"
- [x] Ekran sukcesu — info o rezerwacji
- [x] Stan ładowania i obsługa błędów na każdym kroku
- [x] Responsywność (mobile-first)
- [x] Sekcja `BookingSection.astro` + rejestracja w `SectionDispatcher`

---

## Faza 5 — Panel właściciela (Admin) ✅

- [x] `BookingsTab.tsx` — lista rezerwacji z filtrowaniem po statusie
- [x] Widok szczegółowy rezerwacji (klient, data, godzina, usługa)
- [x] Ręczna zmiana statusu (potwierdź / anuluj / zakończ)
- [x] Zakładka "Bookings" w panelu admina

Pozostałe do zrobienia:
- [ ] Widok kalendarza dzienny/tygodniowy
- [ ] Blokowanie terminów (urlop, przerwa techniczna)

---

## Faza 6 — Konfiguracja w szablonie ✅

- [x] Dodano stronę "Rezerwacja" do szablonu `specialist`
- [x] Dodano konfigurację `booking` do `specialist.json`
  - 4 usługi elektryczne z czasem trwania i ceną
  - Godziny pracy Pon-Pt 7-18, Sob 8-14, Niedz zamknięte
  - Slot co 60 min, leadTime 60 min, maxAdvance 30 dni
- [x] Polskie tłumaczenia w `translations/pl.json`
- [x] Synchronizacja z bazą przez `db:seed`

---

## Faza 7 — Testy i QA

- [ ] Unit testy logiki generowania slotów
- [ ] Unit testy walidacji API
- [ ] E2E test pełnego flow rezerwacji (Playwright)
- [ ] Test powiadomień email
- [ ] Test race condition (dwie osoby rezerwują ten sam slot jednocześnie)

---

## Architektura

### Pliki kluczowe

| Plik | Opis |
|------|------|
| `packages/db/src/schema.ts` | Tabela `bookings` |
| `packages/db/src/queries.ts` | `createBooking`, `getBookingsBySiteId`, `getBookingsByDateAndSiteId`, `updateBookingStatus` |
| `packages/schema/src/business.schema.json` | Sekcja `booking` + typ sekcji `"booking"` |
| `packages/ui/src/sections/booking/BookingWidget.tsx` | Wieloetapowy widget rezerwacji |
| `apps/engine/src/components/sections/BookingSection.astro` | Wrapper Astro dla widgetu |
| `apps/engine/src/pages/api/booking/[businessId]/availability.ts` | API: wolne sloty |
| `apps/engine/src/pages/api/booking/[businessId]/reserve.ts` | API: tworzenie rezerwacji |
| `apps/engine/src/pages/api/admin/bookings/list.ts` | Admin API: lista rezerwacji |
| `apps/engine/src/pages/api/admin/bookings/update-status.ts` | Admin API: zmiana statusu |
| `apps/engine/src/components/admin/BookingsTab.tsx` | Panel admina — zakładka Rezerwacje |
| `templates/specialist/specialist.json` | Strona + konfiguracja bookingu |
| `templates/specialist/translations/pl.json` | Polskie tłumaczenia |

### Jak dodać booking do nowego biznesu

1. Dodaj `booking.enabled: true` + `booking.services[]` + `booking.hours` do config w bazie
2. Dodaj stronę `booking` z sekcją `{ "type": "booking", ... }` do `pages`
3. Gotowe — widget automatycznie pojawi się na stronie
