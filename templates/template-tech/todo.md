# TODO & Analiza ulepszeń — template-tech

## Priorytet: Krytyczne (blokują konwersję)

### 1. Prawdziwe dane kontaktowe
- [ ] Uzupełnić telefon (aktualnie placeholder `+48 500 000 000`)
- [ ] Potwierdzić adres (Warsaw, Poland — czy bardziej szczegółowy?)
- [ ] Dodać link do Calendly / Cal.com do CTA "Get free preview" zamiast formularza kontaktowego

### 2. Sekcja Hero — social proof
- [ ] Dodać licznik "X websites launched this month" lub "Last preview sent X hours ago" — buduje pilność
- [ ] Rozważyć wideo/animację pokazującą jak wygląda demo w akcji (screen recording)

### 3. Formularz kontaktowy
- [ ] Zmienić formularz na bardziej kwalifikujący: pole "Twoja branża" + "Miasto"
- [ ] Dodać pole "Czy masz już stronę www?" — dane do segmentacji
- [ ] Po wysłaniu formularza: strona podziękowania z informacją "otrzymasz demo w ciągu 48h"

---

## Priorytet: Ważne (poprawiają konwersję i UX)

### 4. Case studies — autentyczność
- [ ] Dodać zrzuty ekranu faktycznych stron (mockup na laptopie/telefonie) zamiast stock photos
- [ ] Dodać linki do live stron demo ("See the live website →")
- [ ] Rozbudować każde case study o podstronę `/projects/[slug]` z pełną historią

### 5. Sekcja "How it works" — demo flow
- [ ] Dodać animowaną sekcję pokazującą: firma bez strony → otrzymuje email → klika link → widzi demo
- [ ] To jest kluczowy differentiator — powinno być bardziej widoczne na stronie głównej

### 6. Trust signals
- [ ] Dodać badge Google (jeśli zweryfikowane konto)
- [ ] Dodać licznik "X businesses received free preview this week"
- [ ] Logo mediów jeśli był jakiś coverage (lokalny artykuł, mention)
- [ ] Sekcja "As featured in" przy zdobyciu pierwszych mediów

### 7. Portfolio page
- [ ] Dodać filtry po branży (Gastronomia, Usługi, Zdrowie, Fitness, etc.)
- [ ] Dodać podgląd mobilny vs desktop dla każdego projektu
- [ ] Dodać "before / after" — jak wyglądała stara strona vs nowa

### 8. Blog — content marketing
- [ ] Napisać artykuły pod lokalne SEO:
  - "Czy elektryk potrzebuje strony internetowej?"
  - "Jak restauracja może pozyskać klientów przez Google Maps"
  - "Koszt strony internetowej dla małej firmy w Polsce 2026"
- [ ] Ustawić kategoryzację postów po branży

### 9. Porównanie cenowe
- [ ] Dodać porównanie z Wixem/WordPressem/lokalną agencją — dlaczego Hazelgrouse jest lepszy
- [ ] Kalkulator ROI: "Ile leadów musisz zdobyć żeby strona się spłaciła?" (1 klient = ?)

---

## Priorytet: Nice-to-have (długoterminowe)

### 10. Personalizacja landing page
- [ ] UTM-based personalizacja: `/lp/elektryk` → hero z "Elektryczny? Twoja strona w 5 dni"
- [ ] Dynamiczny tekst na hero na bazie query param (np. `?city=krakow&industry=elektryk`)
- [ ] To mogłoby znacząco zwiększyć konwersję z email outreach

### 11. Live demo preview
- [ ] Sekcja na stronie głównej: "See what your website could look like" z interaktywnym widgetem
- [ ] Formularz: wpisz nazwę firmy → AI generuje placeholder → "Your real preview coming in 24h"

### 12. Chatbot / live support
- [ ] Prosty widget "Got questions? Chat with us" z Crisp/Tawk.to
- [ ] FAQ-based bot dla pierwszego kontaktu poza godzinami pracy

### 13. Google Reviews widget
- [ ] Osadzić prawdziwe opinie z Google Business Profile po zdobyciu pierwszych recenzji
- [ ] Zastąpić manualne testimonials automatycznym feedem

### 14. Strona cennika — bardziej szczegółowa
- [ ] Co DOKŁADNIE wchodzi w 99 zł/mies? (ile zmian treści, SLA, czas odpowiedzi)
- [ ] Tabela porównawcza planów zamiast samych kart
- [ ] FAQ pod cennikiem: "Czy mogę zmienić plan?", "Co po roku?"

### 15. Social proof — liczniki live
- [ ] Animowane liczniki na About page (50+ businesses, 5 days, 100% free preview)
- [ ] Rozważyć połączenie z bazą danych dla real-time stats

---

## Analiza sekcji — mocne i słabe strony

### Mocne strony obecnego szablonu
- **"Free preview first"** — silny, unikalny hook widoczny w hero i przez cały funnel
- **Porównanie "No website vs Hazelgrouse"** — konkretne, przekonujące
- **Case studies z metrykami** — liczby budują wiarygodność
- **Pricing transparent** — ceny w zł, jasna struktura
- **Process section** — 4 kroki eliminują niepewność

### Słabe strony do poprawy
- **Team section** — placeholder names ("Design Lead", "SEO Specialist") — trzeba uzupełnić prawdziwymi danymi lub usunąć
- **Testimonials** — fikcyjne nazwiska — po zdobyciu prawdziwych opinii zastąpić
- **TrustBar logos** — SVG placeholder loga — zastąpić prawdziwymi po zdobyciu klientów
- **Blog** — pusty — wymaga content strategy i pierwszych 3-5 artykułów
- **Contact form** — za generyczny, nie kwalifikuje leadów

### SEO analysis
- [ ] Dodać meta descriptions per strona
- [ ] Structured data: LocalBusiness schema
- [ ] Breadcrumbs na podstronach
- [ ] Sitemap.xml
- [ ] Open Graph images dla social sharing

### Performance
- [ ] Audit Lighthouse — cel: 90+ mobile score
- [ ] Zoptymalizować obrazy Unsplash (dodać format WebP, proper sizing)
- [ ] Lazy loading na images poniżej foldu (już dodane na ProcessGrid)
- [ ] Rozważyć CDN dla zasobów statycznych

### Mobile UX
- [ ] Przetestować formularz kontaktowy na iPhone SE (małe ekrany)
- [ ] CTA button w navbarze na mobile — czy jest wystarczająco duży?
- [ ] Footer na mobile — sprawdzić po ostatnich poprawkach responsywności
