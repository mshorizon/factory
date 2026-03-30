# Plan automatyzacji pozyskiwania klientów

## Cel

Zautomatyzować proces: znajdowanie firm -> generowanie stron www z ich danymi -> wysyłka wiadomości z ofertą -> tracking kontaktów w CSV.

---

## Architektura przepływu

```
[1. Scraper firm] → [2. Enrichment danych] → [3. Generator stron] → [4. Wysyłka wiadomości] → [5. CSV tracker]
         ↑                                                                                           |
         └───────────── filtr: pomiń firmy już kontaktowane ──────────────────────────────────────────┘
```

---

## Krok 1: Znajdowanie firm (Lead Generation)

### Strategia: darmowe źródła → Google Places API przy skali

> **Faza startowa (MVP):** korzystamy wyłącznie z darmowych źródeł danych.
> **Faza skalowania:** jeśli biznes się sprawdzi, przechodzimy na Google Places API (~$17/1000 firm) dla lepszej jakości i pokrycia danych.

### Źródła danych — Faza startowa (darmowe)
- **OpenStreetMap (Overpass API)** — darmowe, bez limitu, dane firm: nazwa, adres, telefon, strona www, kategoria, godziny otwarcia
- **Yelp Fusion API** — darmowy tier (5000 calls/dzień), oceny, opinie, zdjęcia, telefon, godziny
- **Foursquare Places API** — darmowy tier (50 calls/sec), kategorie, oceny, zdjęcia
- **Web scraping** — Panorama Firm, PKT.pl, Google Maps scraping (beautifulsoup4 / playwright)
- **Enrichment ze stron www firm** — email, opis, social media, logo

### Źródła danych — Faza skalowania (płatne)
- **Google Places API** — pełne dane firm, najlepsza jakość i pokrycie na polskim rynku
- **Google My Business** (via Places API) — dane kontaktowe, godziny otwarcia, opinie, zdjęcia

### Dane do pobrania per firma
| Pole | Źródło (darmowe) | Źródło (płatne) |
|------|-------------------|------------------|
| Nazwa firmy | OSM / Yelp / Foursquare | Google Places |
| Adres | OSM / Yelp | Google Places |
| Telefon | OSM / Yelp | Google Places |
| Email | Strona www / scraping | Strona www / scraping |
| Strona www (obecna) | OSM / scraping | Google Places |
| Kategoria / branża | OSM tagi / Yelp / Foursquare | Google Places |
| Ocena | Yelp / Foursquare | Google Places |
| Liczba opinii | Yelp | Google Places |
| Godziny otwarcia | OSM / Yelp | Google Places |
| Zdjęcia | Yelp / strona www | Google Places |
| Opis / about | Strona www / scraping | Strona www / scraping |
| Social media | Strona www / scraping | Strona www / scraping |

### Filtrowanie leadów
- Pomiń firmy, które **już mają profesjonalną stronę www** (heurystyka: sprawdź czy strona jest responsywna, ma SSL, nie jest domyślnym szablonem)
- Pomiń firmy **już skontaktowane** (sprawdzenie w CSV)
- Priorytet: firmy z dobrą oceną (>4.0) ale bez strony lub ze słabą stroną

### Narzędzia / technologie
- Python + `overpy` (OSM Overpass API)
- Python + `requests` (Yelp Fusion API, Foursquare API)
- `beautifulsoup4` / `playwright` do scrapowania stron (Panorama Firm, PKT.pl, Google Maps)
- Przyszłościowo: `googlemaps` library (Google Places API) — po walidacji biznesu

---

## Krok 2: Enrichment danych z webu

### Co robimy
- Wejście na obecną stronę firmy (jeśli istnieje) i wyciągnięcie dodatkowych danych
- Pobranie logo, kolorystyki, opisu usług
- Analiza jakości obecnej strony (PageSpeed score, mobile-friendly, SSL)

### Narzędzia
- `requests` + `beautifulsoup4` — scraping treści
- Google PageSpeed Insights API — ocena jakości obecnej strony
- `colorgram.py` / analiza CSS — ekstrakcja kolorów brandowych

---

## Krok 3: Generowanie strony www (via istniejący silnik Factory)

> **Korzystamy z istniejącego silnika renderowania** — Astro SSR multi-tenant engine.
> Nie generujemy statycznego HTML. Zamiast tego tworzymy BusinessProfile JSON + tłumaczenia,
> walidujemy schematem, wstawiamy do bazy PostgreSQL, i dodajemy subdomenę w Coolify.

### Podejście
1. **Generowanie business JSON** — na bazie szablonu `specialist.json` (electrician), podmiana danych firmy
2. **Generowanie translations** — pl.json z polskimi tekstami dopasowanymi do firmy
3. **Walidacja** — sprawdzenie JSON przeciw `business.schema.json` (AJV validator)
4. **Zapis do templates/** — folder `templates/<subdomain>/` z JSON + translations
5. **Seed do DB** — `pnpm -F @mshorizon/db db:seed` → upsert do tabeli `sites`
6. **Subdomena w Coolify** — dodanie `<subdomain>.dev.hazelgrouse.pl` do konfiguracji DNS

### Dane wstawiane do business JSON
- Nazwa firmy → `business.name`
- Adres, telefon, email → `business.contact`
- Godziny otwarcia → `business.contact.hours` + `booking.hours`
- Lokalizacja GPS → `business.contact.location`
- Ocena Google/Yelp → `business.googleRating`
- Kategoria/branża → `business.industry`
- Social media → `business.socials`

### Technologie
- **Silnik**: istniejący Astro SSR engine (`apps/engine/`)
- **Schema**: `@mshorizon/schema` — `business.schema.json` + AJV validator
- **Baza**: PostgreSQL + Drizzle ORM (`packages/db/`)
- **Hosting**: Coolify — subdomeny `*.dev.hazelgrouse.pl`
- **Generator JSON**: Python script bazujący na template `specialist.json`

### Rezultat
Każda wygenerowana firma dostaje pełną stronę pod np.:
```
https://elektryk-kowalski-krakow.dev.hazelgrouse.pl
```
Z pełnym zestawem podstron: Home, O nas, Usługi, Kontakt, FAQ, Rezerwacja, etc.

---

## Krok 4: Wysyłka wiadomości

### Kanały (w kolejności priorytetu)
1. **Email** — główny kanał, najtańszy i najłatwiejszy do automatyzacji
2. **Formularz kontaktowy na stronie firmy** — jeśli brak emaila
3. **SMS** (opcjonalnie) — wyższy open rate, ale wyższy koszt i regulacje

### Treść wiadomości

```
Temat: Przygotowaliśmy stronę internetową dla [Nazwa Firmy] — zobacz podgląd

Dzień dobry,

Zauważyliśmy, że [Nazwa Firmy] [nie posiada strony internetowej /
posiada stronę, która mogłaby lepiej prezentować Państwa firmę].

Przygotowaliśmy bezpłatny podgląd nowoczesnej strony internetowej
specjalnie dla Państwa firmy:

👉 [link do wygenerowanej strony]

Strona zawiera Państwa aktualne dane, zdjęcia, opinie klientów
i mapę dojazdu.

Jeśli strona się podoba — zapraszamy do kontaktu.
Chętnie dostosujemy ją do Państwa potrzeb.

Pozdrawiam,
[Imię] / [Nazwa naszej firmy]
[Telefon] | [Email]
```

### Personalizacja
- Wiadomość dostosowana do branży
- Wzmianka o konkretnych danych firmy (np. ocena, liczba opinii)
- Link do spersonalizowanej strony jako główny hook

### Narzędzia
- **Wysyłka email**: `resend`, `sendgrid`, `mailgun` lub `smtp` (własny serwer)
- **Rate limiting**: max 50-100 emaili/dzień z jednej domeny (unikanie spamu)
- **Tracking**: pixel śledzący otwarcia + link tracking

### Uwagi prawne (RODO / GDPR)
- Upewnić się, że dane kontaktowe firm są publicznie dostępne
- Wiadomości do firm (B2B) mają łagodniejsze regulacje niż B2C
- Dodać opcję rezygnacji z kontaktu w każdej wiadomości
- Skonsultować z prawnikiem przed uruchomieniem na skalę

---

## Krok 5: CSV Tracker (baza kontaktów)

### Struktura CSV

```csv
id,nazwa_firmy,adres,telefon,email,strona_www,branza,ocena_google,
data_znalezienia,data_wyslania,kanal_wyslania,link_preview,
status,data_odpowiedzi,notatki
```

### Statusy
| Status | Opis |
|--------|------|
| `new` | Znaleziony lead, nie wysłano jeszcze wiadomości |
| `page_generated` | Strona wygenerowana, gotowa do wysyłki |
| `sent` | Wiadomość wysłana |
| `opened` | Email otwarty (tracking pixel) |
| `clicked` | Kliknął w link do strony |
| `replied` | Odpowiedział |
| `converted` | Został klientem |
| `rejected` | Odmówił / poprosił o brak kontaktu |
| `bounced` | Email nie dotarł |

### Mechanizm deduplikacji
- Przed wysyłką: sprawdź CSV po `nazwa_firmy + adres` lub `telefon` lub `email`
- Jeśli firma istnieje i status != `new` → pomiń
- Alternatywa do CSV: SQLite (lepsze przy >10k rekordów)

---

## Pipeline — kolejność uruchomienia

```
1. Załaduj CSV z historią kontaktów
2. Uruchom scraper dla zadanej kategorii + lokalizacji
3. Filtruj: usuń firmy już w CSV (status != new)
4. Filtruj: usuń firmy z dobrą stroną www
5. Enrichment: pobierz dodatkowe dane z webu
6. Generuj stronę www per firma
7. Opublikuj strony (deploy)
8. Wyślij wiadomości z linkiem do strony
9. Zaktualizuj CSV (status: sent, data wysyłki)
10. [Codziennie] Sprawdź tracking (otwarcia, kliknięcia)
11. [Codziennie] Zaktualizuj statusy w CSV
```

---

## Stack technologiczny (propozycja)

| Komponent | Technologia | Koszt |
|-----------|------------|-------|
| Scraping firm (MVP) | Python + OSM Overpass + Yelp Fusion + Foursquare | darmowe |
| Scraping firm (skala) | Python + Google Places API | ~$17/1000 firm |
| Enrichment | Python + BeautifulSoup | darmowe |
| Generator stron | Python → business JSON → istniejący Astro SSR engine | darmowe (istniejąca infra) |
| Hosting preview | Coolify — subdomeny *.dev.hazelgrouse.pl | istniejąca infra |
| Walidacja | @mshorizon/schema AJV validator | darmowe |
| Baza danych | PostgreSQL + Drizzle ORM (istniejąca) | istniejąca infra |
| Wysyłka email | Resend / SendGrid | darmowy tier (100/dzień) |
| Tracking | własny pixel + link tracker | darmowe |
| Baza kontaktów | CSV → SQLite (przy skali) | darmowe |
| Orkiestracja | Python script / cron / n8n | darmowe |

---

## MVP — Minimalna wersja do uruchomienia

1. **Scraper**: Python script pobierający firmy z Google Places API dla jednej kategorii + miasta
2. **Generator**: 1 szablon HTML wypełniany danymi via Jinja2
3. **Hosting**: statyczne pliki na Vercel
4. **Wysyłka**: prosty skrypt SMTP (bez trackingu)
5. **CSV**: ręczny plik CSV z podstawowymi polami

### Czas realizacji MVP: ~2-3 dni robocze

---

## Ryzyka i mitygacje

| Ryzyko | Mitygacja |
|--------|-----------|
| Zablokowanie przez API (rate limit) | Throttling requestów, wiele darmowych źródeł jako fallback |
| Słabsze pokrycie danych w darmowych źródłach vs Google | Hybrydowe podejście: OSM + Yelp + scraping; przejście na Google Places API po walidacji biznesu |
| Wiadomości trafiają do spamu | Warmup domeny, SPF/DKIM/DMARC, limit wysyłek |
| Problemy prawne (spam) | Konsultacja prawna, opt-out w każdej wiadomości |
| Niska jakość wygenerowanych stron | Ręczna weryfikacja przed wysyłką (przynajmniej na początku) |
| Zdjęcia z Google niskiej jakości | Fallback na stock photos per branża |

---

## TODO — Implementacja krok po kroku

### Faza 1: Przygotowanie infrastruktury
- [ ] **1.1** Zdecydować o docelowej branży i lokalizacji na start
- [ ] **1.2** Uzyskać klucze API: Yelp Fusion (darmowy), Foursquare (darmowy). Google Places API — dopiero po walidacji biznesu
- [ ] **1.3** Skonfigurować projekt (Python venv, zależności, struktura folderów)
- [ ] **1.4** Utworzyć plik CSV z nagłówkami (baza kontaktów)
- [ ] **1.5** Skonfigurować domenę do wysyłki emaili (SPF/DKIM/DMARC)
- [ ] **1.6** Konsultacja prawna dot. wysyłki B2B (RODO, opt-out)

### Faza 2: Scraper firm
- [ ] **2.1** Napisać skrypt pobierający firmy z darmowych źródeł (OSM Overpass + Yelp Fusion + Foursquare + scraping Panorama Firm)
- [ ] **2.2** Dodać filtr: pomiń firmy już zapisane w CSV
- [ ] **2.3** Dodać filtr: pomiń firmy z profesjonalną stroną www (heurystyka)
- [ ] **2.4** Zapisywać nowe firmy do CSV ze statusem `new`
- [ ] **2.5** Przetestować na 1 kategorii + 1 mieście, zweryfikować dane

### Faza 3: Enrichment danych
- [ ] **3.1** Napisać skrypt wchodzący na stronę firmy i pobierający dodatkowe dane (email, opis, social media)
- [ ] **3.2** Ekstrakcja logo i kolorów brandowych (jeśli dostępne)
- [ ] **3.3** Opcjonalnie: ocena jakości obecnej strony (PageSpeed API)
- [ ] **3.4** Zapisać wzbogacone dane do CSV

### Faza 4: Generator business JSON + deploy
- [ ] **4.1** Napisać generator business JSON na bazie `specialist.json` (electrician template)
- [ ] **4.2** Napisać generator `translations/pl.json` z danymi firmy
- [ ] **4.3** Dodać walidację JSON przeciw `business.schema.json` (AJV via Node.js subprocess)
- [ ] **4.4** Zapis do `templates/<subdomain>/` + uruchomienie `db:seed`
- [ ] **4.5** Dodanie subdomeny w Coolify (API lub manual)
- [ ] **4.6** Wygenerować testowe strony dla 5 firm, sprawdzić na `*.dev.hazelgrouse.pl`

### Faza 5: Ręczna weryfikacja i poprawki stron (MANUAL)
> **Ten krok robisz ręcznie** — przed wysyłką do klienta każda strona musi przejść Twoją kontrolę.

- [ ] **5.1** Przejrzeć każdą wygenerowaną stronę
- [ ] **5.2** Poprawić dane jeśli scraper pobrał coś błędnie
- [ ] **5.3** Dostosować zdjęcia, teksty, układ jeśli trzeba
- [ ] **5.4** Oznaczyć stronę jako zatwierdzoną → zmienić status firmy w CSV na `page_approved`
- [ ] **5.5** Strony niezatwierdzone oznaczyć jako `page_rejected` (nie wysyłać wiadomości)

### Faza 6: Wysyłka wiadomości
- [ ] **6.1** Napisać szablon wiadomości email (z personalizacją)
- [ ] **6.2** Napisać skrypt wysyłający emaile TYLKO do firm ze statusem `page_approved`
- [ ] **6.3** Dodać rate limiting (max X emaili/dzień)
- [ ] **6.4** Dodać link do opt-out w każdej wiadomości
- [ ] **6.5** Po wysyłce → zmienić status w CSV na `sent` + zapisać datę
- [ ] **6.6** Wysłać testową partię (5-10 firm), sprawdzić dostarczalność

### Faza 7: Tracking i follow-up
- [ ] **7.1** Dodać tracking pixel do emaili (open tracking)
- [ ] **7.2** Dodać link tracking (kliknięcia w link do strony)
- [ ] **7.3** Skrypt aktualizujący statusy w CSV (`opened`, `clicked`)
- [ ] **7.4** Opcjonalnie: skrypt do wysyłki follow-up po X dniach bez odpowiedzi

### Faza 8: Skalowanie
- [ ] **8.1** Dodać kolejne szablony per branża
- [ ] **8.2** Rozszerzyć na kolejne miasta / kategorie
- [ ] **8.3** Rozważyć migrację CSV → SQLite (przy >1000 rekordów)
- [ ] **8.4** Zautomatyzować pipeline (cron / n8n)
- [ ] **8.5** Dashboard z metrykami (ile wysłanych, otwarć, kliknięć, konwersji)

---

### Przepływ statusów firmy w CSV

```
new → page_generated → page_approved (ręcznie) → sent → opened → clicked → replied → converted
                     ↘ page_rejected (ręcznie — nie wysyłaj)
```

> **Zasada:** Żadna wiadomość nie zostanie wysłana bez Twojej ręcznej akceptacji strony (`page_approved`).