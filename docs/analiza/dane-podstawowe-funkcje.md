### Funkcje sekcji „Dane podstawowe” – opis techniczny

Aplikacja: Kalkulator Hipoteczny (Angular 21)
Zakres: Funkcje (akcje użytkownika i zachowania systemu) wynikające z aktualnej implementacji komponentu `BasicDataFormComponent` i serwisów `FormService` / `CalculatorService`.
Data aktualizacji: 2026-05-09

---

## 1. Edycja pól wejściowych i przeliczanie wyników

- Funkcja: wprowadzanie wartości do pól formularza:
  - 1. Wartość nieruchomości (`propertyValue`, zł),
  - 2. Kwota kredytu (`loanAmount`, zł),
  - 3. LTV (`ltv`, %),
  - 4. Okres kredytowania (`loanPeriod`, miesiące — z przełącznikiem widocznej jednostki `lata`/`miesiące`),
  - 5. Data uruchomienia kredytu (`startDate`, `YYYY-MM`),
  - 6. Początek spłat kapitału (`capitalStartDate`, `YYYY-MM`),
  - 7. Typ rat (`installmentType`: `rowne`/`malejace`),
  - Okresy oprocentowania (`ratePeriods` — `FormArray`).
- Działanie: każda zmiana wartości generuje zdarzenie `form.valueChanges`, które `LayoutComponent` przekształca w `MortgageInputs` i przekazuje do `CalculatorService.compute()`. Wynik (`MortgageResults`) trafia do sygnałów `results` i `yearlyGroups`, odświeżając kafelki KPI, donuty i tabelę harmonogramu.
- Walidacje pola: zob. punkt 16. Nieprawidłowy formularz powoduje wyzerowanie `results` (`results.set(null)`).

## 2. Synchronizacja LTV / Wartość / Kwota

- Funkcja: spójność trzech pól 1–3.
- Implementacja: `CalculatorService.syncLtvAmountValue(propertyValue, loanAmount, ltv, edited)` — handlery `onLtvChanged`, `onLoanAmountChanged`, `onPropertyValueChanged` wywołują serwis ze wskazaniem edytowanego pola i nadpisują pozostałe wartości przez `patchValue({ emitEvent: false })`.
- Reguły:
  - przy zmianie `ltv` → `loanAmount = propertyValue × ltv / 100`,
  - przy zmianie `loanAmount` lub `propertyValue` → `ltv = loanAmount / propertyValue × 100` (`0` jeśli `propertyValue == 0`),
  - jeśli wynik daje `loanAmount > propertyValue`, kwota jest obcinana do `propertyValue`,
  - `ltv` jest klampowane do `[0, 100]`; przekroczenie 100 sprowadza wynik do 100 i przelicza kwotę.

## 3. Ustawienie okresu kredytowania (lata vs miesiące)

- Funkcja: wprowadzanie wartości w jednostce wybranej przełącznikiem `loanPeriodUnit` (`lata` lub `miesiące`).
- Działanie: w formularzu zawsze przechowywana jest liczba miesięcy. `loanPeriodDisplayValue` zwraca `Math.round(months / 12 × 100) / 100` (gdy `lata`) lub `months`. Konwersja w drugą stronę: `months = Math.round(value × 12)` lub `Math.round(value)`. Brak automatycznego przenoszenia 12 miesięcy do lat — użytkownik świadomie wybiera jednostkę.
- Walidacja krzyżowa: `totalMonthsInvalid` przy `Math.trunc(loanPeriod) <= 0`.

## 4. Wybór daty uruchomienia kredytu

- Funkcja: zmiana miesiąca/roku w `ui-month-picker` powiązanym z `startDate`.
- Działanie: data wpływa na wszystkie obliczenia czasowe — pierwsza rata przypada na `startDate + 1`, karencja liczona jest od `startDate`, ubezpieczenie pomostowe pokrywa miesiące `1..bridgeMonths` od `startDate`, `setOverheadDefaults`/`setDefaults` ustawiają datę startu na bieżący miesiąc.

## 5. Edycja „Początek spłat kapitału”

- Funkcja: edycja `capitalStartDate` w `ui-month-picker` (pole jest zawsze odblokowane — w bieżącej implementacji nie ma trybu „EDYTUJ”).
- Działanie: ustawienie daty późniejszej niż `startDate + 1` skutkuje karencją: `graceMonths = max(0, monthDiff(startDate, capitalStartDate) - 1)`. W okresie karencji `capital = 0`, a rata = bieżące odsetki.
- Walidacja: `capitalBeforeStart` przy `capitalStartDate < startDate`.

## 6. Wybór trybu rat – „Typ rat”

- Funkcja: przełącznik `ui-segmented` z opcjami `rowne` (label „równe”) / `malejace` (label „malejące”).
- Działanie:
  - `rowne`: rata stała (annuitet) wyliczana przez `annuityPayment(saldo, i_m, n_pozostałe)`,
  - `malejace`: stała część kapitałowa `decreasingCapitalPart = saldo / n_pozostałe`, odsetki naliczane od bieżącego salda.
- Wartość obowiązuje globalnie dla całego okresu kredytu — nie da się zmienić trybu w ramach wybranego okresu oprocentowania.

## 7. Zarządzanie okresami oprocentowania

- Funkcja: lista kart z parametrami stopy w sekcji okresów oprocentowania (`FormArray ratePeriods`). Pierwsza karta startuje od daty uruchomienia kredytu, kolejne mają edytowalne pole `from`.
- Akcje:
  - `addRatePeriod()` — dodaje nową kartę z datą `lastFrom + 12 miesięcy` i kopiuje pozostałe wartości z poprzedniego okresu,
  - `removeRatePeriod(index)` — usuwa kartę o indeksie > 0; pierwszej karty usunąć nie można.
- Działanie silnika: dla każdego miesiąca harmonogramu wybierany jest ostatni okres `period.from <= date`. Zmiana okresu w trakcie spłaty wymusza ponowne wyznaczenie raty (`equalRate`) lub części kapitałowej (`decreasingCapitalPart`) od bieżącego salda.

## 8. Ustawianie trybu stopy wewnątrz okresu

- Funkcja: przełącznik `rateType` (`zmienna`/`stala`) w karcie okresu.
- Działanie:
  - `zmienna`: pole `Oprocentowanie` jest tylko do odczytu i prezentuje sumę `wibor + margin`, widoczne są dodatkowe pola `WIBOR` i `Marża`,
  - `stala`: pola WIBOR/Marża są ukryte, `nominalRate` jest edytowalne i bezpośrednio używane jako stopa nominalna miesiąca.
- W silniku: `getBaseEffectiveRate(period) = period.rateType === 'zmienna' ? wibor + margin : nominalRate`.

## 9. „Wstaw domyślne” (przycisk globalny w topbarze)

- Funkcja: reset formularza do zestawu wartości startowych.
- Działanie: `LayoutComponent.setDefaults()` wywołuje:
  - `FormService.setDefaults()` — przywraca `propertyValue=500_000`, `loanAmount=400_000`, `ltv=80`, `loanPeriod=240`, daty bieżące, `installmentType='rowne'`, jeden okres oprocentowania `zmienna 7+2`, jedną regułę nadpłaty (`jednorazowo`, `0`), domyślną regułę docelowej raty oraz pojedynczą transzę = `loanAmount`,
  - `FormService.setOverheadDefaults()` — ustawia przykładowe wartości w sekcji kosztów okołokredytowych (m.in. prowizja `0`, wycena `400 zł`, ubezpieczenie pomostowe `1,2%` przez `6` miesięcy, ubezpieczenie nieruchomości `0,0008%` rocznie itd.).
- Akcja działa natychmiast, bez potwierdzenia. Sekcje opcjonalne pozostają w stanie `included`, w jakim były przed kliknięciem.

## 10. Zapis kalkulacji – „Zapisz kalkulację” (przycisk globalny w topbarze)

- Funkcja: zapis aktualnej konfiguracji formularza do pamięci lokalnej + pobranie pliku JSON.
- Działanie: `LayoutComponent.saveCalculation()`:
  1. otwiera `SaveCalculationDialogComponent` (`<dialog>` HTML5) z polem `name` i sugerowaną wartością `Kalkulacja <data>`,
  2. po zatwierdzeniu czyta `localStorage['kalkulacje']` (lista rekordów `{ name, createdAt, data }`),
  3. jeśli rekord o tej samej nazwie istnieje, używa `window.confirm()` do potwierdzenia nadpisania,
  4. dopisuje/aktualizuje rekord i zapisuje listę z powrotem do `localStorage`,
  5. tworzy plik `<sanitized-name>.json` (sanityzacja zabronionych znaków `\/:*?"<>|`) i wyzwala pobranie przez ukryty link `<a download>`.
- Walidacja w dialogu: `nameCtrl` z `Validators.required`; pusta nazwa nie zatwierdza dialogu.

## 11. Wczytywanie zapisanej kalkulacji

- W bieżącej implementacji nie ma elementu UI do wczytywania zapisanych rekordów. Komponent dialogu wczytywania (`LoadCalculationDialogComponent`) istnieje w katalogu `src/app/dialogs/`, ale nie jest osadzony w `LayoutComponent`.

## 12. Czyszczenie danych

- Funkcja `FormService.clearAll()` zeruje większość pól sekcji „Dane podstawowe” oraz reguły nadpłat i transze, ale w bieżącej implementacji nie jest wywoływana z UI. Analogicznie `clearOverheadCosts()` i `clearTransze()` są dostępne programistycznie, lecz brak im przycisków.
- Stan początkowy formularza po pierwszym renderze odpowiada wartościom z `setDefaults()`, więc użytkownik nie potrzebuje akcji „Wyczyść”, by mieć sensowne dane wyjściowe.

## 13. Przeglądanie harmonogramu spłaty

- Funkcja: rozwijanie wierszy rocznych (`tbl-row--year`) do widoku miesięcznego (`tbl-row--month`) w `ResultsScheduleComponent`.
- Działanie: kliknięcie wiersza roku ustawia sygnał `expandedYear`. W danym momencie rozwinięty może być tylko jeden rok (kliknięcie ponowne zwija). Status rozwinięcia wizualizowany jest ikonami `icon-chevron-right`/`icon-chevron-down`.
- Kolumny tabeli (rzeczywiste): `Okres`, `Rata`, `Kapitał`, `Odsetki`, opcjonalnie `Nadpłaty` (gdy sekcja nadpłat jest włączona), opcjonalnie `Koszty` (gdy sekcja kosztów okołokredytowych jest włączona), `Pozostało`. Liczba kolumn wpływa na zmienną CSS `--tbl-cols` (`gridColumns` w komponencie).

## 14. Aktualizacja wykresów w czasie rzeczywistym

- Funkcja: dynamiczne odświeżanie wykresów po każdej zmianie formularza (`computed()`).
- Implementacja: dwa komponenty `ui-donut` (SVG, brak Chart.js):
  - **Struktura wszystkich płatności** — slices: `Kapitał`, `Odsetki`, opcjonalnie `Koszty okołokredytowe` (jeśli sekcja włączona i `overheadCosts > 0`), opcjonalnie `Nadpłaty` (jeśli sekcja nadpłat włączona i `prepayments > 0`); wartość środka `Σ totalAllPayments` wyrażona w tysiącach (`Xk`).
  - **Struktura pierwszej raty** — slices: `Kapitał`, `Odsetki` z pierwszego wiersza harmonogramu; wartość środka = wysokość pierwszej raty (`firstInstallment.rate`) sformatowana z separatorami tysięcy.
- Wykres trendu liniowego/warstwowego nie jest częścią bieżącej implementacji.

## 15. Walidacje i komunikaty błędów

- Komunikaty agregowane są w `ResultsErrorsComponent` (`src/app/components/results/results-errors/`).
- Walidatory pola (`Validators.required`, `min`, `max`) blokują rekalkulację: gdy `form.valid === false`, panele wyników zostają ukryte.
- Walidator krzyżowy `crossFieldValidator` produkuje błędy wyświetlane jako paragrafy w `ResultsErrorsComponent`. Lista kluczy znajduje się w dokumencie `dane-podstawowe.md` w punkcie 5.
- Lokalna polityka projektu zabrania renderowania komunikatów błędów wewnątrz komponentów formularzy — wszystkie błędy belki widzialnej muszą znajdować się w `ResultsErrorsComponent` (zgodnie z `CLAUDE.md`).

## 16. Dostępność i obsługa klawiatury

- Pola formularza korzystają z generycznych komponentów UI (`ui-field`, `ui-number-input`, `ui-month-picker`, `ui-segmented`, `ui-select`), które renderują standardowe elementy HTML (`<input>`, `<button>`, `<select>`).
- Tab order zgodny z kolejnością DOM. Picker miesiąca (`ui-month-picker`) obsługuje strzałki klawiaturą (zob. implementacja komponentu).
- Etykiety pól są ustawiane przez atrybut `label` w `ui-field`, dzięki czemu trafiają do struktury DOM jako tekst widoczny powiązany wizualnie z polem (brak jawnych `aria-label` na poziomie tej sekcji).

## 17. Formatowanie i lokalizacja

- Locale: `pl-PL` (formatowanie liczb w `ui-number-input`, dat w `ui-month-picker` przez `formatMonthPipe`).
- Waluty: separator tysięcy = spacja, separator dziesiętny = przecinek; suffix `zł` dla kwot, `%` dla procentów.
- Daty: w UI prezentowane jako `mmm RRRR` (np. „maj 2026”); w modelu i obliczeniach jako `YYYY-MM`.
- Procenty: domyślnie 2 miejsca po przecinku, w niektórych polach ubezpieczeń (poza tą sekcją) 4–5 miejsc dla małych stawek.

## 18. Trwałość stanu

- Stan formularza nie jest automatycznie persystowany między sesjami — odświeżenie strony resetuje formularz do wartości startowych.
- Trwałość uzyskiwana jest jawnie przez „Zapisz kalkulację” → `localStorage['kalkulacje']`. Wczytywanie pozostawione jest na poziomie API serwisu (brak UI).

---

## Zależności między funkcjami

- Każda zmiana w polach 1–8 wywołuje rekalkulację panelu wyników, donutów i tabeli (zob. punkt 14).
- Przełączenie `rateType` w karcie okresu modyfikuje widoczność pól `WIBOR/Marża/Oprocentowanie` i działa per-okres (różne okresy mogą mieć różne typy stóp).
- Ustawienie `capitalStartDate > startDate + 1` powoduje pojawienie się okresu karencji w harmonogramie (kolumna `Kapitał = 0`, rata = same odsetki).
- Włączenie/wyłączenie sekcji opcjonalnych (`overheadCosts.included`, `tranches.included`, `prepayments.included`) wpływa na widoczność kolumn w tabeli, slices na donucie „Struktura wszystkich płatności” oraz etykietę kafelka KPI nr 4.
