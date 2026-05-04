#!/usr/bin/env tsx
/**
 * Save site config for Kancelaria Notarialna Dariusz Klimonda
 * Lead ID: 8, Subdomain: kancelaria-notarialna-dariusz
 */

import { initDb, upsertSiteConfig, updateSiteStatus } from "../packages/db/src/index.js";

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
            hours: "Godziny otwarcia",
            hoursDetailed: [
              "poniedziałek 9:00 – 17:00",
              "wtorek 9:00 – 17:00",
              "środa 9:00 – 17:00",
              "czwartek 9:00 – 17:00",
              "piątek 9:00 – 17:00"
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

async function main() {
  console.log("Saving config for kancelaria-notarialna-dariusz...");
  await upsertSiteConfig("kancelaria-notarialna-dariusz", config as any);
  console.log("Config saved.");

  console.log("Updating status to released...");
  await updateSiteStatus("kancelaria-notarialna-dariusz", "released");
  console.log("Status updated to released.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
