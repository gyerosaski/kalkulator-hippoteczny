# Specyfikacja funkcjonalna — Walidacje formularza

Dokument zbiera w jednym miejscu **wszystkie** reguły walidacji formularza kalkulatora.
Jest to centralna lista walidacji — każda nowa lub zmieniona walidacja musi zostać tutaj
odzwierciedlona.

---

## 1. Cel i zakres

Formularz kalkulatora podlega dwóm rodzajom walidacji:

- **Walidacje pól** — dotyczą pojedynczego pola: obowiązkowość oraz dopuszczalny zakres lub
  format wartości (np. wartość ≥ 0, oprocentowanie w przedziale 0–50%).
- **Walidacje krzyżowe (globalne)** — obejmują wiele pól lub całych sekcji jednocześnie
  (np. suma transz musi być równa kwocie kredytu, początek spłat kapitału nie może wyprzedzać
  daty uruchomienia kredytu).

Sekcje opcjonalne (`Transze`, `Nadpłaty`, `Koszty okołokredytowe i promocje`) są walidowane
wyłącznie, gdy są włączone.

Gdy formularz jest niepoprawny, panel wyników, wykresy i tabela harmonogramu znikają, a w ich
miejscu prezentowana jest lista błędów (patrz § 8).

---

## 2. Walidacje pól — Dane podstawowe

| Pole                        | Reguła                                  | Format / jednostka  |
| --------------------------- | --------------------------------------- | ------------------- |
| `Wartość nieruchomości`     | obowiązkowe; wartość większa od 0       | `zł`                |
| `Kwota kredytu`             | obowiązkowe; wartość większa od 0       | `zł`                |
| `LTV`                       | obowiązkowe; wartość w przedziale 0–100 | `%`                 |
| `Okres kredytowania`        | obowiązkowe; co najmniej 1              | `miesiące` / `lata` |
| `Data uruchomienia kredytu` | obowiązkowe                             | miesiąc i rok       |
| `Początek spłat kapitału`   | obowiązkowe                             | miesiąc i rok       |

---

## 3. Walidacje pól — Oprocentowanie

Reguły poniżej dotyczą każdego okresu oprocentowania osobno.

| Pole                        | Reguła                                                                               | Format / jednostka |
| --------------------------- | ------------------------------------------------------------------------------------ | ------------------ |
| data początku okresu (`od`) | obowiązkowa (poza pierwszym okresem, który zaczyna się od daty uruchomienia kredytu) | miesiąc i rok      |
| `Oprocentowanie`            | dla stopy stałej: wartość w przedziale 0–50                                          | `%`                |
| `Wskaźnik referencyjny`     | dla stopy zmiennej: wartość w przedziale 0–50                                        | `%`                |
| `Marża`                     | dla stopy zmiennej: wartość w przedziale 0–50                                        | `%`                |

---

## 4. Walidacje pól — Transze

| Pole                             | Reguła                                                                                                     | Format / jednostka |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------ |
| `Kwota`                          | obowiązkowa; większa od 0. Wyjątek: kwota pierwszej transzy jest powiązana z kwotą kredytu i nieedytowalna | `zł`               |
| `Data uruchomienia`              | obowiązkowa. Wyjątek: data pierwszej transzy jest powiązana z datą uruchomienia kredytu i nieedytowalna    | miesiąc i rok      |
| `Opłata za uruchomienie transzy` | wartość w przedziale 0–1 000                                                                               | `zł`               |

Walidacje krzyżowe sekcji transz (suma transz, kolejność dat) opisano w § 7.

---

## 5. Walidacje pól — Nadpłaty

### 5.1. Reguły nadpłat

| Pole                                 | Reguła                                               | Format / jednostka |
| ------------------------------------ | ---------------------------------------------------- | ------------------ |
| `Jak często nadpłacasz?`             | obowiązkowe                                          | wybór z listy      |
| `Data nadpłaty` / `Data nadpłaty od` | obowiązkowa                                          | miesiąc i rok      |
| `Data nadpłaty do`                   | obowiązkowa (gdy częstotliwość inna niż jednorazowa) | miesiąc i rok      |
| `Kwota nadpłaty`                     | wartość nieujemna                                    | `zł`               |
| `Skutek nadpłaty`                    | obowiązkowy                                          | wybór z listy      |

### 5.2. Docelowa rata

| Pole                                               | Reguła            | Format / jednostka |
| -------------------------------------------------- | ----------------- | ------------------ |
| `Chcę co miesiąc płacić do banku ratę w wysokości` | wartość nieujemna | `zł`               |
| `Data nadpłaty od`                                 | obowiązkowa       | miesiąc i rok      |
| `Data nadpłaty do`                                 | obowiązkowa       | miesiąc i rok      |
| `Skutek nadpłaty`                                  | obowiązkowy       | wybór z listy      |

### 5.3. Prowizja za wcześniejszą spłatę

| Pole                                       | Reguła                     | Format / jednostka |
| ------------------------------------------ | -------------------------- | ------------------ |
| `Wysokość prowizji za wcześniejszą spłatę` | wartość w przedziale 0–100 | `%`                |
| `Bank pobiera prowizję do`                 | obowiązkowa                | miesiąc i rok      |

Walidacje krzyżowe sekcji nadpłat (kolejność dat, wartości nieujemne) opisano w § 7.

---

## 6. Walidacje pól — Koszty okołokredytowe i promocje

Wszystkie pola wartości i stawek w tej sekcji muszą być nieujemne:

| Pole                                                        | Reguła                                                                              | Format / jednostka |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------ |
| `Prowizja za udzielenie`                                    | wartość nieujemna; dodatkowo nie większa niż 100% przy obliczaniu procentowym (§ 7) | `%` lub `zł`       |
| `Opłata za wycenę`                                          | wartość nieujemna                                                                   | `zł`               |
| Podwyższenie oprocentowania (ubezpieczenie pomostowe)       | wartość nieujemna                                                                   | `%`                |
| Liczba miesięcy podwyższenia (ubezpieczenie pomostowe)      | wartość nieujemna                                                                   | `mies.`            |
| `Wartość składki` (ubezpieczenie nieruchomości)             | wartość nieujemna                                                                   | `%` lub `zł`       |
| Podwyższenie oprocentowania (ubezpieczenie niskiego wkładu) | wartość nieujemna                                                                   | `%`                |
| Wartość składki (ubezpieczenie na życie)                    | wartość nieujemna                                                                   | `%` lub `zł`       |
| Wartość składki (ubezpieczenie od utraty pracy)             | wartość nieujemna                                                                   | `%` lub `zł`       |
| Wartość kosztu dodatkowego                                  | wartość nieujemna                                                                   | `%` lub `zł`       |
| Obniżka oprocentowania (promocja)                           | wartość nieujemna                                                                   | `%`                |

> Pola dat „od/do" w kosztach okołokredytowych i promocji nie podlegają walidacji.

---

## 7. Walidacje krzyżowe (globalne)

Walidacje obejmujące wiele pól lub sekcji prezentowane są jako lista błędów globalnych:

| Warunek wyzwolenia                                                                               | Komunikat / efekt                                                                        |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Kwota kredytu większa od wartości nieruchomości                                                  | błąd: kwota kredytu nie może być większa niż wartość nieruchomości                       |
| Okres kredytowania ≤ 0 miesięcy                                                                  | błąd: łączna liczba miesięcy musi być większa od 0                                       |
| Początek spłat kapitału wcześniejszy niż data uruchomienia kredytu                               | błąd: początek spłat kapitału nie może być wcześniejszy niż data uruchomienia            |
| Transze włączone, liczba transz > 1, początek spłat kapitału nie późniejszy niż ostatnia transza | błąd: początek spłat kapitału musi przypadać po dacie uruchomienia ostatniej transzy     |
| Transze włączone i suma transz ≠ kwocie kredytu (tolerancja 0,01 zł)                             | błąd: suma transz musi być równa kwocie kredytu (z podaniem kwoty oczekiwanej i różnicy) |
| Transze włączone i kwota dowolnej transzy niepoprawna (≤ 0)                                      | błąd: kwota każdej transzy musi być większa od zera                                      |
| Transze włączone i opłata za uruchomienie dowolnej transzy większa niż 1 000 zł                  | błąd: wysokość opłaty za uruchomienie transzy nie może być wyższa niż 1 000 zł           |
| Reguła nadpłaty (nie „jednorazowo") z datą „do" wcześniejszą niż „od"                            | błąd: w regule nadpłaty data „do" nie może być wcześniejsza niż data „od"                |
| Ujemna kwota nadpłaty                                                                            | błąd: kwota nadpłaty nie może być ujemna                                                 |
| Reguła docelowej raty z datą „do" wcześniejszą niż „od"                                          | błąd: w regule docelowej raty data „do" nie może być wcześniejsza niż data „od"          |
| Ujemna docelowa rata                                                                             | błąd: docelowa rata nie może być ujemna                                                  |
| Koszty okołokredytowe włączone, prowizja za udzielenie liczona procentowo i większa niż 100%     | błąd: prowizja za udzielenie (%) nie może przekraczać 100%                               |

---

## 8. Zachowanie formularza przy błędach

- Gdy formularz jest niepoprawny, panel wyników, wykresy i tabela harmonogramu znikają,
  a w ich miejscu prezentowana jest lista błędów.
- Błędy są pogrupowane według sekcji formularza, której dotyczą.
- Każda zmiana dowolnego pola wyzwala ponowną walidację i — przy poprawnych danych —
  ponowne przeliczenie oraz przywrócenie panelu wyników.
