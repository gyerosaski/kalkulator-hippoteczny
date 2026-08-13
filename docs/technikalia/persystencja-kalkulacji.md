# Persystencja kalkulacji

Dokument techniczny: warstwa zapisu, odczytu, importu i eksportu zapisanych kalkulacji oraz logika
listy „Twoje kalkulacje”. Opis funkcjonalny widoku (UI, zachowania, formaty prezentacji) żyje
w `docs/funkcjonalności/twoje-kalkulacje.md`.

## Warstwa store — Tauri + `@tauri-apps/plugin-store`

Aplikacja działa jako desktopowa (Tauri V2). Kalkulacje przechowuje `CalculationsStoreService`
(`src/app/services/calculations-store/calculations-store.service.ts`).

- Plik danych: `calculations.json` w `%APPDATA%/com.gyerosaski.kalkulator-hippoteczny/`.
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

## Fallback przeglądarkowy (tryb dev bez Tauri)

Aplikacja jest projektowana pod desktop (Tauri), ale w developmencie bywa uruchamiana jako zwykły
dev server (`npm start` → `http://localhost:4200`). Poza środowiskiem Tauri most IPC nie istnieje,
więc `@tauri-apps/plugin-store` (a także `plugin-dialog`/`plugin-fs`) odrzucają wywołania. Aby cała
aplikacja działała również w przeglądarce, wprowadzono cienką warstwę wyboru implementacji.

### Warstwa `platform`

`src/app/services/platform/`:

| Plik                     | Rola                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `is-tauri.ts`            | `isTauriRuntime()` — strażnik środowiska; sprawdza obecność `window.__TAURI_INTERNALS__` / `window.__TAURI__`                                            |
| `local-storage-store.ts` | `LocalStorageStore` — implementacja `KeyValueStore` (`src/app/model/platform.model.ts`) oparta o `localStorage`; `storageKeyForStoreFile(fileName)`      |
| `browser-file-io.ts`     | przeglądarkowe odpowiedniki IO: `downloadTextFile` (Blob + `<a download>`), `pickAndReadTextFile` (`<input type="file">`)                                 |
| `platform-dialog.ts`     | `confirmDialog(message, options?)` — w Tauri deleguje do `ask`, w przeglądarce do `window.confirm`                                                        |

`KeyValueStore` to wspólny interfejs (`get`/`set`/`save`/`delete`) odwzorowujący podzbiór API `Store`
Tauri. Natywny `Store` spełnia go strukturalnie, więc `getStore()` w obu store'ach zwraca
`Promise<KeyValueStore>`, a ciała metod `list/save/delete` są wspólne dla obu środowisk.

`LocalStorageStore` mapuje jeden „plik” store'a na jeden wpis `localStorage` z prefiksem
`tauri-store:` (np. `tauri-store:calculations.json`), przechowujący obiekt `{ [key]: value }` — dzięki
temu `calculations.json` i `settings.json` pozostają odizolowane. Zapis jest natychmiastowy przy każdym
`set`/`delete`; `save()` istnieje wyłącznie dla zgodności API.

### Wybór ścieżki w store'ach

`CalculationsStoreService.getStore()` oraz `AppSettingsStoreService.getStore()` branchują na
`isTauriRuntime()`: w Tauri — natywny `load(...)`; poza Tauri — `LocalStorageStore`. Metody
importu/eksportu i `getStorePath()` w `CalculationsStoreService` mają analogiczny branch: w przeglądarce
eksport realizuje pobranie pliku (`downloadTextFile`), import — wybór pliku (`pickAndReadTextFile`),
a `getStorePath()` zwraca etykietę `„localStorage (tryb przeglądarkowy)”` zamiast `appDataDir()`.

### Seed z realnych danych

Aby w przeglądarce widoczna była realna lista kalkulacji, `CalculationsStoreService` przy pierwszym
starcie (gdy w `localStorage` nie ma jeszcze wpisu `tauri-store:calculations.json`) pobiera
`fetch('dev-seed/calculations.json')` i zasila store zawartością (obsługuje kształt `{ calculations }`
oraz gołą tablicę). Warunek „brak wpisu” sprawia, że świadome wyczyszczenie listy (zapis pustej
tablicy) nie powoduje ponownego zasiania.

Snapshot tworzy skrypt `scripts/seed-calculations.mjs` (`npm run seed:calc`, także `prestart` przed
`npm start`) — kopiuje realny `%APPDATA%/kalkulator-hippoteczny/calculations.json` do
`public/dev-seed/calculations.json` (asset serwowany pod `/dev-seed/`). Katalog `public/dev-seed/`
jest w `.gitignore` (zawiera realne dane użytkownika). Brak pliku źródłowego → skrypt kończy się
sukcesem, a dev startuje z pustą listą.

Ścieżka produkcyjna (Tauri desktop) pozostaje nietknięta — `isTauriRuntime()` zawsze wybiera tam
natywny store, a seed i fallbacki przeglądarkowe nie są używane.

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

### Hipopotam (pixel-art) — kanoniczny `settings.json` + cache `localStorage`

`PixelHippoService` (`src/app/services/pixel-hippo/pixel-hippo.service.ts`) trzyma flagę
`pixelHippoEnabled` w sygnale `isEnabled` wg tego samego wzorca co `ThemeService`/`DensityService`
— źródłem prawdy jest `settings.json`, `localStorage` (klucz `pixelHippoEnabled`) pełni rolę
szybkiego cache'u przy starcie (bez migotania hipopotama, gdy jest wyłączony).

- **Uwaga:** reconcile porównuje `stored?.pixelHippoEnabled !== undefined`, a nie sprawdza
  prawdziwości jak w `DensityService`. Dla ustawienia boolowskiego `false` jest poprawną zapisaną
  wartością — truthiness-check potraktowałby ją jak brak pola i zaseedował store z powrotem
  wartością `true`, przez co wyłączenie nie przetrwałoby restartu. Z tego samego powodu
  `loadPreference()` porównuje odczyt z `localStorage` z literałami `'true'`/`'false'`, zamiast
  rzutować go na `Boolean`.
- Brak pola w pliku (pierwsze uruchomienie lub `settings.json` sprzed wprowadzenia opcji) oznacza
  migrację: `settings.json` jest uzupełniany bieżącą wartością sygnału.
- `setEnabled()` zapisuje flagę kanonicznie przez `updateSettings({ pixelHippoEnabled })`.
- Konsumentem jest `ui-topbar`, który owija `ui-pixel-hippo` (wraz z wrapperem `.sprite-track`)
  w `@if (pixelHippoService.isEnabled())`. Wyłączenie niszczy komponent, więc istniejące sprzątanie
  w `DestroyRef.onDestroy` czyści `setTimeout` i anuluje animacje Web Animations API — po wyłączeniu
  nie zostaje żaden aktywny timer.

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
