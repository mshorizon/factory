# Kierunki rozwoju — sklep internetowy i booking

---

## 1. Integracja płatności

- [ ] Wybrać i zintegrować bramkę płatniczą (Stripe lub Przelewy24)
- [ ] Zaimplementować endpoint checkout (`POST /api/checkout`)
- [ ] Obsłużyć webhooki płatności (potwierdzenie, błąd, zwrot)
- [ ] Dodać zarządzanie zamówieniami w panelu admina (lista, statusy)
- [ ] Generowanie faktur PDF
- [ ] Email potwierdzający zamówienie do klienta
- [ ] Email powiadamiający właściciela biznesu o nowym zamówieniu
- [ ] Stan zamówień: oczekujące / opłacone / wysłane / anulowane

---

## 2. Rezerwacje / Booking

- [ ] Zaprojektować schemat danych dla rezerwacji (data, godzina, usługa, klient)
- [ ] Sekcja kalendarza dostępności na stronie klienta
- [ ] Formularz rezerwacji z wyborem terminu
- [ ] Logika blokowania zajętych terminów
- [ ] Panel admina: widok kalendarza z rezerwacjami
- [ ] Panel admina: ręczne dodawanie / anulowanie rezerwacji
- [ ] Email/SMS potwierdzający rezerwację (Resend + Twilio/SMSAPI)
- [ ] Przypomnienie automatyczne 24h przed terminem
- [ ] Integracja z Google Calendar (opcjonalnie)
