# Specyfikacja funkcjonalna sekcji „Koszty okołokredytowe i promocje”

## 1. Kontekst sekcji

- Sekcja jest **opcjonalna** — włączana przełącznikiem w nagłówku. Gdy jest wyłączona, jej pola nie są
  uwzględniane w obliczeniach.
- Cel: konfiguracja wszystkich kosztów dodatkowych oraz reguł zmieniających efektywne oprocentowanie
  (ubezpieczenie pomostowe, niski wkład, promocja). Wpływa na:
  - wartość „Koszty okołokredytowe” używaną w „Suma wszystkich płatności”,
  - kolumnę „Koszty okołokredytowe” w tabeli harmonogramu (widoczna tylko gdy sekcja jest włączona),
  - udział „Koszty okołokredytowe” na donucie „Struktura wszystkich płatności”.

Domyślne wartości startowe są zerowe; wartości przykładowe pojawiają się dopiero po użyciu globalnego
„Wstaw domyślne”.

## 2. Karty kosztów

Każde pole liczbowe przyjmuje wartości nieujemne (≥ 0).

### 2.1. Prowizja za udzielenie

Prowizję można wprowadzić jako procent kwoty kredytu albo jako konkretną kwotę w złotych (przełącznik
`% / zł` przy polu numerycznym). Domyślnie tryb procentowy, wartość `0`.

- Tryb procentowy: kwota prowizji = `kwota kredytu × wartość / 100`. Obok widać przeliczoną kwotę w zł.
  Wartość procentowa nie może przekraczać 100.
- Tryb kwotowy: prowizja równa wprowadzonej kwocie; przeliczenie jest ukryte; brak górnego limitu.

**Automatyczna konwersja przy zmianie trybu** — wartość jest przeliczana na ekwiwalent w nowej jednostce:

| Kierunek        | Formuła                                         |
| --------------- | ----------------------------------------------- |
| procent → kwota | `kwota kredytu × wartość / 100` (zł, 2 miejsca) |
| kwota → procent | `wartość / kwota kredytu × 100` (%, 4 miejsca)  |

Jeśli kwota kredytu ≤ 0 lub wartość = 0, wynik konwersji to 0. Konwersja nie zmienia kwoty prowizji
płaconej przez kredytobiorcę — zmienia jedynie jednostkę reprezentacji.

Prowizja za udzielenie wchodzi do kosztów okołokredytowych i jest księgowana w pierwszym miesiącu
harmonogramu (widoczna w kolumnie „Koszty”).

### 2.2. Opłata za wycenę

Kwota stała (`zł`), domyślnie po „Wstaw domyślne” `400`. Wchodzi do kosztów okołokredytowych, księgowana
w pierwszym miesiącu harmonogramu.

### 2.3. Ubezpieczenie pomostowe

| Pole                    | Jednostka | Domyślnie po „Wstaw domyślne” |
| ----------------------- | --------- | ----------------------------- |
| Podwyżka oprocentowania | `%`       | `1,2`                         |
| Liczba miesięcy         | `mies.`   | `6`                           |

Mechanizm: przez wskazaną liczbę pierwszych miesięcy spłaty bazowa stopa jest powiększana o podwyżkę
pomostową. Skutek: wyższe odsetki w okresie pomostowym — nie tworzy osobnej pozycji kosztów (wpływa
pośrednio przez ratę). Część odsetek z tej podwyżki jest wyodrębniona jako składnik „Ubezpieczenie
pomostowe” w rozwijanej legendzie „Odsetki” (patrz §4 i `docs/funkcjonalności/wykresy.md`).

### 2.4. Ubezpieczenie nieruchomości

| Pole              | Opcje / format                                                                 | Domyślnie                          |
| ----------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| Częstotliwość     | `co rok`, `co miesiąc`                                                         | `co rok`                           |
| Sposób naliczania | `% wartości nieruchomości`, `% kwoty kredytu`, `% salda kredytu`, `znam kwotę` | `% wartości nieruchomości`         |
| Wartość           | `%` (4 miejsca) lub `zł` (2 miejsca dla „znam kwotę”)                          | `0` (po „Wstaw domyślne” `0,0008`) |
| Od                | miesiąc i rok                                                                  | miesiąc po uruchomieniu            |
| Do                | miesiąc i rok                                                                  | koniec okresu kredytu              |

Wyliczanie: składka naliczana, gdy data mieści się w zakresie `[od, do]` oraz w odpowiednim rytmie
(`co rok` — co dwunasty miesiąc od daty „od”; `co miesiąc` — w każdym miesiącu). Baza zależy od sposobu
naliczania (wartość nieruchomości / kwota kredytu / aktualne saldo / kwota). Wartość składki to wpisana
kwota (tryb „znam kwotę”) lub `baza × wartość / 100`.

### 2.5. Ubezpieczenie niskiego wkładu

| Pole                    | Jednostka | Domyślnie |
| ----------------------- | --------- | --------- |
| Podwyżka oprocentowania | `%`       | `0`       |

Mechanizm: stopa jest powiększana o podwyżkę niskiego wkładu tylko wtedy, gdy bieżące LTV przekracza 80%.
LTV liczone jest w każdym miesiącu jako `aktualne saldo / wartość nieruchomości × 100`. Podwyżka przestaje
być stosowana automatycznie w miesiącu, w którym saldo spadnie wystarczająco, by LTV osiągnęło lub
przekroczyło próg 80% od góry. Nie ma konfigurowalnej daty granicznej — warunek jest sprawdzany co miesiąc.
Wpływa pośrednio na odsetki, nie na koszty. Część odsetek z tej podwyżki jest wyodrębniona jako składnik
„Ubezpieczenie niskiego wkładu” w rozwijanej legendzie „Odsetki” (§4).

Przykład: kredyt 420 000 zł przy wartości nieruchomości 500 000 zł → LTV = 84% → podwyżka aktywna.
Po nadpłatach redukujących saldo do 399 000 zł → LTV = 79,8% ≤ 80% → podwyżka wyłącza się automatycznie.

### 2.6. Ubezpieczenie na życie

| Pole              | Opcje / format                                       | Domyślnie               |
| ----------------- | ---------------------------------------------------- | ----------------------- |
| Częstotliwość     | `co rok`, `co miesiąc`, `jednorazowo`                | `co rok`                |
| Sposób naliczania | `% kwoty kredytu`, `% salda kredytu`, `znam kwotę`   | `% kwoty kredytu`       |
| Wartość           | `%` (5 miejsc) lub `zł` (2 miejsca dla „znam kwotę”) | `0`                     |
| Od                | miesiąc i rok                                        | miesiąc po uruchomieniu |
| Do                | miesiąc i rok                                        | koniec okresu kredytu   |

Wyliczanie analogiczne do ubezpieczenia nieruchomości, jednak baza nigdy nie pochodzi z wartości
nieruchomości (brak takiej opcji). Składka `jednorazowo` pobierana jest tylko w pierwszym miesiącu.

### 2.7. Ubezpieczenie od utraty pracy

| Pole              | Opcje / format                                     | Domyślnie               |
| ----------------- | -------------------------------------------------- | ----------------------- |
| Częstotliwość     | `co rok`, `co miesiąc`, `jednorazowo`              | `jednorazowo`           |
| Sposób naliczania | `% kwoty kredytu`, `% salda kredytu`, `znam kwotę` | `% kwoty kredytu`       |
| Wartość           | `%` lub `zł`                                       | `0`                     |
| Od                | miesiąc i rok                                      | miesiąc po uruchomieniu |

Pola „do” brak — składka obowiązuje od daty „od” aż do końca harmonogramu.

### 2.8. Dodatkowe koszty

Opcjonalna lista `DODATKOWE KOSZTY n`. Każdy rekord:

| Pole              | Opcje / format                                     | Domyślnie               |
| ----------------- | -------------------------------------------------- | ----------------------- |
| Nazwa             | tekst                                              | puste                   |
| Częstotliwość     | `co rok`, `co miesiąc`, `jednorazowo`              | `jednorazowo`           |
| Sposób naliczania | `% kwoty kredytu`, `% salda kredytu`, `znam kwotę` | `znam kwotę`            |
| Wartość           | `%` lub `zł` (2 miejsca)                           | `0`                     |
| Od                | miesiąc i rok                                      | miesiąc po uruchomieniu |

Akcje: `+ Dodaj koszt` dodaje pustą kartę; przycisk usuwania (pierwsza karta nie jest usuwalna).
Wyliczanie identyczne jak dla ubezpieczenia na życie/utraty pracy (baza zgodnie ze sposobem naliczania).
Suma wszystkich miesięcznych pozycji wchodzi do kosztów okołokredytowych.

### 2.9. Promocja oprocentowania

| Pole                   | Jednostka | Domyślnie                 |
| ---------------------- | --------- | ------------------------- |
| Obniżka oprocentowania | `%`       | `0`                       |
| Od                     | data      | miesiąc po uruchomieniu   |
| Do                     | data      | 12 miesięcy po dacie „od” |

Mechanizm: dla miesięcy w zakresie `[od, do]` stopa zostaje pomniejszona o obniżkę promocyjną
(nie schodzi poniżej 0).

## 3. Akcje w sekcji

Sekcja nie ma własnego paska akcji. Operacje:

- przełącznik włączenia w nagłówku — włącza/wyłącza wpływ sekcji na wynik,
- `+ Dodaj koszt` w grupie „Dodatkowe koszty”,
- przycisk usuwania kosztu dodatkowego.

Globalne „Wstaw domyślne” wstawia przykładowe wartości pokazane w kolumnach „Domyślnie po »Wstaw domyślne«”.

## 4. Wpływ na wynik

Koszty okołokredytowe są sumą:

```
koszty okołokredytowe = prowizja za udzielenie + opłata za wycenę
                      + ubezpieczenia (nieruchomości, na życie, utraty pracy, dodatkowe koszty)
                      + prowizje za wcześniejszą spłatę (sekcja „Nadpłaty”)
                      + opłaty za uruchomienie transz
```

Prowizja za udzielenie i opłata za wycenę są księgowane w pierwszym miesiącu harmonogramu (widoczne
w kolumnie „Koszty”).

**Rozbicie na składowe (donut „Struktura płatności”):** koszty są rozbijane na pojedyncze pozycje
(prowizja za udzielenie, wycena, poszczególne ubezpieczenia z zachowaniem nazw dodatkowych kosztów,
prowizja za wcześniejszą spłatę, opłaty za uruchomienie transz). Zasilają one rozwijalną pozycję „Koszty
okołokredytowe” w legendzie donuta (patrz `docs/funkcjonalności/wykresy.md` §5.1–5.2). Uwaga: prowizja za
wcześniejszą spłatę i opłaty transzowe pojęciowo należą do sekcji „Nadpłaty”/„Transze” — obecnie pozostają
w kosztach okołokredytowych (przekategoryzowanie planowane osobnym zadaniem).

Ubezpieczenie pomostowe (2.3), niskiego wkładu (2.5) i promocja (2.9) zmieniają **efektywną stopę
miesiąca** i wpływają pośrednio przez odsetki, a nie przez koszty okołokredytowe.

Stąd wartości zbiorcze:

- „Suma wszystkich płatności” = suma rat + koszty okołokredytowe,
- „Koszty okołokredytowe” = jak wyżej,
- „Odsetki” = suma odsetek,
- udział zwrotu do banku = suma wszystkich płatności / kwota kredytu × 100.

## 5. Walidacje

- Każde pole liczbowe przyjmuje wartości nieujemne. Procentowa prowizja za udzielenie dodatkowo nie może
  przekraczać 100.
- Sekcja nie ma własnych walidacji krzyżowych — błędny zakres okresu ubezpieczenia (data „od” późniejsza
  niż „do”) nie zgłasza błędu; składka po prostu nie jest wtedy naliczana.
