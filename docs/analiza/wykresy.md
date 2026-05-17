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

- Implementacja docelowa: **Chart.js** (`type: 'bar'`, jedna z osi jako `type: 'line'`, mieszane datasety).
- Responsywność: wykres zajmuje całą szerokość karty, wysokość ~360 px (desktop) / 280 px (compact density).
- Motyw: dziedziczy zmienne CSS palety i kolorów semantycznych (`--c-int`, `--c-cost`, `--c-cap`, `--c-over`) — działa w trybie jasnym i ciemnym.
