### Dokumentacja funkcjonalna zakładki `Nadpłaty`

### 1. Zakres analizy

- Aplikacja: `Kalkulator kredytu hipotecznego`.
- Analizowana zakładka: `Nadpłaty`.
- Cel zakładki: modelowanie scenariuszy nadpłacania kredytu oraz prowizji za wcześniejszą spłatę i pokazanie wpływu na harmonogram oraz podsumowanie kosztów.

### 2. Elementy interaktywne

| #   | Nazwa pola                                         | Typ pola                                  | Dostępne wartości                                   | Format danych                                                      | Jednostka | Walidacje (zaobserwowane)                                              | Sposób wyliczania / wpływ                                                                                       |
| --- | -------------------------------------------------- | ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ | --------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | `Jak często nadpłacasz?`                           | `combobox`                                | `jednorazowo`, `co miesiąc`, `co kwartał`, `co rok` | wybór z listy                                                      | -         | wartość obowiązkowa (domyślna: `jednorazowo`)                          | Definiuje częstotliwość zdarzeń nadpłat; wpływa na iterację nadpłat w harmonogramie.                            |
| 2   | `Data nadpłaty`                                    | pole daty (`textbox` + selektor miesiąca) | zakres `od` / `do` (miesiąc-rok)                    | `MMM RRRR` (np. `maj 2026`)                                        | data      | wejście miesiąc-rok; brak komunikatów błędu w analizowanym scenariuszu | Okres obowiązywania reguły nadpłaty; ogranicza miesiące/okresy, w których naliczana jest nadpłata.              |
| 3   | `Kwota nadpłaty`                                   | `textbox` numeryczny                      | wartość liczbowa dodatnia lub `0,00`                | liczba dziesiętna z przecinkiem, automatyczne formatowanie tysięcy | `zł`      | maska numeryczna (2 miejsca po przecinku)                              | Kwota dodawana do spłaty kapitału zgodnie z częstotliwością/okresem z pól 1–2.                                  |
| 4   | `Skutek nadpłaty`                                  | `combobox`                                | `niższa rata`, `skrócenie okresu`                   | wybór z listy                                                      | -         | wartość obowiązkowa (domyślnie: `niższa rata`)                         | Ustala sposób rekalkulacji harmonogramu po nadpłacie (zmiana raty vs skrócenie okresu).                         |
| 5   | `Chcę co miesiąc płacić do banku ratę w wysokości` | `textbox` numeryczny                      | wartość liczbowa dodatnia lub `0,00`                | liczba dziesiętna z przecinkiem, automatyczne formatowanie tysięcy | `zł`      | maska numeryczna (2 miejsca po przecinku)                              | Definiuje docelowy miesięczny poziom płatności, na podstawie którego wyznaczane są nadpłaty w okresie z pola 6. |
| 6   | `Data nadpłaty` (dla raty docelowej)               | pola daty `od` / `do`                     | miesiąc-rok od/do                                   | `MMM RRRR`                                                         | data      | wejście miesiąc-rok                                                    | Ogranicza okres, dla którego aktywny jest mechanizm z pola 5.                                                   |
| 7   | `Skutek nadpłaty` (dla raty docelowej)             | `combobox`                                | `niższa rata`, `skrócenie okresu`                   | wybór z listy                                                      | -         | wartość obowiązkowa (domyślnie: `niższa rata`)                         | Definiuje mechanikę rekalkulacji harmonogramu dla nadpłat liczonych od raty docelowej.                          |
| 8   | `Wysokość prowizji za wcześniejszą spłatę`         | `textbox` numeryczny                      | wartość procentowa (domyślnie `0,00`)               | liczba dziesiętna z przecinkiem                                    | `%`       | maska numeryczna (2 miejsca po przecinku)                              | Procent naliczany od nadpłaty/ wcześniejszej spłaty w okresie obowiązywania prowizji.                           |
| 9   | `Bank pobiera prowizję do`                         | pole daty                                 | miesiąc-rok                                         | `MMM RRRR`                                                         | data      | wejście miesiąc-rok                                                    | Data graniczna, do której prowizja z pola 8 jest uwzględniana w kosztach okołokredytowych.                      |

### 3. Przyciski akcji

| Nazwa               | Działanie                                                                                            | Walidacje (zaobserwowane)                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `+` (przy polu 4)   | Akcja rozszerzania/dodawania reguły nadpłaty (UI przewidziane do budowania dodatkowych scenariuszy). | Brak komunikatu błędu w analizowanym scenariuszu; widok podstawowy zawiera jedną grupę pól 1–9. |
| `Wyczyść dane`      | Czyści wartości w zakładce `Nadpłaty` do wartości domyślnych (m.in. kwoty/prowizja do `0,00`).       | Działa natychmiast bez dodatkowego potwierdzenia.                                               |
| `Zapisz kalkulację` | Zapisuje aktualny scenariusz kalkulacji (integracja z sekcją `Twoje kalkulacje`).                    | Brak walidacji błędów prezentowanych inline w analizowanym scenariuszu.                         |

### 4. Zależności obliczeniowe i reguły funkcjonalne

- Zmiana któregokolwiek pola w zakładce `Nadpłaty` wpływa na:
  - `Nadpłaty` w tabeli harmonogramu,
  - `Pozostało do spłaty`,
  - `Suma wszystkich płatności`,
  - `Koszty okołokredytowe` (w szczególności prowizja za wcześniejszą spłatę).
- Tryb skutku nadpłaty:
  - `niższa rata` — model dąży do obniżenia kolejnych rat przy zachowaniu okresu.
  - `skrócenie okresu` — model dąży do utrzymania rat i skracania czasu spłaty.
- Reguła prowizji:
  - Prowizja naliczana tylko do daty granicznej (`Bank pobiera prowizję do`).

### 5. Techniczny wpływ nadpłat na koszty kredytu

#### 5.1 Model miesięczny (uogólnienie)

- Dla miesiąca `t`:
  - `odsetki_t = saldo_{t-1} * stopa_miesieczna_t`
  - `kapitał_raty_t = rata_t - odsetki_t`
  - `nadpłata_t` wynika z reguł z pól 1–7
  - `saldo_t = saldo_{t-1} - kapitał_raty_t - nadpłata_t`
- Wniosek: każda dodatnia `nadpłata_t` obniża `saldo_t`, więc w kolejnych okresach maleje baza naliczania odsetek.

#### 5.2 Wpływ na koszt odsetkowy

- Całkowity koszt odsetek:
  - `Odsetki_total = Σ odsetki_t`
- Ponieważ `odsetki_t` liczone są od aktualnego salda, nadpłaty przesuwają harmonogram w stronę:
  - niższych odsetek w kolejnych miesiącach,
  - szybszego spadku `Pozostało do spłaty`.

#### 5.3 Wpływ trybu `Skutek nadpłaty`

- `niższa rata`:
  - po nadpłacie system rekalkuluje ratę dla pozostałego okresu,
  - efekt: niższy cashflow miesięczny, oszczędność odsetkowa zwykle mniejsza niż przy skróceniu okresu.
- `skrócenie okresu`:
  - po nadpłacie system utrzymuje zbliżoną ratę i redukuje liczbę okresów,
  - efekt: zwykle większa oszczędność odsetek (krótszy czas naliczania).

#### 5.4 Prowizja za wcześniejszą spłatę

- Dla okresów spełniających warunek daty (`t <= data_graniczna_prowizji`):
  - `prowizja_t = nadpłata_t * stawka_prowizji`
- Łączny koszt prowizji:
  - `Prowizja_total = Σ prowizja_t`
- Nadpłata obniża odsetki, ale może chwilowo zwiększyć koszty okołokredytowe przez prowizję. Finalny efekt kosztowy:
  - `Koszt_całkowity = Odsetki_total + Koszty_okołokredytowe_total`

#### 5.5 Reguła „docelowej raty miesięcznej”

- Pole 5 w połączeniu z 6–7 działa jak strategia utrzymania zadanej płatności miesięcznej.
- Dla miesięcy aktywnego zakresu:
  - `nadpłata_t = max(0, rata_docelowa - rata_wynikająca_z_harmonogramu_t)`
- Technicznie oznacza to automatyczne dopisywanie nadpłaty tam, gdzie rata harmonogramowa jest niższa od celu użytkownika.

### 6. Uwagi implementacyjne (Angular)

- Zakładka powinna być odwzorowana jako formularz reaktywny z grupami pól:
  - `nadplatyRegula` (1–4),
  - `rataDocelowaRegula` (5–7),
  - `prowizjaWczesniejszaSplata` (8–9).
- Każda zmiana pola powinna emitować rekalkulację harmonogramu i odświeżenie sekcji wynikowych.
- Wartości liczbowe prezentować z separatorem tysięcy i przecinkiem dziesiętnym (format PL).
- Daty prezentować jako `MMM RRRR`.
