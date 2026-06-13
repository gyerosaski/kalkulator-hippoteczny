# Specyfikacja funkcjonalna sekcji „Transze”

## 1. Kontekst sekcji

- Sekcja: „Transze”.
- Cel: rozbicie uruchomienia kredytu na wiele wypłat (transz) i uwzględnienie opłat za uruchomienie transz.
- Efekt biznesowy:
  - kontrola harmonogramu uruchamiania kapitału,
  - wpływ na „Koszty okołokredytowe”,
  - wpływ na „Suma wszystkich płatności”, „Odsetki” i „Wysokość pierwszej raty”.

## 2. Pola i akcje

### 2.1. Pola

| #   | Nazwa pola                       | Wartości                                                  | Format / jednostka              | Reguły                                                       | Wpływ                                                                                           |
| --- | -------------------------------- | --------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | `Kwota` (pierwsza transza)       | liczba dodatnia; domyślnie cała kwota kredytu             | `zł`                            | udział w sumie transz                                        | rozkład uruchomionego kapitału w czasie i naliczanie odsetek                                    |
| 2   | `Data` (pierwsza transza)        | zawsze równa dacie uruchomienia kredytu                   | miesiąc i rok, tylko do odczytu | aktualizuje się automatycznie przy zmianie daty uruchomienia | data pierwszej transzy jest trwale zsynchronizowana z datą uruchomienia; nie można jej edytować |
| 3   | `Kwota` (kolejna transza)        | liczba dodatnia                                           | `zł`                            | kwota musi być większa od zera                               | wchodzi do sumy transz i przesuwa część uruchomienia kapitału na późniejszy okres               |
| 4   | `Data` (kolejna transza)         | miesiące po pierwszej transzy (domyślnie kolejny miesiąc) | miesiąc i rok                   | musi być późniejsza niż data poprzedniej transzy             | moment wejścia kapitału do salda i odsetek                                                      |
| 5   | `Opłata za uruchomienie transzy` | kwota opłaty                                              | `zł`                            | nie wyższa niż 1000 zł                                       | dodawana do „Koszty okołokredytowe” i zwiększa łączny koszt kredytu                             |
| 6   | `SUMA TRANSZ`                    | wartość wyliczana automatycznie                           | `zł`, tylko do odczytu          | musi być równa kwocie kredytu                                | suma kwot transz                                                                                |

> Pierwsza transza z definicji nie ma opłaty za uruchomienie — to celowa reguła domenowa.

### 2.2. Akcje

| Nazwa               | Działanie                                                                         |
| ------------------- | --------------------------------------------------------------------------------- |
| `+`                 | dodaje kolejną transzę (kwota, data, opcjonalnie opłata za uruchomienie)          |
| `−`                 | usuwa wskazaną dodatkową transzę                                                  |
| `Zapisz kalkulację` | zapisuje aktualną konfigurację (patrz `docs/funkcjonalności/twoje-kalkulacje.md`) |

## 3. Reguły biznesowe i walidacyjne

1. **Suma transz:** `Σ(kwota_transzy_i) = kwota_kredytu`. Niespełnienie reguły to błąd formularza
   z komunikatem o nadwyżce/niedoborze.
2. **Kolejność uruchomienia:**
   - data pierwszej transzy jest zawsze równa dacie uruchomienia kredytu i aktualizuje się automatycznie
     przy jej zmianie; pole jest zablokowane dla użytkownika,
   - kolejne transze definiuje użytkownik (kwota + data + opłata za uruchomienie),
   - data każdej kolejnej transzy musi być większa od daty transzy poprzedniej.
3. **Opłata za uruchomienie:** zwiększa „Koszty okołokredytowe” i tym samym koszt całkowity.
4. **Kolejność spłaty kapitału:** gdy aktywna jest więcej niż jedna transza, „Początek spłat kapitału”
   (sekcja „Dane podstawowe”) musi wskazywać miesiąc ściśle późniejszy niż data ostatniej transzy.
   Niespełnienie reguły to błąd prezentowany w sekcji „Dane podstawowe”.
