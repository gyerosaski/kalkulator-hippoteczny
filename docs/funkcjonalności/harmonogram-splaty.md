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

### 1.0.1. Rozbicie odsetek na składniki (`interestBreakdown`)

Każdy wiersz harmonogramu (`ScheduleRow.interestBreakdown`) przechowuje rozbicie kwoty `Odsetki` na addytywne
składniki efektywnej stopy (`InterestComponentItem[]`, suma `value` == `interest`):

- `BASE` — odsetki z bazowej stopy (WIBOR + marża albo oprocentowanie stałe z sekcji „Oprocentowanie”). Liczone
  jako reszta (`interest − pomostowe − niski wkład + promocja`), aby suma składników była dokładnie równa odsetkom.
- `BRIDGE_INSURANCE` — część odsetek wynikająca z podwyższenia stopy o ubezpieczenie pomostowe (`saldo × bridgeRateIncrease / 12 / 100`).
- `LOW_EQUITY_INSURANCE` — część odsetek z podwyższenia o ubezpieczenie niskiego wkładu (gdy LTV > 80%).
- `PROMOTIONAL_DISCOUNT` — **ujemna** kwota obniżenia odsetek przez promocyjne oprocentowanie (w oknie promocji).

Składniki zerowe są pomijane; ujemny `PROMOTIONAL_DISCOUNT` jest zachowywany. Pole zasila rozwijaną pozycję
„Odsetki” w legendzie donutów (patrz `docs/funkcjonalności/wykresy.md` §5.1–5.2). Agregat całego okresu to
`MortgageResults.totals.totalInterestBreakdown`; pierwsza rata — `firstInstallment.interestBreakdown`.

## 1.1. Kolumna „Oprocentowanie” (warunkowa)

Kolumna pojawia się **wyłącznie** wtedy, gdy w symulacji występuje zmiana oprocentowania w czasie. Warunki uruchamiające:

- istnieje więcej niż jeden okres oprocentowania i różnią się one od siebie,
- niezerowe **ubezpieczenie pomostowe**,
- niezerowe **ubezpieczenie niskiego wkładu**,
- niezerowa **promocja oprocentowania**.

Prezentacja:

- **Warstwa roczna** — jeżeli wszystkie miesiące roku mają tę samą stopę, wyświetla się pojedyncza wartość (`7,90 %`). Jeśli w roku występuje zmiana — wyświetla się zakres ze strzałką (`9,10 % → 7,90 %`, kierunek zgodny z czasem, pierwsza wartość to oprocentowanie w pierwszym miesiącu okresu rocznego, a druga w ostatnim).
- **Warstwa miesięczna** — wartość miesięczna w formacie `0,00 %`. Komórka komunikuje skok wizualnie: jeżeli oprocentowanie jest niższe niż w poprzednim miesiącu, wartość ma kolor zielony, jeśli jest wyższe to czerwony.

- Kolejność kolumny: bezpośrednio po „Odsetki” (intuicyjne sąsiedztwo — przy oglądaniu kwoty odsetek widoczna jest stopa, z której powstała).
