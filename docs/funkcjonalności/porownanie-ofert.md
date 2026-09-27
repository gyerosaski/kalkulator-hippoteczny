# Specyfikacja funkcjonalna widoku „Porównanie ofert”

Zakres: co i w jaki sposób zestawiamy pomiędzy zapisanymi kalkulacjami; opis interakcji, danych źródłowych
oraz ponownego wykorzystania wykresów z widoku „Kalkulator” (dwa donuty + wykres trendu). Architektura
techniczna (modele danych, decyzje implementacyjne) — `docs/technikalia/porownanie-ofert.md`.

---

## 1. Cel i zakres

Widok „Porównanie ofert” zestawia **dokładnie dwie** wcześniej zapisane kalkulacje w jednym widoku, aby
użytkownik mógł szybko odpowiedzieć na pytania:

- Która oferta jest **najtańsza całkowicie** (suma wszystkich płatności)?
- Która ma **najniższą pierwszą ratę** (cashflow miesięczny na starcie)?
- Która ma **najniższe odsetki** (czysty koszt finansowania)?
- Która ma **najniższe koszty okołokredytowe** (prowizja, wycena, ubezpieczenia)?
- Jak różnią się **profile spłaty w czasie** (linia salda + struktura roczna)?
- Jakie parametry wejściowe (oprocentowanie, okres, tryb rat, nadpłaty) odpowiadają za te różnice?

Wszystkie wartości w widoku są wyłącznie odczytami — nie modyfikuje się tu danych wejściowych ofert.
Edycja danych wejściowych odbywa się wyłącznie w widoku „Kalkulator” — ofertę wczytuje się tam z listy
w „Twoje kalkulacje”.

Ograniczenie do dwóch ofert jest decyzją projektową. Para to najczęstszy realny scenariusz decyzyjny
(„oferta z banku A vs oferta z banku B”), a układ dwukolumnowy pozwala zestawić wartości obok siebie bez
przeciążania wzroku. Para generuje też jedną deltę (`Δ = B − A`), co czyni interpretację różnic jednoznaczną.

Wszystkie liczby pochodzą z **przeliczenia na żywo** bieżącym silnikiem na podstawie zapisanej migawki
wejść oferty — porównanie zawsze odzwierciedla aktualną logikę obliczeń.

---

## 2. Układ widoku

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Pasek wyboru ofert (2 sloty: A i B)        │ Akcje globalne               │
├──────────────────────────────────────────────────────────────────────────┤
│ KPI — 4 wskaźniki × 2 oferty + środkowa kolumna delty Δ                  │
├──────────────────────────────────────────────────────────────────────────┤
│ Para donutów „Struktura wszystkich płatności” — A obok B                 │
├──────────────────────────────────────────────────────────────────────────┤
│ Tabela różnic kosztowych — pozycja | A | B | Δ (= B − A)                  │
├──────────────────────────────────────────────────────────────────────────┤
│ Para donutów „Struktura pierwszej raty” — A obok B                       │
├──────────────────────────────────────────────────────────────────────────┤
│ Wykres trendu — nakładka 2 linii salda lub 2 pełne wykresy obok siebie    │
├──────────────────────────────────────────────────────────────────────────┤
│ Tabela parametrów wejściowych — kolumny: parametr | A | B | Δ            │
└──────────────────────────────────────────────────────────────────────────┘
```

Liczba kolumn ofertowych jest stała: **dwie**. Dopóki oba sloty nie są wypełnione, żadna z sekcji
wynikowych się nie pokazuje — widok ogranicza się do nagłówka z paskiem slotów, a pusty slot jest
przyciskiem `+ Wybierz ofertę` otwierającym listę zapisanych kalkulacji.

Konwencja A / B: `A` zajmuje zawsze lewą kolumnę i jest „bazą” (względem niej liczone są delty `Δ = B − A`);
`B` — prawą, jest „porównywaną”. Przycisk `↔ Zamień strony` zamienia `A ↔ B`, co odwraca znak delt.

---

## 3. Elementy interaktywne

### 3.1. Pasek wyboru ofert

- Dwa sloty — `Oferta A` (lewy) i `Oferta B` (prawy), każdy jako chip z nazwą wybranej kalkulacji lub
  placeholder `+ Wybierz ofertę`.
- Kliknięcie slotu otwiera okno z listą wszystkich zapisanych kalkulacji (single-select). Lista ukrywa:
  - pozycję już wybraną w przeciwnym slocie (nie można porównać oferty samej ze sobą),
  - pozycję z błędami walidacji (nie ma pewności, że da się wyliczyć wszystkie wartości).
- Pozycja `Bieżąca kalkulacja` wczytuje bieżącą kalkulację i odświeża porównanie na każdą zmianę
  parametrów w zakładce „Kalkulator”. Jest oznaczona badge'em `bieżąca` — zarówno na liście w oknie
  wyboru, jak i na chipie slotu; po najechaniu na badge pojawia się podpowiedź
  `Kalkulacja wczytana na zakładce „Kalkulator”`.
- Wyczyszczenie slotu: ikona kosza na chipie (slot wraca do stanu pustego).
- Przycisk `↔` między slotami zamienia `A ↔ B`.
- Do pokazania sekcji wynikowych wymagane jest wypełnienie **obu** slotów.

### 3.2. Akcje globalne

| Nazwa                       | Działanie                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `↔ Zamień strony`           | zamienia oferty `A ↔ B`; odwraca znak wszystkich delt (`Δ → −Δ`)                                         |
| `Tryb wykresu trendu`       | `nakładka` / `obok siebie`. Domyślnie `nakładka`                                                         |
| `Pokaż wykluczone segmenty` | przełącznik; domyślnie wyłączony — segmenty puste (np. `Nadpłaty = 0`) chowane w donutach i tabeli       |
| `Tylko różnice`             | przełącznik w tabeli parametrów; domyślnie wyłączony — włączony ukrywa wiersze identyczne w obu ofertach |
| `Drukuj`                    | **ODŁOŻONE** — docelowo wydruk widoku w formacie A4 poziomo                                              |
| `Eksportuj CSV`             | **ODŁOŻONE** — docelowo eksport tabel jako arkusz `metric, offer_a, offer_b, delta`                      |

### 3.3. Akcje per kolumna (nagłówek oferty)

| Element         | Działanie                                                                |
| --------------- | ------------------------------------------------------------------------ |
| Etykieta strony | badge `A` (lewa) lub `B` (prawa) — identyfikuje stronę porównania        |
| Nazwa oferty    | edycja inline **ODŁOŻONA** — zmiana nazwy wyłącznie w „Twoje kalkulacje” |
| Znacznik koloru | kolor identyfikujący ofertę na wykresie trendu                           |
| `Zmień ofertę`  | kliknięcie chipa otwiera dialog wyboru dla tego slotu                    |

---

## 4. KPI

Siatka `4 wskaźniki × (Oferta A | Δ | Oferta B)` — te same cztery wskaźniki co w pasku wyników na zakładce
„Kalkulator”:

1. **Pierwsza rata** — wartość `zł`, meta: `tryb rat · rodzaj stopy · %`.
2. **Suma wszystkich płatności** — wartość `zł`, meta: `oddasz X% pożyczonej kwoty`.
3. **Odsetki** — wartość `zł`, meta: `% od kapitału`.
4. **Koszty okołokredytowe** — wartość `zł`, meta: `prowizja … · wycena …`.

Środkowa kolumna `Δ` dla każdego wskaźnika prezentuje:

- liczbę `B − A` (`+1 234 zł` / `−2 567 zł`),
- procentową zmianę względem A w nawiasie (`(+1,3%)` / `(−5,2%)`),
- kolor: ostrzegawczy gdy `B > A` (B gorsza), pozytywny gdy `B < A` (B lepsza).

Kafelek oferty z **mniejszą wartością** (lepszą dla wskaźników „mniej znaczy lepiej”) dostaje znacznik
`✓ lider`. Brak znacznika gdy `B = A`.

---

## 5. Para donutów

Obie pary donutów mają wspólną charakterystykę opisaną poniżej, ale **nie sąsiadują ze sobą w widoku** —
między „Strukturą wszystkich płatności” a „Strukturą pierwszej raty” prezentowana jest tabela różnic
kosztowych (§ 6).

### 5.1. „Struktura wszystkich płatności”

Dwa donuty obok siebie (`A` po lewej, `B` po prawej), każdy z czterema segmentami w identycznych kolorach
jak w widoku „Kalkulator”: Kapitał, Odsetki, Koszty okołokredytowe, Nadpłaty.

- Oba donuty mają identyczny rozmiar i **wspólną skalę liczbową** — wielkość pierścienia jest porównywalna
  wzrokowo (każda oferta to ta sama 100% pula).
- Jedna wspólna legenda nad parą.
- Pod każdym donutem etykieta: `A`/`B` + nazwa oferty + suma wszystkich płatności w `zł`.
- Między donutami opcjonalna kolumna delty segmentów (`Kapitał / Odsetki / Koszty / Nadpłaty`, każdy
  z wartością `B − A` ze znakiem).
- Przełącznik „Pokaż wykluczone segmenty” decyduje, czy segment o wartości `0` jest pomijany, czy
  renderowany jako `0,00 zł`.

### 5.2. „Struktura pierwszej raty”

Dwa donuty obok siebie, każdy z **dwoma segmentami**: Kapitał i Odsetki.

Dla rat malejących oraz ofert z karencją tytuł karty jest dynamiczny:

- standardowo: `Struktura pierwszej raty`,
- gdy **obie** oferty są w okresie karencji (kapitał = 0): `Pierwsza rata (okres karencji)`; oferta
  w karencji ma centralną etykietę `100% / odsetek` i podpis `(okres karencji)`.

Pod każdym donutem etykieta: `A`/`B` + nazwa oferty + `rata = X zł` + `oprocentowanie startowe %`.
Między donutami wskaźnik `Δ raty` = `rata_B − rata_A` w `zł`.

---

## 6. Tabela różnic kosztowych

Tabela 4 kolumn: `Pozycja | Oferta A | Oferta B | Δ (= B − A)`.

| Pozycja                                | Źródło                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kapitał                                | kwota kredytu                                                                                                                                                                   |
| Odsetki — łącznie                      | suma odsetek                                                                                                                                                                    |
| Odsetki — w okresie ubezp. pomostowego | suma odsetek miesięcy pomostowych; `—` gdy sekcja kosztów wyłączona lub brak okresu pomostowego                                                                                 |
| Prowizja za udzielenie                 | składowa kosztów „prowizja za udzielenie”                                                                                                                                       |
| Opłata za wycenę                       | składowa kosztów „opłata za wycenę”                                                                                                                                             |
| Ubezpieczenia (wszystkie)              | suma ubezpieczeń (nieruchomości, na życie, utraty pracy, dodatkowe koszty) oraz opłat za uruchomienie transz; celowo **bez** prowizji za wcześniejszą spłatę — ma własny wiersz |
| Nadpłaty                               | suma nadpłat                                                                                                                                                                    |
| Prowizja za wcześniejszą spłatę        | suma prowizji za wcześniejszą spłatę; `—` gdy sekcja nadpłat wyłączona                                                                                                          |
| **SUMA — całkowity koszt kredytu**     | suma wszystkich płatności                                                                                                                                                       |
| **Oddasz do banku [%]**                | suma wszystkich płatności / kwota kredytu × 100                                                                                                                                 |

Każdy wiersz: kolumna `A` (wartość), kolumna `B` (wartość), kolumna `Δ` (`B − A` ze znakiem):

- kolor ostrzegawczy gdy `B > A` (B gorsza) — dla pozycji „mniej znaczy lepiej” (wszystkie wiersze kosztów + SUMA),
- kolor pozytywny gdy `B < A` (B lepsza),
- inwersja koloru dla wiersza „Nadpłaty” (więcej nadpłat = lepiej).

Wiersz SUMA jest pogrubiony i ma cieniowane tło; wiersz „Oddasz do banku [%]” jest wyróżniony jak akcent.
„Lider” (oferta z lepszą wartością) jest oznaczany cienkim markerem po lewej stronie komórki A lub B —
zgodnie z regułą „mniej znaczy lepiej” (z inwersją dla „Nadpłaty”). Brak markera gdy `A = B`.

---

## 7. Wykres trendu „Harmonogram spłaty”

Dwa tryby, przełączane kontrolką „Tryb wykresu trendu”:

### 7.1. Tryb `nakładka` (domyślny)

- **dwie linie „Pozostało do spłaty”** nałożone na siebie (każda w kolorze swojej oferty), z węzłami;
  bez słupków skumulowanych — nakładka linii salda jest czytelniejsza dla dwóch ofert,
- oś X kategorialna (rok) obejmuje **unię zakresów lat** obu ofert (najwcześniejszy rok startu →
  najpóźniejszy rok końca); brak danych oferty w roku = brak punktu,
- oś Y skalowana do maksymalnego salda obu ofert,
- tooltip per rok wymienia saldo obu ofert (`A: … zł`, `B: … zł`, dodatkowo `Δ: B − A`).

Legenda nad wykresem: dokładnie dwie pozycje (`A: <nazwa>`, `B: <nazwa>`). Tytuł dynamiczny:
`Harmonogram spłaty — porównanie: <pierwszy rok> – <ostatni rok>`.

### 7.2. Tryb `obok siebie`

Dwa pełne wykresy trendu w jednym rzędzie (50% / 50%). Każdy ma swą pełną zawartość — słupki skumulowane +
linia salda — dokładnie jak na widoku „Kalkulator”. Pod każdym etykieta `A` / `B` + nazwa oferty.

Wymóg porównywalności wzrokowej: w tym trybie **wymuszane są wspólne maksima osi Y** (salda i słupków)
wyznaczone dla obu ofert łącznie. Bez tego porównanie kształtu krzywych byłoby mylące — automatyczne
skalowanie sprawiłoby, że niższa kwota kredytu „wygląda jak ta sama wielkość”.

---

## 8. Tabela parametrów wejściowych

Tabela 4 kolumn: `Parametr | Oferta A | Oferta B | Δ`, wiersze pogrupowane nagłówkami sekcji formularza.
Cel: pokazać, **co użytkownik zmienił** między dwiema ofertami. Czyta wyłącznie migawkę wejść, więc działa
także dla ofert z błędami walidacji.

Kolumna `Δ` zależnie od typu parametru:

- liczby (`zł`, `%`, miesiące): `Δ = B − A` ze znakiem i kolorem (patrz § 9),
- daty: różnica w miesiącach (`+12 m-cy`, `−3 m-ce`),
- wybory tekstowe (`równe` ↔ `malejące`, `zmienna` ↔ `stała`): `≠` w kolorze ostrzegawczym lub `=` neutralnie,
- listy złożone (dodatkowe koszty, okresy oprocentowania): liczba pozycji + `≠`, jeśli zawartość się różni.

Wiersze o identycznych wartościach (`Δ = 0` lub `=`) są opcjonalnie ukrywane przez przełącznik „Tylko różnice”.

Wiersze:

| Grupa           | Pole                               | Format prezentacji                                                    |
| --------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Dane podstawowe | Wartość nieruchomości              | `zł`                                                                  |
| Dane podstawowe | Kwota kredytu                      | `zł`                                                                  |
| Dane podstawowe | LTV                                | `%` (2 miejsca)                                                       |
| Dane podstawowe | Okres kredytowania                 | `X lat Y m-cy` (oraz `Σ miesięcy`)                                    |
| Dane podstawowe | Data uruchomienia                  | miesiąc i rok                                                         |
| Dane podstawowe | Początek spłat kapitału (karencja) | `MMM RRRR (N m-cy)` lub `bez karencji`; Δ = różnica długości karencji |
| Dane podstawowe | Tryb rat                           | `równe` \| `malejące`                                                 |
| Dane podstawowe | Rodzaj stopy                       | `zmienna` \| `stała`                                                  |
| Dane podstawowe | Oprocentowanie nominalne (start)   | `%` (2 miejsca)                                                       |
| Dane podstawowe | Wskaźnik referencyjny / marża      | `%` + `%` (tylko dla stopy zmiennej)                                  |
| Dane podstawowe | Liczba okresów oprocentowania      | `n`                                                                   |
| Koszty          | Prowizja za udzielenie             | `% (= zł)`                                                            |
| Koszty          | Opłata za wycenę                   | `zł`                                                                  |
| Koszty          | Ubezpieczenie pomostowe            | `+% przez N m-cy`                                                     |
| Koszty          | Ubezp. nieruchomości               | `częstotliwość · sposób · wartość`                                    |
| Koszty          | Ubezp. niskiego wkładu             | `+%`                                                                  |
| Koszty          | Ubezp. na życie                    | `częstotliwość · sposób · wartość`                                    |
| Koszty          | Ubezp. od utraty pracy             | `częstotliwość · sposób · wartość`                                    |
| Koszty          | Dodatkowe koszty (lista)           | `n pozycji`; Δ = `≠/=`                                                |
| Koszty          | Promocyjna obniżka oprocentowania  | `−% · od → do`                                                        |
| Transze         | Liczba transz                      | `n`                                                                   |
| Transze         | Suma opłat za uruchomienie         | `zł`                                                                  |
| Nadpłaty        | Reguły nadpłat                     | `n pozycji`; Δ = `≠/=`                                                |
| Nadpłaty        | Docelowa rata miesięczna           | `zł · skutek · od → do`                                               |
| Nadpłaty        | Prowizja za wcześniejszą spłatę    | `% do MMM RRRR`                                                       |

Reguły wizualne wiersza:

- Wiersze o identycznych wartościach: stonowane tło, kolumna `Δ` pokazuje `=`. Ukrywane przez „Tylko różnice”.
- Wiersze różniące się: standardowy wygląd; komórka z wartością **lepszą** dla wskaźnika „mniej znaczy
  lepiej” (np. oprocentowanie, prowizja, koszty) ma cienki marker po lewej w kolorze pozytywnym.
- Komórki z wyłączonymi sekcjami (`Koszty: wył.`, `Nadpłaty: wył.`) renderowane jako `—`.

Sekcja jest prezentowana jako **ostatnia** na widoku — po wskaźnikach, wykresach i tabeli różnic — oraz
jako **jedyna** widoczna sekcja wynikowa, gdy któraś z ofert zawiera błędy walidacji wejść.

---

## 9. Reguły obliczania `Δ`

Dla każdej metryki `M` we wszystkich sekcjach z deltą:

```
Δ = M(offerB) − M(offerA)
```

Konwencja prezentacji:

- `+` w kolorze ostrzegawczym — wartość B większa od A (B gorsza, droższe rozwiązanie, w wierszach „mniej znaczy lepiej”),
- `−` w kolorze pozytywnym — wartość B mniejsza (B lepsza, tańsza),
- dla wiersza „Nadpłaty” inwersja kolorów (więcej nadpłat = lepiej),
- przy `↔ Zamień strony` wszystkie znaki delt się odwracają, a kolory dostosowują odpowiednio.

Wartości formatowane w `pl-PL`, dwa miejsca po przecinku.

---

## 10. Walidacje i komunikaty

| Sytuacja                                      | Komunikat / zachowanie                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Slot A i/lub B pusty                          | sekcje wynikowe ukryte; widoczny wyłącznie pasek slotów z placeholderem `+ Wybierz ofertę`      |
| Próba wybrania tej samej oferty w obu slotach | wybór odrzucony: „Oferta jest już wybrana po drugiej stronie”                                   |
| Oferta A lub B z błędami walidacji wejść      | chip oznaczony błędem, baner ostrzegawczy; tabela parametrów widoczna, pozostałe sekcje ukryte  |
| Oferty mają różne kwoty kredytu               | baner informacyjny nad KPI: „Oferty mają różne kwoty kredytu — porównuj ostrożnie”              |
| Oferty mają różne okresy spłaty               | baner informacyjny nad wykresem trendu: „Różne okresy spłaty — wykres trendu pokazuje unię lat” |
| Usunięto ofertę z „Twoje kalkulacje”          | slot przechodzi w stan pusty z toastem „Oferta została usunięta”                                |

**Znana niedoskonałość:** identyfikatorem oferty jest jej **nazwa** — zmiana nazwy kalkulacji w „Twoje
kalkulacje” osierraca slot porównania (objawia się jak usunięcie: pusty slot + toast).

---

## 11. Dostępność i UX

- Każdy slot ma etykietę dostępności w postaci `Oferta A: <nazwa>, kwota <kwota>, oprocentowanie <%>`.
- Donuty: legenda jest zawsze obecna jako element opisowy; łuki mają opis segmentu dla czytników ekranu.
- Wykres trendu w trybie nakładki: każda z dwóch linii ma opis z nazwą oferty + saldem na koniec ostatniego
  widocznego roku.
- Znacznik lidera (`✓`) niesie informację kolorem **i** glifem (zgodność z WCAG 1.4.1).
- Tabele mają semantyczne role; kolumny `A` i `B` opisane nazwą oferty, kolumna `Δ` nagłówkiem `Δ (B − A)`.
- Nawigacja klawiaturą po komórkach tabel — **ODŁOŻONA**.

---

## 12. Zależności od innych zakładek

- „Twoje kalkulacje” — źródło listy ofert do wyboru.
- „Kalkulator” — źródło bieżącej oferty roboczej.

---

## 13. Drukowanie i eksport — ODŁOŻONE

Cała sekcja jest odłożona poza bieżącą iterację. Docelowo:

- `Drukuj`: wydruk dla A4 poziomo; tabele parametrów i KPI zawsze na pierwszej stronie; wykres trendu
  zawsze w trybie nakładka (czytelny obrazek na 1 stronie).
- `Eksport CSV`: jeden plik z kolumnami `section, metric, offer_a, offer_b, delta`; eksportowane sekcje:
  parametry wejściowe, KPI, różnice kosztowe.
