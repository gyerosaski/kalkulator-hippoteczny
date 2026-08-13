# Porównanie ofert — architektura

Dokument techniczny: modele danych, serwis stanu, decyzje implementacyjne i rozszerzenia komponentów
wykresów dla widoku „Porównanie ofert”. Opis funkcjonalny (układ, interakcje, tabele, reguły delty)
żyje w `docs/funkcjonalności/porownanie-ofert.md`.

## Modele danych

`src/app/model/comparison.model.ts`. „Oferta” występuje na dwóch poziomach szczegółowości:

```
ComparableOffer = {            // model slotu i dialogu wyboru (lekkie, skalarne metadane)
  id: string,                  // = nazwa zapisanej kalkulacji; dla bieżącej — DRAFT_OFFER_ID
  kind: SAVED | DRAFT,
  name, loanAmount, propertyValue, loanPeriodYears, loanPeriodExtraMonths,
  nominalRate, rateType, installmentType,
  firstInstallment, totalInterest, totalCosts, commission, appraisalFee,
  totalOverpayments, totalPayments, hasErrors,
}

ComparisonOfferData = {        // komplet danych oferty wybranej do slotu
  offer: ComparableOffer,
  formValue: MortgageFormRawValue | null,   // migawka wejść (SavedCalculationRecord.data)
  computation: OfferComputation | null,     // null = błędy walidacji / nieudane przeliczenie
}

OfferComputation = {           // pełne przeliczenie bieżącym silnikiem
  inputs: MortgageInputs,
  results: MortgageResults,    // m.in. schedule: ScheduleRow[]
  yearlyGroups: YearGroup[],   // agregaty roczne
}
```

`ComparisonStateService` przechowuje wyłącznie identyfikatory slotów (`offerAId`/`offerBId`) i wystawia
computed `sideA`/`sideB: ComparisonOfferData`. Skalary `ComparableOffer` wybranych ofert są nadpisywane
wartościami z `computation.results` (jedno źródło prawdy). `MortgageResults.schedule` i `YearGroup[]`
to dokładnie te same struktury, które konsumują wykresy na zakładce „Kalkulator”.

Konwencja: `offerA` — lewa kolumna, baza delt (`Δ = B − A`); `offerB` — prawa, porównywana.
`↔ Zamień strony` zamienia `A ↔ B` (odwraca znak delt).

## Reguły aktualizacji (decyzja D1)

Zapisany rekord (`SavedCalculationRecord.data`) to **migawka wejść** (`form.getRawValue()`), nie wyników.
Wszystkie liczby sekcji porównania pochodzą z przeliczenia na żywo:
`record.data → buildMortgageInputs() → CalculatorService.compute() → groupByYear()`.

- Przeliczenia zapisanych ofert są memoizowane (klucz: `nazwa::data ostatniego zapisu`).
- Oferta `DRAFT` (bieżąca robocza) rekalkulowana na każdą zmianę formularza.
- Zmiana slotu lub `↔ Zamień strony` przelicza: delty `Δ`, markery lidera, wspólne skale
  `forcedBalanceAxisMax`/`forcedStackAxisMax` (tryb „obok siebie”).

Identyfikatorem oferty jest jej **nazwa** — zmiana nazwy w „Twoje kalkulacje” osierraca slot (objawia się
jak usunięcie: pusty slot + toast). Znana niedoskonałość.

## Komponenty i ich reużycie

- Szkielet każdej sekcji (3.3–3.8): wspólny `ui-section` (`src/app/components/ui/section/`) —
  nadtytuł + tytuł przez inputy `tag`/`heading`, akcje nagłówka przez `[slot=actions]`
  (używa go tylko tabela parametrów: przełącznik „Tylko różnice”), treść przez `ng-content`.
  Zlikwidowało to duplikację reguł `.{prefix}-section/-header/-tag/-title` powielonych wcześniej
  w SCSS każdej sekcji (m.in. w `donut-pair.shared.scss`).
- Tabela parametrów: `app-comparison-params-table` (czyta `formValue`, działa też dla ofert z błędami).
- KPI grid: `app-comparison-kpi-grid` (kafelek to wewnętrzny markup — generyczny `Kpi` nie istnieje).
- Donuty: `app-comparison-donuts-total`, `app-comparison-donuts-installment` — **reużycie generycznego
  `ui-donut`** (komponenty `app-results-donut-chart-*` z Kalkulatora są sprzężone z `FormService`/
  `SelectedMonthService` i nie są tu używane). Ukrywanie zerowych segmentów rozstrzygane poza komponentem.

## Wykres trendu — decyzja D2

Tryb „nakładka” realizuje nowy, lekki komponent `app-comparison-trend-chart` z inputami
`seriesA`/`seriesB: ComparisonTrendSeries { name; color; loanAmount; yearlyGroups }` — zamiast rozszerzać
`app-results-trend-chart` o tryb `series` (ryzyko regresji w Kalkulatorze: hover-donut, dimming, legenda).
Dwie linie „Pozostało do spłaty”, oś X = unia zakresów lat, oś Y = `roundUpToStep(max(loanAmount, salda), 50 000)`.

Tryb „obok siebie”: dwa pełne `app-results-trend-chart` ze wspólnymi maksimami osi przez nowe inputy:

```
forcedBalanceAxisMax: number | null = null   // wymuszone maks. osi salda
forcedStackAxisMax:   number | null = null   // wymuszone maks. osi stacka rocznego
```

Domyślne `null` = auto-skalowanie (pełna wsteczna zgodność z użyciem na zakładce „Kalkulator”).
Tryb `series`/`showBars` z pierwotnej makiety **nie został zaimplementowany**. Komponent `TrendChartHeader`
z makiety **nie istnieje** — legendę A/B renderuje `app-comparison-trend-chart` we własnym nagłówku.

## Drukowanie i eksport — odłożone (decyzja D3)

`Drukuj` i `Eksport CSV` poza bieżącą iteracją. Docelowo: wydruk A4 poziomo (3.7 zawsze w trybie nakładka),
CSV z kolumnami `section,metric,offer_a,offer_b,delta`. Nawigacja klawiaturą po komórkach tabel — odłożona;
zostają role ARIA (`role="table"/"row"/"cell"/"columnheader"/"rowheader"`).

> Uwaga: pierwotna specyfikacja pisana była pod makietę React (`charts.jsx`); powyżej stan faktyczny w Angularze.
