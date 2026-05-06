# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build (dist/)
npm run watch      # Dev build with watch mode
npm test           # Run unit tests (Vitest)
npm run prettier   # Format code
```

To run a single test file:

```bash
npx vitest run src/app/services/calculator/calculator.service.spec.ts
```

## Architecture

**Kalkulator Hipoteczny** — a Polish mortgage calculator (Angular 21, standalone components, Reactive Forms, Angular Material, Vitest).

### Data flow pipeline

```
FormService (reactive form)
    ↓ valueChanges
LayoutComponent.recalculate()
    ↓ MortgageInputs
CalculatorService.compute()
    ↓ MortgageResults + ScheduleRow[]
groupByYear() → YearGroup[]
    ↓
ResultsSummaryComponent + ResultsScheduleComponent
```

### Key services

**`CalculatorService`** (`src/app/services/calculator/calculator.service.ts`) — core financial engine. The `compute(inputs: MortgageInputs): MortgageResults` method builds the full month-by-month amortization schedule, handling: grace periods, tranches, variable/fixed rates, dynamic rate adjustments (bridge insurance, low equity surcharge, promotional rates), all insurance types, and prepayment rules. Dates are `YYYY-MM` strings throughout; month arithmetic uses `year * 12 + month` offsets. `round2()` is currently a no-op (no rounding).

**`FormService`** (`src/app/services/form/form.ts`) — owns and builds the `FormGroup<MortgageFormGroup>` singleton. Contains a `crossFieldValidator` that enforces cross-field constraints (loan ≤ property value, tranche sum = loan amount, date ordering, etc.). Utility functions `ym()`, `nextMonthStr()`, `addMonthsStr()` handle `YYYY-MM` string date math.

**`LayoutComponent`** (`src/app/containers/layout/layout.component.ts`) — orchestrator. Subscribes to `form.valueChanges`, calls `recalculate()` on each change, holds `results` and `yearlyGroups` as signals. Also manages save/load (localStorage key `'kalkulacje'`) and a draggable column divider (20–80% flex basis range).

### Model structure

```
MortgageInputs → passed to CalculatorService.compute()
MortgageResults → { schedule: ScheduleRow[], totals, firstInstallment, effectiveRate, ... }
YearGroup       → aggregated view of ScheduleRow[] for one calendar year
```

`ToggleableSectionFormGroup<T>` pattern: `{ included: FormControl<boolean>, fields: FormGroup<T> }` — used for optional sections (overhead costs, tranches, prepayments).

### Component layout

```
LayoutComponent (containers/layout)
├── Form column
│   ├── BasicDataFormComponent       — loan params, LTV sync, WIBOR+margin vs fixed rate
│   ├── OverheadCostsFormComponent   — commissions, all insurance types, promo rates
│   ├── TranchesFormComponent        — FormArray of tranches
│   └── PrepaymentsFormComponent     — FormArray of prepayment rules + target installment
└── Results column
    ├── ResultsSummaryComponent      — totals, bank return ratio, first installment
    ├── ResultsScheduleComponent     — Material table, expandable year groups
    └── ResultsErrorsComponent       — cross-field validation errors
```

Dialogs (`src/app/dialogs/`): `SaveCalculationDialogComponent`, `LoadCalculationDialogComponent`.

### Key conventions

- **All components are standalone** with `OnPush` change detection.
- **Signals** for derived/output state; Reactive Forms for input state.
- **Locale:** `pl-PL` — all labels, months, and number formats are Polish. Domain terms stay in Polish (`rowne`/`malejace`, `jednorazowo`, `co rok`, etc.).
- **Strict TypeScript** (`strict: true`, `strictTemplates: true`). No `any`.
- **Tests use Vitest** (not Karma/Jasmine). `describe`/`it`/`expect` are auto-imported via `vitest/globals`.
- SCSS for component styles; global styles in `src/styles.scss`.
