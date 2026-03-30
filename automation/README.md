# Automation Pipeline — Pozyskiwanie Klientów

Pipeline do automatycznego znajdowania firm, generowania dla nich stron www (via Factory engine) i wysyłki ofert.

## Wymagania

```bash
cd automation
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Konfiguracja

```bash
cp .env.example .env
# Uzupełnij klucze API i SMTP (opcjonalne na start)
```

## Pipeline — krok po kroku

### 1. Scraping firm

Pobiera firmy z OpenStreetMap (darmowe, bez limitu).

```bash
python -m automation.pipeline scrape <kategoria> <miasto>
```

Dostępne kategorie: `elektryk`, `hydraulik`, `fryzjer`, `restauracja`, `mechanik`, `dentysta`, `kosmetyczka`, `kawiarnia`, `stolarz`, `malarz`, `dekarz`, `ślusarz` i inne.

Dostępne miasta: `Kraków`, `Warszawa`, `Wrocław`, `Poznań`, `Gdańsk`, `Łódź`, `Katowice`, `Lublin`, `Szczecin`, `Bydgoszcz`.

Przykład:
```bash
python -m automation.pipeline scrape elektryk Kraków
python -m automation.pipeline scrape elektryk Warszawa
```

Wynik: nowe firmy zapisane w `data/leads.csv`.

### 2. Enrichment (wzbogacanie danych)

Wchodzi na stronę www firmy i wyciąga: email, social media, ocenę jakości strony.

```bash
python -m automation.pipeline enrich
```

### 3. Generowanie business JSON

Tworzy pełny profil firmy (JSON + tłumaczenia PL) kompatybilny z Factory engine. Bazuje na szablonie `specialist` (electrician).

```bash
python -m automation.pipeline generate --branza elektryk --limit 10
```

Flagi:
- `--branza elektryk` — filtruj po branży
- `--limit 10` — max ile firm wygenerować (domyślnie 5)

Wynik: foldery w `templates/<subdomain>/` z JSON + translations, zwalidowane schematem AJV.

### 4. Seed do bazy danych

Wstawia wygenerowane firmy do PostgreSQL.

```bash
DATABASE_URL=postgresql://... python -m automation.pipeline seed
```

Lub z `.env` ustawionym w projekcie:
```bash
python -m automation.pipeline seed
```

### 5. Dodanie subdomeny w Coolify

Ręcznie dodaj subdomenę w panelu Coolify dla każdej wygenerowanej firmy:
```
<subdomain>.dev.hazelgrouse.pl
```

### 6. Weryfikacja strony

Otwórz w przeglądarce i sprawdź czy strona wygląda dobrze:
```
https://<subdomain>.dev.hazelgrouse.pl
```

### 7. Zatwierdzenie / odrzucenie

```bash
python -m automation.pipeline approve <lead_id>
python -m automation.pipeline reject <lead_id>
```

ID leadów sprawdzisz komendą `status`.

### 8. Wysyłka emaili (gdy gotowy)

Wymaga skonfigurowanego SMTP w `.env`.

```bash
python -m automation.pipeline send
```

Wysyła tylko do firm ze statusem `page_approved`. Limit: 50 emaili/dzień.

## Pełny pipeline jedną komendą

```bash
python -m automation.pipeline full elektryk Kraków --limit 10
```

Uruchamia: scrape → enrich → generate → validate.

Seed i wysyłka emaili — osobne komendy (celowo, żeby dać czas na review).

## Status

```bash
python -m automation.pipeline status
```

Pokazuje ile leadów w każdym statusie + listę wygenerowanych szablonów.

## Walidacja schematów

```bash
python -m automation.pipeline validate
```

Sprawdza wszystkie JSON w `templates/` przeciw `business.schema.json`.

## Przepływ statusów

```
new → page_generated → page_approved → sent → opened → clicked → replied → converted
                     ↘ page_rejected (nie wysyłaj)
```

## Struktura plików

```
automation/
├── pipeline.py              # Główny orkiestrator (CLI)
├── config.py                # Konfiguracja, ścieżki, klucze API
├── requirements.txt         # Zależności Python
├── .env.example             # Szablon zmiennych środowiskowych
├── data/
│   └── leads.csv            # Baza leadów
├── scrapers/
│   ├── osm_scraper.py       # OpenStreetMap Overpass API
│   ├── panorama_scraper.py  # Panorama Firm web scraper
│   └── lead_manager.py      # CSV tracker, dedup, agregacja
├── enrichment/
│   └── web_enricher.py      # Ekstrakcja email, social, jakość strony
├── generator/
│   ├── business_generator.py  # Generator business JSON + translations
│   ├── schema_validator.py    # Wrapper na AJV walidator
│   └── validate_schema.mjs   # Node.js AJV walidator
└── sender/
    └── email_sender.py      # Wysyłka SMTP z rate limiting
```
