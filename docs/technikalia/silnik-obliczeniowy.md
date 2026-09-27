# Silnik obliczeniowy i przepływ danych

Dokument techniczny opisujący implementację rdzenia obliczeniowego kalkulatora. Treść funkcjonalna
(reguły biznesowe, wzory, zachowania UI) żyje w `docs/funkcjonalności/`; tutaj zebrano realizację
w kodzie — nazwy serwisów, metod, struktur danych i kluczy walidacji.

## Przepływ danych

```
FormService (reactive form)
    ↓ valueChanges
CalculatorComponent.recalculate()
    ↓ MortgageInputs (helper buildMortgageInputs)
CalculatorService.compute()
    ↓ MortgageResults + ScheduleRow[]
groupByYear() → YearGroup[]
    ↓
komponenty wyników (donuty / trend / wykres stóp + ResultsScheduleComponent)
```

`CalculatorComponent` (`src/app/views/calculator/calculator.component.ts`) subskrybuje
`form.valueChanges` i przy każdej zmianie wywołuje `recalculate()`, które buduje `MortgageInputs`
i przekazuje je do `CalculatorService.compute()`. Wyniki trzyma jako sygnały (`results`, `yearlyGroups`)
i mirroruje do `CalculatorStateService`. Gdy `form.valid === false`, `recalculate()` ustawia `results`
i `yearlyGroups` na `null` (panel wyników znika, `ResultsErrorsComponent` wypisuje błędy).

Sekcje opcjonalne (`overheadCosts`, `tranches`, `prepayments`) mają flagę `included`. Gdy `false`,
`recalculate()` przekazuje do `CalculatorService` neutralne wartości (zerowe ubezpieczenia, brak transz,
brak nadpłat).

## `CalculatorService`

`src/app/services/calculator/calculator.service.ts` — rdzeń finansowy. Metoda
`compute(inputs: MortgageInputs): MortgageResults` buduje pełny harmonogram miesiąc po miesiącu:
karencje, transze, stopy zmienne/stałe, dynamiczne korekty stopy (ubezpieczenie pomostowe, niski wkład,
promocja), wszystkie ubezpieczenia oraz reguły nadpłat. Daty to ciągi `YYYY-MM`; arytmetyka miesięcy
operuje na przesunięciach `year * 12 + month`. `round2()` jest aktualnie no-opem (brak zaokrąglania).

Kluczowe metody pomocnicze:

| Metoda                      | Zadanie                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `annuityPayment`            | rata stała annuitetu: `R = saldo × i_m / (1 − (1 + i_m)^(−n_pozostałe))` |
| `decreasingCapitalPart`     | część kapitałowa raty malejącej: `saldo / n_pozostałe`                   |
| `getRateComponentsForMonth` | bazowa stopa miesiąca + podwyżki pomostowe / niskiego wkładu             |
| `getEffectiveRateForMonth`  | stopa efektywna po nałożeniu promocji (`max(0, rate − rateDecrease)`)    |
| `calcInsuranceCostForMonth` | składka ubezpieczenia / dodatkowego kosztu dla danego miesiąca           |
| `syncLtvAmountValue`        | synchronizacja `loanAmount` / `ltv` / `propertyValue`                    |

Okresy oprocentowania sortowane są rosnąco po `from`; dla danego miesiąca brany jest ostatni okres
spełniający `period.from <= date`. Zmiana okresu w trakcie spłaty wyzwala rekalkulację `equalRate`
lub `decreasingCapitalPart` od bieżącego salda i pozostałej liczby rat.

Ubezpieczenie pomostowe: dla `monthIdx >= 1 && monthIdx <= bridgeMonths` (gdzie
`monthIdx = monthDiff(startDate, date)`) bazowa stopa rośnie o `bridgeRateIncrease`.
Ubezpieczenie niskiego wkładu: stopa rośnie o `lowEquityRateIncrease`, gdy
`currentLtv = currentBalance / propertyValue × 100 > 80`. Promocja: dla `date ∈ [promoFrom, promoTo]`
stopa maleje o `promoRateDecrease`.

Składka ubezpieczeniowa (`calcInsuranceCostForMonth`): naliczana, gdy `date ∈ [from, to]` oraz
`monthDiff(from, date) % 12 === 0` (`co rok`), w każdym miesiącu (`co miesiąc`) lub w pierwszym
miesiącu (`jednorazowo`, `monthDiff(from, date) === 0`). Baza zależy od metody (wartość nieruchomości /
kwota kredytu / saldo / kwota). Skrajne zakresy neutralizuje `isMonthInRange` (zwraca `false`).

## RRSO

`MortgageResults.rrso` (w %, `null` gdy nieobliczalna) wyliczane jest przez `computeRrso()`
(`src/app/helpers/rrso.helper.ts`) wg formuły APRC z dyrektywy 2008/48/WE:

```
Σ Dₖ·(1+X)^(−tₖ/12) = Σ Pⱼ·(1+X)^(−tⱼ/12)      (t — miesiące od uruchomienia, wykładnik w latach)
```

- Wypłaty (`Dₖ`): saldo początkowe w `t=0` + każda transza w miesiącu uruchomienia.
- Płatności (`Pⱼ`): dla każdego wiersza `rate + prepayment + commission + insuranceCost`, z korektami:
  koszty wstępne (prowizja za udzielenie + wycena) przenoszone do `t=0`; prowizje za uruchomienie transz
  dodawane w miesiącach uruchomienia (pierwsza transza pomijana — patrz `project_first_tranche_no_fee`).
- Solver: bisekcja od −99,99% do górnej granicy podwajanej do zmiany znaku (cap 10 000%, ~200 iteracji,
  precyzja 1e−10). `null` gdy brak wypłat/płatności lub brak pierwiastka.

## Struktury danych

```
MortgageInputs   → wejście CalculatorService.compute()
MortgageResults  → { schedule: ScheduleRow[], totals, firstInstallment, effectiveRate, rrso, ... }
YearGroup        → agregat ScheduleRow[] dla jednego roku kalendarzowego
```

`ScheduleRow.rate = baseRate + prepayment + commission`. Totale w `compute()`:

```
totalRate          = Σ schedule[i].rate
overheadCosts      = loanCommission + appraisalFee + Σ insuranceCost + Σ commission + Σ trancheDisbursementFees
prepayments        = Σ schedule[i].prepayment
totalAllPayments   = Σ rate + overheadCosts
bankReturnRatioPct = totalAllPayments / loanAmount × 100
```

`loanCommission` i `appraisalFee` trafiają do `insuranceCost` pierwszego wiersza harmonogramu.

### Rozbicie odsetek — `ScheduleRow.interestBreakdown`

`InterestComponentItem[]` (suma `value` == `interest`):

- `BASE` — odsetki bazowe (liczone jako reszta: `interest − pomostowe − niski wkład + promocja`),
- `BRIDGE_INSURANCE` — `saldo × bridgeRateIncrease / 12 / 100`,
- `LOW_EQUITY_INSURANCE` — podwyżka z niskiego wkładu (gdy LTV > 80%),
- `PROMOTIONAL_DISCOUNT` — ujemna kwota obniżenia z promocji.

Zerowe składniki pomijane; ujemny `PROMOTIONAL_DISCOUNT` zachowany. Agregat całego okresu:
`MortgageResults.totals.totalInterestBreakdown`; pierwsza rata: `firstInstallment.interestBreakdown`.
Dzieci odsetek w legendzie buduje `InterestBreakdownService`.

### Rozbicie kosztów — `ScheduleRow.costBreakdown`

`OverheadCostItem { kind: OverheadCostKind; name?; value }` (suma `value` == `insuranceCost` miesiąca):
prowizja za udzielenie i wycena (wiersz 1), ubezpieczenia, dodatkowe koszty (z `name`). Agregat:
`MortgageResults.totals.overheadCostsBreakdown` — złożenie wszystkich `costBreakdown` plus pozycje
`EARLY_REPAYMENT_COMMISSION` (= Σ `commission`) i `TRANCHE_DISBURSEMENT_FEE` (= Σ opłat transz);
suma `value` == `overheadCosts`.

Etykiety składowych pochodzą z pipe’ów `overheadCostKindLabel` i `interestComponentKindLabel`.

## Walidacja krzyżowa — `crossFieldValidator`

Zarejestrowany na `FormGroup<MortgageFormGroup>` (`FormService`), zwraca błędy globalne renderowane
w `ResultsErrorsComponent`:

| Klucz błędu                         | Warunek                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `loanGtProperty`                    | `loanAmount > propertyValue`                                                                                          |
| `totalMonthsInvalid`                | `Math.trunc(loanPeriod) <= 0`                                                                                         |
| `capitalBeforeStart`                | `capitalStartDate < startDate`                                                                                        |
| `capitalBeforeLastTranche`          | transze włączone, liczba transz > 1 i `capitalStartDate <= max(daty transz)` (obiekt błędu zawiera `lastTrancheDate`) |
| `transzeSumMismatch`                | transze włączone i `Σ transze.amount ≠ loanAmount` (tolerancja 0,01; `expected/actual/diff`)                          |
| `prepaymentDateRangeInvalid`        | reguła nadpłaty (nie `jednorazowo`) z `to < from`                                                                     |
| `prepaymentAmountInvalid`           | `amount < 0` w którejkolwiek regule nadpłaty                                                                          |
| `targetInstallmentDateRangeInvalid` | reguła docelowej raty z `to < from`                                                                                   |
| `targetInstallmentInvalid`          | `targetRate < 0`                                                                                                      |
| `commissionPctOverMax`              | `commissionValue > 100` w trybie procentowym prowizji za udzielenie                                                   |

Sekcja kosztów nie ma własnych walidatorów krzyżowych — błędne zakresy ubezpieczeń (`from > to`)
neutralizuje `isMonthInRange`.

## Nawigacja legenda → formularz

Kliknięcie etykiety pozycji legendy powiązanej z sekcją formularza wywołuje
`UiStateService.revealFormSection()` (otwiera sekcję/podsekcję i przewija do niej). Mapowania:
`overheadCostNavigationTarget` (koszt → sekcja) i `interestComponentNavigationTarget`
(składnik odsetek → sekcja), oba w `form-navigation.helper.ts`. „Odsetki bazowe” → sekcja
`RATE_PERIODS`; pozostałe składniki odsetek → podsekcje „Koszty okołokredytowe”.

Szczegóły przewijania: kotwicą sekcji jest `id` hosta `ui-foldable-section`
(`formSectionAnchorId`), kotwicą podsekcji — `id` hosta `ui-subsection`
(`formSubsectionAnchorId`; `ui-subsection` czerpie `sectionId` z wstrzykniętego rodzica
`FoldableSectionComponent`, a klucz z inputu `subsectionKey`). Cel może dodatkowo wskazywać
element dynamicznej listy przez `itemKey` (`FormSectionNavigationTarget.itemKey`) — dziś używane
dla kosztów dodatkowych, gdzie kluczem jest przycięta nazwa kosztu (`overheadCostNavigationTarget`
dokleja ją dla `ADDITIONAL_COST`). Kotwicą elementu jest `id` z `formListItemAnchorId`
(klucz kodowany `encodeURIComponent`), bindowane w szablonie kosztów na `ui-card` z sygnału
`additionalCostNames`. Gdy sekcja była zwinięta, `revealFormSection()` czeka na `transitionend`
animacji `grid-template-rows` na `.sec-body` (z awaryjnym timeoutem), bo dopiero wtedy pozycja celu
jest ostateczna. Elementy list i podsekcje przewijane są z `block: 'center'`, całe sekcje
z `block: 'start'`; brakujący element listy (np. po zmianie nazwy) degraduje cel do podsekcji.
Po starcie przewinięcia sygnał `UiStateService.highlightedNavigationTarget` przez ~2 s wskazuje
cel — `ui-subsection` / `ui-foldable-section` nakładają wtedy na tytuł globalną klasę
`.title-pulse`, a `ui-card` (input `highlighted`) pulsuje obrysem przez klasę `.card--pulse`;
tytuł podsekcji nie pulsuje, gdy cel ma `itemKey`. Ponowne kliknięcie restartuje animację przez
zdjęcie i ponowne nałożenie klasy.
