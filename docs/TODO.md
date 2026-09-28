- [x] jedna wspólna instancja formularza tworzona i przechowywana w FormService
- [x] dodanie silnego typowania do formularza
- [x] wydzielenie do oddzielnych komponentów sekcji "dane podstawowe", "Wyniki", "Transze", "Nadpłaty", "Harmonogram spłaty"
- [x] przeniesienie do katalogu "model", wszystkich interfejsów i typów
- [x] przekształcenie w pipe'a metoday `formatMonthPl()` oraz innych metod, których zadaniem jest formatowanie danych w celu ich prezentacji użytkownikowi
- [x] zmiana layoutu na dwie kolumny, domyślnie równej szerokości z możliwością zmiany proporcji przez użytkownika. w lewej kolumnie prezentowane mają być wszystkie sekcje formularza, a w prawej wyniki i harmonogram spłat
- [x] umożliwienie zwinięcia każdej sekcji formularza
- [x] wydzielenie pól formularza sekcji "Koszty okołokredytowe i promocje", "Transze", "Nadpłaty" do oddzielnych formGroup
- [x] umożliwienie włączania/wyłączania opcjonalnych sekcji formularza tj. "Koszty okołokredytowe i promocje", "Transze", "Nadpłaty", struktura formularza: form -> overheadCosts (FormGroup z polami `included` i `fields` (FormGroup z właściwymi polami sekcji)), nie branie pod uwagę pól z wyłączonych sekcji podczas wykonywania obliczeń
- [x] zamiast pól `MortgageFormGroup.years` i `MortgageFormGroup.months` przechowuj okres kredytowania w jednym polu `MortgageFormGroup.loanPeriod`, w którym dane przechowywana będzie liczba miesięcy. w warstwie prezentacyjnej umożliw wpisanie okresu kredytowania w miesiącach lub latach (input number + radio switch "lat/miesięcy")
- [x] paragraf "Wysokość pierwszej raty:" w komponencie `ResultsSummaryComponent`, zmienić nazwę na "Wysokość pierwszej raty kapitałowo-odsetkowej:" i prezentować odpowiednią wartość
- [x] prezentować kolumny "Nadpłata" i "Koszty okołokredytowe" w harmonogramie spłaty warunkowo na podstawie flag `FormService.isPrepaymentIncluded` i `FormService.isOverheadCostsIncluded`
- [x] wydzielenie pól formularza prezentowany w komponencie `BasicDataFormComponent` do oddzielnej formGroup
- [x] umożliwienie zmiany oprocentowania (pola "Typ rat", "Stopa", "8.a WIBOR (%)", "8.b Marża (%)", "Oprocentowanie (nominalne, %)", "8. Oprocentowanie stałe (%)") w okresie kredytowania. wymienione pola powinny zostać zgrupowane i przechowywane jako formArray z możliwością dodania nowej z uwzględnieniem daty obowiązywania nowego oprocentowania
- [x] udostępnić możliwość wczytywania uprzednio zapisanej konfiguracji formularza
- [x] data wypłaty pierwszej transzy jest zawsze równa dacie uruchomienia kredytu. Pole powinno być zablokowane i aktualizować się po zmianie w polu "Data uruchomienia kredytu". zaktualizuj dokumentacje
- [x] pierwsza rata prezentowana w src/app/components/results/results-summary powinna być pierwszą ratą pełną kapitałowo-odsetkową. w przypadku uruchomienia kredytu w transzach prezentować labelkę "PIERWSZA RATA KAPITAŁOWO-ODSETKOWA" oraz poprawną wartość
- [x] brak walidacji pola "6. Początek spłat kapitału (YYYY-MM)" - jeśli są zdefiniowane transze, data musi być większa od daty uruchomienia ostatniej transzy
- [x] cały kapitał nie jest spłacany, zostają jakieś grosze
- [x] w przypadku wypłaty kredytu w transzach rata kredytu powinna się zwiększać w miesiącu po jej uruchomieniu, a nie w tym samym miesiącu, sekcja "Pozostało" prawidłowo przyrasta o wysokość transzy w miesiącu jej uruchomienia
- [x] w harmonogramie spłat w miesiącu nadpłaty rata jest zwiększana o nadpłatę, a nie powinna
- [x] usunąć metodę CalculatorService.round2
- [x] przy dwóch regułach nadpłaty jeden skracającej okres, a drugiej obniżającej ratę okres kredytowania nie ulega skróceniu
- [x] dodaj regułę, żeby preferować użycie enumów zamiast literal types, zamień wszystkie wykorzystania, enumy powinny mieć klucze i wartości w języku angielskim, THIS_WAY, konwersja enumów na docelowe labelki w języku polskim powinna odbywać się w pipe'ach
- [x] stwórz scheme opisującą strukturę zapisanych ustawień w formacie .json, waliduj .json na podstawie schemy przy wczytywaniu ustawień - jeśli walidacje nie przebiegnie pomyślnie, prezentuj natywny dialog wzorem SaveCalculationDialogComponent z informacją o tym, które pola są niepoprawne/mają niepoprawne wartości
- [x] jeśli transzę są włączone ich suma musi być równa kwocie kredytu
- [x] umożliwić zaznaczenie wiersza miesięcznego w tabeli harmonogram spłat, po zaznaczeniu, donut "Struktura wszystkich płatności" powinien przekształcić się w "Struktura wszystkich płatności do <zaznaczony miesiąc i rok>", a donut "Struktura pierwszej raty" w "Struktura płatności w <zaznaczony miesiąc i rok>", ponowne kliknięcie w dany wiersz odznacza go i przywraca domyślne zachowanie donutów
- [x] Podsekcja "Prowizja za udzielenie" powinna się składać z inputa numerycznego i przełącznika "%/zł" tak, aby użytkownik mógł wprowadzić wartość procentową lub konkretną kwotę
- [x] Opłata za wycenę powinna być ujęta w harmonogramie spłat w kolumnie koszty w pierwszym miesiącu kredytu
- [x] zmień konfigurację tauri tak, żeby aplikacja domyślnie uruchamiała się w trybie pełnoekranowym
- [x] wynieś listę kalkulacji z komponentu src/app/views/calculations-manager do dedykowanego komponentu w przestrzeni src/app/components
- [x] nowe ikony użyte w komponencie src/app/views/calculations-manager przenieś do przestrzeni src/app/components/ui
- [x] usuń kolumnę przebieg salda
- [x] usuń filtr "Robocze"
- [x] customowy dropdown zgodny z design systemem
- [x] nowy badge "Zmodyfikowana"
- [x] Eksportuj wszystkie do .json
- [x] ucięte menu harmburger
- [x] przy zmianie CommissionCalcMethod w forumlarzu aplikacja powinna przeliczać aktualną wartość CommissionFormGroup.commissionValue na nową jednostkę
- [x] po uzupełnieniu podsekcji "ubezpieczenie pomostowe" w harmonogramie spłat dla miesięcy, w których bank podwyższa oprocentowanie rata kapitałowa wynosi 0zł co jest błędem
- [x] przy wyliczaniu ubezpieczenia nieruchomości płatnego co miesiąc jako % salda kredytu, kwota składki jest zaniżona o kilka zł, zbadaj możliwe przyczyny takiego stanu rzeczy, podobnie jest w przypadku ubezpieczenia na życie liczonego jako % salda kredytu
- [x] Ubezpieczenie niskiego wkładu powinno przestawać obowiązywać gdy LTV spadnie poniżej 80%
- [x] dotyczy podsekcji "Ubezpieczenie na życie", "Ubezpieczenie od utraty pracy" i "Dodatkowe koszty" w przypadku, gdy składka/koszt płacony jest jednorazowo nie prezentować pól od/do tylko jeden moth picker z miesiącem płatności składki/kosztu, jeśli ubezpieczenie/koszt płacone jesty cyklicznie (co rok/co miesiąc), prezentować 2 month pickery od/do
- [x] dla pustego stanu listy kalkulacji nie wyświetlaj nagłówków tabeli tj. "Nazwa Kwota · LTV Okres Oproc. Pierwsza rata Odsetki Zmodyfikowano Akcje"
- [x] Błąd - Zakładka "Twoje kalkulacje" -> kliknij importuj -> zamknij file picker -> wyświetla się toast "Zaimportowano kalkulacje"
- [x] Stworzenie UI state service przechowującej rozwinięcie/zwinięcie sekcji, podsekcji, legendy, aktualnie wybrany rok w rocznych składowych płatności, wybrany miesiąc w harmonogramie spłat, etc.
- [x] wyśrodkowanie wertykalne ikonki i labelki na toaście
- [x] po kliknięciu w koszt na legendzie przescrollowanie formularza do odpowiedniej sekcji
- [x] moth picker w okresach oprocentowania ucina nazwy miesięcy
- [x] animacja zwijania rozwijania i animowany chevron dla wierszy lat w harmonogramie spłaty kredytu
- [x] przeniesienie okresów oprocentowania do oddzielnej formGroup i zwijanej sekcji
- [x] zmiana nazwy ui-section na ui-foldable-section
- [x] wyśrodkowanie wertykalne elementów transzy
- [x] zmniejszenie odstępów pomiędzy transzami
- [x] obliczanie i prezentacja RRSO
- [x] Zmiana WIBOR na Wskaźnik referencyjny
- [x] przycisk do odwracania sortowania obok kryterium sortowania w "Twoje kalkulacje"
- [x] Przenieść RRSO do sekcji footer komponentu ui-legend w komponencie `ResultsDonutChartTotalComponent`
- [x] Zmienić nazwę sekcji formularza "Okresy oprocentowania" na "Oprocentowanie"
- [x] Umożliwić rozwinięcie "Odsetek" na legendzie donutów, pokazywać składowe odsetek: wynikające z wartości ustawionych w sekcji "Oprocentowanie", wynikających z "Ubezpieczenia pomostowego", "Ubezpieczenia niskiego wkładu", etc. Zadbać, żeby mechanizm klik -> scroll do sekcji działał tu również poprawnie
- [x] Przeprowadzić audyt color code'u formularza i przygotować poprawki, obecnie cała sekcja "Koszty okołokredytowe i promocje" jest oznaczona na żółto co jest niezgodne ze stanem faktycznym, bo na przykład podsekcja "Ubezpieczenie pomostowe" wpływa na wysokość odsetek i nie zalicza się do kosztów. Podobnie "Prowizja za wcześniejszą spłatę" zalicza się do kosztów, a jest pokolorowana na niebiesko (kolor przypisany nadpłatom)
- [x] Dla poszczególnych wierszy w widoku "Twoje kalkulacje" w dots-menu akcję "Eksportuj CSV" zastąpić akcją "Eksportuj" z zagnieżdżoną listą formatów eksportu. Na początek powinna znaleźć się tam opcja "JSON" - oprogramować eksport do JSON
- [x] Przycisk "Eksportuj wszystkie do JSON" na widoku "Twoje kalkulację" zastąpić przyciskiem-dropdownem "Eksportuj wszystkie". Dropdown na początek powinien pokazywać jedną opcję "JSON" podpiętą do obecnie działającego eksportu
- [x] Przycisk "Importuj" na widoku "Twoje kalkulacje" powinien umożliwiać zarówno import pojedynczej kalkulacji, jak i tablicy kalkulacji w formacie JSON
- [x] po zaznaczeniu miesiąca w harmonogramie spłat rozwijać wiersz; w rozwinięciu prezentować 2 donuty: struktura płatności do... i Struktura płatności w tak, żeby user nie musiał scrollować po te dane na góre kolumny
- [x] dokumentacja funkcjonalna powinna być agnostyczna względem faktycznej implementacji, przejrzeć i dostosować; dodać regułę do Claude.md
- [x] przejrzeć dialogi w src/app/dialogs i stworzyć generyczne komponenty będące podstawą budowania tych i kolejnych dialogów, wykorzystać content projection
- [x] w docs/technikalia dodać dokument opisujący design system, dostępne kontrolki ui, zmienne kolorów, palety motywów
- [x] dodaj eksport do .csv pojedynczej i wszystkich kalkulacji
- [x] dodać dokument walidacje.md w docs/funkcjonalności, który będzie zawierał listę wszystkich walidacji formularza kalkulatora
- [x] podczas otwierania MonthPickerDialogComponent przez moment miga miesiąc i rok zaznaczony podczas poprzedniego otwarcia okna dialog
- [x] animuj zmianę wysokości słupków w ResultsTrendChartComponent analogicznie jak w DonutComponent; animuj również zmianę wysokości salda kredytu
- [x] rozwijanie sekcji w LegendComponent nie wygląda płynnie
- [x] deklaracje zmiennych wynieść z src/styles.scss do oddzielnego pliku variables
- [x] resetuj UiStateService po wczytaniu nowej kalkulacji
- w CalculationsListComponent po najechaniu myszką prezentuj pełną nazwę kalkulacji; jeśli jest za długa ucinaj ją trzykropkiem
- [x] w RatePeriodFormGroup i SavedCalculation zmienić nazwę pola `wibor` na `referenceIndex`, zmienić także nazwę metody `wiborMarginText()`, przeszukać kod pod kątem wystąpień wibor i zamienić w pozostałych miejscach
- [x] wzbogacić DividerComponent o możliwość prezentacji ciągłej linii, przejrzeć kod pod kątem miejsc, w których można by go zastosować
- w DialogComponent zamień tag w title, a title usuń
- [x] użyj SwitchComponent w FoldableSectionComponent, przejrzyj kod w poszukiwaniu miejsc, w których można by zastosować SwitchComponent
- [x] w ResultsRateChartComponent nie koloruj pola pod linią wykresu
- [x] animacja na chevronie sekcji aktywuje się przy przechodzeniu pomiędzy zakładkami
- [x] zamień kolejność wykresów prezentowanych po rozwinięciu miesiąca w harmonogramie spłaty kredytu; zmień styl dividera oddzielającego wykresy na linie ciągłą
- [x] przechowuj ustawienia aplikacji (obecnie tylko bieżący motyw) w pliku settings.json, analogicznie jak ma to miejsce z kalkulacjami
- [x] dodaj plik LICENSE (AGPLv3)
- [x] przechowuj pozycję scrolla dla obu kolumn widoku "Kalkulator"
- [x] wypracuj rozwiązanie, żeby wszystkie ikony były wyśrodkowane wertykalnie by default
- [x] zmień flow eksportu pojedynczej kalkulacji; zamiast zagnieżdżonej listy na dropdownie po kliknięciu "Eksportuj" otwieraj okno dialog, konfigurator eksportu; dostępne opcje: Zakres: "Parametry kalkulacji/Harmonogram spłaty", Format "JSON/CSV"; Ograniczenia: Parametry powinny być eksportowalne tylko do formatu .json, harmonogram zarówno do json jak i do .csv
- [x] dropdown "Eksportuj wszystkie" zamień w zwykły przycisk "Eksportuj wszystkie do JSON", usuń funkcjonalność eksportu wszystkich kalkulacji do .csv
- [x] analogicznie jak w widoku "Kalkulacje", zapamiętuj pozycję scrolla na pozostałych widokach w UiStateService
- [x] analogicznie jak w widoku "Kalkulacje", ukryj scrolla na pozostałych widokach
- na legendzie donuta "Struktura płatności" pod wierszem "RRSO", dodaj wiersz "Całkowity koszt kredyt" który zsumuje odsetki i koszty okołokredytowe
- [x] dodatkowe koszty na formularzu w sekcji "Koszty okołokredytowe i promocję" są ucinane powyżej 2-giego kosztu
- [x] w MonthPickerDialogComponent po zmianie roku odznaczać wybrany miesiąc
- [x] w MonthPickerDialogComponent dodać przyciski skrótów, "data uruchomienia kredytu", "początek spłat kapitału", "data zakończenia kredytu", zadbaj o to, żeby skróty pojawiały się warunkowo i miały sens w danym kontekście formularza
- [x] w DialogComponent on hoover podświetlaj pole pod przyciskiem "x";stwórz ikonę "x";zadbaj żeby każdy dialog w aplikacji miał ten przycisk
- [x] przy więcej niż jednej transzy, pomimo wyłączenia sekcji "Transze" formularza prezentowany jest błąd walidacji "Kwota każdej transzy musi być większa od zera.", jeśli sekcja jest wyłączona nie powinna być brana pod uwagę NIGDZIE
- [x] przy przechodzeniu pomiędzy widokami animuje się przycisk zmiany kierunku sortowania na widoku "Twoje kalkulacje", zastosuj ten sam pattern co m.in. w foldable-section
- [x] z widoku "Porównanie ofert" wyciąć korporacyjny bullshit w treściach, skupić się na prezentacji konkretnych danych i funkcjonalności
- [x] w src/styles/\_variables.scss jest zdefiniowanych aż 10 różnych wielkości czcionek, zaproponuj plan na zmniejszenie ich liczby
- [x] w src/styles/\_variables.scss jest zdefiniowanych aż 12 różnych spacingów, zaproponuj plan na zmniejszenie ich liczby
- [x] parametr data-density (src/styles/\_variables.scss) obecnie nie jest możliwy do zmiany w interfejsie, dodaj odpowiednie ustawienie w app-settings-dialog
- [x] pozycje legendy donuta sortować po wartości od naistotniejszych do najmniej istotnych (analogicznie w obrębie danej kategorii np. "Koszty okołokredytowe")
- import wartości wskaźnika w formacie "yyyy-mm": wartość; i konwersja na okresy oprocentowania
- kliknięcie na wykresie oprocentowania - scroll do formularza do konkretnego okresu i podkreślenie go
- [x] Offer badge wynieść do oddzielnego komponentu ui
- [x] na widoku "Porównanie ofert" zmień kolejność prezentacji sekcji, mają być "Kluczowe wskaźniki" -> "Struktura wszystkich płatności" -> "Tabela różnic kosztowych" -> "Struktura pierwszej raty" -> "Harmonogram spłaty" -> "Tabela parametrów wejściowych"
- [x] ujednolić badge "wczytana" i "bieżąca" -> zostaw tylko bieżąca; dodaj tekst po najechaniu na badge "Kalkulacja wczytana na zakładce "Kalkulator""
- [x] usunąć przyciski "otwórz w kalkulatorze" w porównywarce ofert
- selektor "Typ wykresu trendu" prezentuj w prawym górnym rogu sekcji "Harmonogram spłaty"
- [x] pixel hippo ma być opcjonalny, do wyłączenia na modalu ustawień
- [x] stan szukajki na widoku "Twoje kalkulacje" nie jest przechowywany przy przechodzeniu pomiędzy widokami

## Audyt 2026-09-28 — Etap 0: Siatka bezpieczeństwa

- [x] lint: skrypt `"lint": "eslint src/**/*.ts"` w `package.json` na Ubuntu (CI) jest rozwijany przez `sh` i sprawdza tylko 3 pliki — zmienić na `eslint .`; w `eslint.config.js` zastąpić `tseslint.configs.base` (brak reguł) przez `recommendedTypeChecked`, dodać angular-eslint (reguły TS i szablonów, w tym `template/accessibility`) i naprawić zgłoszone problemy
- [x] usunąć `as any` z `crossFieldValidator` (`src/app/services/form/form.ts`) — otypować `getRawValue()` sekcji nadpłat
- [x] testy referencyjne `CalculatorService` z wartościami bezwzględnymi (obecne testy porównują tylko wyniki względne): annuitet 300 000 zł / 8% / 240 mies. → rata 2 509,32 zł, raty malejące, stopa zmienna (VARIABLE), karencja, nadpłaty QUARTERLY i YEARLY
- [x] testy regresyjne błędów silnika z Etapu 1 (oznaczone `it.fails`, patrz `docs/technikalia/jakosc-kodu-i-ci.md`): w każdym scenariuszu suma kapitału = kwota kredytu, a "Pozostało" w ostatnim wierszu = 0
- [x] dodać `@vitest/coverage-v8` i raportowanie pokrycia w CI (`npm run test:coverage`; punkt wyjścia: 19% instrukcji)
- testy komponentów, pipe'ów oraz `CalculationsStoreService`, `SavedCalculationsStateService`, `ComparisonStateService`, `AppSettingsStoreService` (dziś bez testów)
- [x] CI: dodać `cargo check`/`cargo clippy` dla `src-tauri` (dziś błąd w Rust wychodzi dopiero przy wydaniu); `release.yml` ma uruchamiać lint, testy i build przed bundlowaniem; przypiąć `tauri-action` do konkretnej wersji

## Audyt 2026-09-28 — Etap 1: Błędy krytyczne (poprawność obliczeń i utrata danych)

- BŁĄD: przy ratach równych z ubezpieczeniem niskiego wkładu lub pomostowym kredyt nie jest spłacany do zera — `equalRate` liczony ze stopy bazowej (`iCurrent`), a odsetki ze stopy efektywnej (`iMonth`), pętla kończy się na umownym okresie z saldem > 0 (zaniżone odsetki, koszt całkowity i RRSO); przy promocji odwrotnie — kredyt kończy się przed terminem. Potwierdzone testami `it.fails` w `calculator.service.spec.ts`: 450 000 zł przy LTV 90% i dopłacie +2 pp → 236 928 zł niespłaconego kapitału; pomostowe +1 pp przez 12 mies. → 14 091 zł; promocja −1 pp przez 12 mies. → 235 zamiast 240 rat. Poprawka: rata liczona ze stopy efektywnej i przeliczana przy każdej jej zmianie (nie tylko przy zmianie okresu oprocentowania), ostatnia rata domyka saldo (`capital = saldo`); zaktualizować `harmonogram-splaty.md`, `koszty-okolokredytowe-i-promocje.md`, `silnik-obliczeniowy.md`
- walidacja: początek spłat kapitału musi przypadać przed końcem kredytu — dziś karencja ≥ okres kredytowania daje harmonogram bez spłaty kapitału i bez żadnego komunikatu (test `it.fails` w `form.spec.ts`)
- walidacja: data transzy 2+ musi być późniejsza niż data uruchomienia kredytu i nie późniejsza niż koniec kredytu — dziś można ręcznie ustawić datę uruchomienia (lub wcześniejszą), silnik pomija taką transzę (pętla zaczyna od miesiąca po uruchomieniu), a RRSO ją uwzględnia (test `it.fails` w `form.spec.ts`; domyślna data nowej transzy jest poprawna — uruchomienie + n miesięcy)
- walidacja okresów oprocentowania: unikalne daty "od", nie wcześniejsze niż data uruchomienia i wcześniejsze niż koniec kredytu — dziś dwa okresy z tą samą datą są akceptowane i jeden po cichu nadpisuje drugi (test `it.fails` w `form.spec.ts`; domyślna data nowego okresu jest poprawna — ostatni + 12 miesięcy)
- walidacja dat nadpłat, docelowej raty i kosztów okołokredytowych (muszą mieścić się w okresie kredytu) oraz warunku "do" ≥ "od" w kosztach i promocji (dziś niewalidowane); uzupełnić `walidacje.md` i `ResultsErrorsComponent`
- BŁĄD utraty danych: zmiana nazwy kalkulacji na już istniejącą nadpisuje tamten rekord (`saveCalculation` robi upsert po `name`, rename = zapis + usunięcie); ponowne duplikowanie nadpisuje istniejącą "— kopia". Poprawka: stabilne `id` (`crypto.randomUUID()`) w `SavedCalculationRecord`, upsert po `id`, rename jednym zapisem (`updateCalculation(id, patch)`), blokada zajętej nazwy w `RenameCalculationDialogComponent`, duplikowanie przez istniejące `buildUniqueCalculationName`
- serializacja zapisów w `CalculationsStoreService` (kolejka operacji read-modify-write)
- kopia zapasowa kalkulacji: plugin-store przy uszkodzonym `calculations.json` startuje z pustą listą, a kolejny zapis nadpisuje plik — przed każdym zapisem kopia do `calculations.backup.json`; przy pustym store i niepustej kopii baner z opcją przywrócenia
- eksport do pliku nie ma obsługi błędów — przy nieudanym zapisie pokazać toast błędu
- `scripts/seed-calculations.mjs` kopiuje prawdziwe kalkulacje z `%APPDATA%` do `public/dev-seed`, który trafia do każdego buildu (także lokalnego `tauri:build`) — wykluczyć `dev-seed/**` z assetów konfiguracji production w `angular.json`

## Audyt 2026-09-28 — Etap 2: Silnik zgodny z harmonogramami bankowymi

- refaktoryzacja `CalculatorService.compute()` (~436 linii) bez zmiany wyników: resolver stopy (okres + składniki efektywne), generyczny kalkulator kosztu cyklicznego zamiast 3 skopiowanych bloków w `calcInsuranceCostForMonth`, kalkulator nadpłat, builder wiersza; nowe typy w `src/app/model`
- dzień spłaty raty (1–28) i dzień uruchomienia kredytu w "Danych podstawowych" oraz konwencja naliczania odsetek (enum `ACTUAL_365` domyślnie, `ACTUAL_360`, `THIRTY_360` = obecny model r/12): odsetki = saldo × r × dni między terminami płatności / baza, pierwsza rata proporcjonalna do liczby dni od uruchomienia, rata annuitetowa nadal ze wzoru r/12
- zaokrąglenia do grosza (half-up) rat, odsetek, składek i prowizji w każdym wierszu, kapitał = rata − odsetki, ostatnia rata koryguje resztę — dziś brak zaokrągleń i suma wierszy ≠ wyświetlana suma; usunąć z `CLAUDE.md` wzmiankę o `round2()`
- RRSO w wariancie ustawowym (harmonogram umowny bez nadpłat i docelowej raty) oraz osobna pozycja "Efektywny koszt Twojego scenariusza" uwzględniająca nadpłaty — dziś RRSO uwzględnia nadpłaty użytkownika
- prowizja za wcześniejszą spłatę przy stopie zmiennej: tylko w pierwszych 36 miesiącach i nie więcej niż odsetki za 12 miesięcy od nadpłaconej kwoty (ustawa o kredycie hipotecznym); ostrzeżenie, gdy "Bank pobiera prowizję do" wykracza poza 36 miesięcy
- testy referencyjne dla ACT/365 policzone ręcznie w arkuszu (tolerancja 0,01 zł na wiersz); wyniki dla `THIRTY_360` bez zmian

## Audyt 2026-09-28 — Etap 3: Persystencja pod publiczne wydania

- `schemaVersion` w zapisanej kalkulacji i eksporcie oraz łańcuch migracji vN→vN+1 (`src/app/helpers/saved-calculation-migrations.helper.ts`) uruchamiany przy odczycie store'a i przy imporcie; migracja v1→v2 nadaje `id` i ustawia `THIRTY_360`, żeby istniejące kalkulacje nie zmieniły wyników
- REGRESJA: `calculation.schema.json` nie jest używany w runtime (mimo odhaczonej wyżej pozycji o walidacji schematem), import sprawdza tylko `name`/`createdAt`/`data` — walidować import schematem (ajv), dialog `src/app/dialogs/import-validation` z listą niepoprawnych pól, rozróżnić "plik nie jest poprawnym JSON-em" od "brak rekordów"
- `FormService.loadFromFile`/`loadFromSavedCalculation`: defensywne odczyty (dziś TypeError na niepoprawnym pliku), odbudowa FormArray z `emitEvent: false` i jedno `updateValueAndValidity()` na końcu (dziś przeliczenie przy każdym dodanym wierszu)
- ustawienia: `ThemeService`, `DensityService` i `PixelHippoService` niezależnie czytają i scalają `settings.json` i przy pierwszym uruchomieniu nadpisują sobie zmiany — jeden serwis ładujący ustawienia raz i wspólna kolejka zapisów
- aktualizacja `persystencja-kalkulacji.md` (wersjonowanie, migracje, kopia zapasowa; usunąć nieaktualne `data: unknown`, `id`, `note`) i `tauri.md` (zakres fs obejmuje też `.csv`, usunąć wzmiankę o chart.js)

## Audyt 2026-09-28 — Etap 4: UX — błędy, bezpieczeństwo pracy, wprowadzanie danych

- panel błędów budowany ze wszystkich niepoprawnych kontrolek — dziś błędy pól (LTV ≤ 100, stopy ≤ 50, wartości nieujemne, wymagane miesiące) nie mają komunikatu i panel potrafi pokazać "0 błędów" przy ukrytych wynikach; kliknięcie błędu przewija do pola (`UiStateService.revealFormSection`, `form-navigation.helper.ts`); `aria-invalid` i klasa `.is-invalid` w `ui-field`
- pola wyłączonych sekcji "Koszty okołokredytowe i promocje" oraz "Nadpłaty" nadal blokują wyniki — uogólnić `syncTranchesFieldsEnabledState` na wszystkie sekcje opcjonalne
- przy niepoprawnym formularzu pokazywać ostatnie poprawne wyniki przygaszone, z banerem "Wyniki nieaktualne — popraw N błędów", zamiast je ukrywać; zaktualizować § 8 `walidacje.md`
- dialog niezapisanych zmian (`src/app/dialogs/unsaved-changes`) przy "Wczytaj" i "Nowa kalkulacja", gdy formularz jest zmodyfikowany; obsługa zamykania okna (Tauri `onCloseRequested`, `beforeunload` w wersji web); autozapis szkicu formularza przywracany przy starcie
- "Zapisz" / "Zapisz jako" oraz badge wczytanej kalkulacji ze stanem "Zmodyfikowana" w widoku "Kalkulator" — dziś zapis możliwy tylko z "Twoich kalkulacji"; po "Zapisz jako" nowa kalkulacja nie jest oznaczana jako wczytana
- cofanie usunięcia kalkulacji: toast z akcją "Cofnij" (~6 s, miękkie usunięcie); toasty błędów nie znikają automatycznie
- `NumberInputComponent`: parser polskiego formatu (dziś wklejone "1.234,56" daje 1,234, bo `replace(',', '.')` zamienia tylko pierwszy przecinek), puste pole → `null` zamiast 0, `min`/`max`/`step` i strzałki ↑/↓, stan błędu dla nieparsowalnego tekstu; okres w latach z 2 miejscami po przecinku (dziś 245 mies. wyświetla się jako "20")
- pomoc kontekstowa (`icon-info` z podpowiedzią) przy LTV, RRSO, wskaźniku referencyjnym, skutku nadpłaty, karencji i konwencji odsetek; brakujące etykiety pól prowizji, wyceny, daty "od" okresu oprocentowania i wyszukiwarki
- puste stany: lista bez zapisanych kalkulacji nie powinna sugerować "Zmień filtry…"; wykorzystać `isLoading` (dziś przy ładowaniu miga pusty stan); porównanie ofert przed wybraniem obu ofert pokazuje pusty ekran
- eksport harmonogramu (CSV/JSON) bezpośrednio z widoku "Kalkulator" oraz arkusz `@media print` do druku/PDF

## Audyt 2026-09-28 — Etap 5: Dostępność i motywy

- przełącznik sekcji jest niedostępny z klawiatury i dla czytników ekranu (`.sec-switch input { display: none }` w `styles.scss`, etykieta "wł./wył.") — input ukryty wizualnie i `aria-label` z nazwą sekcji
- zwinięte sekcje formularza nadal przyjmują fokus — dodać `[inert]` przy zwinięciu
- `aria-expanded` w nagłówkach sekcji, podsekcji i dropdownach, `aria-pressed`/`radiogroup` w `ui-segmented`, `aria-current` w topbarze, `aria-label` przycisku ustawień; menu wiersza listy kalkulacji ma się zamykać po "Zmień nazwę", "Duplikuj" i "Usuń"
- dialogi: `aria-labelledby` wskazujące tytuł, autofocus pola nazwy w dialogach zapisu i zmiany nazwy; usunąć z `abstract-dialog.ts` komentarz o zamykaniu kliknięciem w tło albo zaimplementować to zachowanie
- month-picker: ikona kalendarza jako `<button>` (dziś nie da się jej osiągnąć klawiaturą)
- wykresy (donuty, trend, oprocentowanie): `role="img"` oraz `<title>`/`<desc>`; wybór roku oraz rozwijanie i kopiowanie w legendzie jako przyciski; kierunek zmiany stopy w harmonogramie sygnalizowany nie tylko kolorem
- motyw ciemny bez `color-scheme: dark` (natywne kontrolki renderują się jasno); kontrast `--muted` poniżej 4.5:1; obsługa `prefers-reduced-motion`; rozmiary czcionek w `rem`; toast z `role="status"` tworzony razem z treścią (czytnik może go nie ogłosić)

## Audyt 2026-09-28 — Etap 6: Dystrybucja i bezpieczeństwo Tauri

- `src-tauri/capabilities/default.json` pozwala czytać i zapisywać dowolny `.json` pod `$HOME/**` — usunąć statyczny zakres fs (dialog sam dopuszcza plik wybrany przez użytkownika) i sprawdzić import oraz eksport
- wyłączyć feature `devtools` w buildzie release (`src-tauri/Cargo.toml`)
- auto-aktualizacje: `tauri-plugin-updater`, klucze podpisu w GitHub Secrets, `latest.json` w wydaniu
- podpis kodu instalatora Windows (wymaga zakupu certyfikatu)
- wersja aplikacji z jednego źródła (`package.json`) w `release.mjs` — dziś wpisywana w 6 miejscach, w tym na sztywno w topbarze
- nie zmieniać `identifier` w `tauri.conf.json` (osierociłoby dane użytkowników w `%APPDATA%`) — opisać to w `tauri.md`

## Audyt 2026-09-28 — Etap 7: Wydajność i porządki

- jedno źródło wyników: przeliczenie z `form.valueChanges` z `debounceTime(150)` w `CalculatorStateService`, a `CalculatorComponent` i `ComparisonStateService` tylko czytają wynik — dziś compute przy każdym znaku, dwa razy przy starcie (konstruktor + `startWith`), a porównanie liczy bieżący formularz drugi raz; ograniczyć nigdy nieczyszczony cache porównania
- harmonogram renderuje wiersze miesięczne tylko dla rozwiniętego roku (dziś ~360 wierszy w DOM od razu)
- `track $index` → śledzenie po tożsamości kontrolki w listach transz i nadpłat
- usunąć zduplikowane budowanie metadanych w `calculations-manager.component.ts` i martwe wywołanie `ngZone.run` (aplikacja działa bez zone.js)
- rozbić `comparison-params-table.component.ts` (635 linii)
