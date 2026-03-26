# SEO — co to jest i jak to zrobiliśmy

## Czym jest SEO?

**SEO (Search Engine Optimization)** to zbiór technik optymalizacji strony, który sprawia, że wyszukiwarki (Google, Bing) lepiej rozumieją jej zawartość i wyżej ją pozycjonują w wynikach wyszukiwania.

SEO dzielimy na trzy obszary:

| Obszar | Co to jest |
|--------|-----------|
| **On-page SEO** | Tagi meta, nagłówki, treść, URL-e, struktury danych |
| **Technical SEO** | Prędkość, indeksowanie, sitemap, robots.txt, HTTPS |
| **Off-page SEO** | Linki zewnętrzne, recenzje, obecność w Google Business |

---

## Co zostało zaimplementowane

### 1. Open Graph (social media preview)
Kiedy ktoś wkleja link na Facebooku, LinkedIn lub X, wyświetla się bogata karta z tytułem, opisem i obrazem. Wymaga tagów `og:*` w `<head>`.

**Zaimplementowane tagi:**
- `og:type` — `website` dla stron, `article` dla bloga
- `og:title` — tytuł strony
- `og:description` — opis strony
- `og:image` — obraz podglądowy (ze zdjęcia hero/usługi/bloga)
- `og:url` — kanoniczny URL strony
- `og:site_name` — nazwa firmy
- `og:locale` — `pl_PL` lub `en_US`

### 2. Twitter Card
Analogicznie do OG, ale dla X (dawniej Twitter):
- `twitter:card` — `summary_large_image` gdy jest obraz, `summary` gdy nie
- `twitter:title`, `twitter:description`, `twitter:image`

### 3. Canonical URL
Tag `<link rel="canonical" href="...">` mówi wyszukiwarce jaki jest „prawdziwy" URL strony. Eliminuje duplikaty treści (np. `?_preview=1`, `?business=xxx` stripped).

### 4. JSON-LD Structured Data (Schema.org)
Dane strukturalne w formacie JSON-LD to podpowiedzi dla Google, które pomagają generować **Rich Snippets** (gwiazdki, adres, godziny otwarcia w wynikach wyszukiwania).

**Implementacja per typ strony:**

| Strona | Schemat |
|--------|---------|
| Strona główna (`/`) | `LocalBusiness` z adresem, telefonem, geo, ocenami, sameAs |
| Pozostałe strony | `WebPage` z nazwą i opisem |
| Artykuł bloga | `Article` z nagłówkiem, autorem, datą, publisher |
| Usługa (`/services/x`) | `Service` z nazwą, opisem, provider |

**LocalBusiness zawiera:**
- Nazwa, URL, telefon, email
- Adres (PostalAddress)
- Współrzędne geo (GeoCoordinates)
- Oceny Google (AggregateRating) → gwiazdki w Google!
- sameAs (Facebook, Instagram, LinkedIn)

### 5. `robots.txt` (dynamiczny)
Plik `robots.txt` mówi botom które strony mogą indeksować.

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://DOMENA/sitemap.xml
```

Endpoint: `/robots.txt` — generowany dynamicznie z poprawnym URL sitemapy.

### 6. `sitemap.xml` (dynamiczny)
Mapa strony informuje Google o wszystkich dostępnych URL-ach. Generowana dynamicznie z bazy danych:

- Wszystkie strony z CMS-a (`/`, `/about`, `/services`, itp.)
- Wszystkie opublikowane posty bloga (`/blog/xyz`)
- Wszystkie usługi (`/services/xyz`)

Endpoint: `/sitemap.xml`

---

## Czego NIE ma i co warto dodać w przyszłości

| Brakuje | Opis |
|---------|------|
| **Hreflang** | Tagi `<link rel="alternate" hreflang="pl">` dla wersji językowych |
| **Breadcrumb JSON-LD** | Schema dla okruszków nawigacyjnych (rich snippet w Google) |
| **FAQ JSON-LD** | Sekcja FAQ może się pokazać bezpośrednio w Google jako rozwijana lista |
| **Optymalizacja obrazów** | WebP/AVIF, lazy loading, responsive images (`srcset`) |
| **Google Search Console** | Rejestracja domeny, weryfikacja, monitoring indeksowania |
| **Google Business Profile** | Profil w Mapach Google — kluczowe dla lokalnego SEO |
| **Core Web Vitals** | LCP < 2.5s, CLS < 0.1, FID < 100ms — monitoring przez Lighthouse |
| **Słowa kluczowe** | Dopasowanie treści do fraz szukanych przez klientów |

---

## Jak Google to widzi?

Aby sprawdzić efekty SEO:
1. **Google Search Console** → `https://search.google.com/search-console`
2. **Rich Results Test** → `https://search.google.com/test/rich-results`
3. **PageSpeed Insights** → `https://pagespeed.web.dev`
