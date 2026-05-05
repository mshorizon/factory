#!/usr/bin/env tsx
/**
 * Add Polish translations for anna-papiez (site_id=29):
 * - informacje-dla-kupujacych (pl) — no image
 * - informacje-o-oplatach (pl) — no image
 * - 6x service-* (pl) — no image
 * Also: remove images from all translations of the two informations blogs
 */
import { initDb } from "../packages/db/src/index.js";
import { blogs } from "../packages/db/src/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "../packages/db/src/client.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";
const SITE_ID = 29;

const PL_BLOGS = [
  {
    slug: "informacje-dla-kupujacych",
    lang: "pl",
    title: "Przewodnik dla kupujących nieruchomości w Polsce",
    description:
      "Przewodnik prawny dla osób kupujących nieruchomość w Polsce. Wymagania prawne, etapy transakcji, koszty. Kancelaria Notarialna Anna Papież w Krakowie.",
    content: `<h2>Zakup nieruchomości w Polsce — co warto wiedzieć</h2><p>Nabycie nieruchomości to jedna z najważniejszych decyzji finansowych w życiu. Wymaga nie tylko znajomości rynku, ale przede wszystkim rozumienia przepisów prawnych regulujących obrót nieruchomościami w Polsce. Niniejszy przewodnik ma na celu przybliżenie najważniejszych kwestii prawnych i praktycznych związanych z zakupem mieszkania, domu lub działki.</p><h3>Sprawdzenie stanu prawnego nieruchomości</h3><p>Przed podjęciem jakichkolwiek zobowiązań finansowych należy dokładnie sprawdzić stan prawny nieruchomości. Podstawowym dokumentem jest <strong>księga wieczysta</strong>, którą można nieodpłatnie przeglądać online pod adresem <em>ekw.ms.gov.pl</em>. Zawiera ona cztery działy: opis nieruchomości, dane właściciela, prawa, roszczenia i ograniczenia oraz hipoteki. Zalecamy weryfikację wszystkich działów.</p><p>Warto również sprawdzić:</p><ul><li>zaświadczenie o przeznaczeniu nieruchomości w miejscowym planie zagospodarowania przestrzennego (MPZP)</li><li>zaświadczenie o niezaleganiu ze zobowiązaniami podatkowymi przez sprzedającego</li><li>zaświadczenie ze spółdzielni o braku zaległości czynszowych (w przypadku własnościowego prawa do lokalu)</li></ul><h3>Umowa przedwstępna</h3><p>Umowa przedwstępna to etap poprzedzający zawarcie umowy przyrzeczonej (ostatecznej). Może mieć formę zwykłą pisemną lub notarialną. <strong>Forma notarialna</strong> zapewnia kupującemu znacznie silniejszą ochronę — umożliwia dochodzenie zawarcia umowy przyrzeczonej przed sądem, gdyby sprzedający uchylał się od jej wykonania. Umowa przedwstępna zazwyczaj przewiduje wpłatę zadatku lub zaliczki — należy pamiętać, że mają one różne skutki prawne w razie niewykonania umowy.</p><h3>Finansowanie zakupu</h3><p>Przy zakupie na kredyt hipoteczny bank wymaga m.in.:</p><ul><li>dokumentów potwierdzających tożsamość i dochody</li><li>informacji o nieruchomości (odpis z KW, rzut lokalu, zaświadczenie ze spółdzielni)</li><li>wkładu własnego — zazwyczaj minimum 10–20% wartości nieruchomości</li></ul><p>Decyzję kredytową warto uzyskać przed podpisaniem umowy przedwstępnej, aby mieć pewność finansowania.</p><h3>Akt notarialny — umowa przyrzeczona</h3><p>Przeniesienie własności nieruchomości wymaga zachowania <strong>formy aktu notarialnego</strong> pod rygorem nieważności. Notariusz odczytuje treść aktu, wyjaśnia jego skutki prawne i zabezpiecza interesy obu stron. Po podpisaniu aktu notariusz składa wniosek o wpisanie nowego właściciela do księgi wieczystej.</p><h3>Koszty zakupu nieruchomości</h3><p>Planując budżet, należy uwzględnić koszty dodatkowe:</p><ul><li><strong>Taksa notarialna</strong> — zależna od wartości nieruchomości (skala degresywna, od 0,5% do 3%)</li><li><strong>VAT 23%</strong> — naliczany od taksy notarialnej</li><li><strong>Podatek PCC</strong> — 2% wartości nieruchomości przy nabyciu na rynku wtórnym (przy zakupie od dewelopera z VAT — PCC nie występuje)</li><li><strong>Opłata sądowa</strong> — 200 zł za wpis prawa własności do KW, 200 zł za wpis hipoteki</li><li><strong>Wypisy aktu notarialnego</strong> — 6 zł netto za każdą stronę</li></ul><h3>Zapraszamy do kancelarii</h3><p>Kancelaria Notarialna Anna Papież w Krakowie zapewni Państwu profesjonalną obsługę na każdym etapie transakcji — od weryfikacji stanu prawnego, przez przygotowanie i odczytanie aktu notarialnego, aż po złożenie wniosków wieczystoksięgowych. Zapraszamy do kontaktu: ul. Mazowiecka 8, 30-036 Kraków.</p>`,
    metaTitle:
      "Przewodnik dla kupujących nieruchomości w Polsce | Notariusz Kraków",
    metaDescription:
      "Zakup nieruchomości w Polsce — przewodnik prawny. Etapy transakcji, sprawdzenie KW, akt notarialny, koszty. Kancelaria Notarialna Anna Papież w Krakowie.",
    category: "informacje",
    standalone: false,
    status: "published" as const,
    image: null,
    publishedAt: new Date("2026-01-01"),
  },
  {
    slug: "informacje-o-oplatach",
    lang: "pl",
    title: "Opłaty notarialne — pełny wykaz kosztów",
    description:
      "Ile kosztuje notariusz w Polsce? Taksa notarialna, podatki, opłaty sądowe. Przejrzyste informacje od Kancelarii Notarialnej Anna Papież w Krakowie.",
    content: `<h2>Opłaty notarialne — co składa się na koszt czynności notarialnej?</h2><p>Pytanie o koszty jest jednym z pierwszych, jakie zadają klienci umawiający się na wizytę u notariusza. Warto wiedzieć, że opłaty pobierane przez notariusza są ściśle regulowane przepisami prawa — notariusz nie może pobrać więcej niż wynika z <strong>rozporządzenia Ministra Sprawiedliwości z dnia 28 czerwca 2004 r. w sprawie maksymalnych stawek taksy notarialnej</strong>. Może natomiast zastosować stawkę niższą, uzgodnioną ze stronami.</p><h3>Składniki całkowitego kosztu</h3><p>Na łączny koszt czynności notarialnej składają się:</p><ul><li><strong>Taksa notarialna</strong> — wynagrodzenie notariusza za sporządzenie aktu lub inną czynność notarialną</li><li><strong>VAT 23%</strong> — notariusz jest podatnikiem VAT, dlatego do taksy dolicza podatek od towarów i usług</li><li><strong>Podatek od czynności cywilnoprawnych (PCC)</strong> — pobierany przez notariusza jako płatnik podatku przy określonych czynnościach (np. umowa sprzedaży na rynku wtórnym)</li><li><strong>Opłaty sądowe</strong> — za wnioski do ksiąg wieczystych lub KRS</li><li><strong>Wypisy i odpisy</strong> — 6 zł netto za każdą stronę wypisu aktu notarialnego</li></ul><h3>Taksa notarialna przy umowach zależnych od wartości</h3><p>Przy czynnościach, których wartość można określić, taksa notarialna obliczana jest według skali degresywnej:</p><ul><li>Do 3 000 zł — maksymalnie 100 zł</li><li>Od 3 000 do 10 000 zł — 100 zł + 3% nadwyżki ponad 3 000 zł</li><li>Od 10 000 do 30 000 zł — 310 zł + 2% nadwyżki ponad 10 000 zł</li><li>Od 30 000 do 60 000 zł — 710 zł + 1% nadwyżki ponad 30 000 zł</li><li>Od 60 000 do 1 000 000 zł — 1 010 zł + 0,4% nadwyżki ponad 60 000 zł</li><li>Od 1 000 000 do 2 000 000 zł — 4 770 zł + 0,2% nadwyżki ponad 1 000 000 zł</li><li>Powyżej 2 000 000 zł — 6 770 zł + 0,25% nadwyżki ponad 2 000 000 zł, jednak nie więcej niż 10 000 zł</li></ul><p>Przykład: przy zakupie nieruchomości za 500 000 zł taksa wyniesie: 1 010 zł + 0,4% × 440 000 zł = 1 010 + 1 760 = 2 770 zł netto, plus VAT 23% = 3 407,10 zł brutto.</p><h3>Stałe stawki taksy notarialnej</h3><p>Wybrane czynności mają z góry określone stawki:</p><ul><li><strong>Testament zwykły</strong> — 50 zł netto</li><li><strong>Testament z zapisem windykacyjnym</strong> — 200 zł netto</li><li><strong>Pełnomocnictwo do jednej czynności</strong> — 30 zł netto</li><li><strong>Pełnomocnictwo ogólne</strong> — 100 zł netto</li><li><strong>Protokół dziedziczenia</strong> — 100 zł netto</li><li><strong>Akt poświadczenia dziedziczenia (APD)</strong> — 50 zł netto</li><li><strong>Poświadczenie podpisu</strong> — 20 zł netto za każdy podpis</li><li><strong>Poświadczenie zgodności odpisu</strong> — 6 zł netto za każdą stronę</li><li><strong>Poświadczenie daty okazania dokumentu</strong> — 6 zł netto</li><li><strong>Protokół walnego zgromadzenia spółki</strong> — 750 zł netto</li></ul><h3>Podatek od czynności cywilnoprawnych (PCC)</h3><p>Przy nabyciu nieruchomości na rynku wtórnym kupujący zobowiązany jest do zapłaty podatku PCC w wysokości <strong>2% wartości nieruchomości</strong>. Podatek pobiera i odprowadza notariusz w imieniu kupującego. Podatek PCC nie wystąpi przy nabyciu nieruchomości od dewelopera (transakcja objęta VAT), przy darowiznach w najbliższej rodzinie ani w przypadku zakupu pierwszej nieruchomości przez osoby do 35. roku życia (ulga obowiązująca od 2024 r.).</p><h3>Opłaty sądowe</h3><p>Przy czynnościach dotyczących nieruchomości notariusz pobiera opłaty sądowe za wnioski wieczystoksięgowe:</p><ul><li>Wpis prawa własności — 200 zł</li><li>Wpis hipoteki — 200 zł</li><li>Założenie nowej księgi wieczystej — 100 zł</li><li>Wpis innych praw (służebność, użytkowanie) — od 75 do 150 zł</li></ul><h3>Pełna transparentność kosztów</h3><p>Przed przystąpieniem do czynności notarialnej notariusz zobowiązany jest poinformować klienta o przewidywanych kosztach. W Kancelarii Notarialnej Anna Papież w Krakowie zawsze przedstawiamy szczegółową kalkulację kosztów już na etapie wstępnej konsultacji. Zapraszamy: ul. Mazowiecka 8, 30-036 Kraków.</p>`,
    metaTitle:
      "Opłaty notarialne — pełny wykaz kosztów | Notariusz Kraków",
    metaDescription:
      "Taksa notarialna, VAT, podatek PCC, opłaty sądowe — pełny wykaz kosztów czynności notarialnych. Kancelaria Notarialna Anna Papież w Krakowie.",
    category: "informacje",
    standalone: false,
    status: "published" as const,
    image: null,
    publishedAt: new Date("2026-01-01"),
  },
  {
    slug: "service-akty-notarialne",
    lang: "pl",
    title: "Akty notarialne: sprzedaż nieruchomości, darowizny i więcej",
    description:
      "Akty notarialne w Krakowie — sprzedaż i zakup nieruchomości, darowizny, zamiany. Kancelaria Notarialna Anna Papież. Profesjonalna obsługa.",
    content: `<h2>Akty notarialne — podstawa bezpiecznego obrotu prawnego</h2><p>Akt notarialny (akt notarialny) to dokument urzędowy sporządzany przez notariusza, mający moc dokumentu publicznego. W polskim systemie prawnym wiele czynności prawnych wymaga tej formy pod rygorem nieważności — zwłaszcza te dotyczące nieruchomości. Kancelaria Notarialna Anna Papież w Krakowie sporządza akty notarialne w wielu dziedzinach, zapewniając bezpieczeństwo prawne każdej transakcji.</p><h3>Umowy sprzedaży i nabycia nieruchomości</h3><p>Każda umowa przeniesienia własności nieruchomości — mieszkania, domu, działki, lokalu użytkowego — musi być zawarta w formie aktu notarialnego. Notariusz weryfikuje stan prawny nieruchomości w księdze wieczystej, sprawdza tożsamość i zdolność do czynności prawnych stron, pobiera należne podatki i opłaty sądowe, a następnie składa wniosek o wpis nowego właściciela do KW.</p><h3>Darowizny</h3><p>Forma aktu notarialnego jest obowiązkowa dla darowizny nieruchomości oraz udziałów w spółkach z o.o. Przy darowiznach pomiędzy najbliższymi członkami rodziny (małżonek, dzieci, rodzice, rodzeństwo, dziadkowie, wnuki) obowiązuje zwolnienie z podatku od spadków i darowizn, pod warunkiem zgłoszenia do urzędu skarbowego w ciągu 6 miesięcy.</p><h3>Zamiany nieruchomości</h3><p>Umowa zamiany, w której obie strony przenoszą na siebie własność nieruchomości, również wymaga formy aktu notarialnego. Notariusz zadba o prawidłowe ujęcie wzajemnych zobowiązań i wpisanie zmian własnościowych w księgach wieczystych obu nieruchomości.</p><h3>Ustanowienie hipoteki</h3><p>Ustanowienie hipoteki na nieruchomości jako zabezpieczenia kredytu hipotecznego odbywa się w formie aktu notarialnego. Notariusz składa wniosek o wpis hipoteki do księgi wieczystej.</p><h3>Inne akty notarialne</h3><p>Kancelaria sporządza również akty dotyczące:</p><ul><li>podziału majątku wspólnego małżonków</li><li>zniesienia współwłasności nieruchomości</li><li>umów deweloperskich i przedwstępnych w formie aktu notarialnego</li><li>ustanowienia służebności i innych ograniczonych praw rzeczowych</li><li>oświadczeń o poddaniu się egzekucji (art. 777 k.p.c.)</li></ul><h3>Zapraszamy</h3><p>Kancelaria Notarialna Anna Papież w Krakowie zapewnia rzetelną i terminową obsługę. Zapraszamy: ul. Mazowiecka 8, 30-036 Kraków.</p>`,
    metaTitle:
      "Akty notarialne: sprzedaż nieruchomości, darowizny | Notariusz Kraków",
    metaDescription:
      "Akty notarialne w Krakowie — sprzedaż nieruchomości, darowizny, zamiany, hipoteki. Kancelaria Notarialna Anna Papież. Umów konsultację.",
    category: "usługi",
    standalone: false,
    status: "published" as const,
    image: null,
    publishedAt: new Date("2026-01-01"),
  },
  {
    slug: "service-depozyt-notarialny",
    lang: "pl",
    title: "Depozyt notarialny — bezpieczeństwo transakcji",
    description:
      "Depozyt notarialny w Krakowie — bezpieczne przechowywanie pieniędzy i dokumentów przy transakcjach. Kancelaria Notarialna Anna Papież.",
    content: `<h2>Depozyt notarialny — co to jest i do czego służy?</h2><p>Depozyt notarialny (depozyt notarialny) to usługa, dzięki której można przekazać notariuszowi na przechowanie środki pieniężne, papiery wartościowe lub dokumenty, z przeznaczeniem do wydania określonej osobie po spełnieniu wskazanych warunków. Kancelaria Notarialna Anna Papież w Krakowie oferuje obsługę depozytu notarialnego jako skutecznego instrumentu zabezpieczania transakcji.</p><h3>Najczęstsze zastosowania depozytu notarialnego</h3><p>Depozyt notarialny jest szczególnie popularny przy transakcjach nieruchomościowych, w których strony chcą zminimalizować ryzyko:</p><ul><li><strong>Zakup nieruchomości z kredytem hipotecznym</strong> — bank wypłaca kredyt na rachunek depozytu notarialnego, skąd środki trafiają do sprzedającego dopiero po wpisaniu hipoteki do KW</li><li><strong>Transakcje z odroczonym przeniesieniem własności</strong> — kupujący wpłaca cenę do depozytu, a notariusz wydaje ją sprzedającemu po spełnieniu warunków (np. opróżnieniu lokalu, wykreśleniu obciążeń)</li><li><strong>Zabezpieczenie płatności między przedsiębiorcami</strong> — przy umowach handlowych, gdzie strony nie ufają sobie wystarczająco, aby dokonać płatności bez gwarancji wykonania zobowiązania</li><li><strong>Przechowanie dokumentów</strong> — np. oryginalnych umów, testamentów, cennych dokumentów wymagających bezpiecznego przechowania</li></ul><h3>Jak przebiega depozyt notarialny?</h3><p>Procedura depozytu notarialnego obejmuje:</p><ul><li>sporządzenie przez notariusza protokołu przyjęcia środków do depozytu, w którym określone są warunki ich wydania</li><li>wpłatę przez deponenta środków lub złożenie dokumentów</li><li>przechowanie środków na wydzielonym rachunku bankowym kancelarii</li><li>wydanie środków lub dokumentów uprawnionemu po spełnieniu warunków protokołu</li></ul><h3>Bezpieczeństwo depozytu</h3><p>Środki zdeponowane w kancelarii notarialnej nie wchodzą do masy upadłościowej notariusza — są prawnie oddzielone od majątku kancelarii. Notariusz ponosi pełną odpowiedzialność za przechowane środki i dokumenty.</p><h3>Koszty depozytu notarialnego</h3><p>Taksa notarialna za sporządzenie protokołu przyjęcia do depozytu wynosi połowę stawki taksy obliczonej od wartości depozytu, nie więcej jednak niż 10 000 zł netto. Do taksy doliczany jest VAT 23%.</p><h3>Zapraszamy</h3><p>Jeśli planują Państwo skorzystać z depozytu notarialnego, zapraszamy do kontaktu z Kancelarią Notarialną Anna Papież w Krakowie: ul. Mazowiecka 8, 30-036 Kraków.</p>`,
    metaTitle:
      "Depozyt notarialny — bezpieczeństwo transakcji | Notariusz Kraków",
    metaDescription:
      "Depozyt notarialny w Krakowie — bezpieczne przechowywanie środków pieniężnych przy transakcjach nieruchomościowych. Kancelaria Notarialna Anna Papież.",
    category: "usługi",
    standalone: false,
    status: "published" as const,
    image: null,
    publishedAt: new Date("2026-01-01"),
  },
  {
    slug: "service-pelnomocnictwa-testamenty",
    lang: "pl",
    title: "Pełnomocnictwa i testamenty — notarialne zabezpieczenie przyszłości",
    description:
      "Notarialne pełnomocnictwa i testamenty w Krakowie. Planowanie spadkowe i zabezpieczenie interesów. Kancelaria Notarialna Anna Papież.",
    content: `<h2>Pełnomocnictwa i testamenty u notariusza</h2><p>Sporządzenie pełnomocnictwa notarialnego oraz testamentu notarialnego to jedne z podstawowych czynności wykonywanych przez notariuszy. W Kancelarii Notarialnej Anna Papież w Krakowie pomagamy klientom w zaplanowaniu przyszłości i zabezpieczeniu interesów swoich i ich bliskich.</p><h3>Pełnomocnictwa notarialne</h3><p>Pełnomocnictwo (pełnomocnictwo) to oświadczenie woli, na podstawie którego mocodawca upoważnia pełnomocnika do działania w swoim imieniu. Forma notarialna jest wymagana lub zalecana w wielu sytuacjach:</p><ul><li><strong>Pełnomocnictwo do sprzedaży lub zakupu nieruchomości</strong> — obowiązkowo w formie aktu notarialnego</li><li><strong>Pełnomocnictwo ogólne</strong> — do prowadzenia spraw majątkowych mocodawcy</li><li><strong>Pełnomocnictwo do zawarcia umowy spółki</strong> — wymagane przy spółkach, których umowa musi mieć formę aktu notarialnego</li><li><strong>Pełnomocnictwo do dokonania czynności przed zagranicznym notariuszem</strong> — wymaga szczególnej formy, by było uznane za granicą</li></ul><p>Notarialnie poświadczone pełnomocnictwo jest akceptowane przez banki, urzędy i instytucje w całej Polsce i za granicą.</p><h3>Testamenty notarialne</h3><p>Testament notarialny (testament allograficzny w formie aktu notarialnego) jest jedną z najpewniejszych form wyrażenia ostatniej woli. Sporządzany w obecności notariusza eliminuje ryzyko kwestionowania jego autentyczności lub zdolności testowania.</p><p>Notariusz może sporządzić:</p><ul><li><strong>Testament zwykły</strong> — zawierający rozrządzenia majątkiem na wypadek śmierci</li><li><strong>Testament z zapisem windykacyjnym</strong> — wskazujący konkretny przedmiot (np. nieruchomość) dla konkretnego zapisobiorcy, który staje się jego właścicielem z chwilą otwarcia spadku</li><li><strong>Testament zawierający wydziedziczenie</strong> — pozbawienie zachowku osoby ustawowo do niego uprawnionej</li><li><strong>Testament zawierający zapis zwykły lub polecenie</strong></li></ul><h3>Planowanie sukcesji</h3><p>Notariusz może doradzić w zakresie kompleksowego planowania sukcesji — darowizn za życia, umów o zrzeczeniu się dziedziczenia oraz powiązania testamentu z umowami majątkowymi małżeńskimi. Wczesne zaplanowanie przekazania majątku pozwala uniknąć konfliktów i zminimalizować obciążenia podatkowe.</p><h3>Zapraszamy</h3><p>Kancelaria Notarialna Anna Papież w Krakowie: ul. Mazowiecka 8, 30-036 Kraków. Zapraszamy na konsultację.</p>`,
    metaTitle:
      "Pełnomocnictwa i testamenty u notariusza | Notariusz Kraków",
    metaDescription:
      "Pełnomocnictwa notarialne i testamenty w Krakowie. Planowanie sukcesji, zapisy windykacyjne, wydziedziczenie. Kancelaria Notarialna Anna Papież.",
    category: "usługi",
    standalone: false,
    status: "published" as const,
    image: null,
    publishedAt: new Date("2026-01-01"),
  },
  {
    slug: "service-poswiadczenia",
    lang: "pl",
    title: "Poświadczenia notarialne — podpisy, odpisy, daty",
    description:
      "Poświadczenia notarialne w Krakowie: podpisów, zgodności odpisów, daty okazania. Kancelaria Notarialna Anna Papież — szybko i pewnie prawnie.",
    content: `<h2>Poświadczenia notarialne — proste, lecz istotne czynności</h2><p>Poświadczenia notarialne (poświadczenia notarialne) to jedne z najczęściej wykonywanych czynności notarialnych w codziennej praktyce. Są szybkie, stosunkowo niedrogie i mają istotną moc prawną — dokument opatrzony poświadczeniem notarialnym jest dokumentem urzędowym, trudnym do zakwestionowania. Kancelaria Notarialna Anna Papież w Krakowie wykonuje poświadczenia niezwłocznie, często bez konieczności wcześniejszego umawiania.</p><h3>Poświadczenie własnoręczności podpisu</h3><p>Notariusz poświadcza, że wskazana osoba złożyła podpis w jego obecności lub uznała za własny podpis złożony wcześniej. Jest to wymagane m.in. przy:</p><ul><li>pełnomocnictwach do spraw urzędowych i bankowych</li><li>oświadczeniach skierowanych do zagranicznych instytucji</li><li>dokumentach wymaganych przez pracodawców, banki i sądy</li></ul><h3>Poświadczenie zgodności odpisu z oryginałem</h3><p>Notariusz potwierdza, że wykonana kopia dokumentu jest zgodna z okazanym oryginałem lub uwierzytelnionym odpisem. Poświadczony odpis ma moc prawną oryginału. Stosowany jest przy:</p><ul><li>kopiach dyplomów, świadectw, zaświadczeń do celów urzędowych</li><li>kopiach aktów notarialnych, umów i dokumentów sądowych</li><li>dokumentach składanych za granicą lub do organów administracji</li></ul><h3>Poświadczenie daty okazania dokumentu</h3><p>Notariusz potwierdza, że dokument był mu okazany określonego dnia. Ma to znaczenie prawne w sprawach, gdzie liczy się termin — np. przy wykazywaniu daty zawarcia umowy lub daty powstania zobowiązania.</p><h3>Poświadczenie pozostawania osoby przy życiu lub w określonym miejscu</h3><p>Na żądanie uprawnionej osoby notariusz może poświadczyć, że osoba ta pozostaje przy życiu lub że przebywa w określonym miejscu. Czynność ta bywa wymagana przez zagraniczne instytucje emerytalne lub banki.</p><h3>Koszty poświadczeń</h3><p>Taksa notarialna za poświadczenie podpisu wynosi 20 zł netto za każdy podpis, za poświadczenie zgodności odpisu — 6 zł netto za stronę, za poświadczenie daty — 6 zł netto za dokument. Do każdej kwoty doliczany jest VAT 23%.</p><h3>Zapraszamy</h3><p>Kancelaria Notarialna Anna Papież w Krakowie: ul. Mazowiecka 8, 30-036 Kraków.</p>`,
    metaTitle:
      "Poświadczenia notarialne — podpisy i odpisy | Notariusz Kraków",
    metaDescription:
      "Poświadczenia notarialne w Krakowie: własnoręczności podpisu, zgodności odpisu, daty okazania. Kancelaria Notarialna Anna Papież.",
    category: "usługi",
    standalone: false,
    status: "published" as const,
    image: null,
    publishedAt: new Date("2026-01-01"),
  },
  {
    slug: "service-poswiadczenie-dziedziczenia",
    lang: "pl",
    title: "Akt poświadczenia dziedziczenia (APD) — szybka alternatywa dla sądu",
    description:
      "Akt poświadczenia dziedziczenia (APD) w Krakowie — szybkie stwierdzenie praw do spadku bez postępowania sądowego. Kancelaria Notarialna Anna Papież.",
    content: `<h2>Akt poświadczenia dziedziczenia — czym jest?</h2><p>Akt poświadczenia dziedziczenia (APD) to notarialny dokument potwierdzający prawa spadkobierców do spadku po osobie zmarłej. Jest równoważny postanowieniu sądu o stwierdzeniu nabycia spadku — uznawany przez banki, urzędy, sądy i inne instytucje w Polsce i za granicą. Jego uzyskanie jest znacznie szybsze niż droga sądowa — przy sprawach nieskomplikowanych można go sporządzić nawet w ciągu jednej wizyty.</p><h3>Kiedy można sporządzić APD?</h3><p>Akt poświadczenia dziedziczenia można sporządzić, gdy:</p><ul><li>wszyscy znani spadkobiercy ustawowi lub testamentowi wyrażają zgodę na jego sporządzenie</li><li>w skład spadku nie wchodzą nieruchomości lub prawa rzeczowe wymagające szczególnej procedury sądowej</li><li>nie ma sporu co do kręgu spadkobierców ani ważności testamentu</li></ul><h3>Procedura sporządzenia APD</h3><p>Sporządzenie APD przebiega w kilku etapach:</p><ul><li>Notariusz sporządza <strong>protokół dziedziczenia</strong> — przesłuchuje obecnych uczestników, ustala krąg spadkobierców i pyta o ewentualny testament</li><li>Na podstawie protokołu notariusz sporządza <strong>akt poświadczenia dziedziczenia</strong></li><li>Notariusz niezwłocznie rejestruje APD w Notarialnym Rejestrze Testamentów (NORT) oraz Rejestrze Aktów Poświadczenia Dziedziczenia (RAPD)</li></ul><h3>Wymagane dokumenty</h3><p>Do sporządzenia APD potrzebne są m.in.:</p><ul><li>odpis skrócony lub zupełny aktu zgonu spadkodawcy</li><li>odpisy skrócone aktów urodzenia/małżeństwa spadkobierców (potwierdzające pokrewieństwo)</li><li>ewentualny testament w oryginale (jeśli istnieje)</li><li>numer PESEL spadkodawcy (lub zaświadczenie z urzędu stanu cywilnego)</li><li>dokumenty tożsamości wszystkich uczestników</li></ul><h3>Skutki prawne APD</h3><p>Zarejestrowany APD ma skutki prawne sądowego stwierdzenia nabycia spadku. Umożliwia m.in. dostęp do kont bankowych i środków na kontach spadkodawcy, przepisanie nieruchomości na spadkobierców w księdze wieczystej, a także przejęcie praw udziałowych w spółkach.</p><h3>Koszty APD</h3><p>Taksa notarialna za protokół dziedziczenia wynosi 100 zł netto, za akt poświadczenia dziedziczenia — 50 zł netto, za każdą stronę wypisu — 6 zł netto. Do każdej kwoty doliczany jest VAT 23%.</p><h3>Zapraszamy</h3><p>Kancelaria Notarialna Anna Papież w Krakowie: ul. Mazowiecka 8, 30-036 Kraków.</p>`,
    metaTitle:
      "Akt poświadczenia dziedziczenia (APD) u notariusza | Notariusz Kraków",
    metaDescription:
      "APD w Krakowie — szybkie poświadczenie dziedziczenia bez sądu. Protokół dziedziczenia, rejestracja w RAPD. Kancelaria Notarialna Anna Papież.",
    category: "usługi",
    standalone: false,
    status: "published" as const,
    image: null,
    publishedAt: new Date("2026-01-01"),
  },
  {
    slug: "service-umowy-spolek",
    lang: "pl",
    title: "Umowy spółek — zakładanie i zmiany u notariusza",
    description:
      "Umowy spółek u notariusza w Krakowie: zakładanie sp. z o.o., zmiany umów, podwyższenie kapitału. Kancelaria Notarialna Anna Papież.",
    content: `<h2>Umowy spółek u notariusza</h2><p>Założenie i działalność wielu rodzajów spółek handlowych w Polsce wymaga udziału notariusza. Forma aktu notarialnego jest wymagana przy tworzeniu i zmianie umów spółek, których dotyczy obowiązek notarialny. Kancelaria Notarialna Anna Papież w Krakowie obsługuje klientów biznesowych, zapewniając sprawne i profesjonalne sporządzanie wymaganych dokumentów.</p><h3>Czynności notarialne przy spółkach</h3><p>Notariusz jest wymagany przy następujących czynnościach związanych ze spółkami:</p><ul><li><strong>Umowa spółki z ograniczoną odpowiedzialnością (sp. z o.o.)</strong> — zawarcie umowy spółki lub jej zmiana. Możliwe jest założenie przez Internet (S24), jednak forma aktu notarialnego jest wymagana przy aporcie niepieniężnym</li><li><strong>Umowa spółki jawnej lub komandytowej</strong> — zalecana forma notarialna, choć nie zawsze wymagana</li><li><strong>Statut spółki akcyjnej (S.A.) i prostej spółki akcyjnej (P.S.A.)</strong> — forma aktu notarialnego jest obowiązkowa</li><li><strong>Podwyższenie kapitału zakładowego sp. z o.o.</strong> — zmiana umowy spółki w formie aktu notarialnego</li><li><strong>Zbycie udziałów w sp. z o.o.</strong> — podpisy na umowie zbycia udziałów muszą być notarialnie poświadczone</li><li><strong>Protokoły walnych zgromadzeń i zgromadzeń wspólników</strong> — wymagają formy aktu notarialnego przy uchwałach o zmianie umowy spółki lub przy spółkach publicznych</li></ul><h3>Aport niepieniężny</h3><p>Wniesienie wkładu niepieniężnego (aportu) do spółki, np. nieruchomości lub praw majątkowych, wymaga aktu notarialnego, jeśli przedmiotem aportu jest nieruchomość lub inne prawo ujawniane w księdze wieczystej.</p><h3>Procedura i dokumenty</h3><p>Przed sporządzeniem umowy spółki notariusz potrzebuje m.in.:</p><ul><li>danych osobowych i dokumentów tożsamości wspólników</li><li>NIP wspólników będących przedsiębiorcami</li><li>projektu umowy (opcjonalnie — możemy pomóc w jego przygotowaniu)</li><li>przy aporcie: dokumentów potwierdzających prawo do wnoszonego wkładu</li></ul><h3>Zapraszamy</h3><p>Kancelaria Notarialna Anna Papież w Krakowie: ul. Mazowiecka 8, 30-036 Kraków. Zapraszamy do kontaktu w sprawie obsługi notarialnej Państwa firmy.</p>`,
    metaTitle:
      "Umowy spółek u notariusza — zakładanie i zmiany | Notariusz Kraków",
    metaDescription:
      "Umowy spółek w formie aktu notarialnego w Krakowie: sp. z o.o., S.A., zbycie udziałów, protokoły. Kancelaria Notarialna Anna Papież.",
    category: "usługi",
    standalone: false,
    status: "published" as const,
    image: null,
    publishedAt: new Date("2026-01-01"),
  },
];

const INFO_SLUGS = ["informacje-dla-kupujacych", "informacje-o-oplatach"];

async function main() {
  initDb(DATABASE_URL);
  const db = getDb();

  // 1. Remove images from existing de/ua entries for the two info blogs
  console.log("Removing images from informacje-* de/ua entries...");
  for (const slug of INFO_SLUGS) {
    const result = await db
      .update(blogs)
      .set({ image: null })
      .where(and(eq(blogs.siteId, SITE_ID), eq(blogs.slug, slug)));
    console.log(`  Updated ${slug} - images cleared`);
  }

  // 2. Insert pl translations
  console.log("\nInserting pl translations...");
  for (const blog of PL_BLOGS) {
    try {
      await db.insert(blogs).values({
        siteId: SITE_ID,
        slug: blog.slug,
        lang: blog.lang,
        title: blog.title,
        description: blog.description,
        content: blog.content,
        metaTitle: blog.metaTitle,
        metaDescription: blog.metaDescription,
        category: blog.category,
        standalone: blog.standalone,
        status: blog.status,
        image: blog.image,
        publishedAt: blog.publishedAt,
      });
      console.log(`  ✓ Inserted ${blog.slug} [${blog.lang}]`);
    } catch (err: any) {
      if (err.message?.includes("unique")) {
        console.log(`  ~ Skipped ${blog.slug} [${blog.lang}] — already exists`);
      } else {
        throw err;
      }
    }
  }

  console.log("\nDone.");
}

main().catch(console.error);
