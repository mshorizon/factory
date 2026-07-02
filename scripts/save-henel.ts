#!/usr/bin/env tsx
/**
 * Save site config for Henel naprawa silników elektrycznych
 * Cloned from: dariusz-zielinski-darpol
 * Subdomain: henel
 */

import {
  initDb,
  upsertSiteConfig,
  updateSiteStatus,
  updateSiteTranslations,
  getSiteBySubdomain,
  getBlogBySlug,
  createBlog,
  updateBlog,
} from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

const config = {
  business: {
    id: "henel",
    name: "t:business.name",
    assets: {
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23FFC633'/><path d='M18 4L10 18h5l-1 10 8-14h-5l1-10z' fill='%2316181D'/></svg>",
      favicon:
        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23FFC633'/><path d='M18 4L10 18h5l-1 10 8-14h-5l1-10z' fill='%2316181D'/></svg>",
    },
    contact: {
      email: "",
      hours: "Godziny pracy",
      phone: "+48 692 317 809",
      address: "Poznań",
      location: {
        latitude: 52.4064,
        longitude: 16.9252,
        googlePlaceQuery: "Henel naprawa silników elektrycznych Poznań",
      },
    },
    socials: {},
    industry: "electrician",
    serviceArea: [
      "t:serviceArea.areas.0",
      "t:serviceArea.areas.1",
      "t:serviceArea.areas.2",
      "t:serviceArea.areas.3",
      "t:serviceArea.areas.4",
      "t:serviceArea.areas.5",
      "t:serviceArea.areas.6",
      "t:serviceArea.areas.7",
    ],
    googleRating: {
      count: 64,
      score: 4.8,
    },
    trustSignals: [
      {
        icon: "shield",
        text: "t:trustBar.signals.licensed",
      },
      {
        icon: "clock",
        text: "t:trustBar.signals.response",
      },
      {
        icon: "award",
        text: "t:trustBar.signals.guarantee",
      },
      {
        icon: "check-circle",
        text: "t:trustBar.signals.estimates",
      },
    ],
  },
  theme: {
    ui: {
      radius: "64px",
      spacing: {
        lg: "1.5rem",
        md: "1rem",
        sm: "0.75rem",
        xl: "2rem",
        xs: "0.5rem",
        "2xl": "3rem",
        "3xl": "4rem",
        section: "7.5rem",
        container: "2.5rem",
        "section-sm": "5rem",
      },
      radiusSm: "0.75rem",
    },
    mode: "light",
    colors: {
      dark: {
        text: {
          main: "#FFFFFF",
          muted: "#9CA3AF",
          onPrimary: "#16181D",
        },
        primary: "#FFC633",
        surface: {
          alt: "#2D2F34",
          base: "#16181D",
          card: "#1C1E23",
        },
        primaryDark: "#CA9102",
        primaryLight: "#FFD97A",
      },
      light: {
        text: {
          main: "#16181D",
          muted: "#8A8A8A",
          onPrimary: "#16181D",
        },
        primary: "#FFC633",
        surface: {
          alt: "#16181D",
          base: "#F4F4F6",
          card: "#FFFFFF",
        },
        primaryDark: "#CA9102",
        primaryLight: "#FFD97A",
      },
    },
    preset: "bold",
    majorTheme: "template-specialist",
    typography: {
      primary: "'Space Grotesk', system-ui, -apple-system, sans-serif",
      secondary: "'Open Sans', system-ui, -apple-system, sans-serif",
    },
    navLinksPosition: "right",
  },
  layout: {
    blog: {
      postVariant: "sidebar",
    },
    footer: {
      links: [
        {
          label: "Polityka prywatności",
          target: {
            type: "page",
            value: "privacy",
          },
        },
        {
          label: "Regulamin",
          target: {
            type: "page",
            value: "terms",
          },
        },
      ],
      columns: [],
      tagline: "t:footer.tagline",
      variant: "branded",
      copyright: "t:footer.copyright",
      extensions: [
        {
          type: "call",
          phone: "t:footer.callExtension.phone",
          headline: "t:footer.callExtension.headline",
        },
      ],
    },
    navbar: {
      variant: "standard",
      extensions: [
        {
          type: "upper-bar",
        },
      ],
      showAvailability: false,
    },
  },
  booking: {
    hours: {
      fri: { open: "07:00", close: "17:00", enabled: true },
      mon: { open: "07:00", close: "17:00", enabled: true },
      sat: { open: "08:00", close: "13:00", enabled: true },
      sun: { open: "09:00", close: "13:00", enabled: false },
      thu: { open: "07:00", close: "17:00", enabled: true },
      tue: { open: "07:00", close: "17:00", enabled: true },
      wed: { open: "07:00", close: "17:00", enabled: true },
    },
    enabled: false,
    leadTime: 60,
    services: [
      {
        id: "inspection-residential",
        name: "t:booking.services.inspection.name",
        price: 150,
        duration: 60,
        description: "t:booking.services.inspection.description",
      },
      {
        id: "lighting-installation",
        name: "t:booking.services.lighting.name",
        price: 250,
        duration: 120,
        description: "t:booking.services.lighting.description",
      },
      {
        id: "panel-upgrade",
        name: "t:booking.services.panel.name",
        price: 500,
        duration: 180,
        description: "t:booking.services.panel.description",
      },
      {
        id: "lightning-protection",
        name: "t:booking.services.lightning.name",
        price: 800,
        duration: 240,
        description: "t:booking.services.lightning.description",
      },
    ],
    maxAdvance: 30,
    slotInterval: 60,
  },
  navigation: {
    cta: {
      label: "t:nav.cta",
      target: {
        type: "phone",
        value: "+48692317809",
      },
    },
  },
  data: {
    products: [
      {
        id: "smart-thermostat",
        image:
          "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=400&h=400&fit=crop",
        price: 249.99,
        title: "t:data.products.thermostat.title",
        inStock: true,
        category: "smart-home",
        attributes: [
          { key: "Brand", value: "Nest" },
          { key: "Warranty", value: "2 years" },
          { key: "Compatibility", value: "Works with Alexa & Google" },
        ],
        description: "t:data.products.thermostat.description",
      },
      {
        id: "led-panel-light",
        image:
          "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=400&h=400&fit=crop",
        price: 89.99,
        title: "t:data.products.ledPanel.title",
        inStock: true,
        category: "lighting",
        attributes: [
          { key: "Power", value: "40W" },
          { key: "Color Temperature", value: "3000K-6000K" },
          { key: "Dimmable", value: "Yes" },
        ],
        description: "t:data.products.ledPanel.description",
      },
      {
        id: "circuit-breaker",
        image:
          "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop",
        price: 45,
        title: "t:data.products.breaker.title",
        inStock: true,
        category: "electrical-parts",
        attributes: [
          { key: "Amperage", value: "20A" },
          { key: "Type", value: "GFCI" },
          { key: "Poles", value: "2" },
        ],
        description: "t:data.products.breaker.description",
      },
    ],
    services: [
      {
        id: "instalacje-elektryczne",
        icon: "home",
        slug: "instalacje-elektryczne",
        image:
          "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=450&fit=crop",
        price: 150,
        title: "t:services.items.residential.title",
        content:
          "<h3>Kompleksowe instalacje elektryczne</h3><p>Wykonujemy pełen zakres instalacji elektrycznych w budynkach mieszkalnych i komercyjnych. Od projektu po odbiór — zapewniamy bezpieczeństwo i zgodność z normami PN-HD 60364.</p><h3>Zakres prac:</h3><ul><li><strong>Instalacje w nowych budynkach:</strong> Kompletne okablowanie, rozdzielnie, gniazda i oświetlenie od podstaw.</li><li><strong>Wymiana starej instalacji:</strong> Modernizacja aluminiowych przewodów na miedziane, wymiana tablicy rozdzielczej.</li><li><strong>Instalacje trójfazowe:</strong> Zasilanie dla urządzeń o dużym poborze mocy — piece, pompy ciepła, warsztaty.</li><li><strong>Instalacje podtynkowe i natynkowe:</strong> Dobieramy metodę do rodzaju budynku i potrzeb klienta.</li></ul><h3>Dlaczego Henel?</h3><ul><li><strong>Wieloletnie doświadczenie:</strong> Setki zrealizowanych projektów w Wielkopolsce.</li><li><strong>Uprawnienia SEP:</strong> Wszystkie prace wykonywane przez licencjonowanych elektryków.</li><li><strong>Gwarancja jakości:</strong> Udzielamy gwarancji na wykonane instalacje.</li></ul>",
        category: "electrical",
        available: true,
        priceLabel: "Starting at",
        description: "t:services.items.residential.description",
      },
      {
        id: "instalacje-odgromowe",
        icon: "cloud-lightning",
        slug: "instalacje-odgromowe",
        image:
          "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=450&fit=crop",
        price: 800,
        title: "t:services.items.commercial.title",
        content:
          "<h3>Profesjonalne instalacje odgromowe</h3><p>Chronimy budynki przed skutkami wyładowań atmosferycznych. Projektujemy i montujemy systemy odgromowe zgodne z normą PN-EN 62305, zapewniające pełną ochronę przed piorunami.</p><h3>Nasze usługi odgromowe:</h3><ul><li><strong>Projektowanie systemów odgromowych:</strong> Analiza ryzyka i dobór odpowiedniego poziomu ochrony.</li><li><strong>Montaż zwodów i przewodów odprowadzających:</strong> Instalacja na dachach skośnych, płaskich i obiektach przemysłowych.</li><li><strong>Uziemienie:</strong> Wykonanie profesjonalnego uziemienia fundamentowego lub otokowego.</li><li><strong>Przeglądy i konserwacja:</strong> Regularne kontrole stanu technicznego instalacji odgromowej.</li></ul><h3>Dlaczego warto?</h3><ul><li><strong>Zgodność z przepisami:</strong> Obowiązek prawny dla wielu typów budynków.</li><li><strong>Ochrona elektroniki:</strong> Zapobieganie uszkodzeniom sprzętu przez przepięcia.</li><li><strong>Bezpieczeństwo domowników:</strong> Eliminacja ryzyka pożaru od pioruna.</li></ul>",
        category: "electrical",
        available: true,
        priceLabel: "Starting at",
        description: "t:services.items.commercial.description",
      },
      {
        id: "instalacje-niskopradowe",
        icon: "wifi",
        slug: "instalacje-niskopradowe",
        image:
          "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&h=450&fit=crop",
        title: "t:services.items.panel.title",
        content:
          "<h3>Nowoczesne instalacje niskoprądowe</h3><p>Realizujemy instalacje niskoprądowe dla domów i firm — od sieci komputerowych po systemy alarmowe. Zapewniamy niezawodność i łatwość rozbudowy.</p><h3>Zakres usług:</h3><ul><li><strong>Sieci komputerowe LAN:</strong> Okablowanie strukturalne kategorii 5e, 6 i 6A.</li><li><strong>Systemy alarmowe:</strong> Instalacja czujników, central alarmowych i powiadomień.</li><li><strong>Monitoring CCTV:</strong> Kamery IP, rejestratory i zdalny podgląd.</li><li><strong>Domofony i wideodomofony:</strong> Systemy komunikacji wewnętrznej.</li></ul><h3>Nasze atuty:</h3><ul><li><strong>Kompleksowe rozwiązania:</strong> Projekt, montaż, konfiguracja i serwis.</li><li><strong>Certyfikowane materiały:</strong> Stosujemy wyłącznie renomowane marki.</li><li><strong>Pomiary i certyfikacja:</strong> Protokoły pomiarowe dla każdej instalacji.</li></ul>",
        category: "electrical",
        available: true,
        description: "t:services.items.panel.description",
      },
      {
        id: "ogrzewanie-podlogowe",
        icon: "thermometer",
        slug: "ogrzewanie-podlogowe",
        image:
          "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=450&fit=crop",
        price: 200,
        title: "t:services.items.emergency.title",
        content:
          "<h3>Elektryczne ogrzewanie podłogowe</h3><p>Instalujemy nowoczesne systemy elektrycznego ogrzewania podłogowego, które zapewniają komfort cieplny i oszczędność energii. Idealne rozwiązanie do łazienek, kuchni i pomieszczeń mieszkalnych.</p><h3>Rodzaje systemów:</h3><ul><li><strong>Maty grzewcze:</strong> Szybki montaż pod płytkami ceramicznymi — idealne do łazienek.</li><li><strong>Kable grzewcze:</strong> Elastyczne rozwiązanie dla pomieszczeń o nietypowych kształtach.</li><li><strong>Folie grzewcze:</strong> Montaż pod panelami i deską — cienkie i wydajne.</li></ul><h3>Zalety ogrzewania podłogowego:</h3><ul><li><strong>Równomierny rozkład ciepła:</strong> Brak zimnych stref na podłodze.</li><li><strong>Oszczędność miejsca:</strong> Brak widocznych grzejników.</li><li><strong>Indywidualna regulacja:</strong> Termostat w każdym pomieszczeniu.</li><li><strong>Niskie koszty eksploatacji:</strong> W połączeniu z fotowoltaiką — niemal darmowe ogrzewanie.</li></ul>",
        category: "electrical",
        duration: "2-4 hours",
        available: true,
        priceLabel: "Starting at",
        description: "t:services.items.emergency.description",
      },
      {
        id: "pomiary-elektryczne",
        icon: "clipboard-check",
        slug: "pomiary-elektryczne",
        image:
          "https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?w=600&h=450&fit=crop",
        title: "t:services.items.lighting.title",
        content:
          "<h3>Profesjonalne pomiary elektryczne</h3><p>Wykonujemy kompleksowe pomiary instalacji elektrycznych wymagane przy odbiorach budowlanych i przeglądach okresowych. Każdy pomiar zakończony jest protokołem zgodnym z obowiązującymi normami.</p><h3>Rodzaje pomiarów:</h3><ul><li><strong>Pomiary ochronne:</strong> Rezystancja izolacji, skuteczność ochrony przeciwporażeniowej, impedancja pętli zwarcia.</li><li><strong>Pomiary odbiorcze:</strong> Wymagane przy oddaniu nowej instalacji do użytku.</li><li><strong>Pomiary okresowe:</strong> Obowiązkowe co 5 lat (budynki mieszkalne) lub co 1 rok (obiekty zagrożone).</li><li><strong>Pomiary instalacji odgromowych:</strong> Rezystancja uziemienia i ciągłość przewodów.</li></ul><h3>Co otrzymujesz:</h3><ul><li><strong>Protokół pomiarowy:</strong> Dokument zgodny z PN-HD 60364-6.</li><li><strong>Raport z zaleceniami:</strong> Wskazanie usterek i rekomendacji.</li><li><strong>Szybka realizacja:</strong> Pomiary w ciągu 1-2 dni roboczych.</li></ul>",
        category: "electrical",
        available: true,
        description: "t:services.items.lighting.description",
      },
      {
        id: "awarie-elektryczne",
        icon: "alert-circle",
        slug: "awarie-elektryczne",
        image:
          "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=450&fit=crop",
        price: 120,
        title: "t:services.items.ev.title",
        content:
          "<h3>Szybka reakcja na awarie elektryczne</h3><p>Awaria elektryczna nie czeka — my też nie. Nasz zespół jest gotowy do interwencji w przypadku nagłych usterek instalacji elektrycznej. Działamy szybko i skutecznie, minimalizując przestoje i zagrożenia.</p><h3>Typowe awarie:</h3><ul><li><strong>Brak prądu:</strong> Diagnoza i naprawa przyczyn zaniku zasilania.</li><li><strong>Przepalony bezpiecznik:</strong> Wymiana i ustalenie przyczyny przeciążenia.</li><li><strong>Iskrzące gniazdka:</strong> Natychmiastowa naprawa zagrożenia pożarowego.</li><li><strong>Zwarcia:</strong> Lokalizacja i naprawa uszkodzonych przewodów.</li><li><strong>Uszkodzenia po burzy:</strong> Naprawa instalacji po wyładowaniach atmosferycznych.</li></ul><h3>Nasza gwarancja:</h3><ul><li><strong>Szybki dojazd:</strong> Do 60 minut na terenie Poznania i okolic.</li><li><strong>Dostępność:</strong> Również w weekendy i święta po uzgodnieniu.</li><li><strong>Transparentne ceny:</strong> Wycena przed rozpoczęciem naprawy.</li></ul>",
        category: "electrical",
        available: true,
        priceLabel: "Starting at",
        description: "t:services.items.ev.description",
      },
    ],
  },
  pages: {
    home: {
      title: "t:pages.home.title",
      sections: [
        {
          cta: {
            label: "t:hero.cta",
            target: {
              type: "phone",
              value: "+48692317809",
            },
          },
          type: "hero",
          image:
            "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/specialist-001/hero-electrician.jpg",
          header: {
            badge: "t:hero.badge",
            title: "t:hero.title",
            subtitle: "t:hero.subtitle",
          },
          variant: "split",
          background: "dark",
          secondaryCta: {
            label: "t:hero.secondaryCta",
            target: {
              type: "page",
              value: "services",
            },
          },
          testimonials: [
            {
              image:
                "https://api.dicebear.com/7.x/lorelei/svg?seed=testimonial-1",
              quote: "t:hero.testimonial.quote",
              title: "t:hero.testimonial.title",
            },
            {
              image: "https://api.dicebear.com/7.x/lorelei/svg?seed=jan",
              quote: "t:hero.testimonial2.quote",
              title: "t:hero.testimonial2.title",
            },
          ],
        },
        {
          cta: {
            label: "t:services.cta",
            target: {
              type: "page",
              value: "services",
            },
          },
          type: "services",
          header: {
            badge: "t:services.badge",
            title: "t:services.title",
            subtitle: "t:services.subtitle",
          },
          variant: "imageGrid",
        },
        {
          type: "ref",
          sectionId: "service-area-main",
        },
        {
          type: "ref",
          sectionId: "features-main",
        },
        {
          type: "ref",
          sectionId: "about-summary-main",
        },
        {
          cta: {
            label: "t:faq.moreCta",
            target: {
              type: "page",
              value: "contact",
            },
          },
          type: "faq",
          image:
            "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/darpol-elektryk/faq-electrician.jpg",
          header: {
            badge: "t:faq.badge",
            title: "t:faq.title",
            subtitle: "t:faq.subtitle",
          },
          faqItems: [
            {
              answer: "t:faq.items.0.answer",
              question: "t:faq.items.0.question",
            },
            {
              answer: "t:faq.items.1.answer",
              question: "t:faq.items.1.question",
            },
            {
              answer: "t:faq.items.2.answer",
              question: "t:faq.items.2.question",
            },
            {
              answer: "t:faq.items.3.answer",
              question: "t:faq.items.3.question",
            },
            {
              answer: "t:faq.items.4.answer",
              question: "t:faq.items.4.question",
            },
            {
              answer: "t:faq.items.5.answer",
              question: "t:faq.items.5.question",
            },
          ],
        },
        {
          type: "ctaBanner",
          variant: "ticker",
          background: "primary",
          marqueeText: "t:ctaTicker.text",
        },
        {
          type: "testimonials",
          items: [
            {
              image:
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
              title: "t:testimonials.items.0.author",
              description: "t:testimonials.items.0.text",
            },
            {
              image:
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
              title: "t:testimonials.items.1.author",
              description: "t:testimonials.items.1.text",
            },
            {
              image:
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
              title: "t:testimonials.items.2.author",
              description: "t:testimonials.items.2.text",
            },
          ],
          header: {
            badge: "t:testimonials.badge",
            title: "t:testimonials.title",
            subtitle: "t:testimonials.subtitle",
          },
          variant: "summary",
          background: "dark",
        },
        {
          type: "blog",
          header: {
            badge: "t:blog.badge",
            title: "t:blog.title",
            subtitle: "t:blog.subtitle",
          },
          variant: "cards-light",
          ctaLabel: "t:blog.readMore",
          blogPosts: [
            {
              date: "t:blog.posts.0.date",
              image:
                "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/darpol-elektryk/blog-bezpieczenstwo-instalacji.jpg",
              title: "t:blog.posts.0.title",
              description: "t:blog.posts.0.description",
            },
            {
              date: "t:blog.posts.1.date",
              image:
                "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/darpol-elektryk/blog-oszczedzanie-energii.jpg",
              title: "t:blog.posts.1.title",
              description: "t:blog.posts.1.description",
            },
          ],
          badgeVariant: "accent",
        },
      ],
    },
    about: {
      title: "t:pages.about.title",
      navOrder: 1,
      sections: [
        {
          cta: {
            label: "t:about.cta",
            target: {
              type: "page",
              value: "contact",
            },
          },
          type: "about",
          image:
            "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/darpol-elektryk/about-electrician.jpg",
          story: {
            title: "t:about.story.title",
            content: "t:about.story.content",
          },
          header: {
            badge: "t:about.badge",
            title: "t:about.title",
          },
          variant: "story",
        },
        {
          type: "mission",
          image:
            "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/darpol-elektryk/mission-electrician.jpg",
          items: [
            { title: "t:mission.checkpoints.0" },
            { title: "t:mission.checkpoints.1" },
          ],
          header: {
            badge: "t:mission.badge",
            title: "t:mission.title",
            subtitle: "t:mission.subtitle",
          },
          background: "dark",
        },
        {
          type: "ref",
          sectionId: "features-main",
        },
        {
          type: "ref",
          sectionId: "service-area-main",
        },
        {
          type: "ref",
          sectionId: "map-google",
        },
      ],
    },
    terms: {
      title: "Regulamin",
      sections: [
        {
          type: "faq",
          header: {
            title: "Regulamin serwisu",
            subtitle: "Zasady korzystania z serwisu",
          },
          faqItems: [
            {
              answer:
                "Niniejszy regulamin określa zasady korzystania z serwisu internetowego Henel naprawa silników elektrycznych. Korzystanie z serwisu oznacza akceptację niniejszego regulaminu.",
              question: "Postanowienia ogólne",
            },
            {
              answer:
                "Serwis świadczy usługi informacyjne i kontaktowe w zakresie naprawy silników elektrycznych, instalacji elektrycznych, odgromowych, niskoprądowych i pokrewnych.",
              question: "Zakres usług",
            },
            {
              answer:
                "Użytkownik zobowiązany jest do korzystania z serwisu zgodnie z obowiązującym prawem i zasadami współżycia społecznego. Zabrania się przesyłania treści o charakterze bezprawnym.",
              question: "Prawa i obowiązki użytkownika",
            },
            {
              answer:
                "Właściciel serwisu nie ponosi odpowiedzialności za przerwy w działaniu serwisu spowodowane siłą wyższą lub działaniem osób trzecich.",
              question: "Odpowiedzialność",
            },
            {
              answer:
                "Właściciel serwisu zastrzega sobie prawo do zmiany regulaminu. O zmianach użytkownicy będą informowani poprzez publikację nowej wersji na stronie.",
              question: "Zmiany regulaminu",
            },
          ],
        },
      ],
      hideFromNav: true,
    },
    contact: {
      title: "t:pages.contact.title",
      sections: [
        {
          form: {
            nameLabel: "t:contact.form.nameLabel",
            emailLabel: "t:contact.form.emailLabel",
            messageLabel: "t:contact.form.messageLabel",
            submitButton: "t:contact.form.submitButton",
            namePlaceholder: "t:contact.form.namePlaceholder",
            emailPlaceholder: "t:contact.form.emailPlaceholder",
            messagePlaceholder: "t:contact.form.messagePlaceholder",
          },
          info: {
            email: "",
            hours: "t:contact.info.hours",
            phone: "+48 692 317 809",
            notice: {
              title: "t:contact.info.notice.title",
              description: "t:contact.info.notice.description",
            },
            address: "Poznań",
            hoursDetailed: [
              "t:contact.info.hours.mon",
              "t:contact.info.hours.tue",
              "t:contact.info.hours.wed",
              "t:contact.info.hours.thu",
              "t:contact.info.hours.fri",
              "t:contact.info.hours.sat",
            ],
            receptionHours: "t:contact.info.receptionHours",
            receptionLabel: "t:contact.info.receptionLabel",
          },
          type: "contact",
          header: {
            title: "t:contact.title",
            subtitle: "t:contact.page.subtitle",
          },
          variant: "professional",
          iconColor: "primary",
          formBackground: "dark",
          headerLineColor: "primary",
          submitButtonColor: "primary",
        },
        {
          type: "ref",
          sectionId: "map-google",
        },
      ],
    },
    privacy: {
      title: "Polityka prywatności",
      sections: [
        {
          type: "faq",
          header: {
            title: "Polityka prywatności",
            subtitle: "Informacje o przetwarzaniu danych osobowych",
          },
          faqItems: [
            {
              answer:
                "Administratorem danych osobowych jest Henel naprawa silników elektrycznych z siedzibą w Poznaniu. Dane przetwarzane są zgodnie z obowiązującymi przepisami prawa, w tym z Rozporządzeniem RODO.",
              question: "Kto jest administratorem danych osobowych?",
            },
            {
              answer:
                "Zbieramy dane podane przez użytkownika w formularzach kontaktowych (imię, adres e-mail, numer telefonu) oraz dane techniczne niezbędne do prawidłowego działania serwisu (pliki cookies).",
              question: "Jakie dane zbieramy?",
            },
            {
              answer:
                "Dane przetwarzamy w celu realizacji zapytań kontaktowych, świadczenia usług, a za zgodą użytkownika — w celach analitycznych i marketingowych.",
              question: "W jakim celu przetwarzamy dane?",
            },
            {
              answer:
                "Dane przechowujemy przez czas niezbędny do realizacji celów, dla których zostały zebrane, nie dłużej niż wymaga tego prawo.",
              question: "Jak długo przechowujemy dane?",
            },
            {
              answer:
                "Użytkownik ma prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, a także prawo do przenoszenia danych i wniesienia sprzeciwu wobec przetwarzania.",
              question: "Jakie prawa przysługują użytkownikowi?",
            },
          ],
        },
      ],
      hideFromNav: true,
    },
    projects: {
      title: "t:pages.projects.title",
      navOrder: 3,
      sections: [
        {
          type: "project",
          header: {
            badge: "t:projectsPage.badge",
            title: "t:projectsPage.title",
            subtitle: "t:projectsPage.subtitle",
          },
          variant: "grid",
          projects: [
            {
              date: "Styczeń 2026",
              image:
                "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=500&fit=crop",
              title:
                "Instalacja elektryczna – Dom jednorodzinny w Garwolinie",
              metrics: [
                "85 punktów elektrycznych",
                "Oświetlenie LED",
                "2 tygodnie realizacji",
              ],
              description:
                "Kompleksowa instalacja elektryczna w nowym domu jednorodzinnym. Projekt obejmował 85 punktów elektrycznych, tablicę rozdzielczą z zabezpieczeniami różnicowoprądowymi, oświetlenie LED we wszystkich pomieszczeniach oraz przygotowanie pod fotowoltaikę.",
            },
            {
              date: "Październik 2025",
              image:
                "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=500&fit=crop",
              title:
                "Instalacja odgromowa – Budynek użyteczności publicznej",
              metrics: [
                "Norma PN-EN 62305",
                "Uziemienie fundamentowe",
                "Protokół pomiarowy",
              ],
              description:
                "Zaprojektowanie i montaż kompletnej instalacji odgromowej na budynku szkoły w Garwolinie. Instalacja zgodna z normą PN-EN 62305, obejmująca zwody pionowe, przewody odprowadzające i uziemienie fundamentowe.",
            },
            {
              date: "Lipiec 2025",
              image:
                "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=500&fit=crop",
              title: "Modernizacja instalacji – Kamienica w Garwolinie",
              metrics: [
                "Wymiana aluminium na miedź",
                "Nowa rozdzielnia",
                "4 lokale mieszkalne",
              ],
              description:
                "Wymiana kompletnej instalacji elektrycznej w przedwojennej kamienicy. Zastąpienie przewodów aluminiowych miedzianymi, nowa tablica rozdzielcza z zabezpieczeniami, gniazda z uziemieniem we wszystkich pomieszczeniach.",
            },
            {
              date: "Marzec 2025",
              image:
                "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&h=500&fit=crop",
              title:
                "Elektryczne ogrzewanie podłogowe – Łazienki i kuchnia",
              metrics: [
                "4 pomieszczenia",
                "Termostaty WiFi",
                "Oszczędność 25% energii",
              ],
              description:
                "Montaż mat grzewczych w trzech łazienkach i kuchni w domu jednorodzinnym. System sterowany indywidualnymi termostatami w każdym pomieszczeniu, zintegrowany z istniejącą instalacją elektryczną.",
            },
          ],
        },
      ],
    },
    services: {
      title: "t:pages.services.title",
      navOrder: 2,
      sections: [
        {
          type: "services",
          header: {
            badge: "t:servicesPage.badge",
            title: "t:servicesPage.title",
            subtitle: "t:servicesPage.subtitle",
          },
          variant: "imageGrid",
        },
      ],
    },
  },
  sharedSections: {
    "map-google": {
      type: "map",
      header: {
        badge: "t:map.badge",
        title: "t:map.title",
        subtitle: "t:map.subtitle",
      },
      mapPanelButtonColor: "primary",
    },
    "features-main": {
      type: "features",
      items: [
        {
          icon: "timer",
          title: "t:features.items.swift.title",
          linkLabel: "t:features.learnMore",
          linkTarget: { type: "page", value: "contact" },
          description: "t:features.items.swift.description",
        },
        {
          icon: "badge-check",
          title: "t:features.items.trusted.title",
          linkLabel: "t:features.learnMore",
          linkTarget: { type: "page", value: "contact" },
          description: "t:features.items.trusted.description",
        },
        {
          icon: "shield-check",
          title: "t:features.items.safety.title",
          linkLabel: "t:features.learnMore",
          linkTarget: { type: "page", value: "contact" },
          description: "t:features.items.safety.description",
        },
        {
          icon: "wallet",
          title: "t:features.items.affordable.title",
          linkLabel: "t:features.learnMore",
          linkTarget: { type: "page", value: "contact" },
          description: "t:features.items.affordable.description",
        },
      ],
      header: {
        badge: "t:features.badge",
        title: "t:features.title",
        subtitle: "t:features.subtitle",
      },
    },
    "service-area-main": {
      area: {
        region: "wielkopolska",
        country: "polska",
      },
      type: "serviceArea",
      areas: [
        "t:serviceArea.areas.0",
        "t:serviceArea.areas.1",
        "t:serviceArea.areas.2",
        "t:serviceArea.areas.3",
        "t:serviceArea.areas.4",
        "t:serviceArea.areas.5",
        "t:serviceArea.areas.6",
        "t:serviceArea.areas.7",
      ],
      stats: [
        { label: "t:serviceArea.stats.states", value: "8" },
        { label: "t:serviceArea.stats.cities", value: "30+" },
      ],
      header: {
        badge: "t:serviceArea.badge",
        title: "t:serviceArea.title",
        subtitle: "t:serviceArea.subtitle",
      },
      background: "dark",
    },
    "about-summary-main": {
      cta: {
        label: "t:aboutSummary.cta",
        target: { type: "page", value: "about" },
      },
      type: "about-summary",
      image:
        "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/darpol-elektryk/about-electrician.jpg",
      stats: [
        {
          label: "t:aboutSummary.stats.certifications",
          value: "6x",
        },
        {
          label: "t:aboutSummary.stats.completedJobs",
          value: "1,500+",
        },
        {
          label: "t:aboutSummary.stats.emergency",
          value: "24/7",
        },
        {
          label: "t:aboutSummary.stats.satisfaction",
          value: "98%",
        },
      ],
      header: {
        badge: "t:aboutSummary.badge",
        title: "t:aboutSummary.title",
      },
      background: "dark",
      description: "t:aboutSummary.description",
      experienceLabel: "t:aboutSummary.experienceLabel",
      experienceYears: "t:aboutSummary.experienceYears",
    },
  },
} as const;

const translations = {
  pl: {
    "nav.cta": "Zadzwoń: 692 317 809",
    "hero.cta": "692 317 809",
    "about.cta": "Skontaktuj się",
    "blog.back": "Wróć",
    "faq.badge": "FAQ",
    "faq.title": "Najczęściej Zadawane Pytania",
    "map.badge": "ZNAJDŹ NAS",
    "map.title": "Nasza Lokalizacja",
    "blog.badge": "Blog",
    "blog.title": "Przydatna Wiedza o Elektromechanice",
    "hero.badge": "Zakład elektromechaniczny Poznań",
    "hero.title": "Naprawa Silników Elektrycznych w Poznaniu",
    "about.badge": "KIM JESTEŚMY",
    "about.title": "Henel — Zakład Elektromechaniczny z Poznania",
    "faq.moreCta": "Masz więcej pytań?",
    "nav.booking": "Rezerwacje",
    "faq.subtitle": "",
    "footer.terms": "Regulamin",
    "map.subtitle":
      "Odwiedź nas w Poznaniu lub sprawdź nasz obszar działania na mapie poniżej.",
    "services.cta": "Wszystkie Usługi",
    "blog.readMore": "Czytaj Więcej",
    "blog.subtitle": "",
    "booking.badge": "REZERWACJA ONLINE",
    "booking.title": "Umów wizytę w zakładzie",
    "business.name": "Henel",
    "contact.badge": "KONTAKT",
    "contact.title": "Skontaktuj Się z Nami",
    "ctaBottom.cta": "Zadzwoń Teraz",
    "hero.subtitle":
      "Zakład elektromechaniczny — naprawa i regeneracja silników elektrycznych, instalacje, pomiary i serwis urządzeń elektrycznych w Poznaniu i okolicach.",
    "mission.badge": "NASZA MISJA",
    "mission.title": "Precyzja i Niezawodność Na Pierwszym Miejscu",
    "ctaTicker.text": "Zadzwoń — Henel Naprawa Silników Elektrycznych",
    "features.badge": "Dlaczego My?",
    "features.title": "Doświadczony Zakład Elektromechaniczny",
    "footer.privacy": "Polityka Prywatności",
    "footer.tagline":
      "Profesjonalna naprawa silników elektrycznych, instalacje elektryczne i serwis urządzeń w Poznaniu i okolicach.",
    "services.badge": "Usługi",
    "services.title": "Co Robimy",
    "ctaBottom.title":
      "Zadzwoń do Henel — Naprawimy Twoje Silniki i Urządzenia Elektryczne",
    "aboutSummary.cta": "Dowiedz się więcej",
    "booking.subtitle":
      "Wybierz usługę, dogodny termin i zostaw swoje dane. Potwierdzimy rezerwację w ciągu godziny.",
    "contact.subtitle":
      "Masz problem z silnikiem elektrycznym lub potrzebujesz wyceny? Napisz do nas, a odpowiemy jak najszybciej.",
    "footer.copyright":
      "{year} Henel Naprawa Silników Elektrycznych. Wszelkie prawa zastrzeżone.",
    "mission.subtitle":
      "Od lat budujemy reputację na solidnej pracy i uczciwym podejściu do klienta. Każde zlecenie traktujemy z najwyższą starannością — bo niezawodność urządzeń elektrycznych to nie miejsce na kompromisy.",
    "pages.home.title": "Główna",
    "about.story.title": "Wieloletnie Doświadczenie w Elektromechanice",
    "blog.posts.0.date": "10 Marca 2026",
    "blog.posts.1.date": "25 Stycznia 2026",
    "features.subtitle":
      "Wieloletnie doświadczenie w naprawie silników elektrycznych i urządzeń elektromechanicznych. To potwierdzenie najwyższej jakości usług i zaufania klientów.",
    "hero.secondaryCta": "Zobacz Nasze Usługi",
    "pages.about.title": "O Nas",
    "serviceArea.badge": "Obszar Działania",
    "serviceArea.title": "Gdzie Działamy",
    "services.subtitle":
      "Szeroki wachlarz profesjonalnych usług elektromechanicznych — od naprawy silników po instalacje elektryczne i pomiary.",
    "aboutSummary.badge": "O NAS",
    "aboutSummary.title": "Sprawdzona Wiedza, Której Możesz Zaufać",
    "blog.posts.0.title": "Bezpieczeństwo instalacji elektrycznej w domu",
    "blog.posts.1.title": "Jak obniżyć rachunki za prąd",
    "contact.info.hours": "Godziny pracy",
    "faq.items.0.answer":
      "Obsługujemy Poznań i okolice — Swarzędz, Luboń, Kórnik, Mosina, Puszczykowo, Stęszew, Kostrzyn i inne miejscowości w Wielkopolsce.",
    "faq.items.1.answer":
      "Oczywiście! Żadne zlecenie nie jest dla nas za małe. Czy to wymiana gniazdka, naprawa silnika jednofazowego, czy montaż opraw LED — każde zlecenie traktujemy z jednakowym profesjonalizmem.",
    "faq.items.2.answer":
      "W nagłych przypadkach (awarie, brak prądu) docieramy w ciągu 60 minut na terenie Poznania. Na umówione wizyty oferujemy terminy tego samego lub następnego dnia.",
    "faq.items.3.answer":
      "Tak, zapewniamy bezpłatne wyceny dla wszystkich projektów. Nasz specjalista oceni zakres prac i przedstawi szczegółową wycenę bez ukrytych kosztów.",
    "faq.items.4.answer":
      "Posiadamy uprawnienia SEP grup 1-3, ubezpieczenie OC oraz wieloletnie doświadczenie w naprawie silników elektrycznych i instalacjach.",
    "faq.items.5.answer":
      "Tak, projektujemy i montujemy instalacje odgromowe zgodne z normą PN-EN 62305. Wykonujemy również przeglądy i pomiary istniejących instalacji odgromowych.",
    "features.learnMore": "Dowiedz się więcej",
    "projectsPage.badge": "Nasze Realizacje",
    "projectsPage.title": "Projekty, z których jesteśmy dumni",
    "servicesPage.badge": "Pełna Lista Usług",
    "servicesPage.title": "Kompleksowe Rozwiązania Elektromechaniczne",
    "testimonials.badge": "Opinie",
    "testimonials.title": "Co Mówią Nasi Klienci",
    "about.story.content":
      "Henel to zakład elektromechaniczny z siedzibą w Poznaniu, specjalizujący się w naprawie i regeneracji silników elektrycznych. Firma oferuje szeroki wachlarz profesjonalnych usług z zakresu elektromechaniki i instalacji elektrycznych.\n\nW ofercie znajdują się naprawy silników jednofazowych i trójfazowych, regeneracja uzwojeń, a także kompleksowe instalacje elektryczne i niskoprądowe. Ważną częścią działalności jest serwis i konserwacja urządzeń elektrycznych dla przemysłu i klientów indywidualnych.\n\nZespół Henel przeprowadza szczegółowe pomiary instalacji i diagnostykę silników, pozwalające na rzetelną ocenę stanu technicznego oraz zgodności z wymaganymi normami. Firma szybko reaguje na awarie, minimalizując przestoje produkcyjne klientów.",
    "pages.booking.title": "Rezerwacje",
    "pages.contact.title": "Kontakt",
    "serviceArea.areas.0": "Poznań",
    "serviceArea.areas.1": "Swarzędz",
    "serviceArea.areas.2": "Luboń",
    "serviceArea.areas.3": "Kórnik",
    "serviceArea.areas.4": "Mosina",
    "serviceArea.areas.5": "Puszczykowo",
    "serviceArea.areas.6": "Stęszew",
    "serviceArea.areas.7": "Kostrzyn",
    "about.stats.projects": "Zrealizowanych Projektów",
    "faq.items.0.question": "Jakie obszary obsługujecie?",
    "faq.items.1.question": "Czy podejmujecie się drobnych zleceń?",
    "faq.items.2.question": "Jak szybko możecie przyjechać?",
    "faq.items.3.question": "Czy oferujecie bezpłatne wyceny?",
    "faq.items.4.question": "Jakie macie uprawnienia?",
    "faq.items.5.question": "Czy wykonujecie instalacje odgromowe?",
    "pages.projects.title": "Realizacje",
    "pages.services.title": "Usługi",
    "serviceArea.subtitle":
      "Świadczymy profesjonalne usługi elektromechaniczne w Poznaniu i okolicznych miejscowościach. Dojazd do klienta w całej Wielkopolsce.",
    "testimonials.viewAll": "Zobacz Wszystkie Opinie",
    "about.experienceBadge": "15+ Lat",
    "contact.page.subtitle":
      "Skontaktuj się z naszym zespołem. Odpowiemy na wszystkie pytania i wycenimy Twoje zlecenie tak szybko, jak to możliwe.",
    "mission.checkpoints.0":
      "Wieloletnie doświadczenie w elektromechanice",
    "mission.checkpoints.1":
      "Licencjonowani i ubezpieczeni specjaliści",
    "projectsPage.subtitle":
      "Poznaj wybrane realizacje z zakresu naprawy silników, instalacji elektrycznych i odgromowych w Poznaniu i okolicach.",
    "servicesPage.subtitle":
      "Od naprawy silników i instalacji po pomiary i awarie — zajmujemy się wszystkimi Twoimi potrzebami elektromechanicznymi.",
    "testimonials.subtitle": "",
    "about.stats.experience": "Uprawnienia SEP",
    "contact.form.nameLabel": "Imię i Nazwisko",
    "contact.info.hours.fri": "piątek 7:00 – 17:00",
    "contact.info.hours.mon": "poniedziałek 7:00 – 17:00",
    "contact.info.hours.sat": "sobota 8:00 – 13:00",
    "contact.info.hours.thu": "czwartek 7:00 – 17:00",
    "contact.info.hours.tue": "wtorek 7:00 – 17:00",
    "contact.info.hours.wed": "środa 7:00 – 17:00",
    "hero.testimonial.quote":
      "Naprawili silnik trójfazowy, który inni skazali na złom. Działa jak nowy. Gorąco polecam!",
    "hero.testimonial.title": "Henel to gwarancja jakości!",
    "servicesPage.cta.title":
      "Potrzebujesz Usług Elektromechanicznych?",
    "contact.form.emailLabel": "Adres Email",
    "hero.testimonial2.quote":
      "Zadzwoniłem z awarią silnika w zakładzie i przyjechali tego samego dnia. Problem rozwiązany szybko i fachowo.",
    "hero.testimonial2.title": "Szybka pomoc w awarii",
    "services.items.ev.title": "Awarie Elektryczne",
    "servicesPage.cta.button": "Otrzymaj Bezpłatną Wycenę",
    "about.stats.availability": "Awarie 24/7",
    "about.stats.satisfaction": "Zadowolonych Klientów",
    "aboutSummary.description":
      "Z wieloletnim doświadczeniem w elektromechanice, specjalizujemy się w naprawie i regeneracji silników elektrycznych oraz kompleksowych usługach instalacyjnych. Nasz zakład to gwarancja fachowej obsługi.\n\nOd diagnostyki silników i drobnych napraw po kompleksowe instalacje, systemy odgromowe i pomiary — zapewniamy, że każda praca jest wykonana zgodnie z najwyższymi standardami.",
    "blog.posts.0.description":
      "Poznaj najważniejsze sygnały ostrzegawcze i zasady bezpieczeństwa elektrycznego w domu.",
    "blog.posts.1.description":
      "Praktyczne sposoby na zmniejszenie zużycia energii i oszczędność na rachunkach.",
    "pages.testimonials.title": "Opinie Klientów",
    "serviceArea.stats.cities": "Miejscowości obsługiwanych",
    "serviceArea.stats.states": "Gmin w zasięgu",
    "contact.form.messageLabel": "Wiadomość",
    "contact.form.submitButton": "Wyślij Wiadomość",
    "contact.info.notice.title": "Informacja o realizacji zlecenia",
    "footer.columns.pages.home": "Główna",
    "servicesPage.cta.subtitle":
      "Skontaktuj się z nami już dziś, aby otrzymać bezpłatną wycenę na dowolną z naszych usług.",
    "testimonials.items.0.text":
      "Fantastyczna obsługa! Naprawili silnik trójfazowy do mojej maszyny produkcyjnej. Terminowo, czysto i profesjonalnie. Widać wieloletnie doświadczenie.",
    "testimonials.items.1.text":
      "Zamontowali instalację odgromową na naszym zakładzie. Wszystko wyjaśnili, przygotowali dokumentację i wykonali robotę na najwyższym poziomie.",
    "testimonials.items.2.text":
      "Awaria silnika w hali — zadzwoniłem i przyjechali w ciągu godziny. Problem rozwiązany szybko i profesjonalnie. Uczciwe ceny.",
    "testimonials.items.3.text":
      "Zamontowali ogrzewanie podłogowe w biurze i hali socjalnej. Efekt rewelacyjny — ciepła podłoga to komfort, którego nie da się opisać. Polecam!",
    "testimonials.items.4.text":
      "Regularnie korzystam z usług Henel przy przeglądach elektrycznych. Zawsze profesjonalnie, z pełną dokumentacją. Nie szukam innej firmy.",
    "testimonials.items.5.text":
      "Wykonali kompletną instalację niskoprądową — alarm, monitoring, sieć LAN. Wszystko działa bezbłędnie. Bardzo polecam zakład Henel.",
    "trustBar.signals.licensed": "Uprawnienia SEP i OC",
    "trustBar.signals.response": "Dojazd w 60 min",
    "about.experienceBadgeLabel":
      "Doświadczenia w elektromechanice",
    "features.items.swift.title": "Szybka Reakcja",
    "footer.callExtension.phone": "+48 692 317 809",
    "footer.columns.pages.about": "O Nas",
    "footer.columns.pages.title": "Strony",
    "services.items.panel.title": "Instalacje Niskoprądowe",
    "trustBar.signals.estimates": "Bezpłatna Wycena",
    "trustBar.signals.guarantee": "Gwarancja na Usługi",
    "booking.services.panel.name": "Wymiana rozdzielni",
    "contact.info.receptionHours": "tylko awarie",
    "contact.info.receptionLabel": "Niedziela",
    "data.products.breaker.title": "Wyłącznik Automatyczny",
    "features.items.safety.title": "Bezpieczeństwo i Normy",
    "testimonials.items.0.author": "Krzysztof N. — Poznań",
    "testimonials.items.1.author": "Marta Z. — Swarzędz",
    "testimonials.items.2.author": "Andrzej K. — Luboń",
    "testimonials.items.3.author": "Ewa P. — Kórnik",
    "testimonials.items.4.author": "Tomasz W. — Poznań",
    "testimonials.items.5.author": "Agnieszka M. — Mosina",
    "aboutSummary.experienceLabel":
      "Doświadczenia w elektromechanice i instalacjach",
    "aboutSummary.experienceYears": "15+ LAT",
    "aboutSummary.stats.emergency": "Dostępność awaryjna",
    "contact.form.namePlaceholder": "Jan Kowalski",
    "data.products.ledPanel.title": "Panel LED 60x60",
    "features.items.trusted.title": "Uprawnienia SEP",
    "footer.columns.contact.title": "Kontakt",
    "footer.columns.pages.contact": "Kontakt",
    "contact.form.emailPlaceholder": "jan@example.com",
    "footer.callExtension.headline":
      "Naprawimy Twoje silniki i urządzenia elektryczne",
    "footer.columns.pages.services": "Usługi",
    "services.items.ev.description":
      "Szybka reakcja na awarie — brak prądu, przepalone bezpieczniki, iskrzące gniazdka, zwarcia. Dojazd w 60 min.",
    "services.items.lighting.title": "Pomiary i Protokoły",
    "booking.services.lighting.name": "Montaż oświetlenia",
    "data.products.thermostat.title": "Termostat Inteligentny",
    "services.items.emergency.title": "Ogrzewanie Podłogowe",
    "aboutSummary.stats.satisfaction": "Zadowolonych klientów",
    "booking.services.lightning.name": "Instalacja odgromowa",
    "contact.form.messagePlaceholder": "Potrzebuję pomocy z...",
    "contact.info.notice.description":
      "Przy zleceniach wymagających zakupu materiałów pobieramy zaliczkę na poczet ich wartości. Po zakończeniu prac wystawiamy fakturę VAT lub paragon fiskalny.",
    "features.items.affordable.title": "Uczciwe Ceny",
    "services.items.commercial.title": "Instalacje Odgromowe",
    "aboutSummary.stats.completedJobs": "Zrealizowanych zleceń",
    "booking.services.inspection.name": "Przegląd instalacji",
    "features.items.swift.description":
      "Dojazd w ciągu 60 minut w przypadku awarii na terenie Poznania i okolic.",
    "services.items.panel.description":
      "Sieci komputerowe, systemy alarmowe, monitoring CCTV, domofony. Kompleksowe rozwiązania dla domu i firmy.",
    "services.items.residential.title": "Instalacje Elektryczne",
    "aboutSummary.stats.certifications": "Lat doświadczenia",
    "data.products.breaker.description":
      "Bezpiecznik automatyczny do rozdzielnicy. Ochrona przed przeciążeniem i zwarciem.",
    "features.items.safety.description":
      "Wszystkie prace zgodne z polskimi normami PN-HD 60364 i przepisami budowlanymi.",
    "footer.columns.pages.testimonials": "Opinie",
    "booking.services.panel.description":
      "Wymiana starego rozdzielacza na nowoczesny panel z zabezpieczeniami.",
    "data.products.ledPanel.description":
      "Energooszczędny panel LED do montażu sufitowego. Idealne do biur i pomieszczeń użytkowych.",
    "features.items.trusted.description":
      "Wszyscy specjaliści posiadają uprawnienia SEP grup 1-3 i wieloletnie doświadczenie w branży.",
    "services.items.lighting.description":
      "Pomiary instalacji elektrycznych, protokoły odbiorcze i okresowe. Dokumentacja wymagana przy odbiorach i przeglądach.",
    "data.products.thermostat.description":
      "Programowalny termostat Wi-Fi z aplikacją mobilną. Oszczędność energii nawet do 30%.",
    "services.items.emergency.description":
      "Elektryczne ogrzewanie podłogowe — maty grzewcze, kable, folie. Komfort cieplny w łazienkach, kuchniach i pokojach.",
    "booking.services.lighting.description":
      "Instalacja opraw oświetleniowych, LED, halogenów i systemów inteligentnych.",
    "features.items.affordable.description":
      "Jasne wyceny przed realizacją. Brak ukrytych kosztów — płacisz tylko za wykonaną pracę.",
    "services.items.commercial.description":
      "Projektowanie i montaż systemów ochrony odgromowej zgodnych z PN-EN 62305. Zwody, przewody odprowadzające, uziemienie.",
    "booking.services.lightning.description":
      "Projekt i montaż systemu ochrony odgromowej zgodnego z PN-EN 62305.",
    "services.items.residential.description":
      "Kompleksowe instalacje elektryczne w budynkach mieszkalnych i komercyjnych. Od projektu po odbiór — zgodnie z normami PN-HD 60364.",
    "booking.services.inspection.description":
      "Kompleksowy przegląd instalacji elektrycznej w domu lub biurze. Diagnoza usterek i zalecenia.",
  },
};

const blogs = [
  {
    slug: "bezpieczenstwo-instalacji-elektrycznej",
    lang: "pl",
    title: "5 sygnałów, że musisz wezwać elektryka",
    description:
      "Naucz się rozpoznawać sygnały ostrzegawcze, które wskazują na potrzebę pomocy elektryka, zanim drobny problem zamieni się w niebezpieczną sytuację.",
    content:
      '<h2>Nie ignoruj tych sygnałów ostrzegawczych</h2><p>Instalacja elektryczna Twojego domu wysyła wyraźne sygnały, gdy coś jest nie tak. Rozpoznanie tych znaków i szybka reakcja może zapobiec poważnym uszkodzeniom lub wypadkom.</p><h3>1. Częste wypadanie bezpieczników</h3><p>Jeśli bezpieczniki często się wypalają, oznacza to przeciążenie instalacji elektrycznej lub zwarcie. Sporadyczne wypadanie jest normalne, ale częste wymaga profesjonalnej diagnostyki.</p><h4>Co powoduje wypadanie bezpieczników?</h4><ul><li>Przeciążone obwody zbyt dużą liczbą urządzeń</li><li>Zwarcia spowodowane uszkodzonym okablowaniem</li><li>Upływy doziemne spowodowane kontaktem z wodą</li><li>Wadliwe urządzenia pobierające zbyt dużo prądu</li></ul><h3>2. Migające lub przyciemnione światło</h3><p>Migające lub przyciemnione światło po włączeniu dużego urządzenia sygnalizuje, że instalacja może nie radzić sobie z obciążeniem. Możliwe przyczyny to luźne połączenia przewodów, niewystarczający przekrój instalacji lub uszkodzone oprawy.</p><h3>3. Zapach spalenizny lub przebarwione gniazdka</h3><p><strong>To sytuacja awaryjna.</strong> Zapach spalenizny lub ślady przypalenia wokół gniazdek lub włączników świadczą o przegrzaniu i grożą pożarem. Wyłącz zasilanie danego obwodu i natychmiast wezwij elektryka.</p><blockquote>Nigdy nie ignoruj zapachu spalenizny ani widocznych uszkodzeń elementów elektrycznych. To poważne zagrożenie pożarowe.</blockquote><h3>4. Brzęczenie lub szumy z instalacji</h3><p>Instalacja elektryczna powinna pracować bezgłośnie. Brzęczenie, szumy lub trzaski z gniazdek, wyłączników lub tablicy rozdzielczej wskazują na luźne połączenia lub łukowanie — obydwa zagrożenia mogą spowodować pożar.</p><h3>5. Stara lub niedostateczna instalacja</h3><p>Jeśli Twój dom ma ponad 30 lat i instalacja nie była modernizowana, możesz mieć przewody aluminiowe lub niewystarczający przekrój do współczesnych urządzeń. Sygnały przestarzałej instalacji:</p><ul><li>Gniazdka dwużyłowe zamiast trzypinowych z uziemieniem</li><li>Za mało gniazdek (wymuszanie nadmiernego używania przedłużaczy)</li><li>Okablowanie aluminiowe (charakterystyczne dla budynków z lat 70. i 80.)</li></ul><h2>Koszty odkładania decyzji</h2><p>Odkładanie wezwania elektryka jest kuszące, ale problemy elektryczne nie znikają — narastają i stają się coraz bardziej niebezpieczne. Profesjonalna naprawa to inwestycja w bezpieczeństwo Twojego domu.</p><h2>Henel — szybka pomoc w Poznaniu</h2><p>Jeśli zauważyłeś którykolwiek z powyższych sygnałów, nie zwlekaj. Henel naprawa silników elektrycznych zapewnia szybki dojazd na terenie Poznania i okolic. Zadzwoń, a nasz uprawniony specjalista zdiagnozuje i naprawi problem.</p>',
    image:
      "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/darpol-elektryk/blog-bezpieczenstwo-instalacji.jpg",
    author: "Henel",
    category: "Bezpieczeństwo",
    tags: ["bezpieczeństwo", "awarie", "instalacje"],
    status: "published" as const,
    standalone: false,
    publishedAt: new Date("2026-03-10T09:00:00.000Z"),
  },
  {
    slug: "jak-obnizyc-rachunki-za-prad",
    lang: "pl",
    title: "Jak obniżyć rachunki za prąd: praktyczny poradnik",
    description:
      "Odkryj sprawdzone sposoby na zmniejszenie zużycia energii elektrycznej i realne oszczędności na rachunkach.",
    content:
      '<h2>Zrozum swoje zużycie energii</h2><p>Pierwszy krok do obniżenia rachunków za prąd to zrozumienie, gdzie zużywasz energię. W większości domów najwięcej prądu pochłaniają ogrzewanie, chłodzenie i duże AGD.</p><h3>Przejdź na oświetlenie LED</h3><p>Żarówki LED zużywają do 75% mniej energii niż tradycyjne żarówki żarnikowe i działają 25 razy dłużej. Ta prosta zmiana może znacząco obniżyć koszty oświetlenia w Twoim domu.</p><h3>Zadbaj o instalację elektryczną</h3><p>Stara, nieszczelna instalacja elektryczna może powodować straty energii. Modernizacja przewodów aluminiowych na miedziane i wymiana tablicy rozdzielczej poprawia sprawność całej instalacji.</p><ul><li>Wymień stare gniazdka i wyłączniki na nowoczesne</li><li>Sprawdź stan izolacji przewodów</li><li>Zainstaluj programowalny termostat</li><li>Rozważ ogrzewanie podłogowe w kluczowych pomieszczeniach</li></ul><h3>Mądrze używaj urządzeń AGD</h3><p>Duże AGD odpowiada za znaczną część zużycia energii:</p><ul><li><strong>Lodówka:</strong> Ustaw na 3–4°C, zamrażarkę na -18°C</li><li><strong>Pralka:</strong> W miarę możliwości pierz w zimnej wodzie</li><li><strong>Zmywarka:</strong> Uruchamiaj tylko przy pełnym załadunku</li></ul><h3>Wyeliminuj pobór prądu w trybie czuwania</h3><p>Wiele urządzeń zużywa energię nawet po wyłączeniu. Używaj inteligentnych listew zasilających, aby całkowicie odciąć zasilanie.</p><h3>Rozważ fotowoltaikę</h3><p>Panele fotowoltaiczne w połączeniu z elektrycznym ogrzewaniem podłogowym mogą praktycznie wyeliminować rachunki za prąd. Henel naprawa silników elektrycznych pomoże w przygotowaniu instalacji elektrycznej pod fotowoltaikę.</p><h2>Profesjonalny audyt energetyczny</h2><p>Zlecenie audytu energetycznego pomoże wskazać konkretne miejsca, w których Twój dom traci energię. Wdrożenie zaleceń może obniżyć rachunki o 20–30%.</p>',
    image:
      "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/darpol-elektryk/blog-oszczedzanie-energii.jpg",
    author: "Henel",
    category: "Efektywność energetyczna",
    tags: ["energia", "oszczędności", "LED"],
    status: "published" as const,
    standalone: false,
    publishedAt: new Date("2026-01-25T10:00:00.000Z"),
  },
  {
    slug: "instalacja-odgromowa-kiedy-i-dlaczego",
    lang: "pl",
    title:
      "Instalacja odgromowa — kiedy jest obowiązkowa i dlaczego warto?",
    description:
      "Wszystko co powinieneś wiedzieć o instalacjach odgromowych — przepisy, normy, koszty i korzyści z ochrony przed piorunem.",
    content:
      '<h2>Czym jest instalacja odgromowa?</h2><p>Instalacja odgromowa (piorunochron) to system zabezpieczeń chroniący budynek przed bezpośrednim uderzeniem pioruna. Składa się ze zwodów (na dachu), przewodów odprowadzających i uziemienia.</p><h3>Kiedy instalacja odgromowa jest obowiązkowa?</h3><p>Zgodnie z polskim prawem budowlanym, instalacja odgromowa jest wymagana w następujących przypadkach:</p><ul><li><strong>Budynki użyteczności publicznej:</strong> Szkoły, szpitale, urzędy, kościoły</li><li><strong>Budynki wysokie:</strong> Powyżej 15 metrów</li><li><strong>Obiekty zagrożone wybuchem:</strong> Stacje paliw, magazyny chemiczne</li><li><strong>Budynki z pokryciem łatwopalnym:</strong> Dachy pokryte strzechą lub drewnem</li></ul><h3>Dlaczego warto mieć instalację odgromową?</h3><p>Nawet jeśli przepisy nie wymagają piorunochronu w Twoim domu, warto go zamontować ze względu na:</p><ul><li><strong>Ochrona przed pożarem:</strong> Piorun generuje temperaturę do 30 000°C</li><li><strong>Ochrona elektroniki:</strong> Przepięcia niszczą sprzęt AGD i RTV</li><li><strong>Niższe ubezpieczenie:</strong> Niektórzy ubezpieczyciele oferują zniżki</li><li><strong>Bezpieczeństwo domowników:</strong> Eliminacja ryzyka porażenia</li></ul><h3>Norma PN-EN 62305</h3><p>Wszystkie instalacje odgromowe powinny być wykonane zgodnie z normą PN-EN 62305, która określa poziomy ochrony odgromowej (LPL I-IV) w zależności od klasy budynku i analizy ryzyka.</p><h3>Przeglądy instalacji odgromowych</h3><p>Instalacja odgromowa wymaga regularnych przeglądów:</p><ul><li>Co 5 lat — budynki mieszkalne</li><li>Co 1 rok — obiekty zagrożone</li><li>Po każdym uderzeniu pioruna</li></ul><h2>Henel — instalacje odgromowe w Poznaniu</h2><p>Henel naprawa silników elektrycznych specjalizuje się również w projektowaniu i montażu systemów odgromowych. Wykonujemy instalacje od podstaw oraz przeglądy i modernizacje istniejących systemów. Skontaktuj się z nami, aby uzyskać bezpłatną wycenę.</p>',
    image:
      "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/darpol-elektryk/blog-instalacja-odgromowa.jpg",
    author: "Henel",
    category: "Instalacje",
    tags: ["odgromowa", "piorunochron", "normy", "bezpieczeństwo"],
    status: "published" as const,
    standalone: false,
    publishedAt: new Date("2025-11-15T08:00:00.000Z"),
  },
];

async function upsertBlog(
  siteId: number,
  blogData: (typeof blogs)[0]
) {
  const existing = await getBlogBySlug(
    siteId,
    blogData.slug,
    blogData.lang
  );
  if (existing) {
    await updateBlog(existing.id, {
      title: blogData.title,
      description: blogData.description,
      content: blogData.content,
      category: blogData.category,
      standalone: blogData.standalone,
      status: blogData.status,
      publishedAt: blogData.publishedAt,
      tags: blogData.tags,
      author: blogData.author,
      image: blogData.image,
    });
    console.log(
      `  Updated blog [${blogData.lang}]: ${blogData.slug}`
    );
  } else {
    await createBlog({ siteId, ...blogData });
    console.log(
      `  Created blog [${blogData.lang}]: ${blogData.slug}`
    );
  }
}

async function main() {
  console.log("Saving config for henel...");
  await upsertSiteConfig("henel", config as any);
  console.log("Config saved.");

  console.log("Saving translations...");
  await updateSiteTranslations("henel", translations);
  console.log("Translations saved.");

  console.log("Seeding blogs...");
  const site = await getSiteBySubdomain("henel");
  if (site) {
    for (const blog of blogs) {
      await upsertBlog(site.id, blog);
    }
    console.log("Blogs seeded.");
  } else {
    console.warn(
      "Site not found after upsert – skipping blog seed."
    );
  }

  console.log("Updating status to active...");
  await updateSiteStatus("henel", "active");
  console.log("Status updated to active.");

  console.log("Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
