import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const subdomain = "notariuszwgarwolinie";
const sql = postgres(DATABASE_URL);

const rows = await sql`SELECT id, config FROM sites WHERE subdomain = ${subdomain}`;

if (rows.length === 0) {
  console.error(`Business "${subdomain}" not found`);
  await sql.end();
  process.exit(1);
}

const siteId: number = rows[0].id;
let config = rows[0].config as any;
if (typeof config === "string") {
  config = JSON.parse(config);
}

// Service detail content keyed by slug
const serviceDetails: Record<
  string,
  { title: string; description: string; content: string }
> = {
  "akty-notarialne": {
    title: "Akty notarialne",
    description:
      "Sporządzamy akty notarialne dla wszelkich czynności wymagających formy notarialnej – umów, oświadczeń i innych dokumentów prawnych.",
    content: `<h2>Czym jest akt notarialny?</h2>
<p>Akt notarialny to dokument sporządzony przez notariusza, który ma moc dokumentu urzędowego. Jest wymagany przepisami prawa dla szczególnie ważnych czynności prawnych, zapewniając ich ważność, pewność i ochronę interesów stron.</p>

<h3>Kiedy wymagany jest akt notarialny?</h3>
<p>Forma aktu notarialnego jest obligatoryjna m.in. dla:</p>
<ul>
  <li>umów sprzedaży i darowizny nieruchomości oraz spółdzielczego własnościowego prawa do lokalu,</li>
  <li>umów ustanowienia hipoteki,</li>
  <li>umów spółki z ograniczoną odpowiedzialnością i spółki akcyjnej,</li>
  <li>testamentów notarialnych,</li>
  <li>aktów poświadczenia dziedziczenia,</li>
  <li>intercyz (umów majątkowych małżeńskich),</li>
  <li>pełnomocnictw do sprzedaży nieruchomości,</li>
  <li>umów dożywocia i służebności.</li>
</ul>

<h3>Jak przebiega sporządzenie aktu notarialnego?</h3>
<p>Notariusz odczytuje stronom treść aktu, wyjaśnia jego skutki prawne i upewnia się, że strony rozumieją jego treść. Następnie strony oraz notariusz podpisują dokument. Oryginał aktu (tzw. oryginał) pozostaje w kancelarii notarialnej, a stronom wydawane są wypisy, które mają moc oryginału.</p>

<h3>Co należy przygotować?</h3>
<p>Przed wizytą w kancelarii prosimy o kontakt telefoniczny lub e-mailowy. Nasz personel wskaże niezbędne dokumenty i przygotuje projekt aktu, co pozwoli sprawnie przeprowadzić całą procedurę.</p>`,
  },
  "poswiadczenia-dziedziczenia": {
    title: "Poświadczenia dziedziczenia",
    description:
      "Sporządzamy akty poświadczenia dziedziczenia jako szybką alternatywę dla sądowego stwierdzenia nabycia spadku.",
    content: `<h2>Akt poświadczenia dziedziczenia</h2>
<p>Akt poświadczenia dziedziczenia (APD) to sporządzony przez notariusza dokument stwierdzający, kto i w jakim udziale dziedziczy po zmarłym. Stanowi alternatywę dla sądowego postanowienia o stwierdzeniu nabycia spadku i pozwala uregulować sprawy spadkowe znacznie szybciej.</p>

<h3>Kiedy można sporządzić APD?</h3>
<p>Notariusz może sporządzić akt poświadczenia dziedziczenia, gdy:</p>
<ul>
  <li>wszyscy zainteresowani spadkobiercy zgadzają się co do kręgu spadkobierców i ich udziałów,</li>
  <li>spadkodawca był obywatelem polskim lub cudzoziemcem zamieszkałym w Polsce,</li>
  <li>brak jest sporu między spadkobiercami.</li>
</ul>

<h3>Jakie dokumenty są potrzebne?</h3>
<ul>
  <li>odpis aktu zgonu spadkodawcy,</li>
  <li>odpisy aktów urodzenia i małżeństwa spadkobierców,</li>
  <li>testament (jeśli sporządzono),</li>
  <li>dokumenty dotyczące majątku spadkowego,</li>
  <li>numery PESEL wszystkich zainteresowanych.</li>
</ul>

<h3>Procedura i skutki</h3>
<p>W kancelarii notarialnej wszyscy spadkobiercy składają zgodne oświadczenia. Notariusz rejestruje akt w elektronicznym Rejestrze Aktów Poświadczenia Dziedziczenia (RAPD) – od momentu rejestracji ma on taką samą moc jak prawomocne postanowienie sądu.</p>`,
  },
  poswiadczenia: {
    title: "Poświadczenia",
    description:
      "Poświadczamy własnoręczność podpisów, zgodność odpisów z oryginałami dokumentów oraz datę okazania dokumentu.",
    content: `<h2>Czynności poświadczeniowe notariusza</h2>
<p>Poświadczenia notarialne to czynności, w ramach których notariusz potwierdza określone fakty lub okoliczności. Mają one moc dokumentów urzędowych i są powszechnie wymagane w obrocie prawnym i urzędowym.</p>

<h3>Rodzaje poświadczeń</h3>

<h4>Poświadczenie własnoręczności podpisu</h4>
<p>Notariusz potwierdza, że podpis złożony na dokumencie pochodzi od określonej osoby. Wymaga to osobistego stawiennictwa podpisującego w kancelarii z ważnym dokumentem tożsamości. Najczęściej stosowane przy podpisach na pełnomocnictwach, wnioskach i oświadczeniach.</p>

<h4>Poświadczenie zgodności odpisu z oryginałem</h4>
<p>Notariusz sporządza uwierzytelnioną kopię dokumentu, potwierdzając jej zgodność z oryginałem. Jest to odpowiednik uwierzytelnienia przez instytucję wydającą dokument. Stosowane przy kopiach dyplomów, aktów stanu cywilnego, umów i innych dokumentów.</p>

<h4>Poświadczenie daty okazania dokumentu</h4>
<p>Notariusz poświadcza datę, w której dokument został mu okazany – stosowane do ustalenia, że dokument istniał w określonym dniu.</p>

<h4>Poświadczenie pozostawania osoby przy życiu lub w określonym miejscu</h4>
<p>Notariusz może poświadczyć, że dana osoba pozostaje przy życiu lub że przebywa w konkretnym miejscu – wymagane m.in. przy pobieraniu renty z zagranicy.</p>`,
  },
  "umowy-sprzedazy-nieruchomosci": {
    title: "Umowy sprzedaży nieruchomości",
    description:
      "Sporządzamy umowy sprzedaży nieruchomości, sprawdzamy stan prawny oraz przeprowadzamy strony przez cały proces transakcji.",
    content: `<h2>Sprzedaż i kupno nieruchomości u notariusza</h2>
<p>Przeniesienie własności nieruchomości – zarówno gruntowych, jak i lokali mieszkalnych – wymaga formy aktu notarialnego pod rygorem nieważności. Kancelaria notarialna zapewnia bezpieczeństwo całej transakcji, dbając o interesy obu stron.</p>

<h3>Co sprawdzamy przed transakcją?</h3>
<ul>
  <li>stan wpisów w księdze wieczystej (własność, hipoteki, służebności),</li>
  <li>aktualny wypis z rejestru gruntów i mapę ewidencyjną,</li>
  <li>zaświadczenia o braku zaległości podatkowych i opłat za media,</li>
  <li>plan miejscowy lub warunki zabudowy (dla gruntów),</li>
  <li>podstawę nabycia nieruchomości przez sprzedającego.</li>
</ul>

<h3>Przebieg transakcji</h3>
<p>Kancelaria przygotowuje projekt umowy i przesyła go stronom przed podpisaniem. W dniu podpisania notariusz odczytuje akt, wyjaśnia jego treść, pobiera należny podatek od czynności cywilnoprawnych (PCC) oraz opłatę sądową od wniosku o wpis do ksiąg wieczystych. Notariusz składa wniosek wieczystoksięgowy w imieniu stron.</p>

<h3>Dokumenty wymagane przy transakcji</h3>
<ul>
  <li>numer księgi wieczystej nieruchomości,</li>
  <li>dokumenty tożsamości stron (dowód osobisty lub paszport),</li>
  <li>wypis z rejestru gruntów,</li>
  <li>zaświadczenie o braku osób zameldowanych (przy lokalu mieszkalnym),</li>
  <li>zaświadczenie o uregulowaniu opłat z tytułu użytkowania wieczystego (jeśli dotyczy).</li>
</ul>

<p>Szczegółową listę dokumentów podamy po kontakcie z kancelarią – każda transakcja może wymagać dodatkowych zaświadczeń.</p>`,
  },
  testamenty: {
    title: "Testamenty",
    description:
      "Sporządzamy testamenty notarialne zapewniające pewność prawną co do ostatniej woli oraz skuteczne przekazanie majątku zgodnie z intencjami testatora.",
    content: `<h2>Testament notarialny</h2>
<p>Testament notarialny to najbezpieczniejsza forma sporządzenia ostatniej woli. Sporządzony w formie aktu notarialnego zapewnia pewność co do autentyczności, daty sporządzenia i treści woli testatora. Notariusz przechowuje oryginał, a informacja o testamencie może być zarejestrowana w Notarialnym Rejestrze Testamentów (NORT).</p>

<h3>Dlaczego testament notarialny?</h3>
<ul>
  <li><strong>Bezpieczeństwo</strong> – oryginał pozostaje w kancelarii, nie może zostać zgubiony ani zniszczony.</li>
  <li><strong>Pewność prawna</strong> – notariusz czuwa nad prawidłowością treści i zgodnością z prawem.</li>
  <li><strong>Rejestr NORT</strong> – testament można zarejestrować w ogólnopolskim rejestrze, co ułatwia jego odnalezienie po śmierci testatora.</li>
  <li><strong>Trudność podważenia</strong> – forma notarialna znacznie utrudnia kwestionowanie ważności testamentu.</li>
</ul>

<h3>Co można zawrzeć w testamencie?</h3>
<ul>
  <li>powołanie spadkobiercy lub spadkobierców,</li>
  <li>zapis windykacyjny (przekazanie konkretnego składnika majątku konkretnej osobie),</li>
  <li>zapis zwykły (zobowiązanie spadkobiercy do przekazania określonej korzyści),</li>
  <li>polecenie (nałożenie na spadkobiercę obowiązku działania),</li>
  <li>wydziedziczenie i wyłączenie od dziedziczenia,</li>
  <li>powołanie wykonawcy testamentu.</li>
</ul>

<h3>Jak sporządzić testament?</h3>
<p>Wystarczy umówić się na wizytę w kancelarii. Testator przybywa osobiście z dokumentem tożsamości. Notariusz przeprowadza rozmowę co do treści woli, sporządza projekt, a następnie odczytuje go i podpisuje w obecności testatora.</p>`,
  },
  pelnomocnictwa: {
    title: "Pełnomocnictwa",
    description:
      "Sporządzamy pełnomocnictwa notarialne do wszelkich czynności prawnych wymagających reprezentacji przez pełnomocnika.",
    content: `<h2>Pełnomocnictwo notarialne</h2>
<p>Pełnomocnictwo notarialne upoważnia wskazaną osobę (pełnomocnika) do działania w imieniu mocodawcy. Forma notarialna wymagana jest m.in. przy pełnomocnictwach do sprzedaży lub zakupu nieruchomości, zawierania umów spółek i wielu innych czynności prawnych o znaczeniu formalnym.</p>

<h3>Kiedy potrzebne jest pełnomocnictwo notarialne?</h3>
<ul>
  <li>sprzedaż, zakup lub darowizna nieruchomości w imieniu mocodawcy,</li>
  <li>zaciąganie kredytu hipotecznego,</li>
  <li>reprezentacja przed sądami i urzędami wymagającymi formy notarialnej,</li>
  <li>dokonywanie czynności w imieniu spółki (gdy wymagana forma aktu notarialnego),</li>
  <li>odbiór spadku lub zrzeczenie się dziedziczenia,</li>
  <li>ustanowienie hipoteki.</li>
</ul>

<h3>Rodzaje pełnomocnictw</h3>
<p><strong>Pełnomocnictwo ogólne</strong> – uprawnia do dokonywania czynności zwykłego zarządu, nie może być jednak udzielone do czynności przekraczających zwykły zarząd (np. sprzedaży nieruchomości).</p>
<p><strong>Pełnomocnictwo rodzajowe</strong> – upoważnia do określonego rodzaju czynności (np. do podpisywania umów najmu).</p>
<p><strong>Pełnomocnictwo szczególne</strong> – upoważnia do konkretnej, indywidualnie określonej czynności (np. do sprzedaży konkretnej nieruchomości).</p>

<h3>Co jest potrzebne?</h3>
<p>Do sporządzenia pełnomocnictwa notarialnego wymagany jest dokument tożsamości mocodawcy oraz dane pełnomocnika (imię, nazwisko, PESEL, adres zamieszkania). Zakres umocowania powinien być precyzyjnie określony – notariusz pomoże sformułować odpowiednią treść.</p>`,
  },
};

// Get home page services section items
const homeSection = config.pages?.home?.sections?.find(
  (s: any) => s.type === "services"
);
const serviceItems: Array<{ title: string; slug: string; description?: string }> =
  homeSection?.items || [];

if (serviceItems.length === 0) {
  console.warn("No services found in home page services section");
  await sql.end();
  process.exit(0);
}

// Ensure data.services exists
if (!config.data) config.data = {};
if (!config.data.services) config.data.services = [];

let configChanged = false;
const lang = "pl";

for (const item of serviceItems) {
  const slug = item.slug;
  const blogSlug = `service-${slug}`;
  const details = serviceDetails[slug];

  if (!details) {
    console.warn(`No predefined content for service slug: ${slug} — skipping`);
    continue;
  }

  // Create blog post if not already present
  const existing = await sql`
    SELECT id FROM blogs WHERE site_id = ${siteId} AND slug = ${blogSlug} AND lang = ${lang}
  `;

  if (existing.length > 0) {
    console.log(`Blog '${blogSlug}' [${lang}] already exists, skipping`);
  } else {
    await sql`
      INSERT INTO blogs (site_id, slug, lang, title, description, content, status, standalone, published_at)
      VALUES (
        ${siteId},
        ${blogSlug},
        ${lang},
        ${details.title},
        ${details.description},
        ${details.content},
        ${"published"},
        ${true},
        ${new Date("2026-04-27")}
      )
    `;
    console.log(`Inserted blog '${blogSlug}' [${lang}]`);
  }

  // Ensure data.services has an entry with blogSlug for this service
  const existingService = config.data.services.find((s: any) => s.slug === slug);
  if (existingService) {
    if (!existingService.blogSlug) {
      existingService.blogSlug = blogSlug;
      configChanged = true;
    }
  } else {
    config.data.services.push({
      id: slug,
      slug,
      title: item.title,
      description: item.description || details.description,
      available: true,
      blogSlug,
    });
    configChanged = true;
  }
}

if (configChanged) {
  await sql`UPDATE sites SET config = ${sql.json(config)}, updated_at = NOW() WHERE subdomain = ${subdomain}`;
  console.log(`Updated ${subdomain}: linked service blog posts in data.services`);
} else {
  console.log("No config changes needed");
}

await sql.end();
console.log("Done.");
