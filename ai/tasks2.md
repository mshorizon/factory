# Kierunki rozwoju — sklep internetowy i booking

---

## 1. Integracja płatności

- [x] Wybrać i zintegrować bramkę płatniczą (Stripe lub Przelewy24)
- [x] Zaimplementować endpoint checkout (`POST /api/checkout`)
- [x] Obsłużyć webhooki płatności (potwierdzenie, błąd, zwrot)
- [x] Dodać zarządzanie zamówieniami w panelu admina (lista, statusy)
- [x] Generowanie faktur PDF
- [x] Email potwierdzający zamówienie do klienta
- [x] Email powiadamiający właściciela biznesu o nowym zamówieniu
- [x] Stan zamówień: oczekujące / opłacone / wysłane / anulowane

---

## 2. Rezerwacje / Booking

- [x] Zaprojektować schemat danych dla rezerwacji (data, godzina, usługa, klient)
- [x] Sekcja kalendarza dostępności na stronie klienta
- [x] Formularz rezerwacji z wyborem terminu
- [x] Logika blokowania zajętych terminów
- [x] Panel admina: widok kalendarza z rezerwacjami
- [x] Panel admina: ręczne dodawanie / anulowanie rezerwacji
- [x] Email/SMS potwierdzający rezerwację (Resend + Twilio/SMSAPI)
- [x] Przypomnienie automatyczne 24h przed terminem
- [x] Integracja z Google Calendar (opcjonalnie)
