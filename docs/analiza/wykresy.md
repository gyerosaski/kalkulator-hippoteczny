## 5. Wykresy i prezentacja wizualna

### 5.1. „Struktura wszystkich płatności” (wykres kołowy/donut)

- Typ wykresu: donut (Chart.js).
- Dane: łączny udział w całkowitych płatnościach dla kategorii: Kapitał, Odsetki, Koszty okołokredytowe, Nadpłaty.
- Wyliczenia: sumy z całego harmonogramu zgodnie z punktami 4.1–4.2.

### 5.2. „Wysokość pierwszej raty” + „Struktura pierwszej raty”

- Wysokość pierwszej raty: wartość liczbowa (np. 3 598,90 zł) wynikająca z bieżących ustawień i_m, trybu rat oraz n.
- „Struktura pierwszej raty”: donut (Chart.js) – udział Kapitał vs Odsetki (+ ewentualne koszty okołokredytowe przypisane do raty).
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

Jeśli **żadna** z tych okoliczności nie zachodzi, karta wykresu nie jest renderowana. Decyzja podejmowana po stronie serwisu obliczeń jako flaga `hasRateChange` zwracana w `ScheduleResult`.

#### 5.4.1. Typ wykresu

- **Step-line** (linia schodkowa, `step-after`) — oprocentowanie pomiędzy zmianami jest stałe, zmiany rysowane są jako pionowe „skoki”. Najwierniej oddaje zachowanie stopy nominalnej w bankowości — stopa nie interpoluje się liniowo, tylko obowiązuje od konkretnego miesiąca.
- Jedna oś X (czas), jedna oś Y (oprocentowanie w %).
- Pod linią cienka, półprzezroczysta „pod-poświata” (`fill: var(--c-int) / 12 %`) w kolorze grupy odsetkowej — wykres należy do grupy semantycznej „odsetki” w hierarchii kolorów.

#### 5.4.2. Oś X — czas

- Skala czasowa (miesiące spłaty, ale etykiety pokazują **lata kalendarzowe** jak na wykresie trendu §5.3).
- Etykiety obrócone o 90° (taka sama konwencja jak `TrendChart`).
- Pierwszy tick = `startDate`, ostatni = data ostatniej raty z harmonogramu.

#### 5.4.3. Oś Y — oprocentowanie

- Format etykiet: `0,00 %`, `2,50 %`, `5,00 %`, `7,50 %`, `10,00 %` — krok adaptacyjny (0,5 / 1 / 2 % zależnie od rozpiętości).
- Zakres: `[0; ceil(maxRate × 1,1)]` z marginesem ~10 % nad maksimum, w dół zawsze do 0 %.
- Etykieta osi (rotacja 90°): „Nominalne oprocentowanie roczne”.

#### 5.4.4. Serie i adnotacje

- **Linia główna** „Efektywne oprocentowanie” — `var(--ink)`, `stroke-width: 2 px`, step-after, koniec linii zaznaczony krótką poziomą kreską ze strzałką w prawo (kontynuacja do końca okresu).
- W węzłach (każda zmiana stopy) — wypełnione koło `r = 4 px` w kolorze `var(--ink)` z obwódką `var(--surface)`.
- Etykieta każdej zmiany — krótki badge nad węzłem: np. `7,50 %` (mono, 11 px), z linią-łącznikiem do węzła. Przy gęstym układzie etykiet kolizyjne badge'y są łączone w jeden „zlepek”.
- **Wstęgi tła** wskazujące źródło zmiany (jedna nad drugą, w lewym górnym pasku „torów”, każda w innym kolorze, z napisem):
  - `bridge` — `var(--c-int-mid)` z opacity 0,35; etykieta „ubezpieczenie pomostowe +1,20 %”;
  - `lowDown` — `var(--c-cost-mid)` opacity 0,35; etykieta „niski wkład +0,40 %”;
  - `promo` — `var(--c-cap-mid)` opacity 0,35; etykieta „promocja –1,00 %”;
  - `period-N` — `var(--accent)` opacity 0,2; etykieta „okres N (WIBOR + marża)”.
- Tory rysowane są tylko dla aktywnych okoliczności (jeśli np. nie ma `lowDown` — torsja `lowDown` nie istnieje).

#### 5.4.5. Tooltip

Najechanie na obszar wykresu pokazuje pop-over z:

- Nagłówkiem: data miesiąca (np. `lip 2028`).
- Wierszami rozkładu efektywnej stopy: `WIBOR + marża` / `stała`, `+ pomostowe`, `+ niski wkład`, `− promocja`.
- Sumą: `Razem` = efektywna stopa nominalna w tym miesiącu.

#### 5.4.6. Legenda

- Pod tytułem karty, w jednej linii: kropka linii + „Efektywne oprocentowanie”, kafle wstęg (kolor + krótki podpis).
- W trybie statycznym makiety legenda jest opisowa; w docelowej wersji klik chowa torsję.

#### 5.4.7. Dane wejściowe

`ScheduleResult` musi udostępniać:

- `rows[].rate` — efektywne oprocentowanie w danym miesiącu (po wszystkich modyfikatorach), `%`.
- `rows[].rateBase` — stopa nominalna z aktywnego okresu (`WIBOR + marża` lub stała).
- `rateChanges: { fromMonth: number; date: Date; rate: number; cause: 'period' | 'bridge-on' | 'bridge-off' | 'lowdown-on' | 'lowdown-off' | 'promo-on' | 'promo-off' }[]`
- `rateBands: { kind: 'bridge'|'lowDown'|'promo'|'period'; fromMonth: number; toMonth: number; delta: number; label: string }[]` — wstęgi torów.
- `hasRateChange: boolean` — flaga włączająca renderowanie karty wykresu i kolumny „Oprocentowanie” w tabeli (§ harmonogram-spłaty.md).

#### 5.4.8. Wymagania techniczne

- Implementacja docelowa: **Chart.js** (`type: 'line'` z `stepped: 'after'`) lub natywny SVG step-path.
- Wysokość karty: ~240 px (desktop) / 200 px (cozy) / 280 px (roomy).
- Karta wstawiana **bezpośrednio nad** „Tabela harmonogramu”, pod kartą trendu §5.3.
- Motyw: kolory `--c-int`, `--c-int-mid`, `--c-cost-mid`, `--c-cap-mid`, `--accent`, `--ink` — działa w trybie jasnym i ciemnym.
