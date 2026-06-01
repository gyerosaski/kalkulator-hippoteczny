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

| #   | Nazwa pola                           | Typ pola                                                | Dostępne wartości                                                     | Tooltip (zaobserwowany)                                 | Format danych                | Jednostka | Walidacje (zaobserwowane)                                                                                  | Sposób wyliczania / wpływ                                                                                                             |
| --- | ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `1. Kwota`                           | `textbox` numeryczny (`type=tel`)                       | liczba dodatnia; domyślnie cała kwota kredytu                         | brak treści (`has-tooltip`, `data-original-title=null`) | liczba z separatorem tysięcy | `zł`      | pole numeryczne; udział w walidacji sumy transz                                                            | `Suma transz = Σ kwota_transzy_i`; wartość wpływa na rozkład uruchomionego kapitału w czasie i dalsze naliczanie odsetek.             |
| 2   | `2. Data` (pierwsza transza)         | pole daty miesiąc-rok — tylko do odczytu                | zawsze równa dacie uruchomienia kredytu z sekcji `Dane podstawowe`    | brak treści                                             | `MMM RRRR` (np. `kwi 2026`)  | data      | pole zablokowane (`disabled`); aktualizuje się automatycznie przy zmianie pola `Data uruchomienia kredytu` | Data pierwszej transzy jest trwale zsynchronizowana z polem `startDate` z sekcji `Dane podstawowe`; użytkownik nie może jej edytować. |
| 3   | `1.2 Kwota` (kolejna transza)        | `textbox` numeryczny (`type=tel`)                       | liczba dodatnia                                                       | brak dedykowanego tooltipa                              | liczba z separatorem tysięcy | `zł`      | obserwowany komunikat: `Kwota musi być większa od zera.` (dla wartości `0`)                                | Wchodzi do sumy transz i przesuwa część uruchomienia kapitału na późniejszy okres.                                                    |
| 4   | `2.2 Data` (kolejna transza)         | pole daty miesiąc-rok (`textbox` + selektor kalendarza) | miesiące następujące po pierwszej transzy (domyślnie kolejny miesiąc) | brak dedykowanego tooltipa                              | `MMM RRRR`                   | data      | pole daty obsługiwane przez kontrolkę datepickera (wartość tylko miesiąc-rok)                              | Określa miesiąc uruchomienia dodatkowej transzy; wpływa na moment wejścia kapitału do salda i odsetek.                                |
| 5   | `3.2 Opłata za uruchomienie transzy` | `textbox` numeryczny (`type=tel`)                       | kwota opłaty dla dodatkowej transzy                                   | brak dedykowanego tooltipa                              | liczba dziesiętna/kwotowa    | `zł`      | obserwowany limit: `Wysokość opłaty nie może być wyższa niż 1000 zł.`                                      | Opłata jest dodawana do `Koszty okołokredytowe` i zwiększa łączny koszt kredytu.                                                      |
| 6   | `SUMA TRANSZ`                        | pole tylko do odczytu (`textbox`, `disabled`)           | wartość wyliczana automatycznie                                       | brak dedykowanego tooltipa                              | liczba z separatorem tysięcy | `zł`      | walidacja globalna: `Suma transz musi być równa kwocie kredytu (...)`                                      | Pole agregujące: `Σ kwot transz`; musi być równe `Kwocie kredytu` z sekcji `Dane podstawowe`.                                         |

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
   - niespełnienie reguły oznacza błąd formularza i komunikat o nadwyżce/niedoborze.

2. Reguła kolejności uruchomienia:
   - data pierwszej transzy jest zawsze równa dacie uruchomienia kredytu i aktualizuje się automatycznie przy jej zmianie; pole jest zablokowane dla użytkownika,
   - kolejne transze są definiowane przez użytkownika (kwota + data + opłata za uruchomienie transzy).
   - data każdej kolejnej transzy musi być większa od daty transzy poprzedniej

3. Reguła opłaty uruchomienia transzy:
   - opłata zwiększa `Koszty okołokredytowe` i tym samym koszt całkowity.

4. Reguła kolejności spłaty kapitału:
   - gdy aktywnych jest więcej niż jedna transza, pole `Początek spłat kapitału` z sekcji `Dane podstawowe` musi wskazywać miesiąc ściśle późniejszy niż data ostatniej (najpóźniejszej) transzy,
   - walidator krzyżowy `capitalBeforeLastTranche` (na głównym `FormGroup`) zgłasza błąd, gdy `capitalStartDate <= max(daty transz)`,
   - komunikat o błędzie wyświetlany jest w `ResultsErrorsComponent` w sekcji `Dane podstawowe`.
