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
    tweaks/
      tweaks-panel.component.ts
```

## Mapowanie React → Angular

| React (makieta)           | Angular                                    |
| ------------------------- | ------------------------------------------ |
| `useState`                | `signal()`                                 |
| `useMemo`                 | `computed()`                               |
| `window.generateSchedule` | `CalcService.schedule()` (computed signal) |
| props w dół               | `@Input() ... = input.required<...>()`     |
| handlery w górę           | `output<T>()`                              |
| `useTweaks`               | sygnał + `localStorage`                    |
| inline JSX                | osobne komponenty stand-alone              |

## Stan globalny

`CalcService` trzyma sygnały wejściowe (`propertyValue`, `loanAmount`, ...) oraz wystawia `schedule = computed(...)`. Komponenty wstrzykują serwis i wiążą sygnały dwukierunkowo.
