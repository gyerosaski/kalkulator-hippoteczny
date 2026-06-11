# Specyfikacja techniczna widoku „Porównanie ofert”

Zakres: Specyfikacja zakładki `Porównanie ofert` — co i w jaki sposób zestawiamy pomiędzy zapisanymi kalkulacjami; opis interakcji, danych źródłowych oraz **ponownego wykorzystania wykresów z widoku „Kalkulator”** (`Donut` × 2 + `TrendChart`).

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

Modele żyją w `src/app/model/comparison.model.ts`. „Oferta” występuje na dwóch poziomach szczegółowości:

```
ComparableOffer = {            // model widoku slotu i dialogu wyboru (lekki, skalarne metadane)
  id: string,                  // identyfikator = nazwa zapisanej kalkulacji; dla bieżącej — DRAFT_OFFER_ID
  kind: SAVED | DRAFT,
  name, loanAmount, propertyValue, loanPeriodYears, loanPeriodExtraMonths,
  nominalRate, rateType, installmentType,
  firstInstallment, totalInterest, totalCosts, commission, appraisalFee,
  totalOverpayments, totalPayments, hasErrors,
}

ComparisonOfferData = {        // komplet danych oferty wybranej do slotu (sekcje 3.3–3.8)
  offer: ComparableOffer,
  formValue: MortgageFormRawValue | null,   // migawka wejść (SavedCalculationRecord.data)
  computation: OfferComputation | null,     // null = błędy walidacji / nieudane przeliczenie
}

OfferComputation = {           // pełne przeliczenie bieżącym silnikiem
  inputs: MortgageInputs,
  results: MortgageResults,    // m.in. schedule: ScheduleRow[] (≈ dawne rows[])
  yearlyGroups: YearGroup[],   // agregaty roczne (≈ dawne yearly[])
}
```

`ComparisonStateService` przechowuje wyłącznie identyfikatory slotów (`offerAId`/`offerBId`) i wystawia computed `sideA`/`sideB: ComparisonOfferData`. Skalary `ComparableOffer` wybranych ofert są nadpisywane wartościami z `computation.results` (jedno źródło prawdy — patrz § 12).

Konwencja `A` / `B`:

- `offerA` zajmuje zawsze **lewą** kolumnę i jest „bazą” — to względem niej liczone są delty (`Δ = B − A`).
- `offerB` zajmuje prawą kolumnę i jest „porównywaną”.
- Przycisk `↔ Zamień strony` (4.2) zamienia `A ↔ B`, co odwraca znak delt — przydatne, gdy użytkownik chce spojrzeć na różnicę z drugiej perspektywy.

`MortgageResults.schedule` i `YearGroup[]` są dokładnie tymi samymi strukturami, które konsumują wykresy na zakładce `Kalkulator` — dzięki temu komponenty wynikowe są ponownie używane tam, gdzie to bezpieczne (szczegóły w § 11).

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
│       (`app-comparison-donuts-total`, reużycie `ui-donut`)               │
├──────────────────────────────────────────────────────────────────────────┤
│ 3.6  Para donutów „Struktura pierwszej raty” — A obok B                  │
│       (`app-comparison-donuts-installment`, reużycie `ui-donut`)         │
├──────────────────────────────────────────────────────────────────────────┤
│ 3.7  Wykres trendu — nakładka 2 linii „Pozostało do spłaty”             │
│       (`app-comparison-trend-chart`) lub 2× pełny wykres obok siebie    │
│       (`app-results-trend-chart` z wymuszonymi maksimami osi)            │
├──────────────────────────────────────────────────────────────────────────┤
│ 3.8  Tabela różnic — pozycja | A | B | Δ (= B − A)                      │
└──────────────────────────────────────────────────────────────────────────┘
```

Liczba kolumn ofertowych jest stała: **dwie**. Widok pokazuje pusty stan z CTA „Wybierz dwie oferty do porównania”, dopóki oba sloty (`A` i `B`) nie są wypełnione.

---

## 4. Elementy interaktywne

### 4.1. Pasek wyboru ofert

- Typ: **dwa sloty** — `Oferta A` (lewy) i `Oferta B` (prawy), każdy jako chip z nazwą wybranej kalkulacji lub placeholder `+ Wybierz ofertę`.
- Działanie:
  - kliknięcie slotu otwiera okno dialog z listą wszystkich zapisanych kalkulacji (z zakładki `Twoje kalkulacje`) — **single‑select** (jedna pozycja zostaje wybrana, popover zamyka się),
  - lista ukrywa pozycję:
    - która jest już wybrana w przeciwnym slocie (nie można porównać oferty samej ze sobą),
    - która posiada błędy walidacji (nie ma pewności, czy będziemy w stanie wyliczyć wszystkie porównywane wartości)
  - wpis `Bieżąca kalkulacja` wczytujący bieżącą kalkulację i reagujący odświeżeniem porównania na każdą zmianę parametrów kalkulacji w zakładce `Kalkulator`
  - wyczyszczenie slotu: ikona kosza na chipie (slot wraca do stanu pustego),
  - przycisk `↔` między slotami zamienia `A ↔ B` (patrz 4.2 `Zamień strony`).
- Walidacje:
  - wymagane wypełnienie **obu** slotów, aby pokazać sekcje 3.3 – 3.8,

### 4.2. Akcje globalne

| Nazwa                       | Działanie                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `↔ Zamień strony`           | Zamienia oferty `A ↔ B`. Skutkuje odwróceniem znaku wszystkich delt (`Δ` → `−Δ`).                                                    |
| `Tryb wykresu trendu`       | `Segmented`: `nakładka` \| `obok siebie`. Domyślnie `nakładka`. Wpływ na renderowanie sekcji 3.7.                                    |
| `Pokaż wykluczone segmenty` | Toggle. Domyślnie `wyłączony` — segmenty puste (np. `Nadpłaty = 0`) chowane w donutach i tabeli. Włączony — zawsze pokazuj pełną oś. |
| `Tylko różnice`             | Toggle w 3.3. Domyślnie `wyłączony`. Włączony — ukrywa wiersze parametrów identycznych w obu ofertach.                               |
| `Drukuj`                    | **ODŁOŻONE** (poza bieżącą iterację). Docelowo: wydruk widoku (sekcje 3.3 – 3.8) w formacie A4 poziomo.                              |
| `Eksportuj CSV`             | **ODŁOŻONE** (poza bieżącą iterację). Docelowo: eksport 3.3, 3.4 i 3.8 jako jeden arkusz (`metric`, `offer_a`, `offer_b`, `delta`).  |
| `Otwórz w kalkulatorze`     | Akcja per‑oferta (przycisk na chipie slotu). Ładuje migawkę wejść oferty do formularza i przełącza na zakładkę `Kalkulator`.         |

### 4.3. Akcje per kolumna (header oferty)

| Element          | Typ                    | Działanie                                                                                               |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Etykieta strony  | badge                  | `A` (lewa) lub `B` (prawa) — stała, identyfikuje stronę porównania.                                     |
| Nazwa oferty     | `text`                 | Edycja inline **ODŁOŻONA** — zmiana nazwy wyłącznie w widoku „Twoje kalkulacje”.                        |
| Znacznik koloru  | swatch (2 kolory)      | Kolor identyfikujący ofertę w wykresie trendu (sekcja 3.7): A = `var(--offer-a)`, B = `var(--offer-b)`. |
| `Otwórz w kalk.` | `button`               | Patrz 4.2.                                                                                              |
| `Zmień ofertę`   | `button` (treść chipa) | Kliknięcie chipa otwiera dialog z 4.1 dla tego slotu (zamiast „usuń + dodaj”).                          |

---

## 5. Sekcja 3.3 — Tabela parametrów wejściowych

Komponent `app-comparison-params-table`. Tabela 4 kolumn: `Parametr | Oferta A | Oferta B | Δ`, wiersze pogrupowane nagłówkami sekcji formularza (`FormErrorSection`). Cel: pokazać **co użytkownik zmienił** między dwiema ofertami. Czyta wyłącznie `formValue` (migawkę wejść), więc działa także dla ofert z błędami walidacji (§ 13).

Kolumna `Δ` (różnica) prezentowana jest zależnie od typu parametru:

- liczby (`zł`, `%`, miesiące): `Δ = B − A` w mono, ze znakiem i kolorem (patrz § 14),
- daty: różnica w miesiącach (`+12 m‑cy`, `−3 m‑ce`),
- wybory tekstowe (`równe` ↔ `malejące`, `zmienna` ↔ `stała`): symbol `≠` w kolorze ostrzegawczym lub `=` w kolorze neutralnym,
- listy złożone (dodatkowe koszty, okresy oprocentowania): liczba pozycji + `≠` jeśli zawartość się różni.

Wiersze, w których wartości są identyczne (`Δ = 0` lub `=`), są opcjonalnie ukrywane przez toggle `Tylko różnice` (4.2).

Wiersze:

| Grupa           | Pole                               | Format prezentacji                                                    |
| --------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Dane podstawowe | Wartość nieruchomości              | `zł`                                                                  |
| Dane podstawowe | Kwota kredytu                      | `zł`                                                                  |
| Dane podstawowe | LTV                                | `%` (2 miejsca)                                                       |
| Dane podstawowe | Okres kredytowania                 | `X lat Y m-cy` (oraz `Σ miesięcy`)                                    |
| Dane podstawowe | Data uruchomienia                  | `MMM RRRR`                                                            |
| Dane podstawowe | Początek spłat kapitału (karencja) | `MMM RRRR (N m-cy)` lub `bez karencji`; Δ = różnica długości karencji |
| Dane podstawowe | Tryb rat                           | `równe` \| `malejące`                                                 |
| Dane podstawowe | Rodzaj stopy                       | `zmienna` \| `stała`                                                  |
| Dane podstawowe | Oprocentowanie nominalne (start)   | `%` (2 miejsca)                                                       |
| Dane podstawowe | WIBOR / Marża                      | `%` + `%` (tylko dla stopy zmiennej)                                  |
| Dane podstawowe | Liczba okresów oprocentowania      | `n` (link „pokaż okresy” **ODŁOŻONY**)                                |
| Koszty          | Prowizja za udzielenie             | `% (= zł)`                                                            |
| Koszty          | Opłata za wycenę                   | `zł`                                                                  |
| Koszty          | Ubezpieczenie pomostowe            | `+% przez N m-cy`                                                     |
| Koszty          | Ubezp. nieruchomości               | `freq · mode · wartość`                                               |
| Koszty          | Ubezp. niskiego wkładu             | `+%`                                                                  |
| Koszty          | Ubezp. na życie                    | `freq · mode · wartość`                                               |
| Koszty          | Ubezp. od utraty pracy             | `freq · mode · wartość`                                               |
| Koszty          | Dodatkowe koszty (lista)           | `n pozycji`; Δ = `≠/=` (porównanie zawartości)                        |
| Koszty          | Promocyjna obniżka oprocentowania  | `−% · od → do`                                                        |
| Transze         | Liczba transz                      | `n`                                                                   |
| Transze         | Suma opłat za uruchomienie         | `zł`                                                                  |
| Nadpłaty        | Reguły nadpłat                     | `n pozycji`; Δ = `≠/=` (porównanie zawartości)                        |
| Nadpłaty        | Docelowa rata miesięczna           | `zł · skutek · od → do`                                               |
| Nadpłaty        | Prowizja za wcześniejszą spłatę    | `% do MMM RRRR`                                                       |

Reguły wizualne wiersza:

- Wiersze o **identycznych** wartościach w obu ofertach: tło `var(--track)`, kolor `var(--muted)`, kolumna `Δ` pokazuje `=`. Ukrywane przez toggle `Tylko różnice` (4.2).
- Wiersze różniące się: standardowy wygląd; komórka z wartością **lepszą** dla wskaźnika „mniej znaczy lepiej” (np. oprocentowanie, prowizja, koszty) ma cienki marker `▌` po lewej w kolorze `var(--accent-sage-deep)`.
- Komórki z wyłączonymi sekcjami (`Koszty: wył.`, `Nadpłaty: wył.`) renderowane jako `—` w kolorze `var(--muted)`.

---

## 6. Sekcja 3.4 — KPI grid

Komponent `app-comparison-kpi-grid` (kafelek jest jego wewnętrznym markupem — generyczny komponent `Kpi` nie istnieje w kodzie). Siatka `4 wskaźniki × (Oferta A | Δ | Oferta B)` — dokładnie te same cztery KPI co w pasku wyników na zakładce `Kalkulator` (`Pierwsza rata`, `Suma wszystkich płatności`, `Odsetki`, `Koszty okołokredytowe`).

Układ każdego wiersza KPI:

```
┌───────────────────┬──────────┬───────────────────┐
│  Kafelek KPI (A) │    Δ     │  Kafelek KPI (B)  │
│  wartość + meta  │  B − A   │  wartość + meta   │
└───────────────────┴──────────┴───────────────────┘
```

Każda kolumna oferty zawiera:

1. `Pierwsza rata` (= `results.firstInstallment.rate`) — wartość `zł`, meta: `tryb rat · rodzaj stopy · %`.
2. `Suma wszystkich płatności` (= `totals.totalAllPayments`) — wartość `zł`, meta: `oddasz X% pożyczonej kwoty`.
3. `Odsetki` (= `totals.totalInterest`) — wartość `zł`, meta: `% od kapitału`.
4. `Koszty okołokredytowe` (= `totals.overheadCosts`) — wartość `zł`, meta: `prowizja … · wycena …`.

Środkowa kolumna `Δ` dla każdego wskaźnika prezentuje:

- liczbę `B − A` w mono (`+1 234 zł` / `−2 567 zł`),
- procentową zmianę względem A w nawiasie (`(+1,3%)` / `(−5,2%)`),
- kolor: `var(--c-int)` gdy `B > A` (B gorsza) i `var(--accent-sage-deep)` gdy `B < A` (B lepsza).

Kafelek oferty z **mniejszą wartością** (czyli lepszej dla wskaźników „mniej znaczy lepiej”) dostaje znacznik `✓ lider` w kolorze `var(--accent-sage-deep)` i tło `var(--accent-sage-soft)`. Brak znacznika gdy `B = A`.

---

## 7. Sekcja 3.5 — Para donutów „Struktura wszystkich płatności”

Komponent `app-comparison-donuts-total`; **reużycie generycznego `ui-donut`** (komponenty `app-results-donut-chart-*` z Kalkulatora są sprzężone z `FormService`/`SelectedMonthService` i nie są tu używane).

Dwa donuty obok siebie (`A` po lewej, `B` po prawej), każdy z czterema segmentami w identycznych kolorach jak w widoku `Kalkulator`:

| Segment               | Wartość                | Kolor CSS       |
| --------------------- | ---------------------- | --------------- |
| Kapitał               | `totals.totalCapital`  | `var(--c-cap)`  |
| Odsetki               | `totals.totalInterest` | `var(--c-int)`  |
| Koszty okołokredytowe | `totals.overheadCosts` | `var(--c-cost)` |
| Nadpłaty              | `totals.prepayments`   | `var(--c-over)` |

Konfiguracja sekcji:

- Oba donuty mają **identyczną wartość `size`** (np. 200 px) i **wspólną skalę liczbową** — dzięki temu wielkość pierścienia jest porównywalna wzrokowo (każda oferta to ta sama 100% pula).
- Jedna wspólna legenda nad parą, identyfikująca kolory + jednostkę.
- Pod każdym donutem etykieta: `A`/`B` + `nazwa oferty` + `Σ result.totalPayments` w `zł`.
- Między donutami opcjonalna kolumna delty (`Δ segmentów`): cztery wiersze `Kapitał / Odsetki / Koszty / Nadpłaty`, każdy z wartością `B − A` w `zł` i ze znakiem.
- Toggle `Pokaż wykluczone segmenty` (4.2) decyduje, czy segment o wartości `0` jest pomijany w danych przekazanych do `Donut`, czy renderowany jako kreska (`0,00 zł`).

---

## 8. Sekcja 3.6 — Para donutów „Struktura pierwszej raty”

Komponent `app-comparison-donuts-installment`; reużycie generycznego `ui-donut` (rozmiar 160 px, grubość 22 px).

Dwa donuty obok siebie (`A` i `B`), każdy z **dwoma segmentami** zgodnie ze specyfikacją z `wykresy.md` § 5.2:

| Segment | Wartość                             | Kolor CSS      |
| ------- | ----------------------------------- | -------------- |
| Kapitał | `results.firstInstallment.capital`  | `var(--c-cap)` |
| Odsetki | `results.firstInstallment.interest` | `var(--c-int)` |

Dla rat malejących oraz ofert z karencją (`Początek spłat kapitału > Data uruchomienia`) tytuł karty jest dynamiczny:

- standardowo: `Struktura pierwszej raty`,
- gdy **obie** oferty są w okresie karencji (`capital === 0`): `Pierwsza rata (okres karencji)`; oferta w karencji ma centralną etykietę `100% / odsetek` i podpis `(okres karencji)`.

Pod każdym donutem etykieta: `A`/`B` + `nazwa oferty` + `rata = X zł` + `oprocentowanie startowe %`.
Między donutami pojedynczy wskaźnik `Δ raty` = `rata_B − rata_A` w `zł`, kolorowany wg konwencji § 14.

---

## 9. Sekcja 3.7 — Wykres trendu „Harmonogram spłaty”

To kluczowa sekcja porównania w czasie. Zapewniamy **dwa tryby**, przełączane kontrolką `Tryb wykresu trendu` (4.2):

### 9.1. Tryb `nakładka` (domyślny)

**Decyzja implementacyjna (D2):** zamiast rozszerzać `app-results-trend-chart` o tryb `series` (ryzyko regresji w Kalkulatorze: hover-donut, dimming, legenda jednej oferty), nakładkę realizuje **nowy, lekki komponent `app-comparison-trend-chart`** z inputami `seriesA`/`seriesB: ComparisonTrendSeries { name; color; loanAmount; yearlyGroups }`.

Zachowanie:

- **dwie linie „Pozostało do spłaty”** nałożone na siebie (A w kolorze `var(--offer-a)`, B w kolorze `var(--offer-b)`), węzły `r=4 px`, `stroke-width: 2 px`; **bez słupków skumulowanych** — nakładka linii salda jest czytelniejsza dla dwóch ofert,
- oś X kategorialna (rok) obejmuje **unię zakresów lat** obu ofert (najwcześniejszy rok startu → najpóźniejszy rok końca); brak danych oferty w roku = brak punktu,
- oś Y: maks. = `roundUpToStep(max(loanAmount, salda z obu serii), 50 000)`,
- tooltip per rok wymienia saldo obu ofert (`A: ... zł`, `B: ... zł`, dodatkowo `Δ: B − A`),
- każda linia ma `<title>` z nazwą oferty i saldem na koniec ostatniego roku (a11y).

Legenda nad wykresem: dokładnie dwie pozycje (`A: <nazwa>` w swoim kolorze, `B: <nazwa>` w swoim).

Tytuł dynamiczny: `Harmonogram spłaty — porównanie: <pierwszy rok> – <ostatni rok>`.

### 9.2. Tryb `obok siebie`

Dwa pełne wykresy `app-results-trend-chart` renderowane w jednym rzędzie (50% / 50% szerokości). Każdy wykres dziedziczy swą pełną zawartość — słupki stacked + linia salda — dokładnie jak na widoku `Kalkulator`. Pod każdym wykresem etykieta `A` / `B` + nazwa oferty.

Wymóg porównywalności wzrokowej: w tym trybie **wymuszamy wspólne maks. osi Y** (salda i stacka) wyznaczone dla obu ofert łącznie — przez nowe opcjonalne inputy `forcedBalanceAxisMax` / `forcedStackAxisMax` w `app-results-trend-chart` (patrz § 11). Bez tego porównanie kształtu krzywych jest mylące — automatyczne skalowanie sprawi, że niższa kwota kredytu „wygląda jak ta sama wielkość”.

---

## 10. Sekcja 3.8 — Tabela różnic kosztowych

Tabela 4 kolumn: `Pozycja | Oferta A | Oferta B | Δ (= B − A)`.

Wiersze:

| Pozycja                                | Źródło (z `computation.results`)                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kapitał                                | `inputs.loanAmount`                                                                                                                                                                                                                                                                                                  |
| Odsetki — łącznie                      | `totals.totalInterest`                                                                                                                                                                                                                                                                                               |
| Odsetki — w okresie ubezp. pomostowego | `Σ interest dla schedule[0..bridgeMonths-1]`; `—` gdy sekcja kosztów wyłączona lub `bridgeMonths = 0`                                                                                                                                                                                                                |
| Prowizja za udzielenie                 | `overheadCostsBreakdown` o rodzaju `LOAN_COMMISSION`                                                                                                                                                                                                                                                                 |
| Opłata za wycenę                       | `overheadCostsBreakdown` o rodzaju `APPRAISAL_FEE`                                                                                                                                                                                                                                                                   |
| Ubezpieczenia (wszystkie)              | Σ `overheadCostsBreakdown` rodzajów: `PROPERTY_INSURANCE`, `LIFE_INSURANCE`, `JOB_LOSS_INSURANCE`, `ADDITIONAL_COST` oraz `TRANCHE_DISBURSEMENT_FEE` (opłaty za uruchomienie transz wliczone tutaj, by suma wierszy domykała się do `overheadCosts`); celowo **bez** `EARLY_REPAYMENT_COMMISSION` — ma własny wiersz |
| Nadpłaty                               | `totals.prepayments`                                                                                                                                                                                                                                                                                                 |
| Prowizja za wcześniejszą spłatę        | Σ `overheadCostsBreakdown` rodzaju `EARLY_REPAYMENT_COMMISSION`; `—` gdy sekcja nadpłat wyłączona                                                                                                                                                                                                                    |
| **SUMA — całkowity koszt kredytu**     | `totals.totalAllPayments`                                                                                                                                                                                                                                                                                            |
| **Oddasz do banku [%]**                | `totals.totalAllPayments / loanAmount × 100`                                                                                                                                                                                                                                                                         |

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

## 11. Rozszerzenia komponentów wykresów (stan faktyczny)

Sekcja pisana pierwotnie pod makietę Reactową (`charts.jsx`); poniżej rzeczywiste odpowiedniki w kodzie Angular.

### 11.1. `ui-donut` — bez zmian

Generyczny komponent działa bez modyfikacji — w sekcjach 3.5 i 3.6 jest wywoływany przez `app-comparison-donuts-*`. Decyzja o ukrywaniu zerowych segmentów rozstrzygana jest poza komponentem (filtrowaniem segmentów przed przekazaniem).

### 11.2. `app-results-trend-chart` — dwa opcjonalne inputy

```
forcedBalanceAxisMax: number | null = null   // wymuszone maks. osi salda
forcedStackAxisMax:   number | null = null   // wymuszone maks. osi stacka rocznego
```

Domyślne `null` = auto-skalowanie jak dotąd — **pełna wsteczna zgodność** z użyciem na zakładce `Kalkulator`. Tryb `series`/`showBars` ze spec **nie został zaimplementowany** — nakładkę realizuje dedykowany `app-comparison-trend-chart` (decyzja D2, § 9.1).

### 11.3. `TrendChartHeader` — nieaktualne

Komponent nie istnieje w kodzie; legendę A/B renderuje `app-comparison-trend-chart` we własnym nagłówku.

---

## 12. Zdarzenia i reguły aktualizacji

**Decyzja implementacyjna (D1):** zapisany rekord (`SavedCalculationRecord.data`) jest **migawką wejść** (`form.getRawValue()`), nie wyników. Wszystkie liczby sekcji 3.3–3.8 pochodzą z **przeliczenia na żywo bieżącym silnikiem**: `record.data → buildMortgageInputs() → CalculatorService.compute() → groupByYear()`. Metadane zapisane przy zapisie służą wyłącznie liście w dialogu wyboru i chipom slotów; po wybraniu oferty jej skalary są nadpisywane wartościami z przeliczenia (spójność między sekcjami).

- Przeliczenia zapisanych ofert są memoizowane (klucz: `nazwa::data ostatniego zapisu`) — przełączanie toggli i trybów nie powtarza obliczeń.
- Oferta `DRAFT` (bieżąca robocza) jest rekalkulowana na każdą zmianę formularza, identycznie jak na zakładce `Kalkulator`.
- Zmiana zawartości slotu (4.1) lub akcji `↔ Zamień strony` (4.2) przelicza:
  - delty `Δ` w 3.3, 3.4 i 3.8 (znaki się odwracają przy zamianie stron),
  - markery lidera (która strona ma `✓`/`▌`),
  - skale wspólne `forcedBalanceAxisMax`/`forcedStackAxisMax` w trybie `obok siebie` (9.2).
- Zmiana `Trybu wykresu trendu` (4.2) zmienia tylko sposób renderowania 3.7.

---

## 13. Walidacje i komunikaty

| Sytuacja                                      | Komunikat / zachowanie                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Slot A i/lub B pusty                          | Pusty stan: ilustracja + tekst „Wybierz dwie oferty do porównania”. Sekcje 3.3 – 3.8 ukryte.                              |
| Próba wybrania tej samej oferty w obu slotach | Picker odrzuca wybór, komunikat: „Oferta jest już wybrana po drugiej stronie”.                                            |
| Oferta A lub B z błędami walidacji wejść      | Chip slotu oznaczony błędem, baner ⚠ + przycisk „Otwórz w kalkulatorze”. 3.3 widoczna, sekcje 3.4 – 3.8 ukryte.           |
| Oferty mają różne `loanAmount`                | Banner informacyjny nad 3.4: „Oferty mają różne kwoty kredytu — porównuj ostrożnie”.                                      |
| Oferty mają różne `period (n)`                | Banner informacyjny nad 3.7: „Różne okresy spłaty — wykres trendu pokazuje unię lat”.                                     |
| Usunięto ofertę z `Twoje kalkulacje`          | Slot przechodzi w stan pusty z toastem „Oferta została usunięta” (kontrola przy wejściu do widoku, po wczytaniu store'a). |

**Znana niedoskonałość:** identyfikatorem oferty jest jej **nazwa** — zmiana nazwy kalkulacji w „Twoje kalkulacje” osieroca slot porównania (objawia się jak usunięcie: pusty slot + toast).

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

## 15. Drukowanie i eksport — ODŁOŻONE

Cała sekcja jest **odłożona poza bieżącą iterację** (decyzja D3). Docelowe zachowanie:

- `Drukuj` (4.2): generuje wydruk dla A4 poziomo. Sekcje 3.3 i 3.4 zawsze na pierwszej stronie. Wykres trendu (3.7) zawsze w trybie `nakładka` (bez względu na bieżące ustawienie ekranu), ponieważ generuje czytelny obrazek na 1 stronie.
- `Eksport CSV` (4.2): jeden plik, kolumny:
  ```
  section,metric,offer_a,offer_b,delta
  ```
  Eksportowane sekcje: 3.3 (parametry wejściowe), 3.4 (KPI), 3.8 (różnice). Wartości liczbowe bez separatora tysięcy, z `.` jako separatorem dziesiętnym (kompatybilność z arkuszami zagranicznymi); dodatkowy `;` jako separator kolumn (kompatybilność z Excel pl‑PL).

---

## 16. Dostępność i UX

- Każdy slot oferty w 4.1 ma `aria-label` w postaci `Oferta A: <nazwa>, kwota <kwota>, oprocentowanie <%>` (i analogicznie dla B).
- Tabela 3.3 i 3.8: nawigacja klawiaturą po komórkach (`tab` + `arrows`) — **ODŁOŻONE** (decyzja D3); zostają semantyczne role (`role="table"/"row"/"cell"`).
- Donuty 3.5/3.6: legenda jest zawsze obecna jako element opisowy; same łuki donuta mają `aria-label` opisujący segment.
- Wykres 3.7 w trybie nakładki: każda z dwóch linii ma `<title>` z nazwą oferty + saldem na koniec ostatniego widocznego roku.
- Kontrast lidera (`✓`) niesie informację także kolorem **i** glifem (zgodność z WCAG 1.4.1).
- Czytniki ekranu: tabele 3.3/3.8 są zbudowane na `div`-ach z rolami ARIA — kolumny `A` i `B` mają `role="columnheader"` z nazwą oferty, etykiety wierszy `role="rowheader"`, kolumna `Δ` nagłówek `Δ (B − A)`.

---

## 17. Zależności od innych zakładek

- `Twoje kalkulacje` — źródło prawdy dla listy ofert (`Offer.id`, `Offer.name`, `Offer.savedAt`).
- `Kalkulator` — źródło wykresów (`Donut`, `TrendChart`, `TrendChartHeader`), źródło bieżącej oferty roboczej (`isDraft: true`), oraz cel akcji „Otwórz w kalkulatorze”.

---
