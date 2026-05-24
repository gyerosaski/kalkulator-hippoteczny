# 1. Harmonogram spłaty – tabela (agregacja roczna i szczegóły miesięczne)

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
- Sposób wyliczania (miesiąc m, stopa nominalna r, miesięczna i_m = r/12):
  - Jeśli tryb „równe” i dla okresu o stałym r:
    - Rata stała R = P × i_m / (1 − (1 + i_m)^(−n_okresu)),
    - Odsetki*m = Saldo*{m−1} × i_m,
    - Kapitał_m = R − Odsetki_m,
    - Saldo*m = Saldo*{m−1} − Kapitał_m.
  - Jeśli tryb „malejące”:
    - Kapitał_m = P / n_całkowite (lub P_po_aktualizacjach / n_pozostałe),
    - Odsetki*m = Saldo*{m−1} × i_m,
    - Rata_m = Kapitał_m + Odsetki_m,
    - Saldo*m = Saldo*{m−1} − Kapitał_m.
  - Nadpłaty (jeśli występują z innych zakładek) zmniejszają Saldo i modyfikują kolejne wyliczenia.
  - Koszty okołokredytowe przypisywane do miesięcy zgodnie z konfiguracją (domyślnie 0,00).

## 1.1. Kolumna „Oprocentowanie” (warunkowa)

Kolumna pojawia się **wyłącznie** wtedy, gdy w symulacji występuje zmiana oprocentowania w czasie (`ScheduleResult.hasRateChange === true`). Warunki uruchamiające — zgodne z § 5.4 `wykresy.md`:

- istnieje więcej niż jeden okres oprocentowania (`ratePeriods.length ≥ 1`),
- niezerowe **ubezpieczenie pomostowe** (`bridgeRate > 0 ∧ bridgeMonths > 0`),
- niezerowe **ubezpieczenie niskiego wkładu** (`lowDownRate > 0`),
- niezerowa **promocja oprocentowania** (`promoRate > 0`).

Renderowanie:

- **Warstwa miesięczna** — wartość `rows[m].rate` w formacie `0,00 %`. Komórka komunikuje skok wizualnie: jeżeli `rows[m].rate ≠ rows[m-1].rate`, komórkę otacza cienka kropka koloru `--c-int` (znacznik zmiany), a w `title` umieszczany jest powód (np. „koniec ubezpieczenia pomostowego”, „okres 2 — WIBOR + marża”).
- **Warstwa roczna** — jeżeli wszystkie miesiące roku mają tę samą stopę, wyświetla się pojedyncza wartość (`7,90 %`). Jeśli w roku występuje zmiana — wyświetla się zakres ze strzałką (`9,10 % → 7,90 %`, kierunek zgodny z czasem).
- Kolejność kolumny: bezpośrednio po „Odsetki” (intuicyjne sąsiedztwo — przy oglądaniu kwoty odsetek widoczna jest stopa, z której powstała).

Kolumna **nie jest** renderowana, gdy `hasRateChange === false` — w tym przypadku tabela zachowuje 7-kolumnowy układ taki, jak dotychczas.
