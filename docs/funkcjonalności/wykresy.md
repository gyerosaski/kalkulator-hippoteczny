## 5. Wykresy i prezentacja wizualna

### 5.1. „Struktura wszystkich płatności” (donut)

- Typ: wykres kołowy (donut).
- Dane: udział kategorii w całkowitych płatnościach — Kapitał, Odsetki, Koszty okołokredytowe, Nadpłaty.
- **RRSO:** w stopce legendy karty prezentowana jest metryka RRSO (format `pl-PL`, 2 miejsca, sufiks `%`);
  ukrywana, gdy wartość jest nieobliczalna. Sposób wyliczania — patrz `docs/funkcjonalności/dane-podstawowe.md` §4.1.
- **Kolejność pozycji:** pozycje legendy — i odpowiadające im łuki donuta — prezentowane są od
  najistotniejszej do najmniej istotnej, czyli malejąco po wartości. Ta sama reguła obowiązuje wewnątrz
  każdej rozwijanej kategorii: składowe „Kosztów okołokredytowych” i składniki „Odsetek” też układają się
  malejąco w obrębie swojej kategorii. Pozycja o wartości ujemnej („Promocja oprocentowania”) plasowana
  jest według wielkości wpływu (wartości bezwzględnej), a nie spychana na koniec listy. Pozycje o równych
  wartościach zachowują względną kolejność.
- **Suma nad legendą:** nad legendą prezentowany jest wiersz „Suma wszystkich płatności” (= suma wartości
  widocznych segmentów), oddzielony poziomym separatorem od listy legendy.
- **Rozwijalna pozycja „Koszty okołokredytowe”:** kliknięcie pozycji „Koszty okołokredytowe” rozwija ją
  na poszczególne składowe (wcięte wiersze). Łuk kosztów na donucie pozostaje jedną całością.
- **Rozwijalna pozycja „Odsetki”:** kliknięcie pozycji „Odsetki” rozwija ją na składniki efektywnej stopy:
  „Odsetki bazowe” (z sekcji „Oprocentowanie”), „Ubezpieczenie pomostowe”, „Ubezpieczenie niskiego wkładu”
  oraz „Promocja oprocentowania” (wiersz **ujemny** — promocja zmniejsza odsetki). Łuk odsetek pozostaje
  jedną całością. Pozycja jest rozwijalna **tylko gdy** istnieje co najmniej jeden składnik poza bazą
  (pomostowe / niski wkład / promocja); w przeciwnym razie jest zwykłym, nierozwijanym wierszem. Suma
  składników jest dokładnie równa wartości „Odsetki”.
- **Nawigacja z legendy do formularza:** kliknięcie etykiety pozycji legendy powiązanej z sekcją formularza
  (rozwinięte składowe kosztów, składniki odsetek oraz pozycja „Nadpłaty”) otwiera odpowiednią sekcję
  (i podsekcję) w lewej kolumnie i przewija do niej widok — już przy pierwszym kliknięciu, także gdy sekcja
  była zwinięta (przewinięcie następuje po zakończeniu animacji rozwijania sekcji). Cel będący podsekcją
  jest wyśrodkowany w pionie w widocznym obszarze kolumny; cel będący całą sekcją jest dosuwany do góry,
  tak by jej nagłówek pozostał widoczny. Po przewinięciu tytuł docelowej sekcji/podsekcji przez chwilę
  subtelnie pulsuje kolorem akcentu, wskazując miejsce, na które należy spojrzeć. Pozycja legendy
  odpowiadająca pojedynczemu kosztowi dodatkowemu (rozpoznawanemu po nazwie kosztu) celuje jeszcze
  precyzyjniej: na środku widoku ląduje karta tego konkretnego kosztu w podsekcji „Dodatkowe koszty”
  i to jej obrys pulsuje zamiast tytułu podsekcji; gdy koszt o tej nazwie już nie istnieje, zachowanie
  wraca do wskazania samej podsekcji. „Odsetki bazowe”
  przewijają do sekcji „Oprocentowanie”, pozostałe składniki odsetek — do właściwej podsekcji
  „Koszty okołokredytowe”. Etykiety
  nawigowalne są wyróżnione (kursor, podkreślenie na hover) i dostępne z klawiatury. Pozycje „Kapitał” oraz
  wiersze-rodzice „Koszty okołokredytowe” i „Odsetki” (które klik rozwija na składowe) nie nawigują.

### 5.2. „Wysokość pierwszej raty” + „Struktura pierwszej raty”

- **Wysokość pierwszej raty:** wartość liczbowa (np. 3 598,90 zł) wynikająca z bieżących ustawień (stopa,
  tryb rat, liczba rat).
- **Struktura pierwszej raty:** donut — udział Kapitał vs Odsetki (+ ewentualne koszty okołokredytowe
  przypisane do raty). Pozycja „Odsetki” jest rozwijalna na składniki efektywnej stopy — analogicznie jak
  w §5.1. Po wybraniu miesiąca w harmonogramie karta pokazuje strukturę raty wybranego miesiąca, a pozycje
  „Koszty okołokredytowe” i „Odsetki” są rozwijalne na składowe tego miesiąca. Nad legendą prezentowany
  jest wiersz „Razem” (suma składników raty) z separatorem. Kolejność pozycji legendy i łuków donuta —
  malejąco po wartości, wraz z rozwiniętymi składowymi, dokładnie jak w §5.1.
- **Przycisk „drukuj”:** renderuje widok do wydruku (drukarka/PDF) z podsumowaniami, wykresami i/lub harmonogramem.

### 5.3. „Harmonogram spłaty kredytu …” (wykres trendu)

Typ: **combo** — pionowe słupki skumulowane (stacked column) + linia z punktami, na wspólnej osi X
i z **dwiema niezależnymi osiami Y**.

Tytuł dynamiczny: `Harmonogram spłaty kredytu: <miesiąc słownie> <rok> - <miesiąc słownie> <rok>`
(np. „Harmonogram spłaty kredytu: czerwiec 2026 - maj 2046”). Zakres odpowiada datom pierwszej i ostatniej
raty z harmonogramu.

#### 5.3.1. Oś X — kategorie roczne

- Skala kategorialna (jeden „kosz” na rok kalendarzowy).
- Etykiety: czterocyfrowy rok, obrócone do pionu.
- Pierwszy i ostatni rok są zwykle **niepełne** (kredyt rusza i kończy się w trakcie roku) → odpowiadające
  im słupki są wizualnie krótsze, bo kumulacja roczna obejmuje mniej miesięcy.

#### 5.3.2. Oś Y po lewej — linia „Pozostało do spłaty”

- Etykieta osi: „Kwota pozostała do spłaty”.
- Format etykiet: `0 zł`, `50 000 zł`, … (krok ~50 000 zł, format `pl-PL`).
- Zakres: od `0 zł` do najbliższej „okrągłej” wartości powyżej salda początkowego.

#### 5.3.3. Oś Y po prawej — słupki skumulowane (suma rocznych płatności)

- Etykieta osi: „Suma płatności w danym roku”.
- Format etykiet: `0 zł`, `5 000 zł`, … (krok ~5 000 zł).
- Zakres: od `0 zł` do wartości obejmującej najwyższy roczny słupek (Odsetki + Kapitał + Koszty + Nadpłaty).
- Linie siatki rysowane są tylko dla lewej osi (saldo), aby uniknąć podwójnej siatki.

#### 5.3.4. Serie danych

W ramach roku rysowany jest jeden słupek złożony z **czterech segmentów** (kolejność od dołu do góry, taka
sama dla każdego roku):

1. **Odsetki** (czerwień grupy odsetkowej) — suma odsetek roku. Maleje w czasie wraz ze spadkiem salda.
2. **Koszty okołokredytowe** (turkus) — suma kosztów przypisanych do roku. Najczęściej cienka warstwa, czasem zerowa.
3. **Kapitał** (granat) — suma rat kapitałowych roku. Rośnie w czasie (kosztem malejących odsetek przy ratach równych).
4. **Nadpłaty** (jasny błękit) — suma nadpłat roku. Cienka warstwa, zwykle 0 jeśli nie skonfigurowano nadpłat.

Na słupki **nakładana jest linia „Pozostało do spłaty”** (kolor neutralny ciemny):

- punkt dla każdego roku na poziomie salda po ostatnim miesiącu roku (lewa oś Y),
- linia łamana łącząca punkty + wypełnione węzły,
- linia zaczyna się od poziomu kwoty kredytu (saldo początkowe) i kończy w `0 zł` w roku ostatniej raty.

#### 5.3.5. Legenda

- Jedna pozioma legenda nad wykresem, w **stałej** kolejności: Odsetki, Koszty okołokredytowe, Kapitał,
  Nadpłaty, Pozostało do spłaty — odpowiada ona układowi segmentów w słupku (identycznemu dla każdego
  roku) i nie zmienia się wraz z wartościami.
- Każda pozycja ma kwadratową próbkę koloru (segment) lub miniaturkę linii z punktem (saldo).

#### 5.3.6. Tooltip

Najechanie na rok pokazuje pop-over z:

- nagłówkiem: pełna etykieta roku (np. `2030`),
- wierszami: nazwa serii + kwota w `zł` (`pl-PL`, 2 miejsca), uporządkowanymi malejąco po wartości
  (najistotniejsza pozycja na górze — tak jak w legendach donutów, §5.1); kolejność ta jest niezależna
  od stałego układu segmentów w słupku,
- sumą: „Razem w roku” = suma czterech segmentów,
- stopką: „Saldo na koniec roku” = wartość punktu linii.

### 5.4. „Zmiana oprocentowania w czasie” (wykres warunkowy)

Wykres prezentowany **wyłącznie** wtedy, gdy w symulacji występuje co najmniej jedna okoliczność
zmieniająca efektywne oprocentowanie w trakcie spłaty:

1. **Więcej niż jeden okres oprocentowania.**
2. **Ubezpieczenie pomostowe** — niezerowa podwyżka przez pierwsze miesiące spłaty.
3. **Ubezpieczenie niskiego wkładu** — niezerowa podwyżka obowiązująca dopóki LTV > 80%.
4. **Promocja oprocentowania** — niezerowa obniżka między datą „od” a „do”.

Jeśli żadna z tych okoliczności nie zachodzi, karta nie jest renderowana — analogicznie jak warunkowa
kolumna „Oprocentowanie” w harmonogramie spłat.

#### 5.4.1. Typ wykresu

- **Step-line** (linia schodkowa) — oprocentowanie między zmianami jest stałe, zmiany rysowane są jako
  pionowe skoki (stopa nie interpoluje się liniowo, tylko obowiązuje od konkretnego miesiąca).
- Jedna oś X (czas), jedna oś Y (oprocentowanie w %).

#### 5.4.2. Oś X — czas

- Skala czasowa (miesiące spłaty, etykiety pokazują lata kalendarzowe jak na wykresie trendu §5.3),
  obrócone do pionu.
- Pierwszy punkt = data pierwszej raty, ostatni = data ostatniej raty z harmonogramu.

#### 5.4.3. Oś Y — oprocentowanie

- Format etykiet: `0,00 %`, `2,50 %`, … — krok adaptacyjny (0,5 / 1 / 2 % zależnie od rozpiętości).
- Zakres od 0% do ~10% ponad maksimum.
- Etykieta osi: „Nominalne oprocentowanie roczne”.

#### 5.4.4. Tooltip

Najechanie na obszar wykresu pokazuje pop-over z:

- nagłówkiem: data miesiąca (np. `lip 2028`),
- wartością: efektywna stopa nominalna w tym miesiącu.

#### 5.4.5. Umiejscowienie

Karta wstawiana jest bezpośrednio nad tabelą harmonogramu, pod kartą trendu §5.3.
