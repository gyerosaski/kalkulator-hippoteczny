# 1. Harmonogram spłaty — tabela (agregacja roczna i szczegóły miesięczne)

- Kolumny (warstwa miesięczna):
  - Data,
  - Rata,
  - Kapitał,
  - Odsetki,
  - **Oprocentowanie** _(kolumna warunkowa — patrz § 1.1)_,
  - Nadpłaty,
  - Pozostało do spłaty,
  - Koszty okołokredytowe.
- Widok roczny: wiersze „+ RRRR …” z możliwością rozwinięcia do miesięcy.
- Sposób wyliczania (miesiąc m, stopa nominalna r, miesięczna `i_m = r/12`):
  - Tryb „równe” (dla okresu o stałym r):
    - Rata stała `R = saldo × i_m / (1 − (1 + i_m)^(−n_okresu))`,
    - `Odsetki_m = Saldo_{m−1} × i_m`,
    - `Kapitał_m = R − Odsetki_m`,
    - `Saldo_m = Saldo_{m−1} − Kapitał_m`.
  - Tryb „malejące”:
    - `Kapitał_m = saldo / n_pozostałe`,
    - `Odsetki_m = Saldo_{m−1} × i_m`,
    - `Rata_m = Kapitał_m + Odsetki_m`,
    - `Saldo_m = Saldo_{m−1} − Kapitał_m`.
  - Nadpłaty (jeśli skonfigurowane) zmniejszają saldo i modyfikują kolejne wyliczenia.
  - Koszty okołokredytowe przypisywane do miesięcy zgodnie z konfiguracją (domyślnie 0,00).

## 1.0.1. Rozbicie odsetek na składniki

Kwota odsetek danego miesiąca może być rozbita na addytywne składniki efektywnej stopy (suma składników
jest dokładnie równa odsetkom):

- **Odsetki bazowe** — odsetki z bazowej stopy (wskaźnik referencyjny + marża albo oprocentowanie stałe
  z sekcji „Oprocentowanie”).
- **Ubezpieczenie pomostowe** — część odsetek wynikająca z podwyższenia stopy o ubezpieczenie pomostowe
  (`saldo × podwyżka_pomostowa / 12 / 100`).
- **Ubezpieczenie niskiego wkładu** — część odsetek z podwyższenia o ubezpieczenie niskiego wkładu (gdy LTV > 80%).
- **Promocja oprocentowania** — **ujemna** kwota obniżenia odsetek przez promocyjne oprocentowanie (w oknie promocji).

Składniki zerowe są pomijane; ujemna pozycja promocji jest zachowywana. Rozbicie zasila rozwijaną pozycję
„Odsetki” w legendzie donutów (patrz `docs/funkcjonalności/wykresy.md` §5.1–5.2).

## 1.1. Kolumna „Oprocentowanie” (warunkowa)

Kolumna pojawia się **wyłącznie** wtedy, gdy w symulacji występuje zmiana oprocentowania w czasie.
Warunki uruchamiające:

- istnieje więcej niż jeden okres oprocentowania i okresy różnią się od siebie,
- niezerowe **ubezpieczenie pomostowe**,
- niezerowe **ubezpieczenie niskiego wkładu**,
- niezerowa **promocja oprocentowania**.

Prezentacja:

- **Warstwa roczna** — jeżeli wszystkie miesiące roku mają tę samą stopę, wyświetla się pojedyncza wartość
  (`7,90 %`). Jeśli w roku występuje zmiana — wyświetla się zakres ze strzałką (`9,10 % → 7,90 %`, kierunek
  zgodny z czasem: pierwsza wartość to oprocentowanie w pierwszym miesiącu roku, druga w ostatnim).
- **Warstwa miesięczna** — wartość miesięczna w formacie `0,00 %`. Komórka komunikuje skok wizualnie:
  oprocentowanie niższe niż w poprzednim miesiącu ma kolor zielony, wyższe — czerwony.

Kolejność kolumny: bezpośrednio po „Odsetki” (przy oglądaniu kwoty odsetek widoczna jest stopa, z której powstała).
