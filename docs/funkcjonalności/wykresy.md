## 5. Wykresy i prezentacja wizualna

### 5.1. „Struktura wszystkich płatności” (wykres kołowy/donut)

- Typ wykresu: donut (natywny SVG `ui-donut`, komponent `ui-donut-chart`).
- Dane: łączny udział w całkowitych płatnościach dla kategorii: Kapitał, Odsetki, Koszty okołokredytowe, Nadpłaty.
- Wyliczenia: sumy z całego harmonogramu zgodnie z punktami 4.1–4.2.
- **Suma nad legendą:** nad legendą prezentowany jest wiersz „Suma wszystkich płatności” (= suma wartości
  widocznych slice'ów) oddzielony poziomym separatorem (`border-top` w kolorze `--line`) od listy legendy.
- **Rozwijalna pozycja „Koszty okołokredytowe”:** kliknięcie pozycji „Koszty okołokredytowe” w legendzie rozwija
  ją na poszczególne składowe — wcięte wiersze ze składnikami (marker w kolorze kosztów `--c-cost`). Łuk kosztów
  na donucie pozostaje jedną całością (bez podziału).
- **Źródło rozbicia:** składowe pochodzą z kalkulatora (`MortgageResults.totals.overheadCostsBreakdown` dla
  całego okresu; agregat `ScheduleRow.costBreakdown` wierszy do wybranego miesiąca w trybie narastającym) —
  patrz `docs/funkcjonalności/koszty-okolokredytowe-i-promocje.md` §4. Etykiety składowych pochodzą z pipe'u
  `overheadCostKindLabel`.

### 5.2. „Wysokość pierwszej raty” + „Struktura pierwszej raty”

- Wysokość pierwszej raty: wartość liczbowa (np. 3 598,90 zł) wynikająca z bieżących ustawień i_m, trybu rat oraz n.
- „Struktura pierwszej raty”: donut (`ui-donut-chart`) – udział Kapitał vs Odsetki (+ ewentualne koszty okołokredytowe przypisane do raty). Po wybraniu miesiąca w harmonogramie karta pokazuje strukturę raty wybranego miesiąca, a pozycja „Koszty okołokredytowe” w legendzie jest rozwijalna na składowe tego miesiąca (z `ScheduleRow.costBreakdown`) — analogicznie jak w §5.1. Nad legendą prezentowany jest wiersz „Razem” (suma składników raty) z separatorem.
- Dodatkowy przycisk „drukuj”: renderuje widok do wydruku (drukarka/PDF) zawierający podsumowania, wykresy i/lub harmonogram.

### 5.3. „Harmonogram spłaty kredytu …” (wykres trendu)

Typ wykresu: **combo chart** = pionowe słupki skumulowane (stacked column) + linia z punktami, na wspólnej osi X i z **dwiema niezależnymi osiami Y**.

Tytuł dynamiczny: `Harmonogram spłaty kredytu: <miesiąc słownie> <rok> - <miesiąc słownie> <rok>` (np. „Harmonogram spłaty kredytu: czerwiec 2026 - maj 2046”). Zakres odpowiada datom pierwszej i ostatniej raty z harmonogramu.

#### 5.3.1. Oś X — kategorie roczne

- Skala kategorialna (jeden „kosz” na rok kalendarzowy).
- Etykiety: czterocyfrowy rok, obrócone o 90° w pionie (lub czytelnie pod kątem).
- Pierwszy i ostatni rok są zwykle **niepełne** (kredyt rusza w trakcie roku i kończy się w trakcie roku) → odpowiadające im słupki są wizualnie krótsze, ponieważ kumulacja roczna obejmuje mniej miesięcy.

#### 5.3.2. Oś Y po lewej — linia „Pozostało do spłaty”

- Etykieta osi (rotacja 90°): „Kwota pozostała do spłaty”.
- Format etykiet skali: `0 zł`, `50 000 zł`, `100 000 zł`, …, `400 000 zł` (krok ~50 000 zł, formatowanie pl-PL z separatorem tysięcy i sufiksem ` zł`).
- Zakres: od `0 zł` do najbliższej „okrągłej” wartości powyżej salda początkowego (np. 400 000 zł dla kwoty kredytu 400 000 zł).
- Skala obsługuje seria **„Pozostało do spłaty”** (linia + punkty), patrz 5.3.4.

#### 5.3.3. Oś Y po prawej — słupki skumulowane (suma rocznych płatności)

- Etykieta osi (rotacja 90°, prawa strona): „Suma płatności w danym roku”.
- Format etykiet: `0 zł`, `5 000 zł`, `10 000 zł`, …, `45 000 zł` (krok ~5 000 zł).
- Zakres: od `0 zł` do wartości obejmującej najwyższy roczny słupek (suma Odsetki + Kapitał + Koszty + Nadpłaty w danym roku).
- Linie poziome siatki (gridlines) rysuje się **tylko dla lewej osi** (saldo) — żeby uniknąć podwójnej siatki.

#### 5.3.4. Serie danych

W ramach jednego roku rysowany jest jeden słupek złożony z **czterech segmentów** zsumowanych pionowo (kolejność od dołu do góry — ustalona, taka sama dla każdego roku):

1. **Odsetki** — pojedynczy kolor (motyw: koralowy / czerwień grupy odsetkowej `--c-int`). Suma odsetek zapłaconych w danym roku kalendarzowym. **Maleje** w czasie wraz ze spadkiem salda.
2. **Koszty okołokredytowe** — turkus / morski (zwykle alias `--c-cost`, w skali kolorów grupy „koszty”). Suma wszystkich kosztów okołokredytowych przypisanych do danego roku (ubezpieczenia, dodatkowe opłaty miesięczne/roczne, proporcjonalna część jednorazowych prowizji jeśli rozłożone). Najczęściej cienka warstwa, czasem zerowa.
3. **Kapitał** — granat / ciemny niebieski (`--c-cap`). Suma rat kapitałowych zapłaconych w roku. **Rośnie** w czasie (kosztem malejących odsetek przy ratach równych).
4. **Nadpłaty** — jasny cyjan / błękit pastelowy (`--c-over`). Suma kwot nadpłat w danym roku. Cienka warstwa, zwykle 0 jeśli nie skonfigurowano nadpłat.

Na słupkach **nakładana jest linia** „**Pozostało do spłaty**” (`--ink` / kolor neutralny ciemny):

- Punkt dla każdego roku na poziomie salda po ostatnim miesiącu tego roku (skala lewej osi Y).
- Linia łamana łącząca punkty (`stroke-width: 2px`) + wypełnione koła (`r: 4 – 5 px`) w każdym węźle.
- Linia zaczyna się od poziomu **kwoty kredytu** (saldo początkowe) i kończy w `0 zł` w roku ostatniej raty.

#### 5.3.5. Legenda

- Jedna pozioma legenda nad wykresem, w kolejności: Odsetki, Koszty okołokredytowe, Kapitał, Nadpłaty, Pozostało do spłaty.
- Każda pozycja ma kwadratową próbkę koloru (segment) lub miniaturkę linii z punktem (saldo).
- Klik na elementach legendy w docelowej wersji (Chart.js) może chować / pokazywać serie; w wersji makietowej legenda jest tylko opisowa.

#### 5.3.6. Tooltip (interakcja)

Najechanie kursorem na rok pokazuje pop-over z:

- Nagłówkiem: pełna etykieta roku (np. `2030`).
- Wierszami: nazwa serii + kwota w `zł` (format pl-PL, 2 miejsca po przecinku), w kolejności jak w stacku.
- Suma: `Razem w roku` = suma czterech segmentów.
- Stopka: `Saldo na koniec roku` = wartość punktu linii.

#### 5.3.7. Dane i obliczenia

- Wejście: tablica `yearly` z agregacji rocznej harmonogramu (`YearAggregate`), powstała w `CalcService.compute()` / `generateSchedule()`.
- Pola wykorzystywane na słupek: `interest`, `monthlyCost`, `principal`, `overpayment`.
- Pole wykorzystywane na linię: `balance` (saldo po ostatnim miesiącu roku).
- Maksimum prawej osi Y: `ceil(max(Σ słupka po roku) / 5000) * 5000`.
- Maksimum lewej osi Y: `ceil(max(saldo) / 50000) * 50000`.

#### 5.3.8. Wymagania techniczne

- Implementacja: natywne SVG w komponencie `ResultsTrendChartComponent` (`src/app/components/results/results-trend-chart/`) — spójna z istniejącym `ui-donut`, bez zewnętrznych zależności typu Chart.js. Geometria liczona w `computed()` na podstawie `YearGroup[]` przekazanego z `LayoutComponent`.
- SVG używa `viewBox="0 0 1100 520"` i `preserveAspectRatio="xMidYMid meet"`, dzięki czemu wykres skaluje się proporcjonalnie do szerokości karty (typowo ~320–460 px wysokości na desktopie) bez zniekształceń tekstu.
- Tooltip (5.3.6) renderowany w obrębie tego samego SVG (grupa `<g>` z prostokątem tła i wierszami tekstu), aktywowany niewidoczną „strefą złapania kursora” (`<rect>`) na całą wysokość kolumny rocznej. Pozycja tooltipu przełącza się na lewą stronę kolumny, gdy jest ona w prawej połowie wykresu.
- Motyw: dziedziczy zmienne CSS palety i kolorów semantycznych (`--c-int`, `--c-cost`, `--c-cap`, `--c-over`) oraz neutralnych (`--ink`, `--grid`, `--line-2`, `--surface`, `--muted`) — działa w trybie jasnym i ciemnym.
- Tytuł korzysta z `Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' })`, więc nazwy miesięcy są pełne (np. „czerwiec 2026 - maj 2046”).

### 5.4. „Zmiana oprocentowania w czasie” (wykres warunkowy)

Wykres prezentowany **wyłącznie** wtedy, gdy w symulacji kredytu występuje co najmniej jedna z poniższych okoliczności wywołujących zmianę efektywnego oprocentowania w trakcie spłaty:

1. **Więcej niż jeden okres oprocentowania** — użytkownik dodał ≥ 1 dodatkowy `RatePeriod` w „Daty podstawowe → Oprocentowanie”.
2. **Ubezpieczenie pomostowe** — niezerowa stawka `bridgeRate` przez `bridgeMonths > 0` pierwszych miesięcy spłaty.
3. **Ubezpieczenie niskiego wkładu** — niezerowa stawka `lowDownRate` obowiązująca dopóki saldo / wartość nieruchomości > 80 %.
4. **Promocja oprocentowania** — niezerowa stawka `promoRate` obniżająca oprocentowanie pomiędzy `promoFrom` a `promoTo`.

Jeśli **żadna** z tych okoliczności nie zachodzi, karta wykresu nie jest renderowana. Analogicznie jak kolumna "oprocentowanie" w harmonogramie spłat

#### 5.4.1. Typ wykresu

- **Step-line** (linia schodkowa, `step-after`) — oprocentowanie pomiędzy zmianami jest stałe, zmiany rysowane są jako pionowe „skoki”. Najwierniej oddaje zachowanie stopy nominalnej w bankowości — stopa nie interpoluje się liniowo, tylko obowiązuje od konkretnego miesiąca.
- Jedna oś X (czas), jedna oś Y (oprocentowanie w %).

#### 5.4.2. Oś X — czas

- Skala czasowa (miesiące spłaty, ale etykiety pokazują **lata kalendarzowe** jak na wykresie trendu §5.3).
- Etykiety obrócone o 90° (taka sama konwencja jak `TrendChart`).
- Pierwszy tick = data pierwszej raty z harmonogramu, ostatni = data ostatniej raty z harmonogramu.

#### 5.4.3. Oś Y — oprocentowanie

- Format etykiet: `0,00 %`, `2,50 %`, `5,00 %`, `7,50 %`, `10,00 %` — krok adaptacyjny (0,5 / 1 / 2 % zależnie od rozpiętości).
- Zakres: `[0; ceil(maxRate × 1,1)]` z marginesem ~10 % nad maksimum, w dół zawsze do 0 %.
- Etykieta osi (rotacja 90°): „Nominalne oprocentowanie roczne”.

#### 5.4.4. Tooltip

Najechanie na obszar wykresu pokazuje pop-over z:

- Nagłówkiem: data miesiąca (np. `lip 2028`).
- Sumą: `Razem` = efektywna stopa nominalna w tym miesiącu.

#### 5.4.5. Wymagania techniczne

- Implementacja docelowa: natywny SVG step-path.
- Karta wstawiana **bezpośrednio nad** „Tabela harmonogramu”, pod kartą trendu §5.3.
- Motyw: kolory `--c-int`, `--c-int-mid`, `--c-cost-mid`, `--c-cap-mid`, `--accent`, `--ink` — działa w trybie jasnym i ciemnym.
