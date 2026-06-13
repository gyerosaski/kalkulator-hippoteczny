# Wykresy — implementacja

Dokument techniczny: realizacja wykresów w kodzie (natywne SVG, geometria, motyw, źródła danych).
Opis funkcjonalny (typy wykresów, osie, serie, tooltipy, zachowania) żyje w `docs/funkcjonalności/wykresy.md`.

## Zasady ogólne

- Wszystkie wykresy to **natywne SVG** w dedykowanych komponentach — bez zewnętrznych zależności
  typu Chart.js. Geometria liczona w `computed()` na podstawie danych wejściowych.
- Donuty: generyczny `ui-donut` opakowany w `ui-donut-chart`. Dzieci legendy odsetek buduje
  `InterestBreakdownService`.
- Motyw: komponenty dziedziczą zmienne CSS palety i kolorów semantycznych — działają w trybie jasnym
  i ciemnym. Kolory grup: `--c-int` (odsetki), `--c-cost` (koszty), `--c-cap` (kapitał), `--c-over`
  (nadpłaty); neutralne: `--ink`, `--grid`, `--line`, `--line-2`, `--surface`, `--muted`, `--accent`.

## Donuty „Struktura …”

- Komponenty Kalkulatora: `ResultsDonutChartTotalComponent` (struktura wszystkich płatności),
  `ResultsDonutChartInstallmentComponent` (struktura raty).
- Źródła rozbicia: `MortgageResults.totals.overheadCostsBreakdown` / `totalInterestBreakdown`
  (cały okres), agregat `ScheduleRow.costBreakdown` / `interestBreakdown` wierszy do wybranego miesiąca
  (tryb narastający). Etykiety składowych: pipe’y `overheadCostKindLabel`, `interestComponentKindLabel`.
- RRSO w stopce legendy karty „Struktura płatności”: wiersz stopki `ui-legend`
  (`footerLabel="RRSO"`, `footerValueText`), format `pl-PL` 2 miejsca (`formatRate`), ukryty gdy `rrso === null`.
- Nawigacja z legendy do formularza: `UiStateService.revealFormSection()`; mapowania
  `overheadCostNavigationTarget`, `interestComponentNavigationTarget` (`form-navigation.helper.ts`).
  Etykiety nawigowalne renderowane jako przyciski (`.leg-lab--nav`).
- Wybór miesiąca w harmonogramie współdzielony przez `SelectedMonthService`.

## Wykres trendu — `ResultsTrendChartComponent`

`src/app/components/results/results-trend-chart/`. Combo: stacked column + linia, dwie osie Y.

- SVG `viewBox="0 0 1100 520"`, `preserveAspectRatio="xMidYMid meet"` (skalowanie proporcjonalne,
  ~320–460 px wysokości na desktopie).
- Geometria w `computed()` na podstawie `YearGroup[]` z `CalculatorComponent`.
- Wejście słupka: `interest`, `monthlyCost`, `principal`, `overpayment` z agregacji rocznej
  (`YearAggregate`, powstaje w `compute()` / `generateSchedule()`). Linia: `balance` (saldo po ostatnim
  miesiącu roku).
- Maksima osi: prawa `ceil(max(Σ słupka po roku) / 5000) * 5000`; lewa `ceil(max(saldo) / 50000) * 50000`.
- Tooltip renderowany w tym samym SVG (`<g>` z tłem i wierszami), aktywowany niewidoczną „strefą
  złapania kursora” (`<rect>` na całą wysokość kolumny rocznej); pozycja przełącza się na lewą stronę,
  gdy kolumna jest w prawej połowie wykresu.
- Linia salda: `stroke-width: 2px`, węzły `r: 4–5 px`. Gridlines tylko dla lewej osi (saldo).
- Tytuł: `Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' })` (pełne nazwy miesięcy).

## Wykres zmiany oprocentowania (warunkowy)

- Implementacja: natywny SVG step-path (`step-after`). Jedna oś X (czas, etykiety = lata kalendarzowe,
  rotacja 90°), jedna oś Y (oprocentowanie %).
- Oś Y: zakres `[0; ceil(maxRate × 1,1)]`, krok adaptacyjny (0,5 / 1 / 2 %).
- Motyw: `--c-int`, `--c-int-mid`, `--c-cost-mid`, `--c-cap-mid`, `--accent`, `--ink`.
- Karta wstawiana bezpośrednio nad tabelą harmonogramu, pod kartą trendu.
- Warunek renderowania identyczny jak warunkowa kolumna „Oprocentowanie” w harmonogramie (≥ 1 zmiana
  efektywnej stopy w czasie).
