### Dokumentacja funkcjonalna widoku `Twoje kalkulacje`

### 1. Zakres analizy

- Aplikacja: `Kalkulator kredytu hipotecznego` (Tauri V2, Angular 21).
- Analizowany widok: `Twoje kalkulacje`.
- Cel widoku: przeglądanie, wyszukiwanie, sortowanie i zarządzanie (wczytanie, zmiana nazwy, duplikacja, eksport, usunięcie) zapisanymi kalkulacjami hipotecznymi przechowywanymi lokalnie na dysku.

---

### 2. Sekcja nagłówkowa (Hero)

#### 2.1 Statystyki

| #   | Etykieta          | Źródło wartości                                                              |
| --- | ----------------- | ---------------------------------------------------------------------------- |
| 1   | `zapisanych`      | Łączna liczba rekordów w store                                               |
| 2   | `ostatnia zmiana` | Czas względny ostatnio zmodyfikowanego rekordu (np. `3 min temu`, `wczoraj`) |

Czas względny wyznaczany na podstawie pola `updatedAt` — szczegóły w sekcji 4 (kolumna „Zmodyfikowano").

#### 2.2 Przyciski akcji globalnych

| Przycisk           | Działanie                                                                |
| ------------------ | ------------------------------------------------------------------------ |
| `Nowa kalkulacja`  | Przejście do kalkulatora z pustym formularzem                            |
| `Importuj`         | Import kalkulacji z pliku JSON (dialog systemowy Tauri — patrz sekcja 7) |
| `Porównaj wybrane` | Placeholder UI — nie wdrożone w bieżącej wersji designu                  |

---

### 3. Pasek narzędzi

| Element           | Typ          | Opcje / działanie                                                                                                    |
| ----------------- | ------------ | -------------------------------------------------------------------------------------------------------------------- |
| Pole wyszukiwania | `text input` | Filtruje po polu `name` (case-insensitive, substring); przycisk `×` (widoczny gdy pole niepuste) czyści wyszukiwanie |
| Sortowanie        | `select`     | 5 opcji — patrz tabela poniżej                                                                                       |

#### 3.1 Opcje sortowania

| Wartość   | Etykieta               | Kierunek                     |
| --------- | ---------------------- | ---------------------------- |
| `updated` | ostatnio zmodyfikowane | malejąco (`updatedAt`)       |
| `created` | data utworzenia        | malejąco (`createdAt`)       |
| `name`    | nazwa (A–Z)            | rosnąco, locale `pl`         |
| `loan`    | kwota kredytu          | malejąco (`loanAmount`)      |
| `rata`    | wysokość raty          | rosnąco (`firstInstallment`) |

---

### 4. Tabela kalkulacji — kolumny

| #   | Kolumna         | Zawartość                                                                                                                                               | Format wyświetlania                                             |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | `Nazwa`         | Nazwa kalkulacji; badge `wczytana` gdy rekord aktualnie załadowany; badge `zmodyfikowana` gdy bieżący stan formularza różni się od wczytanego snapshotu | tekst                                                           |
| 2   | `Kwota · LTV`   | Kwota kredytu + wartość nieruchomości w podwierszu + wskaźnik LTV%; LTV wyróżnione (czerwone) gdy `> 80%`                                               | PLN bez miejsc dziesiętnych; LTV `X %`                          |
| 3   | `Okres`         | Liczba lat i miesięcy kredytu + typ raty w podwierszu                                                                                                   | `X lat` lub `X l. Y m-cy`; badge `rata równa` / `rata malejąca` |
| 4   | `Oproc.`        | Łączna stopa procentowa; w podwierszu `WIBOR X,XX + marża X,XX` dla stopy zmiennej lub `stała`                                                          | 2 miejsca dziesiętne, `%`                                       |
| 5   | `Pierwsza rata` | Pierwsza rata miesięczna                                                                                                                                | PLN, 2 miejsca dziesiętne                                       |
| 6   | `Odsetki`       | Suma odsetek przez cały okres kredytowania                                                                                                              | PLN bez miejsc dziesiętnych                                     |
| 7   | `Zmodyfikowano` | Czas względny (`updatedAt`); po najechaniu kursorem — pełna data i godzina jako tooltip; w podwierszu data bez godziny                                  | `DD.MM.RRRR`                                                    |
| 8   | `Akcje`         | Przycisk `Wczytaj` + przycisk menu `⋯`                                                                                                                  | —                                                               |

#### 4.1 Wyróżnienie aktywnego wiersza

Wiersz odpowiadający aktualnie wczytanej kalkulacji otrzymuje klasę `table-data-row--active` (lewy kolorowy pasek) i badge `wczytana` w kolumnie Nazwa. Jeśli formularz został zmodyfikowany po wczytaniu, obok badge `wczytana` pojawia się dodatkowo badge `zmodyfikowana`.

#### 4.3 Mechanizm wykrywania modyfikacji

Po wczytaniu kalkulacji (`loadFromSavedCalculation`) serwis `FormService` zapamiętuje snapshot stanu formularza jako `JSON.stringify(form.getRawValue())`. Każda zmiana formularza (RxJS `form.valueChanges`) aktualizuje bieżący snapshot via `toSignal`. Sygnał `isLoadedCalculationModified` to `computed()` porównujący bieżący snapshot z zapamiętanym:

- `false` gdy brak wczytanej kalkulacji (snapshot `=== null`) lub snapshot identyczny z bieżącym stanem.
- `true` gdy snapshoty się różnią — dowolna zmiana parametrów formularza po wczytaniu.

Snapshot jest resetowany do `null` przy `setDefaults()` (nowa kalkulacja) i odświeżany do bieżącego stanu po zapisaniu kalkulacji pod tą samą nazwą co aktualnie wczytana.

#### 4.2 Czas względny

| Zakres różnicy czasu | Wyświetlany tekst |
| -------------------- | ----------------- |
| < 60 s               | `przed chwilą`    |
| < 1 godz.            | `X min temu`      |
| < 24 godz.           | `X godz. temu`    |
| < 48 godz.           | `wczoraj`         |
| < 7 dni              | `X dni temu`      |
| < 30 dni             | `X tyg. temu`     |
| ≥ 30 dni             | `X mies. temu`    |

---

### 5. Stan pusty

Wyświetlany gdy po zastosowaniu aktywnych filtrów i wyszukiwania nie pozostaje żaden rekord (`filtered().length === 0`).

| Element                   | Treść                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Ikona                     | Stylizowana ikona kalendarza SVG                                                            |
| Tytuł                     | `Brak pasujących kalkulacji`                                                                |
| Opis                      | `Zmień filtry albo wyczyść pole szukania, aby zobaczyć wszystkie zapisane warianty.`        |
| Przycisk `Wyczyść filtry` | Widoczny tylko gdy aktywny filtr `≠ 'all'` LUB pole wyszukiwania niepuste; zeruje oba stany |

---

### 6. Akcje na wierszu

#### 6.1 Przycisk `Wczytaj`

- Ładuje pełny zestaw parametrów kalkulacji do formularza kalkulatora.
- Po wczytaniu wyświetla toast: `Wczytano „{nazwa}" do kalkulatora`.

#### 6.2 Menu `⋯` (więcej akcji)

| Pozycja menu    | Działanie                                                                             |
| --------------- | ------------------------------------------------------------------------------------- |
| `Zmień nazwę`   | Otwiera modal zmiany nazwy (sekcja 7.1)                                               |
| `Duplikuj`      | Tworzy kopię kalkulacji z nową nazwą (z sufiksem); toast: `Utworzono kopię „{nazwa}"` |
| `Eksportuj CSV` | Placeholder — nie wdrożone w bieżącej wersji designu                                  |
| `Usuń`          | Otwiera modal potwierdzenia usunięcia (sekcja 7.2)                                    |

#### 6.3 Zachowanie menu ⋯

- Otwarcie menu zamyka każde inne aktualnie otwarte menu.
- Kliknięcie poza obszarem `.sc-menu-wrap` (zdarzenie `document:mousedown`) zamyka menu.
- Naciśnięcie klawisza `Escape` zamyka menu (jeśli nie jest aktywny żaden modal).

---

### 7. Okna modalne

#### 7.1 Modal zmiany nazwy

| Element                       | Zachowanie                                                                 |
| ----------------------------- | -------------------------------------------------------------------------- |
| Input                         | Wypełniony aktualną nazwą kalkulacji                                       |
| Przycisk `Zapisz`             | Disabled gdy: pole jest puste LUB wpisana nazwa jest identyczna z aktualną |
| `Enter`                       | Zatwierdza (odpowiednik kliknięcia `Zapisz`)                               |
| `Escape`                      | Zamyka modal bez zapisu                                                    |
| Klik w tło (`.sc-modal-mask`) | Zamyka modal bez zapisu                                                    |
| Toast po zapisie              | `Zmieniono nazwę na „{nowa nazwa}"`                                        |

#### 7.2 Modal potwierdzenia usunięcia

| Element                                   | Zachowanie                                                      |
| ----------------------------------------- | --------------------------------------------------------------- |
| Podsumowanie                              | Kwota kredytu · Okres (lata) · Oprocentowanie · Data utworzenia |
| Przycisk `Usuń kalkulację`                | Destrukcyjny (czerwony); trwale usuwa rekord                    |
| Przycisk `Anuluj` / `Escape` / klik w tło | Zamykają modal bez usunięcia                                    |
| Toast po usunięciu                        | `Usunięto kalkulację „{nazwa}"`                                 |

#### 7.3 Priorytet klawiszy (Escape)

1. Jeśli aktywny modal rename → zamknij rename.
2. Else jeśli aktywny modal delete → zamknij delete.
3. Else → zamknij menu ⋯.

---

### 8. Toast (powiadomienie)

- Wyświetlany po zakończeniu każdej akcji: wczytanie, zmiana nazwy, duplikacja, usunięcie.
- Automatycznie znika po **3,2 s**.
- Każde nowe powiadomienie anuluje aktywny timeout i natychmiast zastępuje poprzedni tekst.

---

### 9. Stopka

| Element                               | Treść                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Licznik                               | `Wyświetlono X z Y kalkulacji · dane przechowywane lokalnie w przeglądarce` |
| Przycisk `Eksportuj wszystkie do CSV` | Placeholder — nie wdrożone w bieżącej wersji designu                        |

---

### 10. Model danych `SavedCalculation`

Interfejs używany w warstwie widoku (design). W warstwie persystencji (Tauri store) kalkulacja przechowywana jest jako `SavedCalculationRecord` — patrz sekcja 11.

| Pole                  | Typ                     | Opis                                    |
| --------------------- | ----------------------- | --------------------------------------- |
| `id`                  | `string`                | Unikalny identyfikator UUID             |
| `name`                | `string`                | Nazwa nadana przez użytkownika          |
| `note`                | `string \| null`        | Opcjonalna notatka tekstowa             |
| `propertyValue`       | `number`                | Wartość nieruchomości (PLN)             |
| `loanAmount`          | `number`                | Kwota kredytu (PLN)                     |
| `years`               | `number`                | Okres kredytowania — pełne lata         |
| `months`              | `number`                | Okres kredytowania — dodatkowe miesiące |
| `installmentType`     | `'równe' \| 'malejące'` | Typ raty                                |
| `rateType`            | `'zmienna' \| 'stała'`  | Typ oprocentowania                      |
| `wibor`               | `number`                | Stawka WIBOR (%) — dla stopy zmiennej   |
| `margin`              | `number`                | Marża banku (%) — dla stopy zmiennej    |
| `rate`                | `number`                | Łączna stopa procentowa (%)             |
| `firstInstallment`    | `number`                | Wartość pierwszej raty (PLN)            |
| `totalInterest`       | `number`                | Suma odsetek przez cały okres (PLN)     |
| `totalCosts`          | `number`                | Suma wszystkich kosztów kredytu (PLN)   |
| `overpaymentsEnabled` | `boolean`               | Czy kalkulacja zawiera nadpłaty         |
| `tranches`            | `number`                | Liczba transz                           |
| `updatedAt`           | `Date`                  | Data ostatniej modyfikacji              |
| `createdAt`           | `Date`                  | Data pierwszego zapisu                  |

---

### 11. Warstwa persystencji — Tauri + `@tauri-apps/plugin-store`

Aplikacja działa jako aplikacja desktopowa (Tauri V2). Kalkulacje są przechowywane lokalnie przez serwis `CalculationsStoreService` (`src/app/services/calculations-store/calculations-store.service.ts`).

#### 11.1 Mechanizm store

- Plik danych: `calculations.json` w katalogu `%APPDATA%/com.gyerosaski.kalkulator-hipoteczny/`
- Klucz tablicy rekordów w store: `"calculations"` (domyślna wartość: pusta tablica)
- Instancja Store tworzona jednorazowo przy pierwszym dostępie, z opcją `autoSave: true`

#### 11.2 Model rekordu `SavedCalculationRecord`

Zdefiniowany w `src/app/model/saved-calculation.model.ts`.

| Pole        | Typ       | Opis                                                      |
| ----------- | --------- | --------------------------------------------------------- |
| `name`      | `string`  | Klucz unikalności — identyfikator rekordu                 |
| `createdAt` | `string`  | Data ISO-8601                                             |
| `data`      | `unknown` | Pełny zestaw parametrów (`MortgageInputs`) w postaci JSON |

#### 11.3 Operacje serwisu

| Metoda                    | Działanie                                                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listCalculations()`      | Pobiera tablicę wszystkich rekordów ze store                                                                                                                           |
| `hasCalculation(name)`    | Sprawdza czy rekord o danej nazwie już istnieje                                                                                                                        |
| `saveCalculation(record)` | Upsert po `name`: zastępuje istniejący rekord lub dodaje nowy; wywołuje `store.save()`                                                                                 |
| `deleteCalculation(name)` | Filtruje tablicę, usuwa rekord o danej nazwie i zapisuje zaktualizowaną tablicę                                                                                        |
| `exportToFile(record)`    | Otwiera systemowy dialog zapisu pliku (Tauri `saveDialog`), zapisuje JSON; zwraca ścieżkę pliku lub `null` gdy anulowano                                               |
| `importFromFile()`        | Otwiera systemowy dialog otwarcia pliku (`openDialog`), parsuje JSON, waliduje kształt `SavedCalculationRecord`; zwraca `{ record, rawData }` lub `null` gdy anulowano |

#### 11.4 Import / eksport pliku

- Format pliku: JSON z filtrem rozszerzeń `.json`
- **Eksport** — domyślna nazwa pliku: `<sanitized-name>.json`; znaki niedozwolone w nazwie pliku (`\ / : * ? " < > |`) zastępowane są znakiem `_`
- **Import** — po parsowaniu JSON weryfikowany jest kształt obiektu: musi zawierać pola `name` (string), `createdAt` i `data`; nieprawidłowa struktura skutkuje zwróceniem `{ record: null, rawData: <parsed> }`

#### 11.5 Wymagane uprawnienia Tauri

Deklarowane w `src-tauri/capabilities/default.json`:

| Plugin   | Zakres uprawnień                                                                           |
| -------- | ------------------------------------------------------------------------------------------ |
| `store`  | Zapis i odczyt lokalnego store                                                             |
| `dialog` | Systemowe dialogi otwarcia i zapisu pliku                                                  |
| `fs`     | Odczyt i zapis plików JSON; scope: `$DOCUMENT`, `$DOWNLOAD`, `$DESKTOP`, `$HOME/**/*.json` |

---

### 12. Logika filtrowania i sortowania

Operacje wykonywane przez computed signal `filtered()` w następującej kolejności:

1. **Filtr wyszukiwania:** tekst z pola `search` sprawdzany jako substring (case-insensitive) w `name`
2. **Sortowanie:** według wybranej opcji z pola `sortBy` (kierunek — patrz sekcja 3.1)

Computed signal `filterCount(id)` wyznacza liczniki zakładek niezależnie od aktualnie aktywnego wyszukiwania (liczy zawsze po pełnej liście rekordów).

---

### 13. Uwagi implementacyjne (Angular)

- Widok implementowany jako standalone component z `ChangeDetectionStrategy.OnPush`.
- **Sygnały lokalne:** `search`, `filter`, `sortBy`, `openMenu`, `renameTarget`, `renameVal`, `deleteTarget`, `toast`
- **Computed signals:** `stats` (statystyki hero), `filtered` (lista po filtrach i sortowaniu)
- **Funkcje pomocnicze:**
  - `relativeTime(d: Date): string` — czas względny (sekcja 4.2)
  - `exactDate(d: Date): string` — pełna data i godzina w formacie `DD.MM.RRRR HH:mm`
  - `ltvOf(c): number` — oblicza `loanAmount / propertyValue * 100`
  - `periodOf(c): string` — formatuje okres jako `X lat` lub `X l. Y m-cy`
- **Obsługa klawiatury:** `@HostListener('document:keydown.escape')` — zamykanie modali i menu ⋯ zgodnie z priorytetem z sekcji 7.3
- **Zamykanie menu:** `@HostListener('document:mousedown')` — kliknięcie poza `.sc-menu-wrap` zamyka aktywne menu
- Wszystkie liczby w formacie polskim (`pl-PL`): separator tysięcy — spacja, separator dziesiętny — przecinek
