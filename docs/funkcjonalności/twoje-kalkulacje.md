### Dokumentacja funkcjonalna widoku „Twoje kalkulacje”

### 1. Zakres

- Widok: „Twoje kalkulacje”.
- Cel: przeglądanie, wyszukiwanie, sortowanie i zarządzanie (wczytanie, zapisanie zmian, zmiana nazwy,
  duplikacja, eksport, usunięcie) zapisanymi kalkulacjami hipotecznymi przechowywanymi lokalnie.

Kalkulacje są zapisywane lokalnie na dysku i mogą być eksportowane/importowane jako JSON. Szczegóły
techniczne warstwy persystencji — `docs/technikalia/persystencja-kalkulacji.md`.

---

### 2. Sekcja nagłówkowa (Hero)

#### 2.1 Statystyki

| #   | Etykieta          | Źródło wartości                                                                |
| --- | ----------------- | ------------------------------------------------------------------------------ |
| 1   | `zapisanych`      | łączna liczba zapisanych kalkulacji                                            |
| 2   | `ostatnia zmiana` | czas względny ostatnio zmodyfikowanej kalkulacji (np. `3 min temu`, `wczoraj`) |

#### 2.2 Przyciski akcji globalnych

| Przycisk           | Działanie                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `Nowa kalkulacja`  | przejście do kalkulatora z pustym formularzem                                                |
| `Importuj`         | import kalkulacji z pliku JSON — pojedynczej lub tablicy (dialog systemowy — patrz sekcja 9) |
| `Porównaj wybrane` | placeholder UI — nie wdrożone w bieżącej wersji                                              |

---

### 3. Pasek narzędzi

| Element             | Typ                       | Działanie                                                                                         |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| Pole wyszukiwania   | tekst                     | filtruje po nazwie (bez rozróżniania wielkości liter, fragment); przycisk `×` czyści wyszukiwanie |
| Sortowanie          | lista                     | 5 opcji — patrz tabela poniżej                                                                    |
| Kierunek sortowania | przycisk (ikona strzałki) | odwraca kierunek; strzałka w górę = rosnąco, w dół = malejąco                                     |

#### 3.1 Opcje sortowania

| Etykieta               | Kierunek domyślny     |
| ---------------------- | --------------------- |
| ostatnio zmodyfikowane | malejąco              |
| data utworzenia        | malejąco              |
| nazwa                  | rosnąco (locale `pl`) |
| kwota kredytu          | malejąco              |
| wysokość raty          | rosnąco               |

Zmiana kryterium sortowania resetuje kierunek do domyślnego dla tego kryterium; przycisk obok odwraca
kierunek. Kryterium i kierunek przeżywają przełączanie widoków w ramach sesji.

---

### 4. Tabela kalkulacji — kolumny

| #   | Kolumna         | Zawartość                                                                                                                   | Format                                                          |
| --- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | `Nazwa`         | nazwa kalkulacji; badge `wczytana` gdy aktualnie załadowana; badge `zmodyfikowana` gdy bieżący stan różni się od wczytanego | tekst                                                           |
| 2   | `Kwota · LTV`   | kwota kredytu + wartość nieruchomości w podwierszu + LTV%; LTV wyróżnione (czerwone) gdy `> 80%`                            | PLN bez miejsc; LTV `X %`                                       |
| 3   | `Okres`         | liczba lat i miesięcy + typ raty w podwierszu                                                                               | `X lat` lub `X l. Y m-cy`; badge `rata równa` / `rata malejąca` |
| 4   | `Oproc.`        | łączna stopa; w podwierszu `Wskaźnik referencyjny X,XX + marża X,XX` (stopa zmienna) lub `stała`                            | 2 miejsca, `%`                                                  |
| 5   | `Pierwsza rata` | pierwsza rata miesięczna                                                                                                    | PLN, 2 miejsca                                                  |
| 6   | `Odsetki`       | suma odsetek przez cały okres                                                                                               | PLN bez miejsc                                                  |
| 7   | `Zmodyfikowano` | czas względny; po najechaniu — pełna data i godzina; w podwierszu data bez godziny                                          | `DD.MM.RRRR`                                                    |
| 8   | `Akcje`         | przycisk `Wczytaj` + menu `⋯`                                                                                               | —                                                               |

#### 4.1 Wyróżnienie aktywnego wiersza

Wiersz odpowiadający aktualnie wczytanej kalkulacji otrzymuje lewy kolorowy pasek i badge `wczytana`.
Jeśli formularz został zmodyfikowany po wczytaniu, obok pojawia się dodatkowo badge `zmodyfikowana`.

#### 4.2 Wykrywanie modyfikacji

Po wczytaniu kalkulacji aplikacja zapamiętuje jej stan. Dowolna późniejsza zmiana parametrów formularza
oznacza kalkulację jako „zmodyfikowaną”; stan ten wraca do „niezmodyfikowanej” po zapisaniu zmian pod tą
samą nazwą oraz przy utworzeniu nowej kalkulacji.

#### 4.3 Czas względny

| Zakres różnicy czasu | Tekst          |
| -------------------- | -------------- |
| < 60 s               | `przed chwilą` |
| < 1 godz.            | `X min temu`   |
| < 24 godz.           | `X godz. temu` |
| < 48 godz.           | `wczoraj`      |
| < 7 dni              | `X dni temu`   |
| < 30 dni             | `X tyg. temu`  |
| ≥ 30 dni             | `X mies. temu` |

---

### 5. Stan pusty

Wyświetlany, gdy po zastosowaniu filtrów i wyszukiwania nie pozostaje żaden rekord.

| Element                   | Treść                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------ |
| Ikona                     | stylizowana ikona kalendarza                                                         |
| Tytuł                     | `Brak pasujących kalkulacji`                                                         |
| Opis                      | `Zmień filtry albo wyczyść pole szukania, aby zobaczyć wszystkie zapisane warianty.` |
| Przycisk `Wyczyść filtry` | widoczny tylko gdy aktywny filtr lub niepuste pole wyszukiwania; zeruje oba          |

---

### 6. Akcje na wierszu

#### 6.1 Przycisk `Wczytaj`

- Ładuje pełny zestaw parametrów kalkulacji do formularza kalkulatora.
- Po wczytaniu wyświetla toast: `Wczytano „{nazwa}" do kalkulatora`.

#### 6.2 Menu `⋯` (więcej akcji)

| Pozycja         | Działanie                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Zapisz zmiany` | nadpisuje rekord aktualnym stanem formularza; widoczna tylko gdy kalkulacja jest wczytana **i** zmodyfikowana; toast: `Zapisano zmiany w „{nazwa}"` |
| `Zmień nazwę`   | otwiera modal zmiany nazwy (sekcja 7.1)                                                                                                             |
| `Duplikuj`      | tworzy kopię z nową nazwą (z sufiksem); toast: `Utworzono kopię „{nazwa}"`                                                                          |
| `Eksportuj`     | rozwija podmenu z formatami eksportu (obecnie `JSON`); eksportuje rekord do pliku; toast: `Wyeksportowano kalkulację „{nazwa}"`                     |
| `Usuń`          | otwiera modal potwierdzenia usunięcia (sekcja 7.2)                                                                                                  |

Przy zapisaniu zmian zachowywana jest oryginalna data utworzenia, a aktualizowana data modyfikacji.

#### 6.3 Zachowanie menu ⋯

- Otwarcie menu zamyka każde inne otwarte menu.
- Kliknięcie poza obszarem menu zamyka menu.
- Klawisz `Escape` zamyka menu (jeśli nie jest aktywny żaden modal).

---

### 7. Okna modalne

#### 7.1 Modal zmiany nazwy

| Element               | Zachowanie                                                |
| --------------------- | --------------------------------------------------------- |
| Pole nazwy            | wypełnione aktualną nazwą                                 |
| Przycisk `Zapisz`     | nieaktywny gdy pole puste LUB nazwa identyczna z aktualną |
| `Enter`               | zatwierdza                                                |
| `Escape` / klik w tło | zamyka bez zapisu                                         |
| Toast po zapisie      | `Zmieniono nazwę na „{nowa nazwa}"`                       |

#### 7.2 Modal potwierdzenia usunięcia

| Element                          | Zachowanie                                               |
| -------------------------------- | -------------------------------------------------------- |
| Podsumowanie                     | kwota kredytu · okres · oprocentowanie · data utworzenia |
| Przycisk `Usuń kalkulację`       | destrukcyjny (czerwony); trwale usuwa rekord             |
| `Anuluj` / `Escape` / klik w tło | zamyka bez usunięcia                                     |
| Toast po usunięciu               | `Usunięto kalkulację „{nazwa}"`                          |

#### 7.3 Priorytet klawisza Escape

1. Aktywny modal zmiany nazwy → zamknij go.
2. W przeciwnym razie aktywny modal usunięcia → zamknij go.
3. W przeciwnym razie → zamknij menu ⋯.

---

### 8. Toast (powiadomienie)

- Wyświetlany po każdej akcji: wczytanie, zapisanie zmian, zmiana nazwy, duplikacja, usunięcie.
- Znika automatycznie po ~3,2 s.
- Nowe powiadomienie natychmiast zastępuje poprzednie.

---

### 9. Stopka i import/eksport

| Element                                 | Treść                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Licznik                                 | `Wyświetlono X z Y kalkulacji · dane przechowywane lokalnie` + ścieżka pliku                                           |
| Przycisk-dropdown `Eksportuj wszystkie` | rozwija listę formatów (obecnie `JSON`); eksportuje wszystkie rekordy do jednego pliku; nieaktywny gdy brak kalkulacji |

- **Eksport** — domyślna nazwa pliku to nazwa kalkulacji; znaki niedozwolone w nazwie pliku zastępowane
  są znakiem `_`.
- **Import** — obsługiwane są trzy kształty pliku JSON: pojedynczy rekord, tablica rekordów oraz plik
  z eksportu „wszystkich”. Przy kolizji nazwy z istniejącą kalkulacją rekord jest importowany jako kopia
  (sufiks „ — kopia”, „ — kopia (2)”, …) — nic nie jest nadpisywane.
