### Dokumentacja techniczna – Sekcja „Dane podstawowe”

Aplikacja: Kalkulator Hipoteczny (Angular 21, standalone components, Reactive Forms, Vitest)
Zakres: Specyfikacja elementów i logiki sekcji „Dane podstawowe” odzwierciedlająca aktualny stan implementacji.
Data aktualizacji: 2026-05-09

---

## 1. Cel i zakres sekcji

Sekcja „Dane podstawowe” (komponent `BasicDataFormComponent`, plik `src/app/components/form/basic-data-form/`) służy do zdefiniowania kluczowych parametrów kredytu hipotecznego oraz natychmiastowego wyliczenia:

- wysokości pierwszej raty,
- całkowitych kosztów (odsetki + koszty okołokredytowe + nadpłaty + prowizje),
- harmonogramu spłaty (tabela agregowana rocznie, rozwijana do widoku miesięcznego),
- udziału poszczególnych składników płatności (donuty: `Struktura wszystkich płatności`, `Struktura pierwszej raty`).

Wyniki aktualizowane są na bieżąco po każdej zmianie pola formularza — `LayoutComponent` subskrybuje `form.valueChanges` i wywołuje `recalculate()`, które przekazuje `MortgageInputs` do `CalculatorService.compute()`. Sekcja `basicData` jest jedyną sekcją domyślnie rozwiniętą i niewyłączalną — pozostałe sekcje (`Koszty okołokredytowe i promocje`, `Transze`, `Nadpłaty`) są opcjonalne i włączane przełącznikiem nagłówka (`included`).

---

## 2. Elementy interaktywne (pola wejściowe i przełączniki)

Wszystkie pola walutowe i procentowe korzystają z generycznego komponentu `ui-number-input`, który formatuje wartość według lokalizacji `pl-PL` (separator tysięcy: spacja, separator dziesiętny: przecinek). Pola dat operują na ciągu `YYYY-MM` (komponent `ui-month-picker`).

### 2.1. 1. Wartość nieruchomości (`propertyValue`)

- Typ: `ui-number-input`, `suffix="zł"`, `[decimals]="0"`.
- Domyślna wartość startowa: `500 000`.
- Walidatory: `Validators.required`, `Validators.min(0.01)`.
- Zależności: zmiana wywołuje `onPropertyValueChanged()` → `CalculatorService.syncLtvAmountValue(..., 'propertyValue')`, który przelicza LTV (LTV = `loanAmount / propertyValue × 100`). Jeśli `loanAmount > propertyValue`, kwota kredytu zostaje obcięta do `propertyValue`.

### 2.2. 2. Kwota kredytu (`loanAmount`)

- Typ: `ui-number-input`, `suffix="zł"`, `[decimals]="0"`.
- Domyślna wartość startowa: `400 000`.
- Walidatory: `Validators.required`, `Validators.min(0.01)`.
- Zależności: zmiana wywołuje `onLoanAmountChanged()` → przelicza LTV. Walidator krzyżowy `crossFieldValidator` zgłasza błąd `loanGtProperty`, gdy kwota kredytu przekracza wartość nieruchomości.

### 2.3. 3. LTV (`ltv`)

- Typ: `ui-number-input`, `suffix="%"`, `[decimals]="2"`.
- Domyślna wartość startowa: `80` (%).
- Walidatory: `Validators.required`, `Validators.min(0)`, `Validators.max(100)`.
- Zależności: zmiana wywołuje `onLtvChanged()` → przelicza `loanAmount = propertyValue × ltv / 100`. Jeżeli `ltv > 100`, jest sprowadzane do `100`.

### 2.4. 4. Okres kredytowania (`loanPeriod`)

- Typ: kombinacja `ui-number-input` + `ui-segmented` z opcjami `['lata', 'miesiące']` (właściwość `loanPeriodUnit` w komponencie).
- Wartość przechowywana w formularzu jest zawsze w miesiącach. Konwersja z lat: `months = Math.round(years × 12)`.
- Domyślna wartość startowa: `240` miesięcy (20 lat).
- Walidatory: `Validators.required`, `Validators.min(1)`. Walidator krzyżowy `totalMonthsInvalid` zgłasza błąd, gdy `Math.trunc(loanPeriod) <= 0`.
- Zależności: liczba rat `n = loanPeriod`; karencja `graceMonths = max(0, monthDiff(startDate, capitalStartDate) - 1)`; `amortMonths = n - graceMonths`.

### 2.5. 5. Data uruchomienia kredytu (`startDate`)

- Typ: `ui-month-picker`, format wewnętrzny `YYYY-MM`.
- Domyślna wartość startowa: bieżący miesiąc (`ym(new Date())`).
- Walidator: `Validators.required`.
- Zależności: data pierwszej transzy jest synchronizowana z `startDate` (pierwsza transza nie ma odrębnej kontroli daty); pierwsza rata przypada na miesiąc `startDate + 1`.

### 2.6. 6. Początek spłat kapitału (`capitalStartDate`)

- Typ: `ui-month-picker`, format `YYYY-MM`. Pole jest zawsze edytowalne (nie ma trybu „odblokowania” przyciskiem).
- Domyślna wartość startowa: `nextMonthStr()` — miesiąc po dacie uruchomienia.
- Walidatory: `Validators.required`. Walidator krzyżowy `capitalBeforeStart` zgłasza błąd, gdy `capitalStartDate < startDate`. Walidator krzyżowy `capitalBeforeLastTranche` zgłasza błąd, gdy sekcja transz jest włączona, zdefiniowano więcej niż jedną transzę i `capitalStartDate <= max(daty wszystkich transz)` — spłata kapitału musi zacząć się ściśle po uruchomieniu ostatniej transzy.
- Zależności: ustalenie daty późniejszej niż `startDate + 1` skutkuje karencją (w okresie karencji harmonogram zawiera wyłącznie odsetki, `capital = 0`).

### 2.7. 7. Typ rat (`installmentType`)

- Typ: `ui-segmented`, `[options]="['rowne', 'malejace']"`, `[labels]="['równe', 'malejące']"`.
- Domyślna wartość: `rowne`.
- Wartość obowiązuje globalnie dla całego okresu kredytu (jeden typ rat dla wszystkich okresów oprocentowania).
- Zależności:
  - `rowne` (annuitet): rata stała `R = saldo × i_m / (1 − (1 + i_m)^(−n_pozostałe))` (`CalculatorService.annuityPayment`),
  - `malejace`: część kapitałowa stała `Kapitał_m = saldo / n_pozostałe`, odsetki `Odsetki_m = saldo_{m-1} × i_m`, rata `R_m = Kapitał_m + Odsetki_m`.
- Przy zmianie okresu oprocentowania, dołączeniu transzy lub nadpłacie z efektem „niższa rata” rata jest przeliczana ponownie od bieżącego salda i pozostałej liczby rat.

### 2.8. Okresy oprocentowania (`ratePeriods` — `FormArray`)

Sekcja `ui-cards-group` zawiera listę kart `OKRES n` (`FormArray` z `RatePeriodFormGroup`). Każdy okres definiuje typ stopy i jej wartość obowiązującą od wskazanej daty. Domyślnie istnieje jeden okres startujący od `startDate`.

Pola w karcie:

- 8. `Stopa` (`rateType`): `ui-segmented` z opcjami `['zmienna', 'stala']`. Domyślnie `zmienna`.
- 9. `Oprocentowanie` (`nominalRate`): `ui-number-input`, `suffix="%"`, `[decimals]="2"`. Wyświetlane tylko dla `rateType === 'stala'`.
  - Dla `rateType === 'zmienna'` to pole jest zastąpione polem tylko do odczytu (`inp inp--disabled`) prezentującym sumę `wibor + margin`.
- 9a. `WIBOR` (`wibor`): widoczne tylko dla `rateType === 'zmienna'`. `ui-number-input`, `suffix="%"`, `[decimals]="2"`. Domyślnie `7,00`.
- 9b. `Marża` (`margin`): widoczne tylko dla `rateType === 'zmienna'`. `ui-number-input`, `suffix="%"`, `[decimals]="2"`. Domyślnie `2,00`.

Walidatory: `Validators.min(0)`, `Validators.max(50)` dla wszystkich pól liczbowych w okresie.

Pierwszy okres (`$index === 0`) ma stałą datę startu „od daty uruchomienia kredytu” i nie udostępnia pickera. Kolejne okresy mają edytowalne pole `from` (`ui-month-picker`) w nagłówku karty oraz przycisk „usuń”.

Przycisk `+ Dodaj okres oprocentowania` (`addRatePeriod()` w `FormService`) tworzy nowy okres z datą `lastFrom + 12 miesięcy` i kopiuje pozostałe wartości z poprzedniego okresu.

W silniku obliczeniowym (`CalculatorService.compute`) okresy są sortowane rosnąco po `from`. Dla danego miesiąca `date` brany jest ostatni okres spełniający `period.from <= date`. Każda zmiana okresu w trakcie spłaty wywołuje rekalkulację `equalRate` lub `decreasingCapitalPart`.

---

## 3. Akcje globalne (topbar)

Sekcja danych podstawowych nie ma osobnego paska akcji — globalne przyciski znajdują się w nagłówku aplikacji (`LayoutComponent.template`):

### 3.1. „Wstaw domyślne”

- Wywołuje `LayoutComponent.setDefaults()`, które uruchamia kolejno:
  - `FormService.setDefaults()` — resetuje sekcję `basicData`, regułę docelowej raty, prowizję za wcześniejszą spłatę, listę okresów oprocentowania (jeden okres `zmienna 7+2`), reguły nadpłat oraz transze (jedna transza = `loanAmount` w `startDate`).
  - `FormService.setOverheadDefaults()` — wstawia przykładowe wartości w sekcji „Koszty okołokredytowe i promocje” (m.in. `appraisalFee = 400`, `bridgeRateIncrease = 1,2`, `bridgeMonths = 6`, `propInsValue = 0,0008`).
- Akcja nie pyta o potwierdzenie.

### 3.2. „Zapisz kalkulację”

- Otwiera dialog `SaveCalculationDialogComponent` (`<dialog>` HTML5 z polem `nameCtrl`).
- Po zatwierdzeniu nazwy dane (raw value formularza) zapisywane są do `localStorage` pod kluczem `'kalkulacje'` jako element listy `{ name, createdAt, data }`. Jeśli rekord o tej nazwie już istnieje, użytkownik jest pytany o nadpisanie (`window.confirm`).
- Dodatkowo plik JSON o nazwie `<name>.json` jest pobierany przez przeglądarkę (utworzenie `Blob` + `URL.createObjectURL` + click na ukrytym elemencie `<a>`).
- Przycisk „Wyczyść dane” oraz „drukuj” nie istnieją w bieżącej implementacji. Czyszczenie jest dostępne w `FormService.clearAll()` i `clearOverheadCosts()` / `clearTransze()`, ale nie ma do nich powiązanego elementu UI w `LayoutComponent`.

---

## 4. Panel wyników (`ResultsSummaryComponent`)

Bezpośrednio nad wykresami i tabelą harmonogramu wyświetlany jest pasek 4 kafelków KPI (`kpi-strip`):

1. **Pierwsza rata** (`r.firstInstallment.rate`) — z dopiskiem `installmentTypeLabel · rateTypeLabel effectiveRate%`.
2. **Suma wszystkich płatności** (`r.totals.totalAllPayments = totalRate + overheadCosts`) — z dopiskiem „oddasz X% pożyczonej kwoty” (`bankReturnRatioPct`).
3. **Odsetki** (`r.totals.totalInterest`) — z dopiskiem `intPct = totalInterest / totalCapital × 100`.
4. **Koszty okołokredytowe** / **Nadpłaty** / **Koszty i nadpłaty** — etykieta zależna od włączonych sekcji (`kpi4Label`); wartość = `overheadCosts + prepayments`. Dolny meta-tekst opcjonalnie rozbija sumę na składniki.

Wartości totali są obliczane w `CalculatorService.compute()`:

- `totalRate = Σ schedule[i].rate` (rata + nadpłata + prowizja za wcześniejszą spłatę),
- `overheadCosts = loanCommission + appraisalFee + Σ insuranceCost + Σ commission + Σ trancheDisbursementFees`,
- `prepayments = Σ schedule[i].prepayment`,
- `bankReturnRatioPct = totalAllPayments / loanAmount × 100`.

---

## 5. Walidacje krzyżowe (`crossFieldValidator`)

Walidator zarejestrowany na `FormGroup<MortgageFormGroup>` zwraca błędy globalne wyświetlane w `ResultsErrorsComponent`:

| Klucz błędu                         | Warunek wyzwolenia                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `loanGtProperty`                    | `loanAmount > propertyValue`                                                                                              |
| `totalMonthsInvalid`                | `Math.trunc(loanPeriod) <= 0`                                                                                             |
| `capitalBeforeStart`                | `capitalStartDate < startDate`                                                                                            |
| `capitalBeforeLastTranche`          | transze włączone, liczba transz > 1 i `capitalStartDate <= max(daty transz)`; obiekt błędu zawiera pole `lastTrancheDate` |
| `transzeSumMismatch`                | sekcja transz włączona i `Σ transze.amount ≠ loanAmount` (z tolerancją 0,01); w obiekcie błędu `expected/actual/diff`     |
| `prepaymentDateRangeInvalid`        | reguła nadpłaty (nie `jednorazowo`) z `to < from`                                                                         |
| `prepaymentAmountInvalid`           | `amount < 0` w którejkolwiek regule nadpłaty                                                                              |
| `targetInstallmentDateRangeInvalid` | reguła docelowej raty z `to < from`                                                                                       |
| `targetInstallmentInvalid`          | `targetRate < 0`                                                                                                          |

Gdy formularz jest niepoprawny (`form.valid === false`), `LayoutComponent.recalculate()` ustawia `results` i `yearlyGroups` na `null` — panel wyników, donuty i tabela znikają, a `ResultsErrorsComponent` wypisuje listę błędów.

---

## 6. Reguły aktualizacji wyników

- Każda zmiana w polach `basicData` lub jakimkolwiek innym polu formularza wyzwala `form.valueChanges` → `recalculate()`.
- Sekcje opcjonalne (`overheadCosts`, `tranches`, `prepayments`) mają flagę `included`. Gdy jest `false`, `recalculate()` przekazuje do `CalculatorService` neutralne wartości domyślne (zerowe ubezpieczenia, brak transz, brak nadpłat) — silnik wykonuje obliczenia, ale dane sekcji nie wpływają na wynik.
- Stan zwijania/rozwijania kart z okresami oprocentowania nie jest persystowany — to czysto wizualna właściwość komponentu.

---

## 7. Kontekst implementacyjny

- Formularze: Reactive Forms (`FormGroup<MortgageFormGroup>` z typowanymi grupami w `src/app/model/form.model.ts`).
- Serwis obliczeniowy: `CalculatorService` (`src/app/services/calculator/calculator.service.ts`) — czyste funkcje, brak zależności od komponentów; wszystkie daty przechowywane jako `YYYY-MM`, arytmetyka miesięcy oparta o `year × 12 + month`.
- Wykresy: implementacja własna (SVG `stroke-dasharray`) w komponencie `ui-donut`. Brak zależności od Chart.js / ngx-charts.
- Tabela: niestandardowy CSS Grid (klasa `tbl`) z agregacją roczną `groupByYear()` w `LayoutComponent`. Każda kategoria jest sumowana, ostatnie saldo w roku trafia do `lastRemaining`.
- Trwałość: zapis/odczyt w `localStorage` pod kluczem `'kalkulacje'`; dodatkowo eksport JSON jako plik do pobrania.
- Lokalizacja: `pl-PL` (`Intl.NumberFormat`). Etykiety i typy domenowe pozostają po polsku (`rowne`/`malejace`, `jednorazowo`, `co rok`, `niższa rata`, `skrócenie okresu`).
- Strict TypeScript (`strict: true`, `strictTemplates: true`); zakaz `any`. Komponenty standalone z `OnPush`.
- Testy: Vitest (`describe`/`it`/`expect` przez `vitest/globals`).
