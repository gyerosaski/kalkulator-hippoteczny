# Specyfikacja techniczna sekcji „Koszty okołokredytowe i promocje”

## 1. Kontekst sekcji

- Komponent: `OverheadCostsFormComponent` (`src/app/components/form/overhead-costs-form/`).
- Selektor: `app-overhead-costs-form`.
- Sekcja jest **opcjonalna** (`ui-section [toggleable]="true"`) — włączana przełącznikiem `included` w nagłówku. Gdy `included === false`, pola nie są uwzględniane w obliczeniach (`LayoutComponent.recalculate()` przekazuje neutralne wartości zerowe do `CalculatorService`).
- Cel: konfiguracja wszystkich kosztów dodatkowych oraz reguł zmieniających efektywne oprocentowanie (ubezpieczenie pomostowe, niski wkład, promocja). Wpływa na:
  - kafelek KPI „Koszty okołokredytowe” w `ResultsSummaryComponent`,
  - wartość `r.totals.overheadCosts` używaną w `Suma wszystkich płatności`,
  - kolumnę `Koszty` w tabeli harmonogramu (widoczna tylko gdy sekcja jest włączona),
  - slice „Koszty okołokredytowe” na donucie `Struktura wszystkich płatności`.

## 2. Struktura formularza

Pola znajdują się w grupie `OverheadCostsFormGroup` (`src/app/model/form.model.ts`). Każda sekcja prezentowana jest jako `ui-card` z odpowiednim tagiem nagłówka (uppercase). Domyślne wartości startowe (przy pierwszym renderze) są zerowe; wartości „przykładowe” pojawiają się dopiero po kliknięciu globalnego „Wstaw domyślne” (które wywołuje `FormService.setOverheadDefaults()`).

### 2.1. Karta `PROWIZJA ZA UDZIELENIE`

| Pole            | Kontrolka             | Walidatory                                 | Domyślnie po `setDefaults`         | Jednostka |
| --------------- | --------------------- | ------------------------------------------ | ---------------------------------- | --------- |
| `commissionPct` | `ui-number-input`     | `Validators.min(0)`, `Validators.max(100)` | `0` (`0` w `setOverheadDefaults`)  | `%`       |
| `Przeliczenie`  | pole tylko do odczytu | —                                          | `loanAmount × commissionPct / 100` | `zł`      |

Sygnał obliczany `commissionAmount = Math.round(loanAmount × commissionPct) / 100` w komponencie. Wartość w obliczeniach (`CalculatorService`): `loanCommission = round2(loanAmount × commissionPct / 100)` — wlicza się do `overheadCosts`.

### 2.2. Karta `OPŁATA ZA WYCENĘ`

| Pole           | Kontrolka         | Walidatory          | Domyślnie po `setDefaults` | Jednostka |
| -------------- | ----------------- | ------------------- | -------------------------- | --------- |
| `appraisalFee` | `ui-number-input` | `Validators.min(0)` | `400`                      | `zł`      |

Kwota stała dodawana do `overheadCosts` raz w cyklu kalkulacji.

### 2.3. Karta `UBEZPIECZENIE POMOSTOWE`

| Pole                 | Kontrolka         | Walidatory          | Domyślnie po `setDefaults` | Jednostka |
| -------------------- | ----------------- | ------------------- | -------------------------- | --------- |
| `bridgeRateIncrease` | `ui-number-input` | `Validators.min(0)` | `1,2`                      | `%`       |
| `bridgeMonths`       | `ui-number-input` | `Validators.min(0)` | `6`                        | `mies.`   |

Mechanizm: w `CalculatorService.getEffectiveRateForMonth` dla miesięcy spełniających `monthIdx >= 1 && monthIdx <= bridgeMonths` (gdzie `monthIdx = monthDiff(startDate, date)`) bazowa stopa jest powiększana o `bridgeRateIncrease`. Skutek: wyższe odsetki w okresie „pomostowym”, brak osobnej pozycji w `overheadCosts` (wpływa pośrednio przez `totalRate`).

### 2.4. Karta `UBEZPIECZENIE NIERUCHOMOŚCI`

| Pole                | Kontrolka         | Opcje / format                                                                            | Domyślnie                               |
| ------------------- | ----------------- | ----------------------------------------------------------------------------------------- | --------------------------------------- |
| `propInsFrequency`  | `ui-select`       | `co rok`, `co miesiąc`                                                                    | `co rok`                                |
| `propInsCalcMethod` | `ui-select`       | `% wartości nieruchomości`, `% kwoty kredytu`, `% salda kredytu`, `znam kwotę`            | `% wartości nieruchomości`              |
| `propInsValue`      | `ui-number-input` | suffix dynamiczny (`%`/`zł`), decimals 4 dla `%`, 2 dla `znam kwotę`; `Validators.min(0)` | `0` (po `setOverheadDefaults` `0,0008`) |
| `propInsFrom`       | `ui-month-picker` | `YYYY-MM`                                                                                 | `nextMonthStr()`                        |
| `propInsTo`         | `ui-month-picker` | `YYYY-MM`                                                                                 | `endOfLoanDate()` (start + 240 mies.)   |

Wyliczanie (`calcInsuranceCostForMonth`):

- składka naliczana, gdy `date ∈ [from, to]` oraz `monthDiff(from, date) % 12 === 0` (dla `co rok`) lub w każdym miesiącu (`co miesiąc`),
- baza zależy od `calcMethod`: wartość nieruchomości / kwota kredytu / aktualne saldo / `value` jako kwota,
- wartość = `value` (tryb `znam kwotę`) lub `base × value / 100`.

### 2.5. Karta `UBEZPIECZENIE NISKIEGO WKŁADU`

| Pole                    | Kontrolka         | Walidatory          | Domyślnie | Jednostka |
| ----------------------- | ----------------- | ------------------- | --------- | --------- |
| `lowEquityRateIncrease` | `ui-number-input` | `Validators.min(0)` | `0`       | `%`       |

Mechanizm: w `getEffectiveRateForMonth` stopa jest powiększana o `lowEquityRateIncrease` przez cały okres kredytu (nie ma daty granicznej). Wpływa pośrednio na odsetki, nie na `overheadCosts`.

### 2.6. Karta `UBEZPIECZENIE NA ŻYCIE`

| Pole                | Kontrolka         | Opcje / format                                                                 | Domyślnie         |
| ------------------- | ----------------- | ------------------------------------------------------------------------------ | ----------------- |
| `lifeInsFrequency`  | `ui-select`       | `co rok`, `co miesiąc`, `jednorazowo`                                          | `co rok`          |
| `lifeInsCalcMethod` | `ui-select`       | `% kwoty kredytu`, `% salda kredytu`, `znam kwotę`                             | `% kwoty kredytu` |
| `lifeInsValue`      | `ui-number-input` | suffix dynamiczny, decimals 5 dla `%`, 2 dla `znam kwotę`; `Validators.min(0)` | `0`               |
| `lifeInsFrom`       | `ui-month-picker` | —                                                                              | `nextMonthStr()`  |
| `lifeInsTo`         | `ui-month-picker` | —                                                                              | `endOfLoanDate()` |

Wyliczanie analogicznie do ubezpieczenia nieruchomości, jednak baza nigdy nie pochodzi z `propertyValue` (lista `LifeInsuranceCalcMethod` nie zawiera tej opcji). Składka `jednorazowo` jest pobierana tylko w pierwszym miesiącu (`monthDiff(from, date) === 0`).

### 2.7. Karta `UBEZPIECZENIE OD UTRATY PRACY`

| Pole                   | Kontrolka         | Opcje / format                                     | Domyślnie         |
| ---------------------- | ----------------- | -------------------------------------------------- | ----------------- |
| `jobLossInsFrequency`  | `ui-select`       | `co rok`, `co miesiąc`, `jednorazowo`              | `jednorazowo`     |
| `jobLossInsCalcMethod` | `ui-select`       | `% kwoty kredytu`, `% salda kredytu`, `znam kwotę` | `% kwoty kredytu` |
| `jobLossInsValue`      | `ui-number-input` | suffix dynamiczny; `Validators.min(0)`             | `0`               |
| `jobLossInsFrom`       | `ui-month-picker` | —                                                  | `nextMonthStr()`  |

Pole `to` nie istnieje — składka „od utraty pracy” obowiązuje od `from` aż do końca harmonogramu (lub do końca kredytu w przypadku `jednorazowo`/`co rok`/`co miesiąc`).

### 2.8. Lista `DODATKOWE KOSZTY n` (`additionalCosts` — `FormArray`)

Opcjonalny `FormArray<AdditionalCostFormGroup>` w `ui-cards-group`. Każdy rekord:

| Pole         | Kontrolka             | Opcje / format                                           | Domyślnie        |
| ------------ | --------------------- | -------------------------------------------------------- | ---------------- |
| `name`       | `<input type="text">` | tekst                                                    | `''`             |
| `frequency`  | `ui-select`           | `co rok`, `co miesiąc`, `jednorazowo`                    | `jednorazowo`    |
| `calcMethod` | `ui-select`           | `% kwoty kredytu`, `% salda kredytu`, `znam kwotę`       | `znam kwotę`     |
| `value`      | `ui-number-input`     | suffix dynamiczny; `Validators.min(0)`; `[decimals]="2"` | `0`              |
| `from`       | `ui-month-picker`     | —                                                        | `nextMonthStr()` |

Akcje:

- przycisk `+ Dodaj koszt` (`addAdditionalCost()` w `FormService`) — dodaje pustą kartę,
- przycisk usuwania w nagłówku karty (`$index > 0`) — pierwsza karta nie jest usuwalna.

Wyliczanie (`calcInsuranceCostForMonth`): identyczna logika jak dla ubezpieczenia na życie/utraty pracy, baza zgodnie z `calcMethod`. Suma wszystkich miesięcznych pozycji trafia do `Σ insuranceCost`, które wlicza się do `overheadCosts`.

### 2.9. Karta `PROMOCJA OPROCENTOWANIA`

| Pole                | Kontrolka         | Walidatory          | Domyślnie                      | Jednostka |
| ------------------- | ----------------- | ------------------- | ------------------------------ | --------- |
| `promoRateDecrease` | `ui-number-input` | `Validators.min(0)` | `0`                            | `%`       |
| `promoFrom`         | `ui-month-picker` | —                   | `nextMonthStr()`               | data      |
| `promoTo`           | `ui-month-picker` | —                   | `nextMonthStr() + 12 miesięcy` | data      |

Mechanizm: w `getEffectiveRateForMonth` dla miesięcy spełniających `date ∈ [promoFrom, promoTo]` stopa zostaje pomniejszona o `promoRateDecrease` (klampowane do `0` od dołu: `Math.max(0, rate - rateDecrease)`).

## 3. Akcje w sekcji

W bieżącej implementacji sekcja nie ma własnego paska przycisków akcji. Operacje:

- przełącznik `included` w nagłówku `ui-section` — włącza/wyłącza wpływ sekcji na wynik,
- `+ Dodaj koszt` w grupie `DODATKOWE KOSZTY` — patrz 2.8,
- przycisk usuwania koszta dodatkowego (`$index > 0`).

Globalne „Wstaw domyślne” w topbarze wywołuje `FormService.setOverheadDefaults()`, który wstawia przykładowe wartości pokazane wcześniej w kolumnach „Domyślnie po `setDefaults`”.

`FormService.clearOverheadCosts()` jest dostępne programistycznie (resetuje wszystkie pola do zer i jednego pustego rekordu w `additionalCosts`), ale nie ma przypisanego przycisku w UI.

## 4. Wpływ na wynik

`CalculatorService.compute()` agreguje koszty w `overheadCosts`:

```
overheadCosts = loanCommission                  // 2.1
              + appraisalFee                    // 2.2
              + Σ insuranceCost                 // 2.4 + 2.6 + 2.7 + 2.8 (per miesiąc)
              + Σ commission                    // prowizje za wcześniejszą spłatę (sekcja Nadpłaty)
              + Σ trancheDisbursementFees       // opłaty z transz dodatkowych
```

Pola `bridgeInsurance` (2.3), `lowEquityInsurance` (2.5) i `promotionalRate` (2.9) zmieniają **efektywną stopę miesiąca** i wpływają pośrednio przez `interest`, a nie przez `overheadCosts`.

Wartość `totalAllPayments = Σ rate + overheadCosts`, gdzie `rate` w schemacie `ScheduleRow.rate = baseRate + prepayment + commission`. Stąd KPI:

- `Suma wszystkich płatności` = `totalAllPayments`,
- `Koszty okołokredytowe` = `overheadCosts`,
- `Odsetki` = `Σ schedule[i].interest`,
- `bankReturnRatioPct = totalAllPayments / loanAmount × 100`.

## 5. Walidacje

- Każde pole liczbowe ma `Validators.min(0)`. `commissionPct` dodatkowo `Validators.max(100)`. Brak innych walidatorów lokalnych.
- Sekcja nie ma własnych walidatorów krzyżowych — błędy okresów ubezpieczeń (`from > to`) nie są zgłaszane przez `crossFieldValidator` w `FormService`. Skrajne przypadki są neutralizowane przez `isMonthInRange` (zwraca `false` dla błędnego zakresu, więc składka po prostu nie jest naliczana).

## 6. Uwagi implementacyjne

- Wszystkie pola dat operują na ciągu `YYYY-MM`. Konwersja w UI realizowana jest przez `ui-month-picker` i pipe `formatMonth`.
- Suffixy i precyzja pól ubezpieczeń są dynamicznie przełączane przez gettery w komponencie (`propInsSuffix`, `lifeInsSuffix`, `jobLossInsSuffix`, `getAdditionalCostSuffix(index)`), reagując na `calcMethod`.
- `commissionAmount` jest zaimplementowane jako Angularowy `computed()` reagujący na zmiany `loanAmount` i `commissionPct`; w bieżącej implementacji `computed()` odczytuje `mainForm.get('loanAmount')` (pobranie po nazwie kontrolki w `FormGroup<MortgageFormGroup>`). Ze względu na strukturę kontrolek (`basicData.loanAmount`) wartość jest tu efektywnie wyliczana pośrednio — sprawdzenie wartości w trybie debug może zwracać `0` przy startowym renderze, dopóki nie pojawi się pierwsza zmiana formularza. (Drobna nieścisłość zauważona w aktualnym kodzie — nie blokuje wyników, ponieważ silnik korzysta z surowych wartości formularza.)
- Komponent korzysta z `ChangeDetectionStrategy.OnPush` i sygnałów (`toSignal` na `valueChanges`).
