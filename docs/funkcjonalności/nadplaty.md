### Dokumentacja funkcjonalna sekcji formularza — „Nadpłaty”

### 1. Zakres

- Sekcja: „Nadpłaty”.
- Cel: modelowanie scenariuszy nadpłacania kredytu oraz prowizji za wcześniejszą spłatę i pokazanie ich
  wpływu na harmonogram oraz podsumowanie kosztów.

### 2. Pola wejściowe

| #   | Nazwa pola                                         | Wartości                                            | Format / jednostka | Reguły                                | Wpływ                                                                                 |
| --- | -------------------------------------------------- | --------------------------------------------------- | ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | `Jak często nadpłacasz?`                           | `jednorazowo`, `co miesiąc`, `co kwartał`, `co rok` | wybór z listy      | obowiązkowe (domyślnie `jednorazowo`) | częstotliwość zdarzeń nadpłat                                                         |
| 2   | `Data nadpłaty`                                    | zakres `od` / `do`                                  | miesiąc i rok      | —                                     | okres obowiązywania reguły nadpłaty                                                   |
| 3   | `Kwota nadpłaty`                                   | liczba ≥ 0                                          | `zł`, 2 miejsca    | —                                     | kwota dodawana do spłaty kapitału zgodnie z częstotliwością/okresem                   |
| 4   | `Skutek nadpłaty`                                  | `niższa rata`, `skrócenie okresu`                   | wybór z listy      | obowiązkowe (domyślnie `niższa rata`) | sposób rekalkulacji harmonogramu po nadpłacie                                         |
| 5   | `Chcę co miesiąc płacić do banku ratę w wysokości` | liczba ≥ 0                                          | `zł`, 2 miejsca    | —                                     | docelowy miesięczny poziom płatności, od którego liczone są nadpłaty (okres z pola 6) |
| 6   | `Data nadpłaty` (dla raty docelowej)               | zakres `od` / `do`                                  | miesiąc i rok      | —                                     | okres aktywności mechanizmu z pola 5                                                  |
| 7   | `Skutek nadpłaty` (dla raty docelowej)             | `niższa rata`, `skrócenie okresu`                   | wybór z listy      | obowiązkowe (domyślnie `niższa rata`) | rekalkulacja harmonogramu dla nadpłat liczonych od raty docelowej                     |
| 8   | `Wysokość prowizji za wcześniejszą spłatę`         | liczba (domyślnie `0,00`)                           | `%`, 2 miejsca     | —                                     | procent naliczany od nadpłaty w okresie obowiązywania prowizji                        |
| 9   | `Bank pobiera prowizję do`                         | miesiąc i rok                                       | data               | —                                     | data graniczna, do której prowizja z pola 8 jest uwzględniana w kosztach              |

### 3. Akcje

| Nazwa               | Działanie                                                                       |
| ------------------- | ------------------------------------------------------------------------------- |
| `+` (przy regule)   | dodaje kolejną regułę nadpłaty (możliwość budowania wielu scenariuszy)          |
| `Zapisz kalkulację` | zapisuje aktualny scenariusz (patrz `docs/funkcjonalności/twoje-kalkulacje.md`) |

### 4. Zależności obliczeniowe i reguły

- Zmiana dowolnego pola sekcji wpływa na: kolumnę „Nadpłaty” w harmonogramie, „Pozostało do spłaty”,
  „Suma wszystkich płatności” oraz „Koszty okołokredytowe” (prowizja za wcześniejszą spłatę).
- Tryb skutku nadpłaty:
  - `niższa rata` — obniżenie kolejnych rat przy zachowaniu okresu,
  - `skrócenie okresu` — utrzymanie rat i skracanie czasu spłaty.
- Prowizja naliczana tylko do daty granicznej („Bank pobiera prowizję do”).

### 5. Wpływ nadpłat na koszt kredytu

#### 5.1 Model miesięczny

Dla miesiąca `t`:

- `odsetki_t = saldo_{t-1} × stopa_miesieczna_t`,
- `kapitał_raty_t = rata_t − odsetki_t`,
- `nadpłata_t` wynika z reguł z pól 1–7,
- `saldo_t = saldo_{t-1} − kapitał_raty_t − nadpłata_t`.

Każda dodatnia nadpłata obniża saldo, więc w kolejnych okresach maleje baza naliczania odsetek.

#### 5.2 Wpływ na koszt odsetkowy

`Odsetki_total = Σ odsetki_t`. Ponieważ odsetki liczone są od aktualnego salda, nadpłaty przesuwają
harmonogram w stronę niższych odsetek w kolejnych miesiącach i szybszego spadku „Pozostało do spłaty”.

#### 5.3 Wpływ trybu „Skutek nadpłaty”

- `niższa rata`: po nadpłacie rata jest przeliczana dla pozostałego okresu — niższy miesięczny cashflow,
  oszczędność odsetkowa zwykle mniejsza niż przy skróceniu okresu.
- `skrócenie okresu`: po nadpłacie rata jest utrzymywana, a liczba pozostałych miesięcy przeliczana:
  - raty równe: `n' = ceil(ln(rata / (rata − saldo × i)) / ln(1 + i))` (gdy rata nie pokrywa odsetek,
    okres nie jest skracany),
  - raty malejące: `n' = ceil(saldo / część_kapitałowa)`,
    efekt: zwykle większa oszczędność odsetek (krótszy czas naliczania).
- Współistnienie reguł o różnych skutkach w tym samym miesiącu:
  - obie części nadpłaty pomniejszają saldo; przy ograniczeniu do salda najpierw konsumowana jest część
    „niższa rata”, a reszta przypada części „skrócenie okresu”,
  - kolejność efektów w miesiącu: najpierw skrócenie pozostałego okresu przy utrzymanej racie, następnie
    rekalkulacja raty na — ewentualnie skróconym — pozostałym okresie,
  - dzięki temu oba skutki działają jednocześnie: okres ulega skróceniu, a rata obniżeniu.

#### 5.4 Prowizja za wcześniejszą spłatę

- Dla miesięcy spełniających warunek daty (`t ≤ data_graniczna_prowizji`): `prowizja_t = nadpłata_t × stawka_prowizji`.
- `Prowizja_total = Σ prowizja_t`.
- Nadpłata obniża odsetki, ale może chwilowo zwiększyć koszty okołokredytowe przez prowizję. Finalny
  efekt: `Koszt_całkowity = Odsetki_total + Koszty_okołokredytowe_total`.

#### 5.5 Reguła docelowej raty miesięcznej

- Pole 5 w połączeniu z 6–7 działa jak strategia utrzymania zadanej płatności miesięcznej.
- Dla miesięcy aktywnego zakresu: `nadpłata_t = max(0, rata_docelowa − rata_wynikająca_z_harmonogramu_t)`
  — nadpłata jest automatycznie dopisywana tam, gdzie rata harmonogramowa jest niższa od celu użytkownika.
