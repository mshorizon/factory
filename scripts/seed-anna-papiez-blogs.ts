#!/usr/bin/env tsx
/**
 * Seed two blog posts for anna-papiez with Polish and Ukrainian translations.
 * Idempotent: skips if blog already exists (same slug + lang).
 */

import { initDb, getSiteBySubdomain, getBlogBySlug, createBlog } from "../packages/db/src/index.js";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:qM2NsnxsnPsM3FPKqqHE6VOaodrE9P7FJtaG0OwWu4ddkNdVPwhflxbRf1kR6Y4D@46.224.191.237:5432/hazelgrouse-db";

initDb(DATABASE_URL);

const BLOGS: Array<{
  slug: string;
  lang: string;
  title: string;
  description: string;
  content: string;
  image: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
}> = [
  // ─────────────────────────────────────────────────────────
  // Blog 1 PL: Jak przygotować się do wizyty u notariusza
  // ─────────────────────────────────────────────────────────
  {
    slug: "jak-przygotowac-sie-do-wizyty-u-notariusza",
    lang: "pl",
    title: "Jak przygotować się do wizyty u notariusza",
    description:
      "Praktyczny przewodnik dla osób planujących wizytę w kancelarii notarialnej. Dowiedz się, jakie dokumenty zabrać i jak przebiega czynność notarialna.",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80",
    category: "Poradnik",
    metaTitle: "Jak przygotować się do wizyty u notariusza | Kancelaria Notarialna Anna Papież",
    metaDescription:
      "Praktyczny przewodnik krok po kroku: jakie dokumenty zabrać, ile kosztuje wizyta u notariusza i jak przebiega czynność notarialna w Krakowie.",
    content: `<h2>Dlaczego odpowiednie przygotowanie jest ważne?</h2>
<p>Wizyta u notariusza wiąże się z podpisaniem dokumentów mających moc prawną. Dobre przygotowanie pozwala zaoszczędzić czas, uniknąć niepotrzebnych wizyt i sprawia, że czynność notarialna przebiega sprawnie. W niniejszym artykule wyjaśniamy, o czym warto pamiętać przed przyjściem do kancelarii.</p>

<h2>Umów się na wizytę z wyprzedzeniem</h2>
<p>Czynności notarialne wymagają wcześniejszego umówienia terminu. Skontaktuj się z kancelarią telefonicznie lub mailowo, podając:</p>
<ul>
  <li>rodzaj czynności (np. akt sprzedaży, testament, pełnomocnictwo),</li>
  <li>dane stron uczestniczących w czynności,</li>
  <li>orientacyjną wartość przedmiotu czynności (jeśli dotyczy).</li>
</ul>
<p>Dzięki temu notariusz może wcześniej przygotować projekt dokumentu i wstępnie oszacować koszty.</p>

<h2>Wymagane dokumenty tożsamości</h2>
<p>Każda osoba biorąca udział w czynności notarialnej musi okazać ważny dowód tożsamości:</p>
<ul>
  <li><strong>dowód osobisty</strong> – dla obywateli polskich,</li>
  <li><strong>paszport lub karta pobytu</strong> – dla cudzoziemców,</li>
  <li>numer PESEL lub NIP (jeśli czynność dotyczy nieruchomości lub działalności gospodarczej).</li>
</ul>

<h2>Dokumenty niezbędne do konkretnych czynności</h2>

<h3>Umowa sprzedaży lub darowizny nieruchomości</h3>
<ul>
  <li>numer księgi wieczystej nieruchomości,</li>
  <li>aktualny wypis z rejestru gruntów (z urzędu gminy lub starostwa),</li>
  <li>zaświadczenie o braku zaległości w podatku od nieruchomości,</li>
  <li>jeżeli nieruchomość należy do majątku wspólnego małżonków – udział obojga małżonków lub stosowna zgoda.</li>
</ul>

<h3>Testament</h3>
<ul>
  <li>dane osobowe testatora (imię, nazwisko, PESEL, adres),</li>
  <li>dane osób powołanych do spadku lub zapisobierców,</li>
  <li>opis majątku, który ma być przedmiotem rozrządzenia (opcjonalnie).</li>
</ul>

<h3>Pełnomocnictwo</h3>
<ul>
  <li>dane mocodawcy i pełnomocnika (imię, nazwisko, PESEL, adres),</li>
  <li>opis zakresu umocowania (do jakiej czynności udzielane jest pełnomocnictwo).</li>
</ul>

<h2>Koszty czynności notarialnej</h2>
<p>Koszty wizyty u notariusza składają się z:</p>
<ul>
  <li><strong>taksy notarialnej</strong> – wynagrodzenia notariusza, określonego rozporządzeniem Ministra Sprawiedliwości,</li>
  <li><strong>podatku VAT</strong> (23%) od wynagrodzenia notariusza,</li>
  <li><strong>opłat sądowych</strong> i podatków, jeżeli czynność tego wymaga (np. PCC przy umowie sprzedaży).</li>
</ul>
<p>Orientacyjną wycenę kosztów można uzyskać telefonicznie lub mailowo przed wizytą.</p>

<h2>Przebieg czynności notarialnej</h2>
<ol>
  <li>Notariusz weryfikuje tożsamość stron i sprawdza dokumenty.</li>
  <li>Odczytuje projekt aktu notarialnego lub innego dokumentu.</li>
  <li>Strony zadają pytania i zgłaszają ewentualne uwagi.</li>
  <li>Dokument jest podpisywany przez wszystkie strony oraz notariusza i opatrywany pieczęcią.</li>
  <li>Notariusz wydaje wypisy aktu notarialnego.</li>
</ol>

<h2>Podsumowanie</h2>
<p>Dobre przygotowanie do wizyty u notariusza to klucz do sprawnego przeprowadzenia czynności prawnej. Jeśli masz pytania lub wątpliwości, skontaktuj się z Kancelarią Notarialną Anna Papież w Krakowie – chętnie udzielimy wszelkich informacji.</p>`,
  },

  // ─────────────────────────────────────────────────────────
  // Blog 1 UA: Як підготуватися до візиту до нотаріуса
  // ─────────────────────────────────────────────────────────
  {
    slug: "jak-przygotowac-sie-do-wizyty-u-notariusza",
    lang: "ua",
    title: "Як підготуватися до візиту до нотаріуса",
    description:
      "Практичний посібник для тих, хто планує відвідати нотаріальну контору. Дізнайтеся, які документи потрібно взяти та як проходить нотаріальна дія.",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80",
    category: "Поради",
    metaTitle: "Як підготуватися до візиту до нотаріуса | Нотаріальна контора Анна Папєж",
    metaDescription:
      "Покроковий практичний посібник: які документи взяти, скільки коштує візит до нотаріуса та як проходить нотаріальна дія в Кракові.",
    content: `<h2>Чому важлива належна підготовка?</h2>
<p>Візит до нотаріуса пов'язаний із підписанням документів, які мають юридичну силу. Належна підготовка дозволяє заощадити час, уникнути зайвих візитів і забезпечити плавний перебіг нотаріальної дії. У цій статті пояснюємо, про що варто пам'ятати перед приходом до контори.</p>

<h2>Запишіться на прийом заздалегідь</h2>
<p>Нотаріальні дії вимагають попереднього запису. Зв'яжіться з конторою телефоном або електронною поштою, вказавши:</p>
<ul>
  <li>вид дії (наприклад, акт продажу, заповіт, довіреність),</li>
  <li>дані сторін, які беруть участь у дії,</li>
  <li>приблизну вартість предмета дії (якщо застосовно).</li>
</ul>
<p>Завдяки цьому нотаріус зможе заздалегідь підготувати проект документа та попередньо оцінити витрати.</p>

<h2>Необхідні документи для підтвердження особи</h2>
<p>Кожна особа, яка бере участь у нотаріальній дії, повинна пред'явити дійсний документ, що посвідчує особу:</p>
<ul>
  <li><strong>посвідчення особи</strong> – для громадян Польщі,</li>
  <li><strong>паспорт або картка проживання</strong> – для іноземців,</li>
  <li>номер PESEL або NIP (якщо дія стосується нерухомості або підприємницької діяльності).</li>
</ul>

<h2>Документи, необхідні для конкретних дій</h2>

<h3>Договір купівлі-продажу або дарування нерухомості</h3>
<ul>
  <li>номер земельно-іпотечного реєстру нерухомості,</li>
  <li>актуальний витяг із реєстру земель (з органу гміни або повітового управління),</li>
  <li>довідка про відсутність заборгованості з податку на нерухомість,</li>
  <li>якщо нерухомість є спільною власністю подружжя – участь обох або відповідна згода.</li>
</ul>

<h3>Заповіт</h3>
<ul>
  <li>персональні дані заповідача (ім'я, прізвище, PESEL, адреса),</li>
  <li>дані осіб, призначених спадкоємцями або відказоодержувачами,</li>
  <li>опис майна, яке є предметом розпорядження (необов'язково).</li>
</ul>

<h3>Довіреність</h3>
<ul>
  <li>дані довірителя та довіреної особи (ім'я, прізвище, PESEL, адреса),</li>
  <li>опис обсягу повноважень (для якої дії видається довіреність).</li>
</ul>

<h2>Витрати на нотаріальну дію</h2>
<p>Вартість візиту до нотаріуса складається з:</p>
<ul>
  <li><strong>нотаріального тарифу</strong> – винагороди нотаріуса, визначеної постановою Міністра юстиції,</li>
  <li><strong>ПДВ</strong> (23%) від винагороди нотаріуса,</li>
  <li><strong>судових зборів</strong> і податків, якщо цього вимагає дія (наприклад, PCC при договорі купівлі-продажу).</li>
</ul>
<p>Орієнтовну вартість витрат можна дізнатися телефоном або електронною поштою до візиту.</p>

<h2>Перебіг нотаріальної дії</h2>
<ol>
  <li>Нотаріус перевіряє особи сторін і документи.</li>
  <li>Зачитує проект нотаріального акту або іншого документа.</li>
  <li>Сторони ставлять запитання та вносять зауваження.</li>
  <li>Документ підписується всіма сторонами та нотаріусом і скріплюється печаткою.</li>
  <li>Нотаріус видає копії нотаріального акту.</li>
</ol>

<h2>Підсумок</h2>
<p>Належна підготовка до візиту до нотаріуса є запорукою успішного проведення правової дії. Якщо у вас є запитання або сумніви, зверніться до Нотаріальної контори Анни Папєж у Кракові – ми з радістю надамо всю необхідну інформацію.</p>`,
  },

  // ─────────────────────────────────────────────────────────
  // Blog 2 PL: Czym jest akt notarialny
  // ─────────────────────────────────────────────────────────
  {
    slug: "czym-jest-akt-notarialny",
    lang: "pl",
    title: "Czym jest akt notarialny i jakie ma skutki prawne",
    description:
      "Akt notarialny to szczególna forma dokumentu prawnego sporządzanego przez notariusza. Poznaj jego cechy, zastosowania i konsekwencje prawne.",
    image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1200&q=80",
    category: "Prawo notarialne",
    metaTitle: "Czym jest akt notarialny i jakie ma skutki prawne | Kancelaria Anna Papież Kraków",
    metaDescription:
      "Akt notarialny – definicja, cechy, kiedy jest wymagany i jakie wywołuje skutki prawne. Kancelaria Notarialna Anna Papież w Krakowie.",
    content: `<h2>Definicja aktu notarialnego</h2>
<p>Akt notarialny to urzędowy dokument sporządzony przez notariusza w formie przewidzianej prawem. Stanowi on jeden z najważniejszych instrumentów prawa cywilnego w Polsce. Zgodnie z art. 2 ustawy Prawo o notariacie, notariusz działa jako osoba zaufania publicznego, a czynności notarialne mają charakter dokumentu urzędowego.</p>

<h2>Kiedy wymagany jest akt notarialny?</h2>
<p>Ustawa przewiduje szereg czynności prawnych, dla których forma aktu notarialnego jest obligatoryjna pod rygorem nieważności. Należą do nich m.in.:</p>
<ul>
  <li><strong>przeniesienie własności nieruchomości</strong> (sprzedaż, darowizna, zamiana),</li>
  <li><strong>ustanowienie hipoteki</strong>,</li>
  <li><strong>umowa deweloperska</strong>,</li>
  <li><strong>ustanowienie użytkowania wieczystego</strong>,</li>
  <li><strong>umowa spółki z ograniczoną odpowiedzialnością</strong> lub spółki akcyjnej,</li>
  <li><strong>testament notarialny</strong>,</li>
  <li><strong>dział spadku lub zniesienie współwłasności</strong> obejmujące nieruchomość,</li>
  <li><strong>pełnomocnictwo do czynności wymagających formy aktu notarialnego</strong>.</li>
</ul>

<h2>Cechy charakterystyczne aktu notarialnego</h2>

<h3>Moc dokumentu urzędowego</h3>
<p>Akt notarialny korzysta z domniemania autentyczności i prawdziwości. Jego obalenie wymaga przeprowadzenia postępowania sądowego o stwierdzenie fałszu dokumentu.</p>

<h3>Tytuł egzekucyjny</h3>
<p>W przypadkach przewidzianych prawem akt notarialny może stanowić tytuł egzekucyjny (art. 777 Kodeksu postępowania cywilnego). Oznacza to, że wierzyciel może skierować go bezpośrednio do komornika, bez konieczności wytaczania powództwa sądowego. Dotyczy to m.in. dobrowolnego poddania się egzekucji przez dłużnika co do zapłaty oznaczonej kwoty.</p>

<h3>Wpisanie do ksiąg wieczystych</h3>
<p>Notariusz jest obowiązany złożyć wniosek o wpis do księgi wieczystej niezwłocznie po sporządzeniu aktu, jeżeli akt stanowi podstawę takiego wpisu. Wpis ma moc wsteczną od daty złożenia wniosku.</p>

<h2>Jak przebiega sporządzenie aktu notarialnego?</h2>
<ol>
  <li><strong>Weryfikacja tożsamości stron</strong> – notariusz sprawdza dokumenty tożsamości.</li>
  <li><strong>Zbadanie zdolności prawnej i do czynności prawnych</strong> – notariusz upewnia się, że strony mogą skutecznie zawrzeć daną czynność.</li>
  <li><strong>Odczytanie projektu aktu</strong> – treść jest odczytywana na głos, co strony potwierdzają.</li>
  <li><strong>Podpisanie dokumentu</strong> – strony i notariusz składają podpisy, notariusz odciska pieczęć urzędową.</li>
  <li><strong>Wydanie wypisów</strong> – strony otrzymują uwierzytelnione odpisy aktu.</li>
</ol>

<h2>Skutki prawne aktu notarialnego</h2>
<p>Akt notarialny wywołuje następujące skutki prawne:</p>
<ul>
  <li><strong>Przeniesienie własności</strong> – jeżeli przedmiotem jest nieruchomość, własność przechodzi na nabywcę z chwilą podpisania aktu.</li>
  <li><strong>Ochrona wierzyciela</strong> – w przypadku aktu zawierającego poddanie się egzekucji, wierzyciel może prowadzić egzekucję bez wyroku sądowego.</li>
  <li><strong>Trwałość prawna</strong> – akt notarialny jest przechowywany w kancelarii przez 10 lat, a następnie przekazywany do Archiwum Państwowego.</li>
</ul>

<h2>Koszty sporządzenia aktu</h2>
<p>Taksa notarialna jest regulowana rozporządzeniem Ministra Sprawiedliwości i zależy od wartości przedmiotu czynności. Oprócz wynagrodzenia notariusza, strony ponoszą koszty podatków (PCC, podatek od darowizn) oraz opłat sądowych. Kancelaria udzieli szczegółowej informacji o kosztach przed wizytą.</p>

<h2>Podsumowanie</h2>
<p>Akt notarialny to fundamentalny instrument polskiego systemu prawnego, zapewniający bezpieczeństwo obrotu prawnego. Jeżeli planują Państwo czynność wymagającą formy notarialnej, zapraszamy do Kancelarii Notarialnej Anna Papież w Krakowie przy ul. Mazowieckiej 8.</p>`,
  },

  // ─────────────────────────────────────────────────────────
  // Blog 2 UA: Що таке нотаріальний акт
  // ─────────────────────────────────────────────────────────
  {
    slug: "czym-jest-akt-notarialny",
    lang: "ua",
    title: "Що таке нотаріальний акт та які він має правові наслідки",
    description:
      "Нотаріальний акт – це особлива форма правового документа, складеного нотаріусом. Дізнайтеся про його характеристики, сфери застосування та правові наслідки.",
    image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1200&q=80",
    category: "Нотаріальне право",
    metaTitle: "Що таке нотаріальний акт та які він має правові наслідки | Нотаріус Краків",
    metaDescription:
      "Нотаріальний акт – визначення, характеристики, коли він є обов'язковим і які правові наслідки тягне. Нотаріальна контора Анна Папєж у Кракові.",
    content: `<h2>Визначення нотаріального акту</h2>
<p>Нотаріальний акт – це офіційний документ, складений нотаріусом у формі, передбаченій законом. Він є одним із найважливіших інструментів цивільного права в Польщі. Відповідно до ст. 2 Закону про нотаріат, нотаріус діє як особа публічної довіри, а нотаріальні дії мають характер офіційного документа.</p>

<h2>Коли є обов'язковим нотаріальний акт?</h2>
<p>Закон передбачає ряд правових дій, для яких форма нотаріального акту є обов'язковою під загрозою недійсності. До них належать:</p>
<ul>
  <li><strong>перехід права власності на нерухомість</strong> (продаж, дарування, обмін),</li>
  <li><strong>встановлення іпотеки</strong>,</li>
  <li><strong>договір з девелопером</strong>,</li>
  <li><strong>встановлення права довгострокової оренди</strong>,</li>
  <li><strong>статут товариства з обмеженою відповідальністю</strong> або акціонерного товариства,</li>
  <li><strong>нотаріальний заповіт</strong>,</li>
  <li><strong>поділ спадщини або скасування спільної власності</strong>, що включає нерухомість,</li>
  <li><strong>довіреність для дій, що вимагають форми нотаріального акту</strong>.</li>
</ul>

<h2>Характерні риси нотаріального акту</h2>

<h3>Сила офіційного документа</h3>
<p>Нотаріальний акт користується презумпцією автентичності та правдивості. Його спростування вимагає проведення судового провадження щодо визнання документа підробним.</p>

<h3>Виконавчий заголовок</h3>
<p>У випадках, передбачених законом, нотаріальний акт може бути виконавчим заголовком (ст. 777 Цивільно-процесуального кодексу). Це означає, що кредитор може направити його безпосередньо до судового виконавця без необхідності подання позову до суду. Зокрема, це стосується добровільного підкорення виконавчому провадженню боржником щодо сплати визначеної суми.</p>

<h3>Внесення до земельно-іпотечного реєстру</h3>
<p>Нотаріус зобов'язаний подати заяву про внесення до реєстру нерухомості невідкладно після складання акту, якщо акт є підставою для такого запису. Запис має зворотню силу від дати подання заяви.</p>

<h2>Як відбувається складання нотаріального акту?</h2>
<ol>
  <li><strong>Перевірка особи сторін</strong> – нотаріус перевіряє документи, що посвідчують особу.</li>
  <li><strong>Перевірка правоздатності та дієздатності</strong> – нотаріус переконується, що сторони можуть ефективно здійснити дану дію.</li>
  <li><strong>Зачитування проекту акту</strong> – зміст зачитується вголос, що сторони підтверджують.</li>
  <li><strong>Підписання документа</strong> – сторони та нотаріус підписують документ, нотаріус ставить офіційну печатку.</li>
  <li><strong>Видача копій</strong> – сторони отримують засвідчені копії акту.</li>
</ol>

<h2>Правові наслідки нотаріального акту</h2>
<p>Нотаріальний акт тягне такі правові наслідки:</p>
<ul>
  <li><strong>Перехід права власності</strong> – якщо предметом є нерухомість, право власності переходить до покупця з моменту підписання акту.</li>
  <li><strong>Захист кредитора</strong> – у разі акту, що містить підкорення виконавчому провадженню, кредитор може провести стягнення без судового рішення.</li>
  <li><strong>Правова стабільність</strong> – нотаріальний акт зберігається в конторі протягом 10 років, а потім передається до Державного архіву.</li>
</ul>

<h2>Вартість складання акту</h2>
<p>Нотаріальний тариф регулюється постановою Міністра юстиції і залежить від вартості предмета дії. Окрім винагороди нотаріуса, сторони несуть витрати на податки (PCC, податок на дарування) та судові збори. Контора надасть детальну інформацію про витрати до візиту.</p>

<h2>Підсумок</h2>
<p>Нотаріальний акт є фундаментальним інструментом польської правової системи, що забезпечує безпеку правового обігу. Якщо ви плануєте дію, що вимагає нотаріальної форми, запрошуємо до Нотаріальної контори Анна Папєж у Кракові по вул. Мазовецькій 8.</p>`,
  },
];

async function main() {
  const site = await getSiteBySubdomain("anna-papiez");
  if (!site) throw new Error("Site anna-papiez not found in database");

  let inserted = 0;
  let skipped = 0;

  for (const blog of BLOGS) {
    const existing = await getBlogBySlug(site.id, blog.slug, blog.lang);
    if (existing) {
      console.log(`  Skipped [${blog.lang}]: ${blog.slug}`);
      skipped++;
      continue;
    }

    await createBlog({
      siteId: site.id,
      slug: blog.slug,
      lang: blog.lang,
      title: blog.title,
      description: blog.description,
      content: blog.content,
      image: blog.image,
      category: blog.category,
      tags: [],
      status: "published",
      standalone: false,
      publishedAt: new Date("2026-04-01"),
      metaTitle: blog.metaTitle,
      metaDescription: blog.metaDescription,
    });
    console.log(`  Inserted [${blog.lang}]: ${blog.slug}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
