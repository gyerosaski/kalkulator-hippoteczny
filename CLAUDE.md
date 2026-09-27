# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL OVERRIDE — MCP Serena

**This rule overrides all other rules in this and other files**

When working with code in this repository, always use the Serena MCP server tools to the maximum extent possible. Prefer Serena tools (`mcp__serena__*`) over built-in tools (Read, Edit, Grep, Glob, Bash) for all code navigation, reading, editing, and analysis tasks. Before starting any coding task, call `mcp__serena__initial_instructions` to load the Serena Instructions Manual.

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build (dist/)
npm run watch      # Dev build with watch mode
npm test           # Run unit tests (Vitest)
npm run prettier   # Format code
npm run tauri:dev   # Uruchom Angular dev server + okno Tauri (desktop, HMR)
npm run tauri:build # Zbuduj frontend i spakuj MSI/NSIS (src-tauri/target/release/bundle/)
```

To run a single test file:

```bash
npx vitest run src/app/services/calculator/calculator.service.spec.ts
```

## Architecture

**Kalkulator Hippoteczny** — a Polish mortgage calculator (Angular 21, standalone components, Reactive Forms, Angular Material, Vitest).

### Data flow pipeline

```
FormService (reactive form)
    ↓ valueChanges
CalculatorComponent.recalculate()
    ↓ MortgageInputs (buildMortgageInputs helper)
CalculatorService.compute()
    ↓ MortgageResults + ScheduleRow[]
groupByYear() → YearGroup[]
    ↓
results components (donut/trend/rate charts + ResultsScheduleComponent)
```

### Key services

**`CalculatorService`** (`src/app/services/calculator/calculator.service.ts`) — core financial engine. The `compute(inputs: MortgageInputs): MortgageResults` method builds the full month-by-month amortization schedule, handling: grace periods, tranches, variable/fixed rates, dynamic rate adjustments (bridge insurance, low equity surcharge, promotional rates), all insurance types, and prepayment rules. Dates are `YYYY-MM` strings throughout; month arithmetic uses `year * 12 + month` offsets. `round2()` is currently a no-op (no rounding).

**`FormService`** (`src/app/services/form/form.ts`) — owns and builds the `FormGroup<MortgageFormGroup>` singleton. Contains a `crossFieldValidator` that enforces cross-field constraints (loan ≤ property value, tranche sum = loan amount, date ordering, etc.). Utility functions `ym()`, `nextMonthStr()`, `addMonthsStr()` handle `YYYY-MM` string date math.

**`CalculatorComponent`** (`src/app/views/calculator/calculator.component.ts`) — orchestrator of the calculator view. Subscribes to `form.valueChanges`, calls `recalculate()` on each change, holds `results` and `yearlyGroups` as signals and mirrors results into `CalculatorStateService`.

### Model structure

```
MortgageInputs → passed to CalculatorService.compute()
MortgageResults → { schedule: ScheduleRow[], totals, firstInstallment, effectiveRate, ... }
YearGroup       → aggregated view of ScheduleRow[] for one calendar year
```

`ToggleableSectionFormGroup<T>` pattern: `{ included: FormControl<boolean>, fields: FormGroup<T> }` — used for optional sections (overhead costs, tranches, prepayments).

### Tauri (desktop)

Aplikacja jest pakowana jako desktopowa przez **Tauri V2**. Konfiguracja żyje w `src-tauri/`:

- `src-tauri/tauri.conf.json` — okno, CSP, bundle targets (MSI + NSIS), identifier
- `src-tauri/Cargo.toml` — Rust deps (`tauri`, `tauri-plugin-store/dialog/fs`)
- `src-tauri/src/lib.rs` — rejestracja pluginów Tauri
- `src-tauri/capabilities/default.json` — uprawnienia (`store`, `dialog`, `fs` ze scope na `$DOCUMENT/$DOWNLOAD/$DESKTOP/$HOME/**/*.json`)

Persistencja kalkulacji idzie przez `CalculationsStoreService` (`src/app/services/calculations-store/`) — abstrakcja nad `@tauri-apps/plugin-store` z metodami `list/save/delete/exportToFile/importFromFile`. Plik store'a: `%APPDATA%/com.gyerosaski.kalkulator-hippoteczny/calculations.json`. Routing wymusza `withHashLocation()` (kompatybilność z `tauri://localhost`).

### Component layout

```
CalculatorComponent (views/calculator)
├── Form column
│   ├── BasicDataFormComponent              — loan params, LTV sync
│   ├── RatePeriodsFormComponent            — FormArray of interest-rate periods (reference index + margin vs fixed rate)
│   ├── TranchesFormComponent               — FormArray of tranches
│   ├── OverheadCostsFormComponent          — commissions, all insurance types, promo rates
│   └── PrepaymentsFormComponent            — FormArray of prepayment rules + target installment
└── Results column
    ├── ResultsDonutChartTotalComponent     — structure of all payments (donut + legend)
    ├── ResultsDonutChartInstallmentComponent — structure of the installment (donut + legend)
    ├── ResultsTrendChartComponent          — yearly payment composition chart
    ├── ResultsRateChartComponent           — rate timeline (only when rates change)
    ├── ResultsScheduleComponent            — schedule table, expandable year groups
    └── ResultsErrorsComponent              — cross-field validation errors
```

Other views (`src/app/views/`): `CalculationsManagerComponent` ("Twoje kalkulacje" — saved calculations list, import/export), `CalculationsCompareComponent` (offer comparison).

Dialogs (`src/app/dialogs/`): `save-calculation`, `rename-calculation`, `delete-calculation`, `month-picker`, `select-offer`, `settings`.

### Key conventions

- **Plany do realizacji zapisuj w języku polskim**
- **All components are standalone** with `OnPush` change detection.
- **Component templates always live in a separate `.html` file** (`templateUrl`) — never use inline `template: \`...\``in the`@Component` decorator.
- **SVG icons are always separate components** placed in `src/app/components/icons/<icon-name>/`. Never inline SVG markup directly in templates — always use the corresponding icon component (e.g. `<icon-calculator />`). Exception: data-driven chart SVGs (like donut charts with Angular bindings) stay in their own chart components. Every icon component MUST declare `host: { class: 'icon' }` in its `@Component` decorator — the global `.icon` rule in `src/styles.scss` renders the host as `inline-flex` with `vertical-align: middle`, which keeps the icon vertically centred against adjacent text in any context (flex, grid, inline). Because of Angular's emulated view encapsulation, a consumer's stylesheet cannot reach the inner `<svg>` (it carries the icon component's scope attribute, not the consumer's), so never try to fix icon alignment with `svg { display: … }` rules in feature components — rely on the `icon` host class instead.
- **Signals** for derived/output state; Reactive Forms for input state.
- **Locale:** `pl-PL` — all labels, months, and number formats are Polish.
- **Prefer enums over literal types** — domain string unions must be defined as `enum` with `SCREAMING_SNAKE_CASE` keys and English string values (e.g. `enum PrepaymentFrequency { ONE_TIME = 'ONE_TIME', MONTHLY = 'MONTHLY' }`). Polish display labels are derived exclusively in dedicated pipes located in `src/app/pipes/<enum-name>-label/` — never hardcode Polish strings in components or services. Use `Object.values(SomeEnum)` to build option arrays for `ui-select`/`ui-segmented` and pipe the result to `[labels]`. Expose the enum class in the component as `protected readonly SomeEnum = SomeEnum` when needed for template comparisons.
- **No abbreviated identifiers** — use full, descriptive names for all variables, functions, classes, properties, and types. Single-letter names (`r`, `s`, `k`, `x`), common shorthand (`res`, `cfg`, `val`, `acc`, `len`, `pct`, `calc`, `intl`, `fi`), and truncated words (`col`, `btn` in logic code) are forbidden. Exceptions: universally established domain acronyms used as-is in the business domain (e.g. `ltv`, `pln`) and Angular/RxJS idioms (`of`, `map` etc. as operator names).
- **Strict TypeScript** (`strict: true`, `strictTemplates: true`). No `any`.
- **Tests use Vitest** (not Karma/Jasmine). `describe`/`it`/`expect` are auto-imported via `vitest/globals`.
- SCSS for component styles; global styles in `src/styles.scss`.
- **Generic UI components first** — before writing ad-hoc markup, always check `src/app/components/ui/` for an existing component that fits. If none exists, create a new generic one there rather than embedding one-off styles in a feature template. Prefer reuse and extraction over duplication.
- **`ui-` selector prefix** — every component in `src/app/components/ui/` must have a selector starting with `ui-` (e.g. `ui-field`, `ui-btn-add`, `ui-section`). Never use `app-` or bare names for UI components.
- **Generic CSS class names** — class names must describe structure or visual role, never domain context (e.g. `.card-head`, `.field-hint`, `.row--2` — not `.rate-period-head`, `.tranche-fee-row`). Before adding a new class, check `src/styles.scss` for an existing one that covers the same visual pattern. Reuse existing classes to keep the style consistent; extract a new generic class only when no existing one fits.
- **All validation messages in `ResultsErrorsComponent`** — never render `<small class="field-error">` or error paragraphs inside form component templates. All user-visible validation errors (both cross-field errors from `form.errors` and field-level errors derived from `FormArray` controls) belong exclusively in `src/app/components/results/results-errors/`.
- **All dialogs in `src/app/dialogs/`** — every modal/confirm/picker window lives in its own folder under `src/app/dialogs/<dialog-name>/` as a dedicated standalone component built on the native `<dialog>` element with a `viewChild`-based `open(...)` promise API (see `SaveCalculationDialogComponent`, `RenameCalculationDialogComponent`, `DeleteCalculationDialogComponent`, `MonthPickerDialogComponent` as the canonical pattern). Never embed modal/overlay markup, `modal-overlay`/`modal-panel` divs, or `signal`-driven inline modals inside view, container, or feature component templates — extract them into a dialog component instead. Dialogs must not depend on view-specific signals; they take their state via the `open()` argument and resolve via the returned promise.
- **Update `docs/funkcjonalności` when changing business logic** — any change to calculation rules, formulas, validation constraints, or financial model behaviour in `CalculatorService` or `FormService` must be reflected in the relevant file under `docs/funkcjonalności/` (e.g. `harmonogram-splaty.md`, `nadplaty.md`, `transze.md`, `koszty-okolokredytowe-i-promocje.md`, `dane-podstawowe.md`) — described **agnostically** (see rule below). Conversely, changes to implementation/architecture (engine internals, data structures, persistence layer, framework decisions, chart rendering) belong in `docs/technikalia/`. Keep both in sync with the code; do not leave docs describing behaviour that no longer matches the implementation.
- **Functional docs are implementation-agnostic** — files under `docs/funkcjonalności/` describe WHAT the app does (field labels by their Polish UI label, units, formats, business rules, financial formulas, validation constraints expressed as conditions, UI behaviour, chart appearance) from the user's/domain perspective. They MUST NOT reference implementation: component/service/method/signal names, file paths, framework artefacts (Angular, RxJS, `signal`/`computed`, `FormGroup`/`FormArray`, `Validators`, `@HostListener`, `OnPush`), CSS classes/variables/selectors, form-control identifiers, error keys, enum class references, or persistence internals. Refer to form fields by their Polish UI label, never by control name. All technical/architectural detail (engine internals, data structures, persistence layer, framework decisions, SVG/chart implementation) belongs exclusively in `docs/technikalia/` — relocate it there rather than deleting it.
- **Every form validation must be documented in `walidacje.md`** — any new or changed validation (field-level constraint or cross-field rule in `FormService`) must be reflected in `docs/funkcjonalności/walidacje.md`, the central list of all form validations. Describe it agnostically (Polish UI label + condition → message/effect; never error keys, control names, or framework artefacts), following the table format already used there. This is in addition to keeping the relevant feature doc (`dane-podstawowe.md`, `transze.md`, `nadplaty.md`, …) in sync.
- **All types in `src/app/model/`** — every `interface`, `enum`, and `type` alias (whether exported or local to a single file) must be declared in `src/app/model/`. Never define them inside component, service, pipe, or dialog files. Domain types live in `mortgage.model.ts`, reactive-form types in `form.model.ts`, generic UI types in `ui.model.ts`. All are re-exported via `src/app/model/index.ts` (barrel); always import from `'…/model'`, never from individual model sub-files.
- **`[formControl]` over `formControlName`** — always bind reactive controls in templates via `[formControl]="<name>Control"` with an explicit typed getter in the component class; never use `formControlName`. Getters that return a `FormControl<T>` must be named with a `Control` suffix (e.g. `propertyValueControl`, `loanAmountControl`). When all controls in a form group are bound this way, remove the `[formGroup]`, `formArrayName`, and `[formGroupName]` directives from the template — they are only needed as context providers for `formControlName`.
