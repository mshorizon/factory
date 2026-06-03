#!/usr/bin/env tsx
/**
 * Save site config for Kancelaria Notarialna Dariusz Klimonda
 * Lead ID: 8, Subdomain: kancelaria-notarialna-dariusz
 */

import { initDb, upsertSiteConfig, updateSiteStatus, getSiteBySubdomain, getBlogBySlug, createBlog, updateBlog } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

const config = {
  business: {
    id: "kancelaria-notarialna-dariusz",
    name: "Kancelaria Notarialna Dariusz Klimonda",
    industry: "legal",
    assets: {
      favicon: "/assets/portfolio-law-favicon.svg",
      icon: "/assets/portfolio-law-logo.svg"
    },
    contact: {
      address: "ul. Wielicka 30, budynek A, parter, 30-552 Kraków",
      phone: "+48 536 951 371",
      email: "kancelaria@notariuszdk.pl",
      location: {
        latitude: 50.03917,
        longitude: 19.96145
      }
    }
  },
  theme: {
    preset: "elegant",
    majorTheme: "template-law",
    mode: "light",
    colors: {
      light: {
        primary: "#232F43",
        primaryLight: "#324563",
        primaryDark: "#1A2332",
        surface: {
          base: "#EDF0F5",
          alt: "#232F43",
          card: "#FFFFFF",
          gradient: "#F9FAFC"
        },
        text: {
          main: "#131820",
          muted: "#2E3238",
          onPrimary: "#FFFFFF"
        }
      },
      dark: {
        primary: "#8BA0C2",
        primaryLight: "#2B3A54",
        primaryDark: "#1A2332",
        surface: {
          base: "#1A2332",
          alt: "#2E3A4D",
          card: "#253245"
        },
        text: {
          main: "#EDF0F5",
          muted: "#8BA0C2",
          onPrimary: "#1A2332"
        }
      }
    },
    typography: {
      primary: "'Montserrat', system-ui, -apple-system, sans-serif",
      secondary: "'Lora', 'Georgia', serif"
    },
    ui: {
      radius: "12px",
      spacing: {
        xs: "0.5rem",
        sm: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
        "3xl": "4rem",
        "section-sm": "3.75rem",
        section: "3.75rem",
        container: "2.5rem"
      }
    },
    headingWeight: "400",
    maxFontWeight: "400",
    navFontSize: "14px",
    navLogoSize: "16px",
    navLogoWeight: "400",
    navLinksPosition: "right",
    scrollType: "smooth",
    badgeVariant: "accent",
    badgeFontSize: "14px"
  },
  layout: {
    navbar: {
      variant: "transparent",
      logoText: "Not. Dariusz Klimonda",
      hideBorderOnTop: true,
      hideCta: true,
      showSocials: false,
      showAvailability: false,
      showAddress: false,
      showAdditionalInfo: false,
      extensions: [
        {
          type: "upper-bar"
        }
      ]
    },
    footer: {
      variant: "darkColumns",
      name: "Kancelaria Notarialna Dariusz Klimonda",
      copyright: "2026 Kancelaria Notarialna Dariusz Klimonda",
      tagline: "Notariusz Dariusz Klimonda. Profesjonalna obsługa notarialna w Krakowie.",
      background: {
        enabled: true,
        padding: "16px",
        borderRadius: "16px",
        gradient: "primary-to-primary-dark"
      },
      links: [
        {
          label: "RODO",
          target: {
            type: "page",
            value: "rodo"
          }
        }
      ],
      columns: [
        {
          title: "Strony",
          links: [
            {
              label: "Strona główna",
              target: { type: "page", value: "home" }
            },
            {
              label: "O mnie",
              target: { type: "page", value: "about" }
            },
            {
              label: "Kontakt",
              target: { type: "page", value: "contact" }
            },
            {
              label: "RODO",
              target: { type: "page", value: "rodo" }
            }
          ]
        },
        {
          title: "Kontakt",
          links: [
            {
              label: "kancelaria@notariuszdk.pl",
              target: {
                type: "email",
                value: "kancelaria@notariuszdk.pl"
              }
            },
            {
              label: "+48 536 951 371",
              target: {
                type: "phone",
                value: "+48536951371"
              }
            },
            {
              label: "+48 12 312 06 03",
              target: {
                type: "phone",
                value: "+48123120603"
              }
            }
          ]
        }
      ]
    },
    hideBreadcrumbs: true
  },
  navigation: {
    cta: {
      label: "Kontakt",
      target: {
        type: "page",
        value: "contact"
      }
    }
  },
  data: {
    services: [
      {
        id: "akty-notarialne",
        slug: "akty-notarialne",
        title: "Akty Notarialne",
        description: "Sporządzanie aktów notarialnych: sprzedaż i zakup nieruchomości, darowizny, umowy dożywocia, ustanowienie hipotek i służebności.",
        icon: "file-text",
        category: "notarialne",
        available: true
      },
      {
        id: "dziedziczenie",
        slug: "dziedziczenie",
        title: "Dziedziczenie i Spadki",
        description: "Sporządzanie aktów poświadczenia dziedziczenia, europejskich poświadczeń spadkowych, testamentów i protokołów otwarcia testamentu.",
        icon: "scale",
        category: "dziedziczenie",
        available: true
      },
      {
        id: "zarzad-sukcesyjny",
        slug: "zarzad-sukcesyjny",
        title: "Zarząd Sukcesyjny",
        description: "Czynności związane z zarządem sukcesyjnym przedsiębiorstwem osoby fizycznej po śmierci przedsiębiorcy oraz z tymczasowym przedstawicielem.",
        icon: "briefcase",
        category: "sukcesyjny",
        available: true
      },
      {
        id: "poswiadczenia",
        slug: "poswiadczenia",
        title: "Poświadczenia",
        description: "Poświadczenia własnoręczności podpisu, zgodności kopii z oryginałem, daty okazania dokumentu oraz pozostałych poświadczeń notarialnych.",
        icon: "shield",
        category: "poswiadczenia",
        available: true
      },
      {
        id: "depozyty-notarialne",
        slug: "depozyty-notarialne",
        title: "Depozyty Notarialne",
        description: "Przyjmowanie na przechowanie pieniędzy, papierów wartościowych, dokumentów i danych informatycznych w bezpiecznym depozycie notarialnym.",
        icon: "lock",
        category: "depozyty",
        available: true
      },
      {
        id: "wnioski-kw",
        slug: "wnioski-kw",
        title: "Wnioski do Ksiąg Wieczystych",
        description: "Składanie wniosków o wpis w księdze wieczystej wraz z dokumentami stanowiącymi podstawę wpisu — elektronicznie w dniu czynności.",
        icon: "home",
        category: "nieruchomosci",
        available: true
      }
    ]
  },
  pages: {
    home: {
      title: "Kancelaria Notarialna Kraków – Notariusz Dariusz Klimonda",
      navLabel: "Strona główna",
      sections: [
        {
          type: "hero",
          variant: "split",
          background: "transparent",
          hideDots: true,
          badgeLayout: "column",
          header: {
            badge: "Kancelaria Notarialna",
            title: "Profesjonalna obsługa notarialna w Krakowie",
            subtitle: "Kancelaria Notarialna Dariusz Klimonda. Skuteczne i rzetelne przeprowadzanie czynności notarialnych dla osób fizycznych i przedsiębiorców w Krakowie."
          },
          image: "/assets/portfolio-law-hero.png",
          cta: {
            label: "Skontaktuj się",
            target: { type: "page", value: "contact" }
          }
        },
        {
          type: "services",
          variant: "grid",
          minimal: true,
          detailsLabel: "Zobacz szczegóły",
          header: {
            title: "Czynności notarialne"
          },
          items: [
            {
              title: "Akty Notarialne",
              slug: "akty-notarialne",
              description: "Sporządzanie aktów notarialnych: sprzedaż i zakup nieruchomości, darowizny, umowy dożywocia, ustanowienie hipotek i służebności."
            },
            {
              title: "Dziedziczenie i Spadki",
              slug: "dziedziczenie",
              description: "Sporządzanie aktów poświadczenia dziedziczenia, europejskich poświadczeń spadkowych, testamentów i protokołów otwarcia testamentu."
            },
            {
              title: "Zarząd Sukcesyjny",
              slug: "zarzad-sukcesyjny",
              description: "Czynności związane z zarządem sukcesyjnym przedsiębiorstwem osoby fizycznej po śmierci przedsiębiorcy."
            },
            {
              title: "Poświadczenia",
              slug: "poswiadczenia",
              description: "Poświadczenia własnoręczności podpisu, zgodności kopii z oryginałem i pozostałych poświadczeń notarialnych."
            },
            {
              title: "Depozyty Notarialne",
              slug: "depozyty-notarialne",
              description: "Przyjmowanie na przechowanie pieniędzy, papierów wartościowych i dokumentów w bezpiecznym depozycie notarialnym."
            },
            {
              title: "Wnioski do Ksiąg Wieczystych",
              slug: "wnioski-kw",
              description: "Składanie wniosków o wpis w księdze wieczystej wraz z dokumentami stanowiącymi podstawę wpisu."
            }
          ]
        },
        {
          type: "about-summary",
          variant: "default",
          background: "dark-padded",
          hideDots: true,
          badgeVariant: "text",
          badgeColor: "#CCCCCC",
          descriptionColor: "#CCCCCC",
          ctaColor: "#FFFFFF",
          statsInverted: true,
          imagePaddingY: "100px",
          ctaPaddingBottom: "100px",
          header: {
            badge: "O notariuszu",
            title: "Doświadczenie i profesjonalizm w służbie klientów",
            subtitle: "Kancelaria Notarialna Dariusz Klimonda zapewnia profesjonalną obsługę notarialną w Krakowie. Absolwent Wydziału Prawa UJ, notariusz od 2015 roku."
          },
          image: "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/portfolio-law-001/about-lawyer.png",
          cta: {
            label: "Więcej o kancelarii",
            target: { type: "page", value: "about" }
          },
          stats: [
            { value: "11+", label: "Lat jako notariusz" },
            { value: "2015", label: "Rok otwarcia kancelarii" },
            { value: "2020", label: "Kancelaria jednoosobowa od" },
            { value: "UJ", label: "Absolwent prawa" }
          ]
        },
        {
          type: "features",
          variant: "icon-tiles",
          badgeVariant: "accent",
          header: {
            badge: "Narzędzia",
            title: "Nowoczesna kancelaria notarialna",
            subtitle: "Korzystamy z nowoczesnych systemów informatycznych zapewniających sprawną i terminową realizację czynności notarialnych."
          },
          items: [
            {
              title: "Elektroniczne KW",
              description: "Elektroniczny dostęp do ksiąg wieczystych — weryfikacja stanu prawnego nieruchomości i składanie wniosków o wpis w czasie rzeczywistym.",
              icon: "home",
              linkLabel: "Dowiedz się więcej",
              linkHref: "https://ekw.ms.gov.pl"
            },
            {
              title: "ePUAP",
              description: "Elektroniczna Platforma Usług Administracji Publicznej — składanie dokumentów i wniosków urzędowych drogą elektroniczną.",
              icon: "file-text",
              linkLabel: "Dowiedz się więcej",
              linkHref: "https://epuap.gov.pl/wps/portal"
            },
            {
              title: "KRS / CEIDG",
              description: "Dostęp do Krajowego Rejestru Sądowego oraz Centralnej Ewidencji i Informacji o Działalności Gospodarczej do weryfikacji podmiotów.",
              icon: "building",
              linkLabel: "Dowiedz się więcej",
              linkHref: "https://www.gov.pl/web/krs"
            },
            {
              title: "LEX",
              description: "Dostęp do kompleksowych baz danych aktów prawnych, orzeczeń sądowych i komentarzy — kluczowe narzędzie każdego notariusza.",
              icon: "book-open",
              linkLabel: "Dowiedz się więcej",
              linkHref: "https://www.wolterskluwer.com/pl-pl/solutions/lex"
            },
            {
              title: "CREWAN",
              description: "Centralny Rejestr Aktów Notarialnych — elektroniczny rejestr sporządzanych aktów notarialnych, dostępny dla uprawnionych organów.",
              icon: "database",
              linkLabel: "Dowiedz się więcej",
              linkHref: "#"
            },
            {
              title: "NORT",
              description: "Notarialny Rejestr Testamentów — ogólnopolski rejestr umożliwiający wyszukiwanie informacji o sporządzonych testamentach.",
              icon: "file",
              linkLabel: "Dowiedz się więcej",
              linkHref: "#"
            },
            {
              title: "Portal Klienta",
              description: "Dedykowany portal umożliwiający klientom wymianę dokumentów i korespondencji z kancelarią w sposób bezpieczny i wygodny.",
              icon: "globe",
              linkLabel: "Dowiedz się więcej",
              linkHref: "#"
            },
            {
              title: "Bezpieczna komunikacja",
              description: "Szyfrowana platforma komunikacji zapewniająca pełną poufność korespondencji i przesyłania dokumentów z klientem.",
              icon: "shield",
              linkLabel: "Dowiedz się więcej",
              linkHref: "#"
            }
          ]
        },
        {
          type: "testimonials",
          variant: "centered",
          header: {
            badge: "Opinie",
            title: "Co mówią nasi klienci",
            subtitle: "Zaufanie i rzetelność potwierdzone przez naszych klientów",
            layout: "none"
          },
          items: [
            {
              title: "Profesjonalna i sprawna obsługa",
              description: "Notariusz Klimonda przeprowadził transakcję zakupu nieruchomości szybko i sprawnie. Wszystko zostało wyjaśnione w przystępny i zrozumiały sposób. Gorąco polecam kancelarię.",
              author: "Marek Wiśniewski",
              role: "Klient prywatny"
            },
            {
              title: "Kompetencja i życzliwość",
              description: "Kancelaria pomogła nam przeprowadzić postępowanie spadkowe po rodzicu. Notariusz wyczerpująco wyjaśnił wszystkie kwestie prawne i zadbał o nasze interesy na każdym etapie.",
              author: "Anna Kowalska",
              role: "Klientka prywatna"
            },
            {
              title: "Polecam wszystkim",
              description: "Korzystałem z usług kancelarii przy zakupie mieszkania. Wszystko przebiegło bez problemów, termin był dotrzymany, a notariusz był bardzo pomocny. Zdecydowanie polecam.",
              author: "Piotr Nowak",
              role: "Klient biznesowy"
            }
          ]
        },
        {
          type: "faq",
          variant: "split",
          background: "light",
          header: {
            title: "Często zadawane pytania",
            subtitle: "Nie znalazłeś odpowiedzi na swoje pytanie?"
          },
          cta: {
            label: "Skontaktuj się",
            target: { type: "page", value: "contact" }
          },
          faqItems: [
            {
              question: "Jak umówić się na wizytę w kancelarii notarialnej?",
              answer: "Wizytę można umówić telefonicznie pod numerem +48 536 951 371 lub +48 12 312 06 03, mailowo na adres kancelaria@notariuszdk.pl, lub za pomocą formularza kontaktowego. Kancelaria czynna jest od poniedziałku do piątku w godzinach 9:00–17:00, z możliwością umówienia wizyty poza godzinami otwarcia, również w soboty."
            },
            {
              question: "Co powinienem zabrać na spotkanie z notariuszem?",
              answer: "Na spotkanie należy zabrać ważny dowód osobisty lub paszport. W zależności od rodzaju czynności konieczne mogą być dodatkowe dokumenty, np. numer księgi wieczystej, akt własności, zaświadczenie o zameldowaniu czy NIP firmy. Szczegółowa lista wymaganych dokumentów przekazywana jest podczas uzgadniania terminu."
            },
            {
              question: "Ile kosztują czynności notarialne?",
              answer: "Opłaty notarialne (taksa notarialna) są regulowane rozporządzeniem Ministra Sprawiedliwości i ustalane na podstawie wartości przedmiotu czynności. Notariusz ma obowiązek wycenić czynność zgodnie z obowiązującymi przepisami. Szczegółowe informacje o kosztach udzielamy podczas wstępnej konsultacji telefonicznej lub mailowej."
            },
            {
              question: "Czy notariusz może reprezentować jedną ze stron?",
              answer: "Nie. Notariusz jest osobą zaufania publicznego i działa bezstronnie na rzecz wszystkich uczestników czynności. Jego rolą jest sporządzenie aktu notarialnego, który w równym stopniu chroni interesy każdej ze stron transakcji."
            },
            {
              question: "Jakie dokumenty są potrzebne do sprzedaży nieruchomości?",
              answer: "Do umowy sprzedaży nieruchomości potrzebne są: numer księgi wieczystej, dokument potwierdzający własność (akt notarialny lub postanowienie sądowe), zaświadczenie o braku zaległości podatkowych, zaświadczenie ze spółdzielni mieszkaniowej (jeśli dotyczy) oraz zaświadczenie o braku osób zameldowanych. Pełna lista dokumentów jest przekazywana indywidualnie po zapoznaniu się ze sprawą."
            }
          ]
        },
        {
          type: "contact",
          variant: "minimal",
          ctaVariant: "primaryLight",
          header: {
            badge: "Kontakt",
            title: "Skontaktuj się z nami",
            subtitle: "Potrzebujesz pomocy notarialnej lub masz pytania? Jesteśmy do Twojej dyspozycji."
          },
          cta: {
            label: "Skontaktuj się",
            target: { type: "page", value: "contact" }
          }
        }
      ]
    },
    about: {
      title: "O Notariuszu",
      navLabel: "O mnie",
      navOrder: 1,
      sections: [
        {
          type: "about",
          variant: "story",
          imagePosition: "right",
          ctaVariant: "primaryLight",
          header: {
            title: "Notariusz Dariusz Klimonda"
          },
          image: "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/portfolio-law-001/about-lawyer.png",
          story: {
            content: "W 2010 roku ukończyłem prawo na Wydziale Prawa i Administracji Uniwersytetu Jagiellońskiego. W tym samym roku rozpocząłem aplikację notarialną pod patronatem notariusza Joanny Greguły.\n\nPo ukończeniu aplikacji notarialnej, w 2013 roku zdałem egzamin notarialny z wynikiem bardzo dobrym. Od 2014 roku, po złożeniu ślubowania, dokonywałem czynności notarialnych jako zastępca notarialny, zdobywając niezbędne doświadczenie zawodowe.\n\nOd kwietnia 2015 roku, jako notariusz, prowadziłem kancelarię w formie spółki cywilnej. Od kwietnia 2020 roku prowadzę Kancelarię Notarialną jednoosobowo, świadcząc pełen zakres usług notarialnych dla klientów indywidualnych i przedsiębiorców na terenie Krakowa i całej Małopolski."
          },
          cta: {
            label: "Skontaktuj się",
            target: { type: "page", value: "contact" }
          }
        },
        {
          type: "about",
          variant: "career",
          header: {
            title: "Droga zawodowa"
          },
          timeline: [
            {
              year: "2020 — Obecnie",
              title: "Notariusz",
              company: "Kancelaria Notarialna Dariusz Klimonda (działalność jednoosobowa)",
              description: "Prowadzę Kancelarię Notarialną jednoosobowo przy ul. Wielickiej 30 w Krakowie. Świadczę pełen zakres usług notarialnych dla klientów indywidualnych i przedsiębiorców."
            },
            {
              year: "2015 — 2020",
              title: "Notariusz",
              company: "Kancelaria Notarialna (spółka cywilna), Kraków",
              description: "Prowadziłem kancelarię notarialną w formie spółki cywilnej, specjalizując się w obrocie nieruchomościami, prawie spadkowym i obsłudze przedsiębiorców."
            },
            {
              year: "2014 — 2015",
              title: "Zastępca Notarialny",
              company: "Kraków",
              description: "Po złożeniu ślubowania dokonywałem czynności notarialnych jako zastępca notarialny, zdobywając niezbędne doświadczenie zawodowe w praktyce notarialnej."
            },
            {
              year: "2010 — 2013",
              title: "Aplikant Notarialny",
              company: "Pod patronatem notariusza Joanny Greguły, Kraków",
              description: "Odbyłem aplikację notarialną pod patronatem doświadczonego notariusza, zakończoną egzaminem notarialnym w 2013 roku z wynikiem bardzo dobrym."
            }
          ]
        },
        {
          type: "about",
          variant: "story",
          header: {
            title: "Obszar działalności"
          },
          story: {
            content: "Kancelaria Notarialna Dariusz Klimonda świadczy usługi notarialne na terenie całej Polski, ze szczególnym uwzględnieniem Krakowa i województwa małopolskiego.\n\nKancelaria mieści się przy ul. Wielickiej 30, budynek A, parter, 30-552 Kraków — w kompleksie biurowców w bezpośrednim sąsiedztwie Urzędu Miasta Krakowa (Wielicka 28). W pobliżu kancelarii znajdują się bezpłatne miejsca postojowe. Najbliższy przystanek komunikacji miejskiej to Cmentarz Podgórski.\n\nGodziny pracy: poniedziałek–piątek 9:00–17:00. Istnieje możliwość telefonicznego umówienia się poza godzinami otwarcia, również w soboty.\n\nPrzed każdą czynnością notarialną prosimy o wcześniejszy kontakt telefoniczny lub mailowy w celu uzgodnienia listy niezbędnych dokumentów i terminu spotkania."
          }
        },
        {
          type: "contact",
          variant: "minimal",
          header: {
            badge: "Kontakt",
            title: "Skontaktuj się z nami",
            subtitle: "Potrzebujesz pomocy notarialnej lub masz pytania? Jesteśmy do Twojej dyspozycji."
          },
          cta: {
            label: "Skontaktuj się",
            target: { type: "page", value: "contact" }
          }
        }
      ]
    },
    contact: {
      title: "Kontakt",
      navLabel: "Kontakt",
      sections: [
        {
          type: "contact",
          variant: "professional",
          header: {
            title: "Skontaktuj się z nami",
            subtitle: "Skontaktuj się z Kancelarią Notarialną Dariusza Klimondy. Chętnie odpowiemy na pytania i umówimy termin wizyty."
          },
          info: {
            address: "ul. Wielicka 30, budynek A, parter, 30-552 Kraków",
            phone: "+48 536 951 371",
            email: "kancelaria@notariuszdk.pl",
            hours: "GODZINY OTWARCIA",
            hoursDetailed: [
              "PONIEDZIAŁEK – PIĄTEK 9.00 – 17.00."
            ],
            receptionHours: "poza godzinami otwarcia i w soboty (po uzgodnieniu telefonicznym)",
            receptionLabel: "Wizyty poza godzinami",
            notice: {
              title: "Dodatkowy numer telefonu",
              highlight: "+48 12 312 06 03",
              description: "Dostępny w godzinach pracy kancelarii. Prosimy o wcześniejsze uzgodnienie terminu wizyty."
            }
          },
          form: {
            nameLabel: "Imię i nazwisko",
            namePlaceholder: "Twoje imię i nazwisko",
            emailLabel: "Email",
            emailPlaceholder: "twoj@email.pl",
            messageLabel: "Wiadomość",
            messagePlaceholder: "Opisz sprawę, w której potrzebujesz pomocy notarialnej...",
            submitButton: "Wyślij wiadomość"
          }
        },
        {
          type: "map",
          badgeVariant: "accent",
          badgeLayout: "column",
          header: {
            badge: "Lokalizacja",
            title: "Znajdź nas",
            subtitle: "Kancelaria Notarialna Dariusz Klimonda, ul. Wielicka 30, bud. A, parter, 30-552 Kraków"
          },
          openInMapsLabel: "Otwórz w Mapach Google",
          directionsLabel: "Trasa do"
        }
      ]
    },
    informations: {
      title: "Informacje",
      navLabel: "Informacje",
      navOrder: 2,
      sections: [
        {
          type: "blog",
          variant: "cards-light",
          columns: 2,
          header: {
            badge: "Informacje",
            title: "Informacje dla klientów",
            subtitle: "Praktyczne informacje dotyczące czynności notarialnych i kosztów kancelarii"
          },
          blogSlugs: [
            "przygotowanie-do-czynnosci-notarialnej",
            "koszty-czynnosci-notarialnych"
          ],
          ctaLabel: "Czytaj więcej"
        }
      ]
    },
    rodo: {
      title: "RODO",
      hideFromNav: true,
      sections: [
        {
          type: "blog-standalone",
          blogSlug: "rodo"
        }
      ]
    }
  },
  sharedSections: {}
} as const;

const blogs = [
  {
    slug: "przygotowanie-do-czynnosci-notarialnej",
    lang: "pl",
    title: "Jak przygotować się do czynności notarialnej – przewodnik klienta",
    description: "Praktyczny przewodnik dla klientów kancelarii notarialnej: jak przygotować się do wizyty, jakie dokumenty zabrać, czego oczekiwać od współpracy z notariuszem i jakie prawa przysługują klientowi.",
    standalone: true,
    status: "published" as const,
    category: "Informacje",
    content: "<h2>1. Pierwsze spotkanie z notariuszem – jak się przygotować</h2><p>Efektywna wizyta w kancelarii notarialnej zaczyna się od właściwego przygotowania. Zanim umówisz termin, skontaktuj się z kancelarią telefonicznie lub mailowo, aby ustalić, jakie dokumenty są niezbędne dla planowanej czynności. Każda czynność notarialna ma swoje wymagania – przygotowanie dokumentów z wyprzedzeniem pozwala uniknąć opóźnień i dodatkowych wizytowania.</p><p>Na każdą wizytę należy zabrać:</p><ul><li>ważny dokument tożsamości – dowód osobisty lub paszport,</li><li>numer PESEL i ewentualnie NIP (dla przedsiębiorców),</li><li>wszystkie dokumenty związane z planowaną czynnością,</li><li>pełnomocnictwo, jeśli ktoś działa w imieniu innej osoby.</li></ul><h2>2. Tajemnica notarialna – Twoja gwarancja poufności</h2><p>Notariusz jest objęty tajemnicą zawodową. Wszelkie informacje przekazane kancelarii w związku z planowaną czynnością notarialną są bezwzględnie poufne. Obowiązek zachowania tajemnicy notarialnej jest bezterminowy i nie wygasa po zakończeniu współpracy.</p><p>Możesz swobodnie i otwarcie przedstawić notariuszowi wszelkie okoliczności sprawy. Pełna wiedza pozwala notariuszowi właściwie przygotować dokumenty i pouczyć strony o skutkach prawnych planowanej czynności.</p><h2>3. Jakie dokumenty są potrzebne do najczęstszych czynności?</h2><p>Wymagania dokumentacyjne zależą od rodzaju czynności notarialnej:</p><ul><li><strong>Umowa sprzedaży nieruchomości:</strong> numer księgi wieczystej, akt własności, zaświadczenie o niezaleganiu z podatkami, zaświadczenie o braku osób zameldowanych, zaświadczenie ze spółdzielni (jeśli dotyczy).</li><li><strong>Akt poświadczenia dziedziczenia:</strong> akt zgonu spadkodawcy, akty urodzenia lub małżeństwa spadkobierców, testament (jeśli istnieje).</li><li><strong>Testament notarialny:</strong> tylko ważny dokument tożsamości – treść testamentu ustalana jest z klientem podczas wizyty.</li><li><strong>Pełnomocnictwo:</strong> dokument tożsamości mocodawcy, dane pełnomocnika i opis zakresu pełnomocnictwa.</li><li><strong>Umowa spółki:</strong> dane wspólników, projekt umowy lub opis planowanej działalności.</li></ul><h2>4. Jak przebiega czynność notarialna?</h2><p>Notariusz odczytuje projekt dokumentu przed jego podpisaniem. Ma to na celu upewnienie się, że wszystkie strony rozumieją treść i w pełni wyrażają swoją wolę. Masz prawo zadawać pytania i prosić o wyjaśnienia – notariusz jest zobowiązany odpowiadać w sposób zrozumiały dla klienta.</p><p>Notariusz jako osoba zaufania publicznego działa bezstronnie, chroniąc interesy wszystkich uczestników czynności. Wyjaśnia skutki prawne podejmowanych decyzji, wskazuje na ryzyka i czuwa nad zgodnością czynności z obowiązującym prawem.</p><p>Po podpisaniu aktu notariusz wykonuje niezbędne czynności urzędowe – wniosek o wpis do księgi wieczystej składany jest elektronicznie w dniu dokonania czynności notarialnej.</p><h2>5. Prawa klienta kancelarii notarialnej</h2><p>Jako klient kancelarii notarialnej przysługują Ci następujące prawa:</p><ul><li><strong>Prawo do informacji</strong> – notariusz wyjaśnia skutki prawne każdej czynności i poucza o konsekwencjach podejmowanych decyzji.</li><li><strong>Prawo do bezstronności</strong> – notariusz działa na rzecz wszystkich stron, nie reprezentuje żadnej z nich jednostronnie.</li><li><strong>Prawo do wglądu w dokumentację</strong> – możesz otrzymać wypis lub wyciąg z aktu notarialnego w każdym czasie.</li><li><strong>Prawo do odmowy</strong> – możesz zrezygnować z planowanej czynności przed jej dokonaniem bez podania przyczyny.</li></ul><h2>6. Jak umówić wizytę w kancelarii?</h2><p>Zapraszamy do kontaktu telefonicznego lub mailowego w celu ustalenia terminu i listy wymaganych dokumentów. Kancelaria Notarialna Dariusza Klimondy mieści się przy ul. Wielickiej 30, budynek A, parter w Krakowie i czynna jest od poniedziałku do piątku w godzinach 9:00–17:00. Istnieje możliwość umówienia wizyty poza standardowymi godzinami otwarcia, również w soboty.</p>",
    metaTitle: "Jak przygotować się do czynności notarialnej – przewodnik klienta | Kancelaria Notarialna Dariusz Klimonda",
    metaDescription: "Praktyczny przewodnik dla klientów kancelarii notarialnej: jak przygotować się do wizyty, jakie dokumenty zabrać, prawa klienta i przebieg czynności notarialnej w Krakowie.",
    publishedAt: new Date("2026-01-01"),
    tags: [],
  },
  {
    slug: "przygotowanie-do-czynnosci-notarialnej",
    lang: "ua",
    title: "Як підготуватися до нотаріальної дії – путівник клієнта",
    description: "Практичний путівник для клієнтів нотаріальної контори: як підготуватися до візиту, які документи взяти, чого очікувати від співпраці з нотаріусом та які права має клієнт.",
    standalone: true,
    status: "published" as const,
    category: "Інформація",
    content: "<h2>1. Перша зустріч із нотаріусом – як підготуватися</h2><p>Успішний візит до нотаріальної контори починається з належної підготовки. Перш ніж записатися на прийом, зв'яжіться з конторою телефоном або електронною поштою, щоб уточнити, які документи потрібні для запланованої дії. Кожна нотаріальна дія має свої вимоги – підготовка документів заздалегідь дозволяє уникнути затримок і додаткових візитів.</p><p>На кожен візит необхідно взяти:</p><ul><li>дійсний документ, що посвідчує особу – посвідчення особи або паспорт,</li><li>номер PESEL та, за потреби, NIP (для підприємців),</li><li>усі документи, пов'язані із запланованою дією,</li><li>довіреність, якщо хтось діє від імені іншої особи.</li></ul><h2>2. Нотаріальна таємниця – ваша гарантія конфіденційності</h2><p>Нотаріус зобов'язаний дотримуватися професійної таємниці. Будь-яка інформація, передана конторі у зв'язку з планованою нотаріальною дією, є строго конфіденційною. Обов'язок зберігати нотаріальну таємницю є безстроковим і не припиняється після завершення співпраці.</p><p>Ви можете вільно і відверто повідомити нотаріусу про всі обставини справи. Повна інформація дозволяє нотаріусу правильно підготувати документи та роз'яснити сторонам правові наслідки запланованої дії.</p><h2>3. Які документи потрібні для найбільш поширених дій?</h2><p>Вимоги до документів залежать від виду нотаріальної дії:</p><ul><li><strong>Договір купівлі-продажу нерухомості:</strong> номер земельної книги, правовстановлюючий документ, довідка про відсутність податкової заборгованості, довідка про відсутність зареєстрованих мешканців, довідка від кооперативу (за потреби).</li><li><strong>Акт посвідчення спадкування:</strong> свідоцтво про смерть спадкодавця, акти про народження або шлюб спадкоємців, заповіт (якщо є).</li><li><strong>Нотаріальний заповіт:</strong> лише дійсний документ, що посвідчує особу – зміст заповіту узгоджується з клієнтом під час візиту.</li><li><strong>Довіреність:</strong> документ, що посвідчує особу довірителя, дані повіреного та опис обсягу повноважень.</li><li><strong>Установчий договір:</strong> дані учасників, проект договору або опис планованої діяльності.</li></ul><h2>4. Як проходить нотаріальна дія?</h2><p>Нотаріус зачитує проект документа перед його підписанням. Це необхідно для того, щоб усі сторони розуміли зміст і цілком виражали свою волю. Ви маєте право ставити запитання та просити роз'яснень – нотаріус зобов'язаний відповідати в зрозумілій для клієнта формі.</p><p>Нотаріус як особа публічної довіри діє неупереджено, захищаючи інтереси всіх учасників дії. Він роз'яснює правові наслідки прийнятих рішень, вказує на ризики та стежить за відповідністю дії чинному законодавству.</p><p>Після підписання акта нотаріус вчиняє необхідні адміністративні дії – заява про внесення запису до земельної книги подається електронно в день нотаріальної дії.</p><h2>5. Права клієнта нотаріальної контори</h2><p>Як клієнт нотаріальної контори ви маєте такі права:</p><ul><li><strong>Право на інформацію</strong> – нотаріус роз'яснює правові наслідки кожної дії та повідомляє про наслідки прийнятих рішень.</li><li><strong>Право на неупередженість</strong> – нотаріус діє в інтересах усіх сторін, не представляючи жодну з них в односторонньому порядку.</li><li><strong>Право на доступ до документації</strong> – ви можете в будь-який час отримати виписку або витяг з нотаріального акта.</li><li><strong>Право відмовитися</strong> – ви можете відмовитися від запланованої дії до її здійснення без пояснення причин.</li></ul><h2>6. Як записатися на прийом до нотаріуса?</h2><p>Запрошуємо зв'язатися з нами телефоном або електронною поштою для узгодження дати та переліку необхідних документів. Нотаріальна контора Даріуша Климонди розташована за адресою вул. Вєліцька 30, корпус А, перший поверх у Кракові. Контора приймає клієнтів з понеділка по п'ятницю з 9:00 до 17:00. Є можливість записатися на прийом поза стандартними годинами роботи, зокрема в суботу.</p>",
    metaTitle: "Як підготуватися до нотаріальної дії – путівник клієнта | Нотаріальна контора Даріуш Климонда",
    metaDescription: "Практичний путівник для клієнтів нотаріальної контори: як підготуватися до візиту, які документи взяти, права клієнта та порядок проведення нотаріальної дії в Кракові.",
    publishedAt: new Date("2026-01-01"),
    tags: [],
  },
  {
    slug: "koszty-czynnosci-notarialnych",
    lang: "pl",
    title: "Koszty czynności notarialnych – co warto wiedzieć",
    description: "Przewodnik po kosztach czynności notarialnych: taksa notarialna, podatki (PCC, od darowizn, od spadków), opłaty sądowe za wpisy do ksiąg wieczystych i VAT. Jak obliczyć koszt planowanej czynności.",
    standalone: true,
    status: "published" as const,
    category: "Informacje",
    content: "<h2>1. Taksa notarialna – jak ustalane są opłaty notarialne</h2><p>Wynagrodzenie notariusza – zwane taksą notarialną – jest ściśle regulowane przez rozporządzenie Ministra Sprawiedliwości w sprawie maksymalnych stawek taksy notarialnej. Notariusz może pobierać jedynie wynagrodzenie nieprzekraczające maksymalnych stawek określonych w przepisach. Wysokość taksy zależy przede wszystkim od wartości przedmiotu czynności notarialnej.</p><p>Przykładowe maksymalne stawki taksy notarialnej:</p><ul><li>do 3 000 zł wartości: taksa 100 zł,</li><li>powyżej 3 000 zł do 10 000 zł: 100 zł + 3% od nadwyżki ponad 3 000 zł,</li><li>powyżej 10 000 zł do 30 000 zł: 310 zł + 2% od nadwyżki ponad 10 000 zł,</li><li>powyżej 30 000 zł do 60 000 zł: 710 zł + 1% od nadwyżki ponad 30 000 zł,</li><li>powyżej 60 000 zł do 1 000 000 zł: 1 010 zł + 0,4% od nadwyżki ponad 60 000 zł,</li><li>powyżej 1 000 000 zł do 2 000 000 zł: 4 770 zł + 0,2% od nadwyżki ponad 1 000 000 zł.</li></ul><h2>2. VAT na usługi notarialne</h2><p>Usługi notarialne podlegają opodatkowaniu VAT w wysokości 23%. Podatek ten doliczany jest do wynagrodzenia notariusza (taksy notarialnej). VAT nie obejmuje podatków i opłat sądowych, które notariusz pobiera i przekazuje w imieniu Skarbu Państwa – te kwoty są neutralne dla notariusza.</p><h2>3. Podatki przy czynnościach notarialnych</h2><p>Przy wielu czynnościach notarialnych notariusz pobiera i odprowadza należne podatki:</p><ul><li><strong>Podatek od czynności cywilnoprawnych (PCC)</strong> – przy zakupie nieruchomości na rynku wtórnym wynosi 2% wartości rynkowej nieruchomości. Kupujący pierwsze mieszkanie lub dom może być zwolniony z PCC na podstawie odrębnych przepisów.</li><li><strong>Podatek od darowizn i spadków</strong> – wysokość zależy od grupy podatkowej (stopnia pokrewieństwa). Najbliższa rodzina (małżonkowie, dzieci, rodzice, rodzeństwo) może skorzystać ze zwolnienia podatkowego po spełnieniu ustawowych warunków.</li></ul><h2>4. Opłaty sądowe za wpisy do ksiąg wieczystych</h2><p>Przy czynnościach dotyczących nieruchomości notariusz pobiera opłatę sądową za wniosek o wpis do księgi wieczystej i przekazuje ją do właściwego sądu rejonowego. Wniosek o wpis składany jest elektronicznie w dniu dokonania czynności notarialnej. Standardowe stawki opłat sądowych:</p><ul><li>Wpis prawa własności: 200 zł,</li><li>Wpis hipoteki: 200 zł,</li><li>Założenie nowej księgi wieczystej: 60 zł,</li><li>Wpis ostrzeżenia: 60 zł.</li></ul><h2>5. Łączny koszt czynności notarialnej</h2><p>Całkowity koszt czynności notarialnej obejmuje:</p><ul><li><strong>Taksę notarialną</strong> – wynagrodzenie notariusza obliczane od wartości przedmiotu czynności,</li><li><strong>VAT 23%</strong> – podatek naliczany od taksy notarialnej,</li><li><strong>Podatki</strong> – PCC lub podatek od darowizn/spadków, jeśli dotyczy danej czynności,</li><li><strong>Opłaty sądowe</strong> – za wpisy w księdze wieczystej, jeśli dotyczy.</li></ul><h2>6. Jak uzyskać wstępną wycenę kosztów?</h2><p>Przed planowaną czynnością zapraszamy do kontaktu z kancelarią – chętnie pomożemy wstępnie obliczyć koszty na podstawie przekazanych informacji o wartości nieruchomości lub innych parametrów czynności.</p><p>Kancelaria Notarialna Dariusza Klimondy, ul. Wielicka 30, budynek A, parter, 30-552 Kraków. Tel.: +48 536 951 371, +48 12 312 06 03. E-mail: kancelaria@notariuszdk.pl.</p>",
    metaTitle: "Koszty czynności notarialnych – taksa, podatki, opłaty sądowe | Kancelaria Notarialna Dariusz Klimonda",
    metaDescription: "Ile kosztuje czynność notarialna? Taksa notarialna, VAT, PCC, podatek od darowizn i opłaty sądowe za wpisy do KW. Kancelaria Notarialna Dariusz Klimonda, Kraków.",
    publishedAt: new Date("2026-01-01"),
    tags: [],
  },
  {
    slug: "koszty-czynnosci-notarialnych",
    lang: "ua",
    title: "Вартість нотаріальних дій – що варто знати",
    description: "Путівник по витратах на нотаріальні дії: нотаріальна такса, податки (PCC, на дарування, на спадщину), судові збори за записи до земельних книг та ПДВ. Як розрахувати вартість запланованої дії.",
    standalone: true,
    status: "published" as const,
    category: "Інформація",
    content: "<h2>1. Нотаріальна такса – як розраховується винагорода нотаріуса</h2><p>Винагорода нотаріуса – так звана нотаріальна такса – суворо регулюється розпорядженням Міністра юстиції Польщі про максимальні ставки нотаріальної такси. Нотаріус може стягувати лише винагороду, що не перевищує максимальних ставок, встановлених нормативними актами. Розмір такси залежить насамперед від вартості предмета нотаріальної дії.</p><p>Приклади максимальних ставок нотаріальної такси:</p><ul><li>до 3 000 злотих: такса 100 злотих,</li><li>понад 3 000 до 10 000 злотих: 100 злотих + 3% від суми понад 3 000 злотих,</li><li>понад 10 000 до 30 000 злотих: 310 злотих + 2% від суми понад 10 000 злотих,</li><li>понад 30 000 до 60 000 злотих: 710 злотих + 1% від суми понад 30 000 злотих,</li><li>понад 60 000 до 1 000 000 злотих: 1 010 злотих + 0,4% від суми понад 60 000 злотих,</li><li>понад 1 000 000 до 2 000 000 злотих: 4 770 злотих + 0,2% від суми понад 1 000 000 злотих.</li></ul><h2>2. ПДВ на нотаріальні послуги</h2><p>Нотаріальні послуги оподатковуються ПДВ у розмірі 23%. Цей податок нараховується на винагороду нотаріуса (нотаріальну таксу). ПДВ не стосується податків і судових зборів, які нотаріус стягує та перераховує від імені держави – ці суми є нейтральними для нотаріуса.</p><h2>3. Податки при нотаріальних діях</h2><p>При багатьох нотаріальних діях нотаріус стягує та перераховує належні податки:</p><ul><li><strong>Податок на цивільно-правові угоди (PCC)</strong> – при купівлі нерухомості на вторинному ринку становить 2% ринкової вартості нерухомості. Покупець першого житла або будинку може бути звільнений від PCC відповідно до окремих нормативних актів.</li><li><strong>Податок на дарування та спадщину</strong> – розмір залежить від групи оподаткування (ступеня спорідненості). Найближчі родичі (подружжя, діти, батьки, брати і сестри) можуть скористатися податковим звільненням за умови виконання законодавчих вимог.</li></ul><h2>4. Судові збори за записи до земельних книг</h2><p>При нотаріальних діях, пов'язаних із нерухомістю, нотаріус стягує судовий збір за заяву про внесення запису до земельної книги та перераховує його до відповідного районного суду. Заява про внесення запису подається електронно в день вчинення нотаріальної дії. Стандартні ставки судових зборів:</p><ul><li>Реєстрація права власності: 200 злотих,</li><li>Реєстрація іпотеки: 200 злотих,</li><li>Відкриття нової земельної книги: 60 злотих,</li><li>Реєстрація застереження: 60 злотих.</li></ul><h2>5. Загальна вартість нотаріальної дії</h2><p>Загальна вартість нотаріальної дії включає:</p><ul><li><strong>Нотаріальну таксу</strong> – винагорода нотаріуса, що розраховується від вартості предмета дії,</li><li><strong>ПДВ 23%</strong> – податок, що нараховується на нотаріальну таксу,</li><li><strong>Податки</strong> – PCC або податок на дарування/спадщину, якщо застосовно до конкретної дії,</li><li><strong>Судові збори</strong> – за записи до земельної книги, якщо застосовно.</li></ul><h2>6. Як дізнатися попередню вартість?</h2><p>Перед запланованою нотаріальною дією запрошуємо зв'язатися з конторою – ми з радістю допоможемо попередньо розрахувати витрати на підставі наданої інформації про вартість нерухомості або інших параметрів дії.</p><p>Нотаріальна контора Даріуша Климонди, вул. Вєліцька 30, корпус А, перший поверх, 30-552 Краків. Тел.: +48 536 951 371, +48 12 312 06 03. E-mail: kancelaria@notariuszdk.pl.</p>",
    metaTitle: "Вартість нотаріальних дій – такса, податки, судові збори | Нотаріальна контора Даріуш Климонда",
    metaDescription: "Скільки коштує нотаріальна дія? Нотаріальна такса, ПДВ, PCC, податок на дарування та судові збори за записи до земельних книг. Нотаріальна контора Даріуш Климонда, Краків.",
    publishedAt: new Date("2026-01-01"),
    tags: [],
  },
];

async function upsertBlog(siteId: number, blogData: typeof blogs[0]) {
  const existing = await getBlogBySlug(siteId, blogData.slug, blogData.lang);
  if (existing) {
    await updateBlog(existing.id, {
      title: blogData.title,
      description: blogData.description,
      content: blogData.content,
      category: blogData.category,
      standalone: blogData.standalone,
      status: blogData.status,
      metaTitle: blogData.metaTitle,
      metaDescription: blogData.metaDescription,
      publishedAt: blogData.publishedAt,
      tags: blogData.tags,
    });
    console.log(`  Updated blog [${blogData.lang}]: ${blogData.slug}`);
  } else {
    await createBlog({ siteId, ...blogData });
    console.log(`  Created blog [${blogData.lang}]: ${blogData.slug}`);
  }
}

async function main() {
  console.log("Saving config for kancelaria-notarialna-dariusz...");
  await upsertSiteConfig("kancelaria-notarialna-dariusz", config as any);
  console.log("Config saved.");

  console.log("Updating status to released...");
  await updateSiteStatus("kancelaria-notarialna-dariusz", "released");
  console.log("Status updated to released.");

  console.log("Seeding blogs...");
  const site = await getSiteBySubdomain("kancelaria-notarialna-dariusz");
  if (site) {
    for (const blog of blogs) {
      await upsertBlog(site.id, blog);
    }
    console.log("Blogs seeded.");
  } else {
    console.warn("Site not found after upsert – skipping blog seed.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
