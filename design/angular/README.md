# Kalkulator hipoteczny — Angular port

Standalone-components Angular 17+. Wszystko bez backendu.

## Setup

```bash
ng new kalkulator-hipoteczny --standalone --style=scss --routing=false
cd kalkulator-hipoteczny
# wklej zawartość katalogu angular/src/ do src/
ng serve
```

Wymagane: Angular ≥ 17 (signals + standalone), TypeScript ≥ 5.2.
Brak zewnętrznych bibliotek (Chart.js niepotrzebny — wykresy są w SVG, dokładnie jak w makiecie).

## Struktura

```
src/
  index.html
  main.ts
  styles.scss
  app/
    app.component.ts
    models.ts
    calc.service.ts
    pipes/
      pln.pipe.ts
      month-label.pipe.ts
    ui/
      number-input.component.ts
      month-picker.component.ts
      segmented.component.ts
      select.component.ts
      section.component.ts
      field.component.ts
    sections/
      basic-data.component.ts
      costs.component.ts
      tranches.component.ts
      overpayments.component.ts
    results/
      kpi-strip.component.ts
      donut.component.ts
      payment-structure.component.ts
      first-installment.component.ts
      trend-chart.component.ts
      schedule-table.component.ts
      errors-panel.component.ts
    tweaks/
      tweaks-panel.component.ts
    saved/
      saved-calculations.component.ts
```

## Mapowanie React → Angular

| React (makieta) | Angular |
|---|---|
| `useState` | `signal()` |
| `useMemo` | `computed()` |
| `window.generateSchedule` | `CalcService.schedule()` (computed signal) |
| props w dół | `@Input() ... = input.required<...>()` |
| handlery w górę | `output<T>()` |
| `useTweaks` | sygnał + `localStorage` |
| inline JSX | osobne komponenty stand-alone |

## Stan globalny

`CalcService` trzyma sygnały wejściowe (`propertyValue`, `loanAmount`, ...) oraz wystawia `schedule = computed(...)`. Komponenty wstrzykują serwis i wiążą sygnały dwukierunkowo.

## Walidacja formularza

`CalcService` udostępnia trzy sygnały związane z błędami:

- `realErrors: Signal<FormError[]>` — wynik walidacji bieżącego stanu (kwota vs wartość, okres > 0, kolejność dat itp.).
- `errors: Signal<FormError[]>` — błędy faktycznie prezentowane (z uwzględnieniem trybu demo).
- `showErrors: Signal<boolean>` — czy prawa kolumna ma renderować `app-errors-panel` zamiast wyników.

O trybie decyduje `tweaks().viewState`:

| wartość | zachowanie |
|---|---|
| `'auto'` | pokaż błędy jeśli `realErrors.length > 0`, w przeciwnym razie wyniki |
| `'results'` | zawsze wyniki (błędy ukryte — do podglądu designu) |
| `'errors'` | zawsze pełen zestaw przykładowych błędów (`demoErrors`) — do podglądu designu |

`AppComponent.handleGoto(err)` przewija stronę do elementu `#{{ err.fieldId }}` i przygasza go klasą `.field--err-target` (pulsujące obramowanie). Anchory są wstawione w `BasicDataComponent`, `TranchesComponent`, `OverpaymentsComponent` — każdy błąd w `FormError` ma odpowiadające `fieldId`.

## Twoje kalkulacje (`SavedCalculationsComponent`)

Drugi widok aplikacji, przełączany przez topbar (`tweaks().activeTab`). Komponent samodzielny, zajmuje całą szerokość kontenera `.grid` (CSS `grid-column: 1 / -1`).

Dane w `CalcService.savedCalculations: Signal<SavedCalculation[]>` (mock — 8 wpisów). Metody serwisu:

| metoda | działanie |
|---|---|
| `renameSavedCalc(id, name)` | zmiana nazwy + aktualizacja `updatedAt` |
| `deleteSavedCalc(id)` | trwałe usunięcie; jeśli była aktywna — `activeCalculationId = null` |
| `duplicateSavedCalc(id)` | tworzy kopię z sufiksem „— kopia", tag `'robocza'`, ląduje na górze listy |
| `toggleFavSavedCalc(id)` | przełączenie tagu `'ulubiona'` |
| `loadSavedCalc(c)` | wpisuje parametry do sygnałów formularza i przełącza zakładkę na `kalkulator` |

Widok zarządza lokalnie: pole wyszukiwania, filtr (wszystkie / ulubione / robocze), sortowanie (5 kryteriów), otwarte menu kontekstowe, modale (rename / delete), toast.

Wszystkie akcje destrukcyjne idą przez modal potwierdzenia. Szczegóły UI: ikona ⭐ inline w wierszu, sparkline salda w SVG (cache'owany — dwa warianty: z nadpłatą i bez), kolorowy chip LTV (czerwony przy >80 %), tag „wczytana" na aktywnej kalkulacji.
