# Specyfikacja techniczna zakładki „Transze”

## 1. Kontekst zakładki

- Zakładka dostępna w kalkulatorze: `Transze`.
- Cel zakładki: rozbicie uruchomienia kredytu na wiele wypłat (transz) i uwzględnienie opłat uruchomienia transz.
- Efekt biznesowy:
  - kontrola harmonogramu uruchamiania kapitału,
  - wpływ na `Koszty okołokredytowe`,
  - wpływ na `Suma wszystkich płatności`, `Odsetki` i `Wysokość pierwszej raty`.

## 2. Elementy interaktywne

### 2.1. Pola i kontrolki

| # | Nazwa pola | Typ pola | Dostępne wartości | Tooltip (zaobserwowany) | Format danych | Jednostka | Walidacje (zaobserwowane) | Sposób wyliczania / wpływ |
|---|---|---|---|---|---|---|---|---|
| 1 | `1. Kwota` | `textbox` numeryczny (`type=tel`) | liczba dodatnia; domyślnie cała kwota kredytu | brak treści (`has-tooltip`, `data-original-title=null`) | liczba z separatorem tysięcy | `zł` | pole numeryczne; udział w walidacji sumy transz | `Suma transz = Σ kwota_transzy_i`; wartość wpływa na rozkład uruchomionego kapitału w czasie i dalsze naliczanie odsetek. |
| 2 | `2. Data` (pierwsza transza) | pole daty miesiąc-rok (`textbox` + selektor kalendarza) | domyślnie data uruchomienia kredytu | brak treści (`has-tooltip`, `data-original-title=null`) | `MMM RRRR` (np. `kwi 2026`) | data | dla pierwszej transzy pole jest zablokowane (`disabled`, `readonly`) | Data pierwszej transzy jest powiązana z datą uruchomienia kredytu z zakładki `Dane podstawowe`. |
| 3 | `1.2 Kwota` (kolejna transza) | `textbox` numeryczny (`type=tel`) | liczba dodatnia | brak dedykowanego tooltipa | liczba z separatorem tysięcy | `zł` | obserwowany komunikat: `Kwota musi być większa od zera.` (dla wartości `0`) | Wchodzi do sumy transz i przesuwa część uruchomienia kapitału na późniejszy okres. |
| 4 | `2.2 Data` (kolejna transza) | pole daty miesiąc-rok (`textbox` + selektor kalendarza) | miesiące następujące po pierwszej transzy (domyślnie kolejny miesiąc) | brak dedykowanego tooltipa | `MMM RRRR` | data | pole daty obsługiwane przez kontrolkę datepickera (wartość tylko miesiąc-rok) | Określa miesiąc uruchomienia dodatkowej transzy; wpływa na moment wejścia kapitału do salda i odsetek. |
| 5 | `3.2 Opłata za uruchomienie transzy` | `textbox` numeryczny (`type=tel`) | kwota opłaty dla dodatkowej transzy | brak dedykowanego tooltipa | liczba dziesiętna/kwotowa | `zł` | obserwowany limit: `Wysokość opłaty nie może być wyższa niż 1000 zł.` | Opłata jest dodawana do `Koszty okołokredytowe` i zwiększa łączny koszt kredytu. |
| 6 | `SUMA TRANSZ` | pole tylko do odczytu (`textbox`, `disabled`) | wartość wyliczana automatycznie | brak dedykowanego tooltipa | liczba z separatorem tysięcy | `zł` | walidacja globalna: `Suma transz musi być równa kwocie kredytu (...)` | Pole agregujące: `Σ kwot transz`; musi być równe `Kwocie kredytu` z zakładki `Dane podstawowe`. |

### 2.2. Przyciski akcji

| Nazwa | Tooltip (zaobserwowany) | Działanie | Walidacje (zaobserwowane) |
|---|---|---|---|
| `+` | brak | Dodaje kolejny wiersz transzy (`Kwota`, `Data`, opcjonalnie opłata uruchomienia). | Po dodaniu nowej transzy aktywuje się walidacja sumy transz i pól nowego wiersza. |
| `-` | brak | Usuwa wskazaną dodatkową transzę. | Po usunięciu następuje rekalkulacja sumy transz i wyników. |
| `Wyczyść dane` | brak | Czyści dane zakładki do stanu domyślnego (jedna transza = kwota kredytu). | Działa natychmiast, bez dodatkowego potwierdzenia w tej zakładce. |
| `Zapisz kalkulację` | brak | Zapisuje aktualną konfigurację kalkulacji do sekcji `Twoje kalkulacje`. | Brak inline-błędu dedykowanego dla przycisku; obowiązują walidacje pól formularza. |

## 3. Tabele i wykresy (obszar wynikowy współdzielony z kalkulatorem)

### 3.1. Tabele

#### Tabela: `Harmonogram spłaty kredytu`

- Kolumny:
  - `Data`
  - `Rata`
  - `Kapitał`
  - `Odsetki`
  - `Nadpłaty`
  - `Pozostało do spłaty`
  - `Koszty okołokredytowe`
- Prezentowane wartości:
  - agregacja roczna (widok zwijany/rozwijany),
  - po rozwinięciu: szczegóły okresowe.
- Sposób wyliczania (funkcjonalnie):
  - `Rata = Kapitał + Odsetki + ewentualne koszty/zdarzenia`,
  - `Odsetki_t` naliczane od bieżącego salda zadłużenia,
  - `Pozostało do spłaty_t = Pozostało do spłaty_{t-1} - Kapitał_t - Nadpłaty_t`,
  - koszty uruchomienia transz z zakładki `Transze` zasilają kolumnę `Koszty okołokredytowe`.

### 3.2. Wykresy

Wyniki zakładki `Transze` aktualizują wykresy w sekcji wynikowej:

1. `Struktura wszystkich płatności`
   - Typ: wykres udziałów (kołowy/donut w UI).
   - Dane: udział `Odsetek`, `Kosztów okołokredytowych`, `Kapitału`, `Nadpłat` w łącznej płatności.
   - Logika: wartości zsumowane z całego harmonogramu.

2. `Struktura pierwszej raty`
   - Typ: wykres udziałów (kołowy/donut w UI).
   - Dane: udział kapitału i odsetek (oraz kosztów, jeśli przypadają) w pierwszej racie.
   - Logika: dane z pierwszego okresu harmonogramu.

3. `Harmonogram spłaty kredytu` (wykres czasowy)
   - Typ: wykres szeregu czasowego (warstwowy/obszarowy w UI).
   - Dane: serie `Odsetki`, `Koszty okołokredytowe`, `Kapitał`, `Nadpłaty`, `Pozostało do spłaty`.
   - Logika: wartości miesięczne/okresowe z harmonogramu po każdej rekalkulacji formularza.

## 4. Reguły biznesowe i walidacyjne zakładki `Transze`

1. Reguła sumy transz:
   - `Σ(kwota_transzy_i) == kwota_kredytu`.
   - Niespełnienie reguły oznacza błąd formularza (`is-invalid`) i komunikat o nadwyżce/niedoborze.

2. Reguła kolejności uruchomienia:
   - pierwsza transza jest powiązana z datą uruchomienia kredytu,
   - kolejne transze są definiowane przez użytkownika (kwota + data).

3. Reguła opłaty uruchomienia transzy:
   - opłata dodatkowej transzy podlega walidacji kwotowej,
   - obserwowany limit: maksymalnie `1000 zł` dla pola opłaty,
   - opłata zwiększa `Koszty okołokredytowe` i tym samym koszt całkowity.

4. Reguła rekalkulacji:
   - każda zmiana pól zakładki `Transze` powoduje przeliczenie sekcji wynikowej (podsumowania, wykresów, harmonogramu).

## 5. Zaobserwowane scenariusze referencyjne

### 5.1. Stan bazowy (1 transza, bez opłat)

- `Suma wszystkich płatności`: `863 736,92 zł`
- `Odsetki`: `463 736,92 zł`
- `Koszty okołokredytowe`: `0,00 zł`
- `Wysokość pierwszej raty`: `3 598,90 zł`

### 5.2. Scenariusz 2 transz + opłata uruchomienia

- Przykład: transze `300 000 zł` + `100 000 zł`, opłata uruchomienia `1 000 zł`.
- Efekt zaobserwowany:
  - `Koszty okołokredytowe`: `1 000,00 zł`
  - `Suma wszystkich płatności`: `864 677,79 zł`
  - `Odsetki`: `463 677,79 zł`
  - `Wysokość pierwszej raty`: `3 604,30 zł`

## 6. Uwagi implementacyjne (odtworzenie w Angularze)

- Zakładkę modelować jako listę transz (`FormArray`) z rekordem:
  - `amount: number`,
  - `date: MonthYear`,
  - `disbursementFee?: number` (dla transz dodatkowych).
- Dodać walidatory:
  - `sum(transze.amount) === loanAmount`,
  - `amount > 0` dla transz dodatkowych,
  - `disbursementFee <= 1000` (zgodnie z obserwowanym zachowaniem UI).
- Każda zmiana formularza powinna emitować rekalkulację wyników.
- Formatowanie:
  - kwoty: locale `pl-PL` (`1 234 567,89`),
  - daty: `MMM RRRR`.
- W badanym UI ikony tooltipów są obecne, ale bez treści; przy odtworzeniu warto jawnie zdefiniować zawartość tooltipów.
