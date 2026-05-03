# Specyfikacja techniczna sekcji „Transze”

## 1. Kontekst sekcji

- Zakładka dostępna w kalkulatorze: `Transze`.
- Cel sekcji: rozbicie uruchomienia kredytu na wiele wypłat (transz) i uwzględnienie opłat uruchomienia transz.
- Efekt biznesowy:
  - kontrola harmonogramu uruchamiania kapitału,
  - wpływ na `Koszty okołokredytowe`,
  - wpływ na `Suma wszystkich płatności`, `Odsetki` i `Wysokość pierwszej raty`.

## 2. Elementy interaktywne

### 2.1. Pola i kontrolki

| #   | Nazwa pola                           | Typ pola                                                | Dostępne wartości                                                     | Tooltip (zaobserwowany)                                 | Format danych                | Jednostka | Walidacje (zaobserwowane)                                                     | Sposób wyliczania / wpływ                                                                                                 |
| --- | ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------- | --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | `1. Kwota`                           | `textbox` numeryczny (`type=tel`)                       | liczba dodatnia; domyślnie cała kwota kredytu                         | brak treści (`has-tooltip`, `data-original-title=null`) | liczba z separatorem tysięcy | `zł`      | pole numeryczne; udział w walidacji sumy transz                               | `Suma transz = Σ kwota_transzy_i`; wartość wpływa na rozkład uruchomionego kapitału w czasie i dalsze naliczanie odsetek. |
| 2   | `2. Data` (pierwsza transza)         | pole daty miesiąc-rok (`textbox` + selektor kalendarza) | domyślnie data uruchomienia kredytu                                   | brak treści (`has-tooltip`, `data-original-title=null`) | `MMM RRRR` (np. `kwi 2026`)  | data      | dla pierwszej transzy pole jest zablokowane (`disabled`, `readonly`)          | Data pierwszej transzy jest powiązana z datą uruchomienia kredytu z sekcji `Dane podstawowe`.                             |
| 3   | `1.2 Kwota` (kolejna transza)        | `textbox` numeryczny (`type=tel`)                       | liczba dodatnia                                                       | brak dedykowanego tooltipa                              | liczba z separatorem tysięcy | `zł`      | obserwowany komunikat: `Kwota musi być większa od zera.` (dla wartości `0`)   | Wchodzi do sumy transz i przesuwa część uruchomienia kapitału na późniejszy okres.                                        |
| 4   | `2.2 Data` (kolejna transza)         | pole daty miesiąc-rok (`textbox` + selektor kalendarza) | miesiące następujące po pierwszej transzy (domyślnie kolejny miesiąc) | brak dedykowanego tooltipa                              | `MMM RRRR`                   | data      | pole daty obsługiwane przez kontrolkę datepickera (wartość tylko miesiąc-rok) | Określa miesiąc uruchomienia dodatkowej transzy; wpływa na moment wejścia kapitału do salda i odsetek.                    |
| 5   | `3.2 Opłata za uruchomienie transzy` | `textbox` numeryczny (`type=tel`)                       | kwota opłaty dla dodatkowej transzy                                   | brak dedykowanego tooltipa                              | liczba dziesiętna/kwotowa    | `zł`      | obserwowany limit: `Wysokość opłaty nie może być wyższa niż 1000 zł.`         | Opłata jest dodawana do `Koszty okołokredytowe` i zwiększa łączny koszt kredytu.                                          |
| 6   | `SUMA TRANSZ`                        | pole tylko do odczytu (`textbox`, `disabled`)           | wartość wyliczana automatycznie                                       | brak dedykowanego tooltipa                              | liczba z separatorem tysięcy | `zł`      | walidacja globalna: `Suma transz musi być równa kwocie kredytu (...)`         | Pole agregujące: `Σ kwot transz`; musi być równe `Kwocie kredytu` z sekcji `Dane podstawowe`.                             |

### 2.2. Przyciski akcji

| Nazwa               | Tooltip (zaobserwowany) | Działanie                                                                         | Walidacje (zaobserwowane)                                                          |
| ------------------- | ----------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `+`                 | brak                    | Dodaje kolejny wiersz transzy (`Kwota`, `Data`, opcjonalnie opłata uruchomienia). | Po dodaniu nowej transzy aktywuje się walidacja sumy transz i pól nowego wiersza.  |
| `-`                 | brak                    | Usuwa wskazaną dodatkową transzę.                                                 | Po usunięciu następuje rekalkulacja sumy transz i wyników.                         |
| `Wyczyść dane`      | brak                    | Czyści dane sekcji do stanu domyślnego (jedna transza = kwota kredytu).           | Działa natychmiast, bez dodatkowego potwierdzenia w tej zakładce.                  |
| `Zapisz kalkulację` | brak                    | Zapisuje aktualną konfigurację kalkulacji do sekcji `Twoje kalkulacje`.           | Brak inline-błędu dedykowanego dla przycisku; obowiązują walidacje pól formularza. |

## 3. Reguły biznesowe i walidacyjne sekcji `Transze`

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
   - każda zmiana pól sekcji `Transze` powoduje przeliczenie sekcji wynikowej (podsumowania, wykresów, harmonogramu).

## 4. Zaobserwowane scenariusze referencyjne

### 4.1. Stan bazowy (1 transza, bez opłat)

- `Suma wszystkich płatności`: `863 736,92 zł`
- `Odsetki`: `463 736,92 zł`
- `Koszty okołokredytowe`: `0,00 zł`
- `Wysokość pierwszej raty`: `3 598,90 zł`

### 4.2. Scenariusz 2 transz + opłata uruchomienia

- Przykład: transze `300 000 zł` + `100 000 zł`, opłata uruchomienia `1 000 zł`.
- Efekt zaobserwowany:
  - `Koszty okołokredytowe`: `1 000,00 zł`
  - `Suma wszystkich płatności`: `864 677,79 zł`
  - `Odsetki`: `463 677,79 zł`
  - `Wysokość pierwszej raty`: `3 604,30 zł`

## 5. Uwagi implementacyjne (odtworzenie w Angularze)

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
