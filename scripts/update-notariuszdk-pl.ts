import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    // 1. Update PL contact.info.hours translation
    console.log("Updating contact.info.hours PL translation...");
    await client.query(`
      UPDATE sites
      SET translations = jsonb_set(translations, '{pl,contact.info.hours}', '"GODZINY OTWARCIA"')
      WHERE id = 30
    `);
    console.log("  ✓ contact.info.hours updated");

    // 2. Update hoursDetailed in config
    console.log("Updating hoursDetailed in config...");
    await client.query(`
      UPDATE sites
      SET config = jsonb_set(
        config,
        '{pages,contact,sections,0,info,hoursDetailed}',
        '["PONIEDZIAŁEK – PIĄTEK 9.00 – 17.00."]'
      )
      WHERE id = 30
    `);
    console.log("  ✓ hoursDetailed updated");

    // 3. Insert PL service blog posts
    const services = [
      {
        slug: "service-akty-notarialne",
        title: "Akty notarialne: obrót nieruchomościami, darowizny i zamiany",
        description:
          "Dowiedz się o aktach notarialnych w Polsce — sprzedaż nieruchomości, darowizny i zamiany w kancelarii notarialnej w Krakowie.",
        content: `<h2>Akty notarialne w kancelarii notarialnej</h2><p>Akt notarialny jest najbardziej uroczystą formą dokumentu prawnego w polskim systemie prawnym. Wiele czynności prawnych — w szczególności dotyczących nieruchomości — wymaga z mocy prawa zachowania formy aktu notarialnego. Bez tej formy czynność prawna jest nieważna. W Kancelarii Notarialnej Dariusz Klimonda w Krakowie sporządzamy akty notarialne dla szerokiego zakresu czynności z zakresu prawa cywilnego.</p><h3>Umowy sprzedaży nieruchomości</h3><p>Najczęstszym rodzajem aktu notarialnego jest umowa sprzedaży nieruchomości. Zgodnie z polskim prawem (art. 158 Kodeksu cywilnego) każda umowa przenosząca własność nieruchomości musi być zawarta w formie aktu notarialnego. Dotyczy to mieszkań, domów, działek, nieruchomości komercyjnych oraz gruntów rolnych.</p><p>Akt notarialny dotyczący transakcji nieruchomościowej zawiera zazwyczaj:</p><ul><li>Oznaczenie stron (kupującego i sprzedającego) wraz z ich danymi osobowymi</li><li>Dokładny opis nieruchomości, w tym numer księgi wieczystej (KW)</li><li>Ustaloną cenę sprzedaży i warunki płatności</li><li>Oświadczenia dotyczące stanu prawnego nieruchomości</li><li>Wnioski do sądu wieczystoksięgowego</li></ul><h3>Umowy darowizny</h3><p>Darowizny nieruchomości między członkami rodziny są w Polsce niezwykle powszechne, szczególnie przy międzypokoleniowym przekazywaniu majątku. Umowa darowizny zawarta w formie aktu notarialnego przenosi własność nieruchomości na obdarowanego. Notariusz dba o to, aby obie strony rozumiały konsekwencje podatkowe — bliscy krewni (małżonek, dzieci, rodzice, rodzeństwo, dziadkowie, wnuki) mogą korzystać z pełnego zwolnienia podatkowego w ramach I grupy podatkowej, pod warunkiem zgłoszenia darowizny do urzędu skarbowego w terminie sześciu miesięcy.</p><h3>Umowy zamiany</h3><p>Umowa zamiany pozwala dwóm stronom na wymianę nieruchomości bez tradycyjnej sprzedaży. Może być szczególnie przydatna, gdy sąsiedzi chcą uregulować granice działek lub gdy członkowie rodziny pragną dokonać redystrybucji majątku nieruchomościowego. Akt notarialny obejmujący zamianę zawiera wyceny obu nieruchomości oraz określa ewentualną dopłatę, gdy nieruchomości różnią się wartością.</p><h3>Umowy przedwstępne</h3><p>Przed zawarciem umowy ostatecznej strony często zawierają umowę przedwstępną. Umowę przedwstępną można zawrzeć w zwykłej formie pisemnej, jednak zawarcie jej w formie aktu notarialnego zapewnia znacznie silniejszą ochronę prawną. Notarialna umowa przedwstępna daje kupującemu prawo żądania zawarcia umowy przyrzeczonej na drodze sądowej, podczas gdy zwykła forma pisemna uprawnia jedynie do dochodzenia odszkodowania.</p><h3>Rola notariusza</h3><p>Notariusz jest bezstronnym funkcjonariuszem publicznym, który dba o legalność i bezpieczeństwo transakcji dla wszystkich stron. Przed sporządzeniem aktu notariusz weryfikuje stan prawny nieruchomości poprzez badanie księgi wieczystej, sprawdza tożsamość stron i upewnia się, że wszystkie wymagane dokumenty są w porządku. Notariusz wyjaśnia też obu stronom skutki prawne transakcji.</p><h3>Jakie dokumenty są potrzebne?</h3><p>Przy typowej transakcji nieruchomościowej należy dostarczyć:</p><ul><li>Ważne dokumenty tożsamości (paszport lub dowód osobisty)</li><li>Numer księgi wieczystej (KW)</li><li>Podstawę nabycia (poprzedni akt notarialny, postanowienie spadkowe lub wyrok sądu)</li><li>Zaświadczenie z gminy o przeznaczeniu terenu w miejscowym planie zagospodarowania przestrzennego</li><li>Świadectwo charakterystyki energetycznej</li><li>Zaświadczenia podatkowe, jeśli są wymagane</li></ul><p>Zalecamy wcześniejszy kontakt z kancelarią, abyśmy mogli przygotować dostosowaną listę dokumentów dla konkretnej transakcji. Zespół Kancelarii Notarialnej Dariusz Klimonda w Krakowie jest gotowy odpowiedzieć na wszelkie pytania dotyczące aktów notarialnych.</p>`,
        image:
          "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/notariuszdk/blog-service-akty-notarialne.jpg",
        category: "usługi",
        tags: JSON.stringify([
          "notariusz",
          "kraków",
          "akt notarialny",
          "nieruchomości",
          "sprzedaż",
          "darowizna",
          "zamiana",
        ]),
        meta_title:
          "Akty notarialne: nieruchomości, darowizny i zamiany | Notariusz Kraków",
        meta_description:
          "Akty notarialne dla transakcji nieruchomościowych, darowizn i zamian w Krakowie. Sprawdź, jakie dokumenty są potrzebne i jak przebiega proces.",
      },
      {
        slug: "service-depozyt-notarialny",
        title:
          "Depozyt notarialny: bezpieczne przechowanie pieniędzy i dokumentów",
        description:
          "Dowiedz się o depozycie notarialnym w Polsce — bezpieczna usługa escrow dla pieniędzy, papierów wartościowych i dokumentów w kancelarii notarialnej w Krakowie.",
        content: `<h2>Depozyt notarialny</h2><p>Depozyt notarialny to usługa, w ramach której notariusz przyjmuje pieniądze, papiery wartościowe lub dokumenty na przechowanie i wydaje je oznaczonemu odbiorcy po spełnieniu określonych warunków. Działa podobnie jak escrow i zapewnia wysoki poziom bezpieczeństwa dla obu stron transakcji. W Kancelarii Notarialnej Dariusz Klimonda w Krakowie oferujemy usługi depozytu notarialnego w różnych celach.</p><h3>Jak działa depozyt notarialny?</h3><p>Mechanizm depozytu notarialnego jest prosty. Składający depozyt przekazuje pieniądze lub dokumenty notariuszowi, który przechowuje je na dedykowanym rachunku depozytowym (środki pieniężne) lub w bezpiecznym miejscu (dokumenty). Następnie notariusz wydaje depozyt oznaczonemu odbiorcy, gdy spełnione zostaną uzgodnione warunki — na przykład gdy przedstawiony zostanie dowód przeniesienia własności nieruchomości lub gdy nadejdzie określona data.</p><p>Całość jest udokumentowana w protokole przyjęcia depozytu, który precyzyjnie określa:</p><ul><li>Tożsamość składającego i uprawnionego odbiorcy</li><li>Dokładną kwotę pieniędzy lub opis deponowanych dokumentów</li><li>Warunki, po spełnieniu których depozyt zostanie wydany</li><li>Termin spełnienia tych warunków</li><li>Co się dzieje, jeśli warunki nie zostaną spełnione (zwrot do składającego)</li></ul><h3>Kiedy stosuje się depozyt notarialny?</h3><p>Najczęstsze zastosowania depozytu notarialnego to:</p><h3>Transakcje nieruchomościowe</h3><p>Depozyt notarialny jest szczególnie wartościowy przy sprzedaży nieruchomości. Kupujący deponuje cenę zakupu u notariusza przed lub w chwili podpisania umowy sprzedaży. Notariusz przekazuje środki sprzedającemu dopiero po prawidłowym wpisaniu przeniesienia własności do księgi wieczystej. Chroni to kupującego przed zapłatą za nieruchomość, której może nie otrzymać, oraz zapewnia sprzedającemu pewność dostępności środków.</p><h3>Uregulowanie zobowiązań</h3><p>Gdy wierzyciel odmawia przyjęcia płatności lub nie można go odnaleźć, dłużnik może złożyć należną kwotę u notariusza. Zgodnie z polskim prawem cywilnym (art. 470 Kodeksu cywilnego) depozyt taki ma skutek prawny spełnienia zobowiązania. Dłużnik jest zwolniony z długu, a wierzyciel może odebrać zdeponowane środki od notariusza.</p><h3>Sprawy spadkowe</h3><p>Depozyty notarialne są czasem stosowane przy rozliczeniach spadkowych, szczególnie gdy spadkobiercy potrzebują neutralnego mechanizmu przechowania i podziału składników majątkowych. Na przykład, gdy jeden ze spadkobierców spłaca pozostałych z tytułu przejęcia nieruchomości spadkowej, płatność może być zabezpieczona poprzez depozyt notarialny.</p><h3>Transakcje gospodarcze</h3><p>W transakcjach biznesowych, takich jak przeniesienie udziałów lub nabycie aktywów, strony często korzystają z depozytu notarialnego, aby zapewnić jednoczesność płatności i przeniesienia własności. Jest to szczególnie powszechne w transakcjach między stronami nieposiadającymi ugruntowanych relacji biznesowych.</p><h3>Bezpieczeństwo depozytu notarialnego</h3><p>Depozyty notarialne oferują wyjątkowo wysoki poziom bezpieczeństwa z kilku powodów:</p><ul><li>Środki pieniężne są przechowywane na specjalnym rachunku depozytowym, oddzielonym od rachunków osobistych i służbowych notariusza</li><li>Rachunek depozytowy jest chroniony przed zajęciem w ramach ewentualnych postępowań egzekucyjnych przeciwko notariuszowi</li><li>Notariusz ponosi osobistą odpowiedzialność za prawidłowe zarządzanie depozytami</li><li>Notariusz jest objęty obowiązkowym ubezpieczeniem odpowiedzialności zawodowej</li><li>Notariusz jest związany ścisłą etyką zawodową i podlega nadzorowi izby notarialnej</li></ul><h3>Opłaty za depozyt notarialny</h3><p>Wynagrodzenie notariusza za przyjęcie depozytu jest regulowane rozporządzeniem Ministra Sprawiedliwości w sprawie maksymalnych stawek taksy notarialnej. Opłata zależy od wartości depozytu. Dla kwot do 3 000 zł opłata wynosi 100 zł. Dla wyższych kwot opłata jest obliczana według skali degresywnej. Notariusz poda dokładną kalkulację opłaty przed przyjęciem depozytu.</p><p>Jeśli planujesz transakcję i chcesz zapewnić maksymalne bezpieczeństwo wszystkim stronom, skontaktuj się z naszą kancelarią w Krakowie, aby omówić, jak depozyt notarialny może chronić Twoje interesy.</p>`,
        image:
          "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/notariuszdk/blog-service-depozyt-notarialny.jpg",
        category: "usługi",
        tags: JSON.stringify([
          "notariusz",
          "kraków",
          "depozyt notarialny",
          "escrow",
          "przechowanie",
          "nieruchomości",
        ]),
        meta_title: "Depozyt notarialny: bezpieczne escrow | Notariusz Kraków",
        meta_description:
          "Depozyt notarialny w Krakowie — bezpieczne przechowanie pieniędzy i dokumentów przy transakcjach nieruchomościowych, spłatach zobowiązań i transakcjach biznesowych.",
      },
      {
        slug: "service-pelnomocnictwa-testamenty",
        title: "Pełnomocnictwa i testamenty u polskiego notariusza",
        description:
          "Dowiedz się o notarialnych pełnomocnictwach i testamentach w Polsce — rodzaje, wymogi prawne i dlaczego forma notarialna zapewnia najsilniejszą ochronę.",
        content: `<h2>Pełnomocnictwa i testamenty: czynności notarialne</h2><p>Pełnomocnictwa i testamenty to dwa z najważniejszych instrumentów prawnych, z których korzystają osoby fizyczne w celu ochrony swoich interesów i zabezpieczenia rodziny. Choć oba dokumenty mogą być sporządzone w zwykłej formie pisemnej na gruncie polskiego prawa, nadanie im formy notarialnej zapewnia znacznie silniejszą ochronę prawną i pomaga uniknąć sporów. W Kancelarii Notarialnej Dariusz Klimonda w Krakowie sporządzamy te dokumenty z najwyższą starannością.</p><h3>Pełnomocnictwa</h3><p>Pełnomocnictwo to dokument prawny, na mocy którego jedna osoba (mocodawca) upoważnia inną osobę (pełnomocnika) do działania w jej imieniu w określonych sprawach prawnych. Polskie prawo wyróżnia kilka rodzajów pełnomocnictw, różniących się zakresem i wymogami formalnymi.</p><h3>Rodzaje pełnomocnictw</h3><ul><li><strong>Pełnomocnictwo ogólne</strong> — upoważnia pełnomocnika do dokonywania czynności zwykłego zarządu w imieniu mocodawcy. Wymaga formy pisemnej pod rygorem nieważności.</li><li><strong>Pełnomocnictwo rodzajowe</strong> — upoważnia pełnomocnika do dokonywania określonej kategorii czynności prawnych (np. wszelkich operacji bankowych).</li><li><strong>Pełnomocnictwo szczególne</strong> — upoważnia pełnomocnika do dokonania jednej, konkretnej czynności prawnej (np. sprzedaży określonej nieruchomości).</li></ul><p>Co istotne, jeśli czynność prawna, do której udzielane jest pełnomocnictwo, wymaga formy aktu notarialnego — jak np. sprzedaż nieruchomości — wówczas samo pełnomocnictwo również musi być sporządzone w formie aktu notarialnego. To jeden z najczęstszych powodów wizyt w naszej kancelarii.</p><h3>Kiedy wymagane jest notarialne pełnomocnictwo?</h3><p>Pełnomocnictwo notarialne jest wymagane lub szczególnie zalecane w przypadku:</p><ul><li>Transakcji nieruchomościowych (sprzedaż, zakup, darowizna, zamiana)</li><li>Ustanowienia lub zwolnienia hipoteki</li><li>Reprezentowania kogoś na zgromadzeniu wspólników lub walnym zgromadzeniu akcjonariuszy</li><li>Działania przed sądem wieczystoksięgowym</li><li>Każdej sytuacji, gdy kontrahent lub instytucja wymaga formy notarialnej</li></ul><h3>Testamenty</h3><p>Testament to oświadczenie woli testatora dotyczące rozporządzenia jego majątkiem po śmierci. Polskie prawo przewiduje kilka form testamentów, jednak testament notarialny oferuje największe bezpieczeństwo i jest najtrudniejszy do podważenia w sądzie.</p><h3>Rodzaje testamentów w świetle prawa polskiego</h3><ul><li><strong>Testament holograficzny</strong> — musi być w całości napisany odręcznie, opatrzony datą i podpisem testatora. Nie wymaga świadków, ale łatwo go zgubić lub zakwestionować.</li><li><strong>Testament notarialny</strong> — sporządzany przez notariusza w formie aktu notarialnego. Przechowywany w archiwum kancelarii i rejestrowany w Notarialnym Rejestrze Testamentów (NPUR).</li><li><strong>Testament allograficzny</strong> — ustne oświadczenie złożone przed upoważnionym urzędnikiem i dwoma świadkami. W praktyce rzadko stosowany.</li></ul><h3>Zalety testamentu notarialnego</h3><p>Testament notarialny jest zdecydowanie najbezpieczniejszym rozwiązaniem z kilku powodów:</p><ul><li>Notariusz weryfikuje tożsamość testatora i jego zdolność do czynności prawnych</li><li>Testament jest sporządzany precyzyjnym językiem prawnym, co zmniejsza ryzyko niejasności</li><li>Oryginał jest przechowywany w archiwum kancelarii, co eliminuje ryzyko zagubienia lub zniszczenia dokumentu</li><li>Rejestracja w Notarialnym Rejestrze Testamentów gwarantuje odnalezienie testamentu po śmierci testatora</li><li>Jest niezwykle trudny do podważenia w sądzie w porównaniu z testamentami holograficznymi</li></ul><h3>Odwołanie i zmiana testamentu</h3><p>Zgodnie z polskim prawem testament może być odwołany lub zmieniony w każdej chwili za życia testatora. Można to zrobić poprzez sporządzenie nowego testamentu (który automatycznie odwołuje poprzedni w zakresie sprzeczności), zniszczenie istniejącego testamentu lub usunięcie konkretnych postanowień. Zalecamy sporządzenie nowego testamentu notarialnego zawsze, gdy okoliczności istotnie się zmieniają.</p><p>Skontaktuj się z naszą kancelarią w Krakowie, aby omówić swoje potrzeby w zakresie pełnomocnictw lub testamentów. Wyjaśnimy dostępne opcje i pomożemy wybrać najlepsze rozwiązanie dla Twojej sytuacji.</p>`,
        image:
          "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/notariuszdk/blog-service-pelnomocnictwa-testamenty.jpg",
        category: "usługi",
        tags: JSON.stringify([
          "notariusz",
          "kraków",
          "pełnomocnictwo",
          "testament",
          "dokumenty prawne",
        ]),
        meta_title:
          "Pełnomocnictwa i testamenty u notariusza | Notariusz Kraków",
        meta_description:
          "Notarialne pełnomocnictwa i testamenty w Krakowie. Poznaj rodzaje, wymogi prawne i zalety formy notarialnej według prawa polskiego.",
      },
      {
        slug: "service-poswiadczenia",
        title: "Poświadczenia notarialne: podpisy, odpisy i daty",
        description:
          "Poświadczenia notarialne w Polsce — uwierzytelnienie podpisów, odpisy z oryginałów, poświadczenia daty i inne czynności notarialne.",
        content: `<h2>Poświadczenia notarialne w polskim prawie</h2><p>Poświadczenia notarialne należą do najczęściej zlecanych usług w każdej polskiej kancelarii notarialnej. Są to urzędowe zaświadczenia notariusza potwierdzające określone fakty — takie jak autentyczność podpisu, zgodność odpisu z oryginałem dokumentu lub data okazania dokumentu. W Kancelarii Notarialnej Dariusz Klimonda w Krakowie świadczymy wszystkie rodzaje poświadczeń notarialnych szybko i sprawnie.</p><h3>Poświadczenie podpisu</h3><p>Notarialne poświadczenie podpisu potwierdza, że określona osoba złożyła podpis na dokumencie w obecności notariusza lub uznała za własny podpis wcześniej złożony. Jest to jedna z najczęściej potrzebnych usług notarialnych, wymagana przy wielu rodzajach czynności prawnych.</p><p>Najczęstsze sytuacje wymagające poświadczonego podpisu:</p><ul><li>Sprzedaż pojazdu (gdy strony nie mogą spotkać się osobiście)</li><li>Wnioski do sądu wieczystoksięgowego</li><li>Pełnomocnictwa w różnych sprawach administracyjnych</li><li>Dokumenty korporacyjne (uchwały wspólników, zbycie udziałów)</li><li>Oświadczenia dla banków, firm ubezpieczeniowych i urzędów</li><li>Formularze zgody i oświadczenia woli</li></ul><p>Osoba, której podpis ma zostać poświadczony, musi osobiście stawić się przed notariuszem z ważnym dokumentem tożsamości. Notariusz weryfikuje tożsamość osoby i umieszcza na dokumencie urzędową klauzulę poświadczeniową.</p><h3>Poświadczenie zgodności odpisu z oryginałem</h3><p>Notarialne poświadczenie zgodności odpisu potwierdza, że kserokopia lub odpis dokumentu jest wiernym odwzorowaniem oryginału. Notariusz porównuje odpis z oryginałem dokumentu i umieszcza urzędową klauzulę potwierdzającą zgodność. Ten rodzaj poświadczenia jest często wymagany, gdy należy złożyć kopie ważnych dokumentów, zachowując oryginały.</p><p>Dokumenty najczęściej wymagające poświadczonych odpisów:</p><ul><li>Dyplomy i świadectwa</li><li>Akty urodzenia, małżeństwa i zgonu</li><li>Orzeczenia i wyroki sądowe</li><li>Dokumenty założycielskie spółek</li><li>Dokumenty własności nieruchomości</li><li>Dokumenty zagraniczne przeznaczone do użytku w Polsce</li></ul><h3>Poświadczenie daty</h3><p>Poświadczenie daty (data pewna) potwierdza, że dokument istniał w określonym dniu. Zgodnie z polskim prawem cywilnym określone skutki prawne zależą od tego, czy dokument posiada datę pewną — ma to szczególne znaczenie przy umowach najmu, cesji wierzytelności i sporach o pierwszeństwo. Notariusz opatruje dokument pieczęcią i sporządza protokół potwierdzający datę okazania dokumentu.</p><h3>Poświadczenie pozostawania przy życiu</h3><p>To poświadczenie potwierdza, że określona osoba żyje w danym dniu. Najczęściej jest wymagane dla celów emerytalnych, w szczególności przez osoby pobierające emerytury z zagranicznych instytucji. Osoba musi stawić się przed notariuszem osobiście.</p><h3>Inne poświadczenia</h3><p>Notariusz może również poświadczyć:</p><ul><li>Że osoba stawiła się w określonym miejscu i czasie</li><li>Wydruki dokumentów elektronicznych zgodnie z ich oryginałami cyfrowymi</li><li>Tłumaczenia przedstawiane wraz z oryginalnymi dokumentami</li></ul><h3>Informacje praktyczne</h3><p>Większość poświadczeń notarialnych można uzyskać podczas krótkiej wizyty bez wcześniejszego umawiania terminu, choć zalecamy telefoniczny kontakt w godzinach wzmożonego ruchu. Opłaty za poświadczenia są regulowane przez Ministra Sprawiedliwości i są zazwyczaj niewielkie. Należy przynieść oryginał dokumentu i ważny dokument tożsamości (paszport lub dowód osobisty). W przypadku poświadczenia odpisu należy przynieść zarówno oryginał, jak i odpis przeznaczony do poświadczenia.</p><p>Zapraszamy do naszej kancelarii przy ul. Wielickiej 30 w Krakowie lub prosimy o kontakt telefoniczny, aby dowiedzieć się więcej o usługach poświadczeń.</p>`,
        image:
          "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/notariuszdk/blog-service-poswiadczenia.jpg",
        category: "usługi",
        tags: JSON.stringify([
          "notariusz",
          "kraków",
          "poświadczenia",
          "podpisy",
          "odpisy",
          "uwierzytelnienie",
        ]),
        meta_title:
          "Poświadczenia notarialne: podpisy, odpisy i daty | Notariusz Kraków",
        meta_description:
          "Poświadczenia notarialne w Krakowie — uwierzytelnienie podpisów, odpisy z oryginałów, poświadczenia daty. Szybka obsługa w Kancelarii Notarialnej Dariusz Klimonda.",
      },
      {
        slug: "service-poswiadczenie-dziedziczenia",
        title: "Akt Poświadczenia Dziedziczenia (APD) u notariusza",
        description:
          "Dowiedz się o notarialnym akcie poświadczenia dziedziczenia (APD) w Polsce — szybka alternatywa dla sądowego stwierdzenia nabycia spadku.",
        content: `<h2>Akt Poświadczenia Dziedziczenia (APD)</h2><p>Gdy osoba umrze w Polsce, jej spadkobiercy muszą formalnie potwierdzić swoje prawo do dziedziczenia. Tradycyjnie wymagało to postępowania sądowego, które mogło trwać miesiące, a nawet lata. Od 2009 roku polskie prawo oferuje szybszą i wygodniejszą alternatywę: notarialny akt poświadczenia dziedziczenia (APD). W Kancelarii Notarialnej Dariusz Klimonda w Krakowie przeprowadzamy rodziny przez ten proces z profesjonalizmem i wrażliwością.</p><h3>Czym jest APD?</h3><p>Akt Poświadczenia Dziedziczenia to dokument notarialny, który oficjalnie potwierdza, kto jest spadkobiercą po zmarłym i w jakim udziale każdy ze spadkobierców dziedziczy. Po zarejestrowaniu w Notarialnym Rejestrze Aktów Poświadczenia Dziedziczenia APD ma taką samą moc prawną jak sądowe postanowienie o stwierdzeniu nabycia spadku. Oznacza to, że można go wykorzystać do przeniesienia własności nieruchomości, uzyskania dostępu do rachunków bankowych i uregulowania wszelkich spraw związanych ze spadkiem.</p><h3>Kiedy można skorzystać z drogi notarialnej?</h3><p>Notarialne poświadczenie dziedziczenia jest możliwe, gdy:</p><ul><li>Wszyscy spadkobiercy ustawowi i testamentowi są znani i możliwi do ustalenia</li><li>Wszyscy spadkobiercy stawiają się przed notariuszem osobiście (jednocześnie)</li><li>Między spadkobiercami nie ma sporu co do dziedziczenia</li><li>Spadek otworzył się (zgon nastąpił) po 30 czerwca 1984 r.</li><li>Spadkodawca był obywatelem polskim lub posiadał majątek w Polsce</li></ul><p>Jeśli którykolwiek z tych warunków nie jest spełniony — na przykład gdy spadkobiercy kwestionują ważność testamentu lub nie mogą wszyscy stawić się jednocześnie — sprawa musi zostać rozstrzygnięta przez sąd.</p><h3>Procedura sporządzenia APD krok po kroku</h3><p>Proces obejmuje dwa główne etapy przeprowadzane podczas jednej wizyty w kancelarii:</p><h3>1. Protokół dziedziczenia</h3><p>W pierwszej kolejności notariusz sporządza szczegółowy protokół, w którym wszyscy spadkobiercy składają oświadczenia pod rygorem odpowiedzialności karnej dotyczące sytuacji rodzinnej spadkodawcy, w tym informacji o:</p><ul><li>Stanie cywilnym spadkodawcy i ewentualnych umowach majątkowych małżeńskich</li><li>Wszystkich dzieciach i zstępnych (w tym przysposobionych)</li><li>Istnieniu testamentów (odręcznych, notarialnych lub innych form)</li><li>Czy którykolwiek ze spadkobierców zrzekł się spadku lub został uznany za niegodnego dziedziczenia</li><li>Czy toczą się jakiekolwiek postępowania spadkowe w sądzie</li></ul><h3>2. Akt poświadczenia dziedziczenia</h3><p>Na podstawie protokołu i dokumentów pomocniczych notariusz sporządza sam APD. Dokument ten wymienia wszystkich spadkobierców i ich udziały w spadku, ustalone na podstawie przepisów ustawowych lub postanowień ważnego testamentu. APD jest niezwłocznie rejestrowany w elektronicznym Notarialnym Rejestrze Aktów Poświadczenia Dziedziczenia.</p><h3>Wymagane dokumenty</h3><p>Do sporządzenia APD spadkobiercy muszą dostarczyć:</p><ul><li>Akt zgonu spadkodawcy</li><li>Akty urodzenia spadkobierców (lub akty małżeństwa dla małżonka)</li><li>Oryginalny testament, jeśli istnieje</li><li>Dokumenty tożsamości wszystkich spadkobierców (paszporty lub dowody osobiste)</li><li>Numer PESEL spadkodawcy (jeśli jest dostępny)</li><li>Akt małżeństwa spadkodawcy (jeśli dotyczy)</li></ul><h3>Zalety w porównaniu z postępowaniem sądowym</h3><p>APD notarialny oferuje kilka istotnych korzyści w porównaniu z drogą sądową. Cały proces można zazwyczaj zakończyć podczas jednej wizyty w kancelarii, często w ciągu jednego lub dwóch tygodni od pierwszego kontaktu. Postępowania sądowe mogą natomiast trwać kilka miesięcy. APD jest również zazwyczaj tańszy, a atmosfera w kancelarii notarialnej jest mniej formalna i stresująca niż sala sądowa.</p><p>Skontaktuj się z Kancelarią Notarialną Dariusz Klimonda w Krakowie, aby umówić wizytę i dowiedzieć się więcej o dokumentach potrzebnych w Twojej konkretnej sytuacji.</p>`,
        image:
          "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/notariuszdk/blog-service-poswiadczenie-dziedziczenia.jpg",
        category: "usługi",
        tags: JSON.stringify([
          "notariusz",
          "kraków",
          "dziedziczenie",
          "APD",
          "akt poświadczenia dziedziczenia",
          "spadek",
        ]),
        meta_title:
          "Akt Poświadczenia Dziedziczenia (APD) u notariusza | Notariusz Kraków",
        meta_description:
          "Szybkie notarialne poświadczenie dziedziczenia (APD) w Krakowie. Poznaj procedurę, wymagane dokumenty i zalety w porównaniu z postępowaniem sądowym.",
      },
      {
        slug: "service-umowy-spolek",
        title: "Umowy spółek u notariusza: zakładanie firmy w Polsce",
        description:
          "Zakładasz firmę w Polsce? Dowiedz się, które umowy spółek wymagają formy aktu notarialnego i jak wygląda ten proces u notariusza.",
        content: `<h2>Umowy spółek w kancelarii notarialnej</h2><p>Założenie firmy w Polsce często wymaga udziału notariusza. Zgodnie z Kodeksem spółek handlowych określone rodzaje umów spółek muszą być zawarte w formie aktu notarialnego, aby były ważne prawnie. W Kancelarii Notarialnej Dariusz Klimonda w Krakowie pomagamy przedsiębiorcom i inwestorom w zakładaniu i zmienianiu umów spółek.</p><h3>Które typy spółek wymagają aktu notarialnego?</h3><p>Polskie prawo nakazuje formę notarialną dla dokumentów założycielskich następujących typów spółek:</p><ul><li><strong>Spółka z ograniczoną odpowiedzialnością (sp. z o.o.)</strong> — najpopularniejsza forma prowadzenia działalności w Polsce. Umowa spółki musi być zawarta w formie aktu notarialnego (chyba że korzysta się z systemu S24 do prostych rejestracji online).</li><li><strong>Spółka akcyjna (S.A.)</strong> — statut musi być zawsze sporządzony w formie notarialnej.</li><li><strong>Spółka komandytowa</strong> — umowa spółki wymaga formy notarialnej.</li><li><strong>Spółka komandytowo-akcyjna</strong> — statut musi być sporządzony notarialnie.</li></ul><h3>Spółki jawne i partnerskie</h3><p>Spółki jawne i spółki partnerskie nie wymagają formy notarialnej dla umów założycielskich — wystarczy zwykła forma pisemna. Jeśli jednak wspólnicy zamierzają wnieść do spółki nieruchomości, forma aktu notarialnego staje się konieczna dla tego konkretnego wkładu.</p><h3>Co robi notariusz?</h3><p>Sporządzając umowę spółki, notariusz wykonuje kilka istotnych czynności:</p><ul><li>Sporządza lub weryfikuje umowę spółki lub statut pod kątem zgodności z polskim prawem</li><li>Weryfikuje tożsamość wszystkich założycieli i ich zdolność do czynności prawnych</li><li>Sprawdza, czy kapitał zakładowy spełnia minimalne wymagania (5 000 zł dla sp. z o.o., 100 000 zł dla S.A.)</li><li>Odczytuje cały dokument wszystkim stronom na głos i wyjaśnia jego skutki prawne</li><li>Zbiera podpisy i przykłada urzędową pieczęć notarialną</li><li>Wydaje uwierzytelnione odpisy (wypisy) potrzebne do rejestracji w Krajowym Rejestrze Sądowym (KRS)</li></ul><h3>Zmiany umów spółek</h3><p>Zmiany umowy spółki lub statutu zazwyczaj również wymagają formy notarialnej. Najczęstsze zmiany to: zmiana firmy (nazwy), siedziby, przedmiotu działalności, kapitału zakładowego (podwyższenie lub obniżenie) oraz zasad funkcjonowania zarządu lub rady nadzorczej. Każda zmiana wymaga uchwały wspólników podjętej w formie przewidzianej prawem, często w postaci aktu notarialnego.</p><h3>Zbycie udziałów</h3><p>Sprzedaż lub przeniesienie udziałów w spółce z ograniczoną odpowiedzialnością musi być udokumentowane na piśmie z notarialnie poświadczonymi podpisami. Oznacza to, że zarówno zbywca, jak i nabywca muszą podpisać umowę zbycia udziałów w obecności notariusza, który poświadcza autentyczność ich podpisów. Wymóg ten chroni obie strony i zapewnia prawidłowe odnotowanie transakcji w rejestrze wspólników spółki.</p><h3>Fuzje, podziały i przekształcenia</h3><p>Restrukturyzacje korporacyjne, takie jak łączenie, podział i przekształcanie spółek, również wymagają udziału notariusza. Plany i uchwały związane z tymi operacjami muszą być sporządzone w formie aktów notarialnych, a notariusz odgrywa kluczową rolę w zapewnieniu zgodności ze złożonymi wymogami proceduralnymi Kodeksu spółek handlowych.</p><h3>Praktyczne wskazówki dla przedsiębiorców</h3><p>Jeśli planujesz założyć firmę w Polsce, zalecamy:</p><ul><li>Konsultację z notariuszem przed sporządzeniem umowy w celu omówienia konkretnych potrzeb</li><li>Przygotowanie jasnego planu biznesowego, aby umowa spółki mogła być dostosowana do Twoich celów</li><li>Przyniesienie ważnych dokumentów tożsamości wszystkich założycieli</li><li>Zarezerwowanie wystarczającego czasu na przejrzenie i przygotowanie dokumentów przez notariusza</li></ul><p>Nasza kancelaria w Krakowie obsługuje przedsiębiorców z całego regionu. Skontaktuj się z Kancelarią Notarialną Dariusz Klimonda, aby umówić konsultację w sprawie zakładania spółki lub innych zagadnień korporacyjnych.</p>`,
        image:
          "https://pub-e1c131c824954a5086d6fb327930e430.r2.dev/notariuszdk/blog-service-umowy-spolek.jpg",
        category: "usługi",
        tags: JSON.stringify([
          "notariusz",
          "kraków",
          "zakładanie firmy",
          "spółka",
          "umowa spółki",
          "prawo polskie",
        ]),
        meta_title:
          "Umowy spółek u notariusza w Polsce | Notariusz Kraków",
        meta_description:
          "Zakładasz firmę w Polsce? Dowiedz się, które rodzaje spółek wymagają aktu notarialnego i jak wygląda ten proces. Kancelaria notarialna w Krakowie.",
      },
    ];

    console.log("Inserting PL service blog posts...");
    for (const s of services) {
      await client.query(
        `INSERT INTO blogs (site_id, slug, lang, title, description, content, image, author, category, tags, status, published_at, meta_title, meta_description, standalone)
         VALUES ($1, $2, 'pl', $3, $4, $5, $6, 'Dariusz Klimonda', $7, $8::jsonb, 'published', NOW(), $9, $10, false)
         ON CONFLICT (site_id, slug, lang) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           content = EXCLUDED.content,
           image = EXCLUDED.image,
           category = EXCLUDED.category,
           tags = EXCLUDED.tags,
           status = EXCLUDED.status,
           meta_title = EXCLUDED.meta_title,
           meta_description = EXCLUDED.meta_description`,
        [
          30,
          s.slug,
          s.title,
          s.description,
          s.content,
          s.image,
          s.category,
          s.tags,
          s.meta_title,
          s.meta_description,
        ]
      );
      console.log(`  ✓ ${s.slug} [pl]`);
    }

    console.log("Done.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
