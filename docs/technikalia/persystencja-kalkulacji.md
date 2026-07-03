# Persystencja kalkulacji

Dokument techniczny: warstwa zapisu, odczytu, importu i eksportu zapisanych kalkulacji oraz logika
listy „Twoje kalkulacje”. Opis funkcjonalny widoku (UI, zachowania, formaty prezentacji) żyje
w `docs/funkcjonalności/twoje-kalkulacje.md`.

## Warstwa store — Tauri + `@tauri-apps/plugin-store`

Aplikacja działa jako desktopowa (Tauri V2). Kalkulacje przechowuje `CalculationsStoreService`
(`src/app/services/calculations-store/calculations-store.service.ts`).

- Plik danych: `calculations.json` w `%APPDATA%/com.gyerosaski.kalkulator-hipoteczny/`.
- Klucz tablicy rekordów w store: `"calculations"` (domyślnie pusta tablica).
- Instancja Store tworzona jednorazowo przy pierwszym dostępie, opcja `autoSave: true`.

### Operacje serwisu

| Metoda                                     | Działanie                                                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listCalculations()`                       | pobiera tablicę wszystkich rekordów ze store                                                                                                                    |
| `saveCalculation(record)`                  | upsert po `name` (zastępuje lub dodaje); wywołuje `store.save()`                                                                                                |
| `deleteCalculation(name)`                  | usuwa rekord o danej nazwie i zapisuje tablicę                                                                                                                  |
| `exportToFile(record)`                     | systemowy dialog zapisu (Tauri `saveDialog`), zapis JSON; zwraca ścieżkę lub `null`                                                                             |
| `exportCsvToFile(name, csvContent, title)` | systemowy dialog zapisu z filtrem `.csv`, sanityzacja nazwy pliku i zapis gotowej treści CSV; zwraca ścieżkę lub `null`                                         |
| `importFromFile()`                         | systemowy dialog otwarcia (`openDialog`), parsowanie JSON i wyłuskanie rekordów przez `extractImportableRecords`; zwraca tablicę poprawnych rekordów lub `null` |

### Uprawnienia Tauri

Deklarowane w `src-tauri/capabilities/default.json`:

| Plugin   | Zakres                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store`  | zapis i odczyt lokalnego store                                                                                                                                |
| `dialog` | systemowe dialogi otwarcia i zapisu pliku                                                                                                                     |
| `fs`     | odczyt/zapis JSON oraz zapis CSV; scope zapisu: `$DOCUMENT`, `$DOWNLOAD`, `$DESKTOP`, `$HOME` dla wzorców `**/*.json` i `**/*.csv` (odczyt tylko `**/*.json`) |

## Ustawienia aplikacji — `settings.json`

Ustawienia aplikacji (motyw i gęstość interfejsu) przechowuje `AppSettingsStoreService`
(`src/app/services/app-settings-store/app-settings-store.service.ts`) — analogiczny wzorzec do
`CalculationsStoreService`, oparty o ten sam `@tauri-apps/plugin-store` i uprawnienie `store`.

- Plik danych: `settings.json` w `%APPDATA%/com.gyerosaski.kalkulator-hipoteczny/`.
- Klucz obiektu ustawień w store: `"settings"` (typ `AppSettings` z `src/app/model/ui.model.ts`).
- Instancja Store tworzona jednorazowo przy pierwszym dostępie, opcja `autoSave: true`. Bez `defaults`
  na poziomie store — dzięki temu `getRawSettings()` zwraca `undefined`, gdy plik nie zawiera jeszcze
  wpisu (rozróżnienie pierwszego uruchomienia od zapisanego ustawienia).

| Metoda                    | Działanie                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `getSettings()`           | zwraca ustawienia zmergowane z wartościami domyślnymi (`DEFAULT_APP_SETTINGS`)            |
| `getRawSettings()`        | zwraca surowe zapisane ustawienia lub `undefined`, gdy brak wpisu                         |
| `updateSettings(partial)` | read-merge-write — scala podane pola z bieżącymi ustawieniami i zapisuje (`store.save()`) |

### Motyw — kanoniczny `settings.json` + cache `localStorage`

`ThemeService` (`src/app/services/theme/theme.service.ts`) trzyma motyw w sygnale, którego źródłem
prawdy jest `settings.json`. `localStorage` (klucz `theme`) pełni rolę **szybkiego cache'u** do
natychmiastowego pomalowania motywu przy starcie (zero migotania), zanim asynchroniczny store się wczyta.

- Sygnał inicjalizowany synchronicznie z `localStorage` (z kompatybilnością wsteczną dla `'dark'`/`'light'`
  i fallbackiem na `prefers-color-scheme`).
- W konstruktorze następuje reconcile: `getRawSettings()` → jeśli wpis istnieje, jego wartość nadpisuje
  sygnał (jest nadrzędna); jeśli nie (pierwsze uruchomienie), `settings.json` jest seedowany bieżącą
  wartością (migracja z `localStorage`).
- `setTheme()` zapisuje motyw kanonicznie przez `updateSettings({ theme })`; zapis do `localStorage`
  realizuje istniejący efekt sygnału. Reconcile używa bezpośredniego ustawienia sygnału (bez ponownego
  zapisu do store), więc nie powstaje echo-write.

### Gęstość interfejsu — kanoniczny `settings.json` + cache `localStorage`

`DensityService` (`src/app/services/density/density.service.ts`) trzyma gęstość w sygnale wg tego
samego wzorca co `ThemeService` — źródłem prawdy jest `settings.json`, `localStorage` (klucz
`density`) pełni rolę szybkiego cache'u przy starcie.

- Reconcile sprawdza konkretnie `stored?.density` (nie samo `stored`), ponieważ pliki `settings.json`
  zapisane przed wprowadzeniem gęstości zawierają tylko pole `theme` — brak pola `density` jest więc
  traktowany tak samo jak brak całego pliku (pierwsze uruchomienie): sygnał zostaje przy wartości z
  `localStorage`/domyślnej, a `settings.json` jest nią uzupełniany (migracja istniejących plików).
- `setDensity()` zapisuje gęstość kanonicznie przez `updateSettings({ density })`, analogicznie do
  `setTheme()`.

## Model rekordu — `SavedCalculationRecord`

`src/app/model/saved-calculation.model.ts`:

| Pole        | Typ       | Opis                                                                                     |
| ----------- | --------- | ---------------------------------------------------------------------------------------- |
| `name`      | `string`  | klucz unikalności — identyfikator rekordu                                                |
| `createdAt` | `string`  | data ISO-8601                                                                            |
| `data`      | `unknown` | pełny zestaw parametrów (`MortgageInputs`) w postaci JSON (migawka `form.getRawValue()`) |

Model widokowy `SavedCalculation` (warstwa prezentacji listy) rozszerza to o skalary wyliczone przy
zapisie: `id` (UUID), `note`, `propertyValue`, `loanAmount`, `years`, `months`, `installmentType`,
`rateType`, `referenceIndex`, `margin`, `rate`, `firstInstallment`, `totalInterest`, `totalCosts`,
`overpaymentsEnabled`, `tranches`, `updatedAt`, `createdAt`. Metadane służą wyłącznie liście i chipom;
po wczytaniu oferty jej skalary są nadpisywane wartościami z przeliczenia na żywo.

## Import / eksport

- Formaty: JSON (filtr `.json`) oraz CSV (filtr `.csv`, tylko eksport).
- Eksport — domyślna nazwa `<sanitized-name>.json`; znaki niedozwolone (`\ / : * ? " < > |`) → `_`.
  Eksport wszystkich: obiekt-opakowanie `{ exportedAt, count, calculations: [...] }`.
- Eksport CSV — czyste funkcje w `src/app/helpers/csv-export.helper.ts` (`buildScheduleCsv`,
  `toCsv`, `formatCsvNumber`) budują treść, a `exportCsvToFile` zapisuje ją do pliku.
  Wariant „polski Excel”: separator kolumn `;`, separator dziesiętny `,`, końce linii CRLF, prefiks BOM
  UTF-8; pola zawierające `;`, `"` lub znak nowej linii są cytowane (podwojony cudzysłów). CSV dotyczy
  wyłącznie eksportu pojedynczej kalkulacji (harmonogram spłaty), który przelicza harmonogram na nowo
  (`normalizeCalculationData` → `buildMortgageInputs` → `CalculatorService.compute`) i zapisuje wiersze
  `ScheduleRow`. Eksport wszystkich kalkulacji odbywa się wyłącznie do JSON.
- Import — `extractImportableRecords` obsługuje trzy kształty: pojedynczy rekord, gołą tablicę,
  obiekt-opakowanie. Każdy element musi mieć `name` (string), `createdAt` i `data`; elementy
  o niepoprawnym kształcie są pomijane. Przy kolizji nazwy rekord importowany jest jako kopia
  (`buildUniqueCalculationName`: sufiks „ — kopia”, „ — kopia (2)”, …) — nic nie jest nadpisywane.

## Filtrowanie, sortowanie, czas względny

Widok „Twoje kalkulacje” to standalone component z `ChangeDetectionStrategy.OnPush`.

- Sygnały lokalne: `search`, `filter`, `sortBy`, `openMenu`, `renameTarget`, `renameVal`, `deleteTarget`, `toast`.
- Computed: `stats` (hero), `filtered` (lista po filtrze i sortowaniu), `filterCount(id)` (liczniki).
- `filtered()`: filtr wyszukiwania (substring, case-insensitive, po `name`) → `sortSavedCalculations()`
  (`saved-calculation-sort.helper.ts`) — komparator rosnący kryterium + odwrócenie przy kierunku malejącym.
- Kryteria sortowania i ich domyślne kierunki (`DEFAULT_SORT_DIRECTIONS`): `UPDATED` (malejąco, `updatedAt`),
  `CREATED` (malejąco, `createdAt`), `NAME` (rosnąco, locale `pl`), `LOAN_AMOUNT` (malejąco, `loanAmount`),
  `FIRST_INSTALLMENT` (rosnąco, `firstInstallment`). Kryterium i kierunek (`SortDirection`) trzyma
  `UiStateService` (przeżywają przełączanie widoków w sesji).
- Helpery: `relativeTime(d): string` (czas względny), `exactDate(d): string` (`DD.MM.RRRR HH:mm`),
  `ltvOf(c)`, `periodOf(c)`.
- Obsługa klawiatury i menu: `@HostListener('document:keydown.escape')` (priorytet: rename → delete → menu ⋯),
  `@HostListener('document:mousedown')` (klik poza `.sc-menu-wrap` zamyka menu).

## Wykrywanie modyfikacji wczytanej kalkulacji

Po `loadFromSavedCalculation` `FormService` zapamiętuje snapshot `JSON.stringify(form.getRawValue())`.
Każda zmiana (`form.valueChanges`) aktualizuje bieżący snapshot przez `toSignal`. Sygnał
`isLoadedCalculationModified` to `computed()` porównujący snapshoty:

- `false` — brak wczytanej kalkulacji (snapshot `null`) lub snapshot identyczny,
- `true` — snapshoty się różnią.

Snapshot resetowany do `null` przy `setDefaults()` i odświeżany po zapisaniu pod tą samą nazwą.

## Migracja okresów oprocentowania

Starsze zapisane kalkulacje trzymały okresy w `basicData.ratePeriods` (płaska tablica). Przy wczytywaniu
(`FormService.loadFromFile`), w porównywarce ofert i na liście kalkulacji migawka jest normalizowana
przez `normalizeCalculationData()` (`src/app/helpers/saved-calculation-data.helper.ts`) — stare pliki
wczytują się bez zmian. Ta sama normalizacja mapuje też legacy nazwę pola wskaźnika referencyjnego
`wibor` → `referenceIndex` w każdym okresie oprocentowania, więc kalkulacje zapisane przed zmianą
nazwy wczytują się z zachowaniem wartości. Schemat zapisu (`src/app/schemas/calculation.schema.json`)
opisuje wyłącznie bieżący kształt (`ratePeriods.items` w korzeniu, `referenceIndex`, `minItems: 1`).
