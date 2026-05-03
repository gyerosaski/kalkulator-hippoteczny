### Dokumentacja techniczna – Zakładka „Dane podstawowe”

Aplikacja: Kalkulator kredytu hipotecznego 2.0
Zakres: Szczegółowa specyfikacja elementów i logiki zakładki „Dane podstawowe” niezbędna do odtworzenia w Angular.
Data opracowania: 2026-04-25

---

## 1. Cel i zakres zakładki

Zakładka „Dane podstawowe” służy do zdefiniowania kluczowych parametrów kredytu hipotecznego oraz natychmiastowego wyliczenia:

- wysokości pierwszej raty,
- całkowitych kosztów (odsetki + koszty okołokredytowe),
- harmonogramu spłaty (tabela, agregacja roczna, wykres),
- udziału poszczególnych składników płatności w czasie (wykresy).

Wyniki aktualizowane są na bieżąco po każdej zmianie danych wejściowych.

---

## 2. Elementy interaktywne (pola wejściowe i przełączniki)

Poniżej opisano wszystkie elementy wejściowe wraz z typami, formatami, jednostkami, walidacjami i regułami przeliczeń.

### 2.1. 1. Wartość nieruchomości

- Typ: pole tekstowe z maską liczbową.
- Domyślna wartość: 500 000.
- Format danych: liczba całkowita lub z częścią dziesiętną, separator tysięcy: spacja, separator dziesiętny: przecinek (np. „750 000”, „750 000,50”).
- Jednostka: zł (PLN), prezentowana po prawej stronie pola.
- Dostępne wartości: > 0.
- Walidacje:
  - wymagane (pole nie może być puste),
  - wartość dodatnia (> 0),
  - maksymalna długość rozsądna, np. 12 cyfr łącznie (rekomendacja UI; brak ograniczenia domenowego),
  - niedozwolone znaki inne niż cyfry, spacja (jako separator tysięcy) i przecinek (separator dziesiętny).
- Zależności i przeliczenia:
  - aktualizacja LTV (3) według wzoru LTV[%] = Kwota kredytu / Wartość nieruchomości × 100%,
  - w przypadku wpisania LTV (3) – automatyczne wyliczenie „Kwota kredytu” (2) = Wartość × LTV/100.

### 2.2. 2. Kwota kredytu

- Typ: pole tekstowe z maską liczbową.
- Domyślna wartość (przykładowa): 400 000.
- Format danych: jak w 2.1.
- Jednostka: zł (PLN).
- Dostępne wartości: 0 < Kwota ≤ Wartość nieruchomości.
- Walidacje:
  - wymagane,
  - kwota dodatnia,
  - nie większa niż „Wartość nieruchomości”.
- Zależności i przeliczenia:
  - przelicza LTV (3): LTV[%] = Kwota / Wartość × 100%,
  - wpływa na harmonogram i wszystkie wyniki (raty, odsetki, wykresy, sumy).

### 2.3. 3. LTV

- Typ: pole procentowe z maską liczbową.
- Domyślna wartość (przykładowa): 80,00 %.
- Format danych: dwie cyfry po przecinku, separator dziesiętny: przecinek; wyświetlana jednostka „%”.
- Dostępne wartości: 0,00 – 100,00.
- Walidacje:
  - wymagane,
  - zakres [0;100],
  - format procentowy (maks. 2 miejsca po przecinku; rekomendacja UI).
- Zależności i przeliczenia:
  - przy zmianie LTV wyliczana jest „Kwota kredytu” (2) = Wartość (1) × LTV/100,
  - przy zmianie (1) lub (2) – LTV przeliczane automatycznie = 2/1 × 100.

### 2.4. 4. Okres kredytowania

- Typ: dwa pola liczb całkowitych: „lat” i „m‑cy”.
- Domyślna wartość (przykładowa): 20 lat 0 m‑cy.
- Format danych: wartości całkowite (bez separatorów). Prezentowane jednostki „lat”, „m‑cy”.
- Dostępne wartości: lata ≥ 0, miesiące w zakresie 0–11.
- Walidacje:
  - łączna liczba miesięcy > 0,
  - miesiące w zakresie 0–11;
  - przy wpisaniu 12 m‑cy – automatyczne przeniesienie do lat (UX rekomendowany).
- Zależności i przeliczenia:
  - całkowita liczba rat n = lata × 12 + miesiące,
  - n używane we wszystkich wyliczeniach harmonogramu i wykresów.

### 2.5. 5. Data uruchomienia kredytu

- Typ: pole wyboru miesiąca/roku z pickerem (MonthPicker), z prezentacją „MMM RRRR” (np. „kwi 2026”).
- Domyślna wartość: bieżący lub najbliższy miesiąc (obserwowane „kwi 2026”).
- Walidacje:
  - wymagane,
  - poprawny miesiąc i rok.
- Zależności i przeliczenia:
  - wyznacza start harmonogramu (pierwsza rata w miesiącu „Początek spłat kapitału” – patrz 2.6),
  - zmiana daty przesuwa zakres dat w tabeli i na wykresach.

### 2.6. 6. Początek spłat kapitału

- Typ: pole miesiąc/rok z przyciskiem akcji „EDYTUJ”.
- Domyślna wartość: miesiąc następujący po „Dacie uruchomienia” (np. dla „kwi 2026” → „maj 2026”).
- Zachowanie:
  - domyślnie pole jest nieedytowalne (disabled),
  - kliknięcie „EDYTUJ” odblokowuje edycję i pozwala ustawić karencję (opóźnienie spłaty kapitału).
- Walidacje:
  - „Początek spłat” ≥ „Data uruchomienia”,
  - jeśli ustawiono karencję (Początek > Uruchomienie) – w okresie karencji harmonogram zawiera wyłącznie część odsetkową.

### 2.7. Jakie raty?

- Typ: przełącznik opcji (segment/segmented control).
- Dostępne wartości: „równe” | „malejące”.
- Zależności i przeliczenia:
  - „równe” (annuitet): rata stała R przez cały okres danego poziomu oprocentowania,
    - R = P × i_m / (1 − (1 + i_m)^(−n)),
  - „malejące”: część kapitałowa stała, odsetki malejące,
    - Kapitał*m = P / n, Odsetki_m = Saldom*−1 × i_m, R_m = Kapitał_m + Odsetki_m.

### 2.8. 7. Stopa (rodzaj oprocentowania)

- Typ: lista rozwijana (select).
- Dostępne wartości: „zmienna” | „stała”.
- Zachowanie i zależności:
  - „zmienna”: sekcja 2.9 „Oprocentowanie” jest polem tylko do odczytu, a wartość wyliczana jest jako „WIBOR + Marża”; widoczne i edytowalne pola 2.10 i 2.11.
  - „stała”: sekcja 2.9 staje się edytowalna (wartość nominalnego stałego oprocentowania), a pola 2.10 i 2.11 są ukryte lub ignorowane.

### 2.9. 8. Oprocentowanie (nominalne)

- Typ: pole procentowe z maską liczbową.
- Domyślna wartość (przykładowa przy „zmiennej”): 9,00 % (wynik 7,00% + 2,00%).
- Jednostka: %.
- Zachowanie:
  - przy „zmiennej” stopie: disabled, wyliczane = WIBOR (2.10) + Marża (2.11),
  - przy „stałej” stopie: edytowalne i używane bezpośrednio w kalkulacji.
- Walidacje: wymagane; zakres rozsądny, np. 0%–50% (rekomendacja UI); 2 miejsca po przecinku.

### 2.10. 8.a WIBOR

- Typ: pole procentowe.
- Domyślna wartość: 7,00 %.
- Jednostka: %.
- Zależności: przy „zmiennej” stopie współtworzy „Oprocentowanie” (2.9) jako WIBOR + Marża.
- Walidacje: wymagane; wartość nieujemna; 2 miejsca po przecinku.

### 2.11. 8.b Marża

- Typ: pole procentowe.
- Domyślna wartość: 2,00 %.
- Jednostka: %.
- Zależności: przy „zmiennej” stopie współtworzy „Oprocentowanie” (2.9).
- Walidacje: wymagane; wartość nieujemna; 2 miejsca po przecinku.

### 2.12. „+” (Dodaj okres oprocentowania)

- Typ: przycisk akcji w sekcji stóp.
- Działanie: dodaje kolejny okres oprocentowania zaczynający się od wskazanej daty (zależnie od wybranego typu stopy: jedno pole „Oprocentowanie” dla stałej, albo para „WIBOR”/„Marża” dla zmiennej).
- Walidacje i reguły:
  - daty okresów nie mogą się pokrywać ani mieć przerw (ciągłość linii czasu),
  - każdy okres musi mieć dodatni czas trwania,
  - zmiana okresów powoduje rekalkulację harmonogramu z podziałem na odcinki stałego oprocentowania.

---

## 3. Przyciski akcji (na dole sekcji danych)

### 3.1. „Wstaw domyślne”

- Działanie: ustawia wartości domyślne wszystkich pól na zakładce „Dane podstawowe” (np. 500 000 / 400 000 / 80% / 20 lat / bieżąca data / raty równe / zmienna 7%+2%).
- Walidacje: brak dodatkowych (operacja nadpisuje bieżące dane po potwierdzeniu lub natychmiast – zgodnie z projektem UX).

### 3.2. „Wyczyść dane”

- Działanie: zeruje/usuwa wartości we wszystkich polach wejściowych i czyści wyniki; resetuje wykresy i tabelę (do pustego stanu lub domyślnego minimalnego zakresu dat).
- Walidacje: może wymagać potwierdzenia (dialog), jeśli istnieją niezapisane zmiany.

### 3.3. „Zapisz kalkulację”

- Działanie: otwiera modal „Zapisz kalkulację” (nazwa, ewentualnie opis). Po zapisaniu konfiguracja (dane wejściowe) trafia do pamięci lokalnej (localStorage) lub backendu – w zależności od docelowej architektury.
- Walidacje:
  - nazwa kalkulacji – wymagane, niepusta,
  - unikalność nazwy (rekomendowane) lub nadpisanie po potwierdzeniu.

Dodatkowy przycisk w obszarze wyników: „drukuj” – patrz 5.2.

---

## 4. Tabele i podsumowania

### 4.1. Podsumowanie „Oddasz do banku … pożyczonej kwoty”

- Prezentowane wartości:
  - Udział całkowitych płatności względem kwoty pożyczonej (np. 216%).
  - Suma wszystkich płatności (kapitał + odsetki + koszty okołokredytowe − nadpłaty),
  - Rozbicie: „Odsetki”, „Koszty okołokredytowe”, „Kapitał – spłacany w ratach”, „Nadpłaty”.
- Sposób wyliczania:
  - Odsetki = suma odsetek w całym harmonogramie,
  - Koszty okołokredytowe = suma pozycji z zakładki „Koszty…” (tu default 0,00),
  - Kapitał = kwota kredytu (spłacona w ratach),
  - Nadpłaty = suma nadpłat (zakładka „Nadpłaty”, domyślnie 0,00),
  - Wskaźnik „Oddasz do banku [%]” = Suma wszystkich płatności / Kwota kredytu × 100.

---

## 6. Zdarzenia, przeliczenia i reguły aktualizacji

- Każda zmiana w polach wejściowych (2.1–2.11) wyzwala natychmiastową rekalkulację:
  - ponowne wyznaczenie n (liczby rat),
  - ponowne obliczenie R (dla rat równych) lub Kapitał_m (dla malejących),
  - przeliczenie odsetek, salda, sum i wskaźników,
  - odświeżenie wykresów i tabel (wraz z agregacją roczną).
- Zmiana „Rodzaju oprocentowania” (2.8) przełącza tryb edycji pól (2.9–2.11) i wywołuje rekalkulację.
- Dodawanie okresów oprocentowania („+”) dzieli harmonogram na podokresy stałego r i odpowiednio aktualizuje n oraz R lub Kapitał_m dla każdego podokresu.

---

## 7. Wymagania implementacyjne (Angular – wskazówki)

- Formularz: Reactive Forms + maski wejściowe dla walut i procentów (np. ngx-mask/Angular built-in pipes), walidacje synchroniczne; w razie potrzeby walidacje krzyżowe (kwota ≤ wartość; LTV = 2/1 × 100).
- Logika finansowa: osobna warstwa serwisowa z czystymi funkcjami obliczeniowymi (deterministyczne, testowalne), bez zależności od komponentu UI.
- Wykresy: Chart.js przez ngx‑charts/ngx‑chartjs lub bezpośrednią integrację; aktualizacja danych reaktywnie po zmianie formularza.
- Tabela: wirtualizacja przy długich harmonogramach; mechanizm grupowania (rok) + rozwijanie miesięcy; formatowanie walutowe i daty polskie (Intl.NumberFormat, Intl.DateTimeFormat, pl‑PL).
- Trwałość: zapisy konfiguracji lokalnie do pliku .json; serializacja tylko danych wejściowych, nie wyników.
- Dostępność (a11y): role ARIA dla przycisków/przełączników; focus management w modalach; etykiety i opisy dla czytników.
- brak API - wszystko ma się odbywać w aplikacji webowej Angular

---

## 8. Uwagi i ograniczenia obserwacyjne

- Zakładki „Koszty…”, „Transze”, „Nadpłaty” wpływają na wyniki (koszty, nadpłaty), ale nie są częścią tej specyfikacji – tu ujęto ich wpływ na poziomie agregacji.
