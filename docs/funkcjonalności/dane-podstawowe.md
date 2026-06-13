### Dokumentacja funkcjonalna sekcji formularza - `Dane podstawowe`

Zakres: Specyfikacja elementów i logiki sekcji „Dane podstawowe” odzwierciedlająca aktualny stan implementacji.

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

### 2.8. Okresy oprocentowania

Okresy oprocentowania zostały wydzielone do osobnej, zwijanej sekcji formularza „Oprocentowanie” (`RatePeriodsFormComponent`), prezentowanej bezpośrednio pod sekcją „Dane podstawowe”. Pełny opis: `docs/funkcjonalności/okresy-oprocentowania.md`.

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

## 4. Panel wyników

Wyniki prezentowane są w prawej kolumnie jako seria kart (wykresy + harmonogram) — opis poszczególnych kart w `docs/funkcjonalności/wykresy.md` i `docs/funkcjonalności/harmonogram-splaty.md`. (Wcześniej opisywany tu `ResultsSummaryComponent` z paskiem `kpi-strip` nie istnieje w bieżącej implementacji.)

Wartości totali są obliczane w `CalculatorService.compute()`:

- `totalRate = Σ schedule[i].rate` (rata + nadpłata + prowizja za wcześniejszą spłatę),
- `overheadCosts = loanCommission + appraisalFee + Σ insuranceCost + Σ commission + Σ trancheDisbursementFees`,
- `prepayments = Σ schedule[i].prepayment`,
- `bankReturnRatioPct = totalAllPayments / loanAmount × 100`.

### 4.1. RRSO (Rzeczywista Roczna Stopa Oprocentowania)

`MortgageResults.rrso` (w %, `null` gdy nieobliczalna) — wyliczana w `CalculatorService.compute()` przez `computeRrso()` (`src/app/helpers/rrso.helper.ts`) według formuły APRC z dyrektywy 2008/48/WE: szukana jest stopa `X`, dla której suma zdyskontowanych wypłat kredytu równa się sumie zdyskontowanych płatności kredytobiorcy:

```
Σ Dₖ·(1+X)^(−tₖ/12) = Σ Pⱼ·(1+X)^(−tⱼ/12)      (t — miesiące od uruchomienia, wykładnik w latach)
```

Montaż przepływów pieniężnych:

- **Wypłaty (Dₖ):** saldo początkowe w `t=0` (pierwsza transza lub cała kwota kredytu) + każda kolejna transza w miesiącu jej uruchomienia.
- **Płatności (Pⱼ):** dla każdego wiersza harmonogramu `rate + prepayment + commission + insuranceCost`, z dwiema korektami:
  - koszty wstępne (prowizja za udzielenie + opłata za wycenę), księgowane w harmonogramie w wierszu 1, są przenoszone do `t=0` (zgodnie z konwencją dyrektywy — koszty płatne przy zawarciu umowy),
  - prowizje za uruchomienie transz (nieobecne w wierszach harmonogramu) są dodawane w miesiącach uruchomienia transz; pierwsza transza z definicji nie ma prowizji za uruchomienie, więc jest pomijana (tak samo jak w totalach silnika).

Solver: bisekcja na przedziale od −99,99% do górnej granicy podwajanej aż do zmiany znaku (cap 10 000%; ~200 iteracji, precyzja 1e−10). `null` gdy brak wypłat/płatności lub brak pierwiastka w zakresie.

**Prezentacja:** RRSO wyświetlane jest w stopce legendy karty „Struktura płatności” (`ResultsDonutChartTotalComponent`) — w wierszu stopki komponentu `ui-legend` (`footerLabel="RRSO"`, `footerValueText`), w formacie pl-PL z 2 miejscami po przecinku (`formatRate`). Stopka jest ukryta, gdy `rrso === null`.

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
