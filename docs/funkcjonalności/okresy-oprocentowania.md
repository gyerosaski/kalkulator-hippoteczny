# Okresy oprocentowania

## 1. Kontekst

- Sekcja formularza: „Okresy oprocentowania” (`RatePeriodsFormComponent`, `src/app/components/form/rate-periods-form/`).
- Pozycja w lewej kolumnie: bezpośrednio pod sekcją „Dane podstawowe”, nad sekcją „Transze”.
- Sekcja jest **zwijana** (`ui-foldable-section`, `FormSectionId.RATE_PERIODS`, domyślnie rozwinięta), ale **nie jest wyłączalna** — co najmniej jeden okres oprocentowania jest zawsze wymagany do przeprowadzenia obliczeń.

## 2. Struktura formularza

Okresy żyją w korzeniu formularza jako osobna grupa:

```
MortgageFormGroup.ratePeriods : FormGroup<RatePeriodsSectionFormGroup>
└── items : FormArray<FormGroup<RatePeriodFormGroup>>
```

`RatePeriodFormGroup`: `from` (`YYYY-MM`), `rateType` (`VARIABLE`/`FIXED`), `nominalRate`, `wibor`, `margin`.

> **Migracja:** starsze zapisane kalkulacje przechowywały okresy w `basicData.ratePeriods` (płaska tablica). Przy wczytywaniu (`FormService.loadFromFile`), w porównywarce ofert i na liście kalkulacji migawka jest normalizowana przez `normalizeCalculationData()` (`src/app/helpers/saved-calculation-data.helper.ts`) — stare pliki/rekordy wczytują się bez zmian. Schemat zapisu (`src/app/schemas/calculation.schema.json`) opisuje wyłącznie bieżący kształt (`ratePeriods.items` w korzeniu, `minItems: 1`).

## 3. Pola w karcie okresu

Sekcja `ui-cards-group` zawiera listę kart `OKRES n`. Każdy okres definiuje typ stopy i jej wartość obowiązującą od wskazanej daty. Domyślnie istnieje jeden okres startujący od `startDate`.

- 8. `Stopa` (`rateType`): `ui-segmented` z opcjami `VARIABLE`/`FIXED` (etykiety „zmienna”/„stała”). Domyślnie `VARIABLE`.
- 9. `Oprocentowanie` (`nominalRate`): `ui-number-input`, `suffix="%"`, `[decimals]="2"`. Wyświetlane tylko dla stopy stałej.
  - Dla stopy zmiennej to pole jest zastąpione polem tylko do odczytu (`inp inp--disabled`) prezentującym sumę `wibor + margin`.
- 9a. `Wskaźnik referencyjny` (`wibor`): widoczne tylko dla stopy zmiennej. `ui-number-input`, `suffix="%"`, `[decimals]="2"`. Domyślnie `7,00`.
- 9b. `Marża` (`margin`): widoczne tylko dla stopy zmiennej. `ui-number-input`, `suffix="%"`, `[decimals]="2"`. Domyślnie `2,00`.

Walidatory: `Validators.min(0)`, `Validators.max(50)` dla wszystkich pól liczbowych w okresie.

Pierwszy okres (`$index === 0`) ma stałą datę startu „od daty uruchomienia kredytu” i nie udostępnia pickera. Kolejne okresy mają edytowalne pole `from` (`ui-month-picker`) w nagłówku karty oraz przycisk „usuń”.

Przycisk `+ Dodaj okres oprocentowania` (`addRatePeriod()` w `FormService`) tworzy nowy okres z datą `lastFrom + 12 miesięcy` i kopiuje pozostałe wartości z poprzedniego okresu.

## 4. Zachowanie w silniku obliczeniowym

W silniku obliczeniowym (`CalculatorService.compute`) okresy są sortowane rosnąco po `from`. Dla danego miesiąca `date` brany jest ostatni okres spełniający `period.from <= date`. Każda zmiana okresu w trakcie spłaty wywołuje rekalkulację `equalRate` lub `decreasingCapitalPart`.
