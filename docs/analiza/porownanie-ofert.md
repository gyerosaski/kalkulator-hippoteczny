# Specyfikacja techniczna widoku „Porównanie ofert”

Aplikacja: Kalkulator kredytu hipotecznego 2.0
Zakres: Specyfikacja zakładki `Porównanie ofert` — co i w jaki sposób zestawiamy pomiędzy zapisanymi kalkulacjami; opis interakcji, danych źródłowych oraz **ponownego wykorzystania wykresów z widoku „Kalkulator”** (`Donut` × 2 + `TrendChart`).
Data opracowania: 2026-05-23

---

## 1. Cel i zakres zakładki

Zakładka `Porównanie ofert` służy do zestawienia **dokładnie dwóch** wcześniej zapisanych kalkulacji (sekcja `Twoje kalkulacje`) w jednym widoku tak, aby użytkownik mógł szybko odpowiedzieć na pytania:

- Która oferta jest **najtańsza całkowicie** (suma wszystkich płatności)?
- Która ma **najniższą pierwszą ratę** (cashflow miesięczny na starcie)?
- Która ma **najniższe odsetki** (czysty koszt finansowania)?
- Która ma **najniższe koszty okołokredytowe** (prowizja, wycena, ubezpieczenia)?
- Jak różnią się **profile spłaty w czasie** (linia salda + struktura roczna)?
- Jakie parametry wejściowe (oprocentowanie, okres, tryb rat, nadpłaty) odpowiadają za te różnice?

Wszystkie wyniki w widoku są wyłącznie odczytami — nie modyfikuje się tu danych wejściowych ofert. Edycja oferty odbywa się przez kliknięcie „Otwórz w kalkulatorze”, które ładuje wybraną kalkulację do widoku `Kalkulator`.

Ograniczenie do dwóch ofert jest decyzją projektową. Para to najczęstszy realny scenariusz decyzyjny („oferta z banku A vs oferta z banku B”), a układ dwukolumnowy pozwala na bezpośrednie zestawienie wartości obok siebie bez przeciążania wzroku gęstą siatką wskaźników. Para naturalnie generuje też **jedną deltę** (`Δ = B − A`), co czyni interpretację różnic jednoznaczną — bez konieczności wybierania „oferty referencyjnej”.

---

## 2. Model danych — czym jest „oferta”

`Oferta` w tym widoku to wynik `CalcService.compute(input)` opakowany w meta‑rekord:

```
Offer = {
  id:          string,                  // identyfikator zapisanej kalkulacji
  name:        string,                  // nazwa nadana przez użytkownika (np. „PKO 7,5% / 25 lat”)
  savedAt:     Date,                    // data ostatniego zapisu
  input:       MortgageInput,           // pełna kopia danych z zakładek „Dane podstawowe”, „Koszty…”, „Transze”, „Nadpłaty”
  result:      ComputeResult            // wynik = { firstInstallment, totalPayments, totalInterest, totalCosts, commission, valuationFee, totalOverpayments, rows[], yearly[] }
  isDraft?:    boolean,                 // true dla bieżącej, niezapisanej kalkulacji dodanej tymczasowo
}

Comparison = {
  offerA:      Offer,                   // lewa kolumna
  offerB:      Offer,                   // prawa kolumna
}
```

Konwencja `A` / `B`:

- `offerA` zajmuje zawsze **lewą** kolumnę i jest „bazą” — to względem niej liczone są delty (`Δ = B − A`).
- `offerB` zajmuje prawą kolumnę i jest „porównywaną”.
- Przycisk `↔ Zamień strony` (4.2) zamienia `A ↔ B`, co odwraca znak delt — przydatne, gdy użytkownik chce spojrzeć na różnicę z drugiej perspektywy.

`ComputeResult.rows[]` i `ComputeResult.yearly[]` są dokładnie tymi samymi strukturami, które konsumują `Donut` i `TrendChart` na zakładce `Kalkulator` — dzięki temu wykresy są ponownie używane **bez zmian w warstwie komponentów**.

---

## 3. Układ widoku

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 3.1  Pasek wyboru ofert (2 sloty: A i B)   │ 3.2  Akcje globalne          │
├──────────────────────────────────────────────────────────────────────────┤
│ 3.3  Tabela parametrów wejściowych — 3 kolumny: parametr | A | B | Δ     │
├──────────────────────────────────────────────────────────────────────────┤
│ 3.4  KPI grid — 4 wskaźniki × 2 oferty + środkowa kolumna delty Δ        │
├──────────────────────────────────────────────────────────────────────────┤
│ 3.5  Para donutów „Struktura wszystkich płatności” — A obok B            │
│       (REUŻYCIE komponentu `Donut`)                                      │
├──────────────────────────────────────────────────────────────────────────┤
│ 3.6  Para donutów „Struktura pierwszej raty” — A obok B                  │
│       (REUŻYCIE komponentu `Donut`)                                      │
├──────────────────────────────────────────────────────────────────────────┤
│ 3.7  Wykres trendu — nakładka 2 linii „Pozostało do spłaty” + 2 stacki  │
│       roczne obok siebie w tej samej kategorii roku                      │
│       (REUŻYCIE komponentu `TrendChart` z rozszerzeniem `series`)        │
├──────────────────────────────────────────────────────────────────────────┤
│ 3.8  Tabela różnic — pozycja | A | B | Δ (= B − A)                      │
└──────────────────────────────────────────────────────────────────────────┘
```

Liczba kolumn ofertowych jest stała: **dwie**. Widok pokazuje pusty stan z CTA „Wybierz dwie oferty do porównania”, dopóki oba sloty (`A` i `B`) nie są wypełnione.

---

## 4. Elementy interaktywne

### 4.1. Pasek wyboru ofert (`OffersPicker`)

- Typ: **dwa sloty** — `Oferta A` (lewy) i `Oferta B` (prawy), każdy jako chip z nazwą wybranej kalkulacji lub placeholder `+ Wybierz ofertę`.
- Działanie:
  - kliknięcie slotu otwiera popover z listą wszystkich zapisanych kalkulacji (`Twoje kalkulacje`) — **single‑select** (jedna pozycja zostaje wybrana, popover zamyka się),
  - lista popovera ukrywa pozycję, która jest już wybrana w przeciwnym slocie (nie można porównać oferty samej ze sobą),
  - wpis `Bieżąca kalkulacja (robocza)` widoczny tylko jeśli na zakładce `Kalkulator` istnieje aktywna kalkulacja nieprzypisana do żadnego zapisu — pozwala porównać świeże ustawienia z zapisanym wariantem,
  - wyczyszczenie slotu: `×` na chipie (slot wraca do stanu pustego),
  - przycisk `↔` między slotami zamienia `A ↔ B` (patrz 4.2 `Zamień strony`).
- Walidacje:
  - wymagane wypełnienie **obu** slotów, aby pokazać sekcje 3.3 – 3.8,
  - oferta z błędem walidacji wejść (`Σ transz ≠ kwota`, `LTV ∉ [0,100]` itp.) jest oznaczona ikoną ⚠ — sekcje liczbowe (3.4, 3.7, 3.8) są ukryte, widoczna pozostaje tylko 3.3 (parametry wejściowe) z banerem „Oferta A/B zawiera błędy — popraw w kalkulatorze”.

### 4.2. Akcje globalne

| Nazwa                       | Działanie                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `↔ Zamień strony`           | Zamienia oferty `A ↔ B`. Skutkuje odwróceniem znaku wszystkich delt (`Δ` → `−Δ`).                                                    |
| `Tryb wykresu trendu`       | `Segmented`: `nakładka` \| `obok siebie`. Domyślnie `nakładka`. Wpływ na renderowanie sekcji 3.7.                                    |
| `Pokaż wykluczone segmenty` | Toggle. Domyślnie `wyłączony` — segmenty puste (np. `Nadpłaty = 0`) chowane w donutach i tabeli. Włączony — zawsze pokazuj pełną oś. |
| `Tylko różnice`             | Toggle w 3.3. Domyślnie `wyłączony`. Włączony — ukrywa wiersze parametrów identycznych w obu ofertach.                               |
| `Drukuj`                    | Generuje wydruk widoku (sekcje 3.3 – 3.8) w formacie A4 poziomo.                                                                     |
| `Eksportuj CSV`             | Eksportuje 3.3, 3.4 i 3.8 jako jeden arkusz (`metric`, `offer_a`, `offer_b`, `delta`).                                               |
| `Otwórz w kalkulatorze`     | Akcja per‑oferta (przycisk w nagłówku kolumny). Ładuje `input` oferty na zakładkę `Kalkulator` i przełącza widok.                    |

### 4.3. Akcje per kolumna (header oferty)

| Element          | Typ                  | Działanie                                                                                               |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| Etykieta strony  | badge                | `A` (lewa) lub `B` (prawa) — stała, identyfikuje stronę porównania.                                     |
| Nazwa oferty     | `text` (inline edit) | Zmiana nazwy zapisanej kalkulacji (zapis natychmiastowy).                                               |
| Znacznik koloru  | swatch (2 kolory)    | Kolor identyfikujący ofertę w wykresie trendu (sekcja 3.7): A = `var(--offer-a)`, B = `var(--offer-b)`. |
| `Otwórz w kalk.` | `button`             | Patrz 4.2.                                                                                              |
| `Zmień ofertę`   | `link-btn`           | Otwiera popover z 4.1 dla tego slotu (zamiast „usuń + dodaj”).                                          |

---

## 5. Sekcja 3.3 — Tabela parametrów wejściowych

Tabela 4 kolumn: `Parametr | Oferta A | Oferta B | Δ`. Cel: pokazać **co użytkownik zmienił** między dwiema ofertami.

Kolumna `Δ` (różnica) prezentowana jest zależnie od typu parametru:

- liczby (`zł`, `%`, miesiące): `Δ = B − A` w mono, ze znakiem i kolorem (patrz § 14),
- daty: różnica w miesiącach (`+12 m‑cy`, `−3 m‑ce`),
- wybory tekstowe (`równe` ↔ `malejące`, `zmienna` ↔ `stała`): symbol `≠` w kolorze ostrzegawczym lub `=` w kolorze neutralnym,
- listy złożone (dodatkowe koszty, okresy oprocentowania): liczba pozycji + `≠` jeśli zawartość się różni.

Wiersze, w których wartości są identyczne (`Δ = 0` lub `=`), są opcjonalnie ukrywane przez toggle `Tylko różnice` (4.2).

Wiersze:

| Grupa           | Pole                               | Format prezentacji                           |
| --------------- | ---------------------------------- | -------------------------------------------- |
| Dane podstawowe | Wartość nieruchomości              | `zł`                                         |
| Dane podstawowe | Kwota kredytu                      | `zł`                                         |
| Dane podstawowe | LTV                                | `%` (2 miejsca)                              |
| Dane podstawowe | Okres kredytowania                 | `X lat Y m-cy` (oraz `Σ miesięcy`)           |
| Dane podstawowe | Data uruchomienia                  | `MMM RRRR`                                   |
| Dane podstawowe | Początek spłat kapitału (karencja) | `MMM RRRR` lub `bez karencji`                |
| Dane podstawowe | Tryb rat                           | `równe` \| `malejące`                        |
| Dane podstawowe | Rodzaj stopy                       | `zmienna` \| `stała`                         |
| Dane podstawowe | Oprocentowanie nominalne (start)   | `%` (2 miejsca)                              |
| Dane podstawowe | WIBOR / Marża                      | `%` + `%` (tylko dla stopy zmiennej)         |
| Dane podstawowe | Liczba okresów oprocentowania      | `n` (jeśli > 1 — link „pokaż okresy”)        |
| Koszty          | Prowizja za udzielenie             | `% (= zł)`                                   |
| Koszty          | Opłata za wycenę                   | `zł`                                         |
| Koszty          | Ubezpieczenie pomostowe            | `+% przez N m-cy`                            |
| Koszty          | Ubezp. nieruchomości               | `freq · mode · wartość`                      |
| Koszty          | Ubezp. niskiego wkładu             | `+%`                                         |
| Koszty          | Ubezp. na życie                    | `freq · mode · wartość`                      |
| Koszty          | Ubezp. od utraty pracy             | `freq · mode · wartość`                      |
| Koszty          | Dodatkowe koszty (lista)           | wiersz per pozycja: `nazwa · freq · wartość` |
| Koszty          | Promocyjna obniżka oprocentowania  | `−% · od → do`                               |
| Transze         | Liczba transz                      | `n`                                          |
| Transze         | Suma opłat za uruchomienie         | `zł`                                         |
| Nadpłaty        | Reguła nadpłat (A)                 | `freq · kwota · skutek · od → do`            |
| Nadpłaty        | Docelowa rata miesięczna (B)       | `zł · skutek · od → do`                      |
| Nadpłaty        | Prowizja za wcześniejszą spłatę    | `% do MMM RRRR`                              |

Reguły wizualne wiersza:

- Wiersze o **identycznych** wartościach w obu ofertach: tło `var(--track)`, kolor `var(--muted)`, kolumna `Δ` pokazuje `=`. Ukrywane przez toggle `Tylko różnice` (4.2).
- Wiersze różniące się: standardowy wygląd; komórka z wartością **lepszą** dla wskaźnika „mniej znaczy lepiej” (np. oprocentowanie, prowizja, koszty) ma cienki marker `▌` po lewej w kolorze `var(--accent-sage-deep)`.
- Komórki z wyłączonymi sekcjami (`Koszty: wył.`, `Nadpłaty: wył.`) renderowane jako `—` w kolorze `var(--muted)`.

---

## 6. Sekcja 3.4 — KPI grid

Siatka `4 wskaźniki × (Oferta A | Δ | Oferta B)`. Dokładnie te same cztery KPI co w pasku wyników na zakładce `Kalkulator` (`Pierwsza rata`, `Suma wszystkich płatności`, `Odsetki`, `Koszty okołokredytowe`) — komponent kafelka `Kpi` jest ponownie używany.

Układ każdego wiersza KPI:

```
┌───────────────────┬──────────┬───────────────────┐
│  Kafelek Kpi (A) │    Δ     │  Kafelek Kpi (B)  │
│  wartość + meta  │  B − A   │  wartość + meta   │
└───────────────────┴──────────┴───────────────────┘
```

Każda kolumna oferty zawiera:

1. `Pierwsza rata` (= `result.firstInstallment`) — wartość `zł`, meta: `tryb rat · rodzaj stopy · %`.
2. `Suma wszystkich płatności` (= `result.totalPayments`) — wartość `zł`, meta: `oddasz X% pożyczonej kwoty` (`= result.totalPayments / loanAmount × 100`).
3. `Odsetki` (= `result.totalInterest`) — wartość `zł`, meta: `% od kapitału`.
4. `Koszty okołokredytowe` (= `result.totalCosts`) — wartość `zł`, meta: `prowizja … · wycena …`.

Środkowa kolumna `Δ` dla każdego wskaźnika prezentuje:

- liczbę `B − A` w mono (`+1 234 zł` / `−2 567 zł`),
- strzałkę `↑` lub `↓` przy znaku,
- procentową zmianę względem A w nawiasie (`(+1,3%)` / `(−5,2%)`),
- kolor: `var(--c-int)` gdy `B > A` (B gorsza) i `var(--accent-sage-deep)` gdy `B < A` (B lepsza).

Kafelek oferty z **mniejszą wartością** (czyli lepszej dla wskaźników „mniej znaczy lepiej”) dostaje znacznik `✓ lider` w kolorze `var(--accent-sage-deep)` i tło `var(--accent-sage-soft)`. Brak znacznika gdy `B = A`.

---

## 7. Sekcja 3.5 — Para donutów „Struktura wszystkich płatności”

**Ponowne wykorzystanie:** komponent `<Donut data={...} centerLabel="Razem" centerValue={`${(total/1000).toFixed(0)}k`} />` z `charts.jsx` bez modyfikacji.

Dwa donuty obok siebie (`A` po lewej, `B` po prawej), każdy z czterema segmentami w identycznych kolorach jak w widoku `Kalkulator`:

| Segment               | Wartość                    | Kolor CSS       |
| --------------------- | -------------------------- | --------------- |
| Kapitał               | `loanAmount`               | `var(--c-cap)`  |
| Odsetki               | `result.totalInterest`     | `var(--c-int)`  |
| Koszty okołokredytowe | `result.totalCosts`        | `var(--c-cost)` |
| Nadpłaty              | `result.totalOverpayments` | `var(--c-over)` |

Konfiguracja sekcji:

- Oba donuty mają **identyczną wartość `size`** (np. 200 px) i **wspólną skalę liczbową** — dzięki temu wielkość pierścienia jest porównywalna wzrokowo (każda oferta to ta sama 100% pula).
- Jedna wspólna legenda nad parą, identyfikująca kolory + jednostkę.
- Pod każdym donutem etykieta: `A`/`B` + `nazwa oferty` + `Σ result.totalPayments` w `zł`.
- Między donutami opcjonalna kolumna delty (`Δ segmentów`): cztery wiersze `Kapitał / Odsetki / Koszty / Nadpłaty`, każdy z wartością `B − A` w `zł` i ze znakiem.
- Toggle `Pokaż wykluczone segmenty` (4.2) decyduje, czy segment o wartości `0` jest pomijany w danych przekazanych do `Donut`, czy renderowany jako kreska (`0,00 zł`).

---

## 8. Sekcja 3.6 — Para donutów „Struktura pierwszej raty”

**Ponowne wykorzystanie:** ten sam komponent `<Donut size={160} thickness={22} centerLabel="rata" centerValue={fmtPLN(rata, 0)} />`.

Dwa donuty obok siebie (`A` i `B`), każdy z **dwoma segmentami** zgodnie ze specyfikacją z `wykresy.md` § 5.2:

| Segment | Wartość                    | Kolor CSS      |
| ------- | -------------------------- | -------------- |
| Kapitał | `result.rows[0].principal` | `var(--c-cap)` |
| Odsetki | `result.rows[0].interest`  | `var(--c-int)` |

Dla rat malejących oraz ofert z karencją (`Początek spłat kapitału > Data uruchomienia`) tytuł karty jest dynamiczny:

- standardowo: `Struktura pierwszej raty`,
- w okresie karencji (`rows[0].principal === 0`): `Pierwsza rata (okres karencji)` — dodatkowo segment kapitału jest renderowany jako pusty pierścień, a centralna etykieta to `100% odsetek`.

Pod każdym donutem etykieta: `A`/`B` + `nazwa oferty` + `rata = X zł` + `oprocentowanie startowe %`.
Między donutami pojedynczy wskaźnik `Δ raty` = `rata_B − rata_A` w `zł`, kolorowany wg konwencji § 14.

---

## 9. Sekcja 3.7 — Wykres trendu „Harmonogram spłaty”

To kluczowa sekcja porównania w czasie. Zapewniamy **dwa tryby**, przełączane kontrolką `Tryb wykresu trendu` (4.2):

### 9.1. Tryb `nakładka` (domyślny)

Pojedynczy wykres zbudowany na bazie `<TrendChart>`, w którym:

- **dwie linie „Pozostało do spłaty”** są nałożone na siebie (A w kolorze `var(--offer-a)`, B w kolorze `var(--offer-b)`),
- **słupki skumulowane** są ukryte. Powód: łączenie dwóch stacków w tej samej kategorii roku (parą obok siebie) przeszło w testach makietowych jako trudne do odczytania przy 20+ słupkach/rok — nakładka linii salda jest zdecydowanie czytelniejsza dla dwóch ofert.

Rozszerzenie komponentu `TrendChart`:

- Nowa, **opcjonalna** prop `series?: { name: string, color: string, yearly: YearAggregate[] }[]` (max 2 pozycje w tym widoku).
- Gdy `series` jest podane, komponent:
  - nie renderuje słupków (`stack`),
  - dla każdej pozycji `series[i]` rysuje linię „Pozostało do spłaty” w kolorze `series[i].color`, węzły `r=4 px`, `stroke-width: 2 px`,
  - zachowuje oś X kategorialną (rok) zorientowaną do **unii zakresów lat** obu ofert (najwcześniejszy rok startu → najpóźniejszy rok końca),
  - oś Y lewa: maks. = `ceil(max(saldo z obu serii) / 50000) * 50000`,
  - tooltip per rok wymienia saldo obu ofert (jeden wiersz `A: ... zł`, jeden `B: ... zł`, dodatkowo `Δ: B − A`).
- Gdy `series` nie jest podane — działa tak jak dotąd (`rows` + `yearly` jednej oferty).

Legenda nad wykresem: dokładnie dwie pozycje (`A: <nazwa>` w swoim kolorze, `B: <nazwa>` w swoim).

Tytuł dynamiczny: `Harmonogram spłaty — porównanie: <min(startDate) słownie> – <max(endDate) słownie>`.

### 9.2. Tryb `obok siebie`

Dwa wykresy `<TrendChart rows={offer.result.rows} yearly={offer.result.yearly} />` renderowane w jednym rzędzie (50% / 50% szerokości). Każdy wykres dziedziczy swą pełną zawartość — słupki stacked + linia salda — dokładnie jak na widoku `Kalkulator`. Pod każdym wykresem etykieta `A` / `B` + nazwa oferty.

Wymóg porównywalności wzrokowej: w tym trybie **wymuszamy wspólne maks. osi Y** (lewej i prawej) wyznaczone dla obu ofert łącznie. Propagacja przez nowe propsy `forcedMaxLeft?: number` i `forcedMaxRight?: number` w `TrendChart` (patrz 11). Bez tego porównanie kształtu krzywych jest mylące — automatyczne skalowanie sprawi, że niższa kwota kredytu „wygląda jak ta sama wielkość”.

---

## 10. Sekcja 3.8 — Tabela różnic kosztowych

Tabela 4 kolumn: `Pozycja | Oferta A | Oferta B | Δ (= B − A)`.

Wiersze:

| Pozycja                                | Źródło                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| Kapitał                                | `loanAmount`                                                                 |
| Odsetki — łącznie                      | `result.totalInterest`                                                       |
| Odsetki — w okresie ubezp. pomostowego | `Σ interest dla rows[0..bridgeMonths-1]`                                     |
| Prowizja za udzielenie                 | `result.commission`                                                          |
| Opłata za wycenę                       | `result.valuationFee`                                                        |
| Ubezpieczenia (wszystkie)              | `result.totalCosts − commission − valuationFee` (suma składek)               |
| Nadpłaty                               | `result.totalOverpayments`                                                   |
| Prowizja za wcześniejszą spłatę        | część kosztów wynikająca z nadpłat (osobne wyliczenie z `nadplaty.md` § 5.4) |
| **SUMA — całkowity koszt kredytu**     | `result.totalPayments`                                                       |
| **Oddasz do banku [%]**                | `result.totalPayments / loanAmount × 100`                                    |

Każdy wiersz zawiera:

- kolumna `A`: wartość (mono, `zł` lub `%`),
- kolumna `B`: wartość (mono, `zł` lub `%`),
- kolumna `Δ`: `B − A` w mono ze znakiem:
  - kolor `var(--c-int)` gdy `B > A` (B gorsza) — dla pozycji „mniej znaczy lepiej” (wszystkie wiersze kosztów + SUMA),
  - kolor `var(--accent-sage-deep)` gdy `B < A` (B lepsza),
  - inwersja koloru dla wiersza `Nadpłaty` (więcej nadpłat = lepiej).

Wiersz `SUMA` jest pogrubiony i ma cieniowane tło; wiersz `Oddasz do banku [%]` jest wyróżniony jak akcent.

„Lider” (oferta z lepszą wartością) w danym wierszu jest oznaczany cienkim markerem `▌` po lewej stronie komórki A lub B — zgodnie z regułą „mniej znaczy lepiej” (z inwersją dla `Nadpłaty`). Brak markera gdy `A = B`.

---

## 11. Wymagane rozszerzenia komponentów wykresów

Cel: maksymalnie ponowne wykorzystanie istniejących komponentów z `charts.jsx`. Nie wprowadzamy nowych wykresów.

### 11.1. `Donut` — bez zmian

Komponent działa bez modyfikacji — w sekcjach 3.5 i 3.6 jest wywoływany identycznie jak na zakładce `Kalkulator`. Decyzja o ukrywaniu zerowych segmentów rozstrzygana jest poza komponentem (filtrowaniem `data` przed przekazaniem).

### 11.2. `TrendChart` — opcjonalne propsy

```
TrendChart({
  // dotychczas:
  rows, yearly, w, h,
  // NOWE — opcjonalne, niełamiące dotychczasowych użyć:
  series?:          { name: string, color: string, yearly: YearAggregate[] }[],   // 1–2 pozycje; jeśli podane → tryb nakładki
  forcedMaxLeft?:   number,                                                       // wymuszone maks. osi salda
  forcedMaxRight?:  number,                                                       // wymuszone maks. osi sumy płatności
  showBars?:        boolean = true,                                               // false dla trybu nakładki ofertowej
})
```

Domyślne wartości zapewniają **pełną wsteczną zgodność** z bieżącym użyciem na zakładce `Kalkulator`.

### 11.3. `TrendChartHeader` — rozszerzony props `legendSeries?`

Gdy podany, header renderuje legendę z dwoma pozycjami `A: <nazwa>` + `B: <nazwa>` (każda z własnym swatchem koloru) zamiast standardowej legendy `Odsetki / Koszty / Kapitał / Nadpłaty / Saldo`.

---

## 12. Zdarzenia i reguły aktualizacji

- Wszystkie wartości są **migawkami** zapisanymi w momencie `savedAt`. Widok nie rekalkuluje kalkulacji w locie; ewentualne odświeżenie wymaga przejścia do `Kalkulator` i ponownego zapisu oferty.
- Wyjątek: oferta `isDraft: true` (bieżąca robocza) jest rekalkulowana na żywo, identycznie jak na zakładce `Kalkulator` (te same zależności `useMemo`).
- Zmiana zawartości slotu (4.1) lub akcji `↔ Zamień strony` (4.2) przelicza:
  - delty `Δ` w 3.3, 3.4 i 3.8 (znaki się odwracają przy zamianie stron),
  - markery lidera (która strona ma `✓`),
  - skale wspólne `forcedMaxLeft/Right` w trybie `obok siebie` (9.2).
- Zmiana `Trybu wykresu trendu` (4.2) zmienia tylko sposób renderowania 3.7.

---

## 13. Walidacje i komunikaty

| Sytuacja                                      | Komunikat / zachowanie                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Slot A i/lub B pusty                          | Pusty stan: ilustracja + tekst „Wybierz dwie oferty do porównania”. Sekcje 3.3 – 3.8 ukryte.      |
| Próba wybrania tej samej oferty w obu slotach | Picker odrzuca wybór, komunikat: „Oferta jest już wybrana po drugiej stronie”.                    |
| Oferta A lub B z błędami walidacji wejść      | Kolumna szara, baner ⚠ + przycisk „Otwórz w kalkulatorze”. 3.3 widoczna, sekcje 3.4 – 3.8 ukryte. |
| Oferty mają różne `loanAmount`                | Banner informacyjny nad 3.4: „Oferty mają różne kwoty kredytu — porównuj ostrożnie”.              |
| Oferty mają różne `period (n)`                | Banner informacyjny nad 3.7: „Różne okresy spłaty — wykres trendu pokazuje unię lat”.             |
| Usunięto ofertę z `Twoje kalkulacje`          | Slot przechodzi w stan pusty z toastęm „Oferta została usunięta”.                                 |

---

## 14. Reguły obliczania `Δ`

Dla każdej metryki `M` w sekcjach 3.3, 3.4, 3.5, 3.6, 3.7 i 3.8:

```
Δ = M(offerB) − M(offerA)
```

Konwencja prezentacji:

- `+` w kolorze ostrzegawczym (`var(--c-int)`) — wartość B większa od A (czyli B gorsza, droższe rozwiązanie, w wierszach „mniej znaczy lepiej”),
- `−` w kolorze akcentu pozytywnego (`var(--accent-sage-deep)`) — wartość B mniejsza (czyli B lepsza, tańsza),
- dla wiersza `Nadpłaty` inwersja kolorów (więcej nadpłat = lepiej, jeśli celem jest skrócenie kredytu),
- przy akcji `↔ Zamień strony` (4.2) wszystkie znaki delt się odwracają (`Δ` → `−Δ`), kolory dostosowują się odpowiednio.

Wartości formatowane przez `fmtPLN` z `pl-PL`, dwa miejsca po przecinku.

---

## 15. Drukowanie i eksport

- `Drukuj` (4.2): generuje wydruk dla A4 poziomo. Sekcje 3.3 i 3.4 zawsze na pierwszej stronie. Wykres trendu (3.7) zawsze w trybie `nakładka` (bez względu na bieżące ustawienie ekranu), ponieważ generuje czytelny obrazek na 1 stronie.
- `Eksport CSV` (4.2): jeden plik, kolumny:
  ```
  section,metric,offer_a,offer_b,delta
  ```
  Eksportowane sekcje: 3.3 (parametry wejściowe), 3.4 (KPI), 3.8 (różnice). Wartości liczbowe bez separatora tysięcy, z `.` jako separatorem dziesiętnym (kompatybilność z arkuszami zagranicznymi); dodatkowy `;` jako separator kolumn (kompatybilność z Excel pl‑PL).

---

## 16. Dostępność i UX

- Każdy slot oferty w 4.1 ma `aria-label` w postaci `Oferta A: <nazwa>, kwota <kwota>, oprocentowanie <%>` (i analogicznie dla B).
- Tabela 3.3 i 3.8: nawigacja klawiaturą po komórkach (`tab` + `arrows`).
- Donuty 3.5/3.6: legenda jest zawsze obecna jako element opisowy; same łuki donuta mają `aria-label` opisujący segment.
- Wykres 3.7 w trybie nakładki: każda z dwóch linii ma `<title>` z nazwą oferty + saldem na koniec ostatniego widocznego roku.
- Kontrast lidera (`✓`) niesie informację także kolorem **i** glifem (zgodność z WCAG 1.4.1).
- Czytniki ekranu: kolumny `A` i `B` mają `<th scope="col">` z nazwą oferty; wiersze 3.3/3.8 mają `<th scope="row">`. Kolumna `Δ` ma `<th scope="col">Różnica (B − A)</th>`.

---

## 17. Uwagi implementacyjne (Angular)

- Stan widoku w usłudze `OfferComparisonService`:
  ```
  offerAId:        Signal<string | null>
  offerBId:        Signal<string | null>
  trendMode:       Signal<'overlay'|'side-by-side'>
  showZeroSegments: Signal<boolean>
  diffOnly:        Signal<boolean>          // toggle „Tylko różnice” w 3.3
  ```
- Źródło danych ofert: `SavedCalculationsService.list$` + `CalcService.compute()` per `input` zapisany w localStorage.
- Kolory ofert: dwa odcienie przygotowane w `:root` (`--offer-a`, `--offer-b`), kontrastujące ze sobą i z paletą segmentów (`--c-cap/int/cost/over`), spójne w trybie jasnym i ciemnym.
- Komponenty wielokrotnego użytku:
  - `<app-donut>` — komponent równoważny `Donut` z makiety,
  - `<app-trend-chart>` — komponent z propsami z § 11.2 (Chart.js datasety: linie z `tension: 0`, punkty `r: 4`).
- Brak nowych zapisów do persistence — widok jest read‑only względem ofert.
- Routing: `/porownanie?a=<id>&b=<id>&mode=overlay`.
- Akcja `↔ Zamień strony`: prosta zamiana sygnałów `offerAId ↔ offerBId`; pozostałe selektory (`compareSelector$`) reagują automatycznie.

---

## 18. Zależności od innych zakładek

- `Twoje kalkulacje` — źródło prawdy dla listy ofert (`Offer.id`, `Offer.name`, `Offer.savedAt`).
- `Kalkulator` — źródło wykresów (`Donut`, `TrendChart`, `TrendChartHeader`), źródło bieżącej oferty roboczej (`isDraft: true`), oraz cel akcji „Otwórz w kalkulatorze”.
- `Słownik` — link kontekstowy z nagłówków wierszy w 3.3 / 3.8 (np. `LTV`, `WIBOR`, `Marża`, `Ubezpieczenie pomostowe`, `Prowizja za wcześniejszą spłatę`) — kliknięcie nazwy pozycji otwiera definicję w `Słowniku` w modalu.

---

## 19. Co celowo POMINIĘTO w widoku

- Porównywanie 3+ ofert jednocześnie — świadome ograniczenie projektowe (patrz § 1). Porównanie par jest najczęstszym realnym scenariuszem decyzyjnym, a układ dwukolumnowy + jedna delta dają najwyższą czytelność. Użytkownik, który chce zestawić więcej wariantów, robi to serią par (A‑B, A‑C, B‑C).
- Edycja danych wejściowych ofert (zawsze przez `Kalkulator`).
- Liczenie RRSO (`APR`) — nie występuje w obecnym modelu obliczeniowym `CalcService`; jeśli zostanie dodane w przyszłości, należy dodać je do `result` i jako wiersz w 3.4 oraz 3.8 (już zarezerwowane miejsce w specyfikacji wierszy 3.8 — sekcja „SUMA”).
- Wielowariantowe analizy „co‑jeśli” (np. WIBOR ±1pp) — wykraczają poza zakres tej zakładki; rekomendowane jako kolejny widok lub jako sekcja w `Kalkulator`.
