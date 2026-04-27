# Specyfikacja techniczna zakładki „Koszty okołokredytowe i promocje”

## 1. Kontekst zakładki

- Zakładka dostępna w kalkulatorze: `Koszty okołokredytowe i promocje`.
- Cel zakładki: konfiguracja wszystkich kosztów dodatkowych oraz promocji obniżających oprocentowanie, które wpływają na:
  - `Koszty okołokredytowe` (panel podsumowania),
  - `Suma wszystkich płatności`,
  - szczegółowy harmonogram spłat.

## 2. Elementy interaktywne

## 2.1. Sekcja: 1. Prowizja za udzielenie

- Pole: `1. Prowizja za udzielenie`
  - Typ: `textbox` (numeryczne, maskowane)
  - Domyślna wartość startowa: `0,00`
  - Wartość po `Wstaw domyślne`: `1,50`
  - Jednostka: `%` (z podglądem przeliczenia na `zł`)
  - Format: liczba dziesiętna z przecinkiem
  - Walidacje (UI): tylko wartość numeryczna
  - Sposób wyliczania: procent od kwoty kredytu (zweryfikowane: `1,00%` przy `400 000 zł` daje `4 000,00 zł` w podsumowaniu).

## 2.2. Sekcja: 2. Opłata za wycenę

- Pole: `2. Opłata za wycenę`
  - Typ: `textbox` (numeryczne)
  - Domyślna wartość startowa: `0,00`
  - Wartość po `Wstaw domyślne`: `400,00`
  - Jednostka: `zł`
  - Format: kwota dziesiętna
  - Walidacje (UI): tylko wartość numeryczna
  - Sposób wyliczania: kwota stała dodawana do `Koszty okołokredytowe`.

## 2.3. Sekcja: 3. Ubezpieczenie pomostowe

- Pole: `Bank podwyższa oprocentowanie o`
  - Typ: `textbox` (numeryczne)
  - Domyślna wartość startowa: `0,00`
  - Wartość po `Wstaw domyślne`: `1,20`
  - Jednostka: `%`
  - Format: liczba dziesiętna
  - Walidacje (UI): tylko wartość numeryczna
- Pole: `przez`
  - Typ: `textbox` (numeryczne)
  - Domyślna wartość startowa: `0`
  - Wartość po `Wstaw domyślne`: `6`
  - Jednostka: `miesięcy`
  - Walidacje (UI): liczba całkowita
- Sposób wyliczania: podwyższenie oprocentowania przez wskazaną liczbę miesięcy zwiększa koszt odsetkowy i łączną kwotę spłat.

## 2.4. Sekcja: 4. Ubezpieczenie nieruchomości

- Pole: `4.a Jak często opłacana jest składka?`
  - Typ: `combobox`
  - Dostępne wartości: `co rok`, `co miesiąc`
  - Domyślnie: `co rok`
- Pole: `4.b Jak wyliczana jest składka?`
  - Typ: `combobox`
  - Dostępne wartości: `% wartości nieruchomości`, `% kwoty kredytu`, `% salda kredytu`, `znam kwotę`
  - Domyślnie: `% wartości nieruchomości`
- Pole wartości składki
  - Typ: `textbox` (numeryczne)
  - Domyślna wartość startowa: `0,0000`
  - Wartość po `Wstaw domyślne`: `0,0008`
  - Jednostka: `%` (dla trybów procentowych)
- Pola okresu opłacania
  - Typ: `textbox` daty (`Od`, `do`)
  - Domyślne wartości startowe: `maj 2026` → `kwi 2046`
- Sposób wyliczania: składka naliczana wg wybranego trybu, częstotliwości i okresu; suma trafia do `Koszty okołokredytowe`.

## 2.5. Sekcja: 5. Ubezpieczenie niskiego wkładu

- Pole: `Bank podwyższa oprocentowanie o`
  - Typ: `textbox` (numeryczne)
  - Domyślna wartość: `0,00`
  - Jednostka: `%`
- Sposób wyliczania: podwyższenie oprocentowania wpływa na odsetki i całkowity koszt kredytu.

## 2.6. Sekcja: 6. Ubezpieczenie na życie

- Pole: `6.a Jak często opłacana jest składka?`
  - Typ: `combobox`
  - Opcje: `co rok`, `co miesiąc`, `jednorazowo`
  - Domyślnie: `co rok`
- Pole: `6.b Jak wyliczana jest składka?`
  - Typ: `combobox`
  - Opcje: `% kwoty kredytu`, `% salda kredytu`, `znam kwotę`
  - Domyślnie: `% kwoty kredytu`
- Pole wartości składki
  - Typ: `textbox` (numeryczne)
  - Domyślna wartość: `0,00000`
  - Jednostka: `%`
- Pola okresu opłacania (`Od`, `do`)
  - Typ: pola daty
  - Domyślnie: `maj 2026` → `kwi 2046`

## 2.7. Sekcja: 7. Ubezpieczenie od utraty pracy

- Pole: `7.a Jak często opłacana jest składka?`
  - Typ: `combobox`
  - Opcje: `jednorazowo`, `co rok`, `co miesiąc`
  - Domyślnie: `jednorazowo`
- Pole: `7.b Jak wyliczana jest składka?`
  - Typ: `combobox`
  - Opcje: `% kwoty kredytu`, `% salda kredytu`, `znam kwotę`
  - Domyślnie: `% kwoty kredytu`
- Pole wartości składki
  - Typ: `textbox` (numeryczne)
  - Domyślna wartość: `0,00`
  - Jednostka: `%`
- Pole okresu (`Od`)
  - Typ: pole daty
  - Domyślnie: `maj 2026`

## 2.8. Sekcja: Dodatkowe koszty

- Pole: `8. Nazwa kosztu`
  - Typ: `textbox` (tekst)
  - Domyślna wartość: pusta
  - Walidacje: pole opcjonalne, długość ograniczona po stronie UI
- Pole: `8.a Jak często pobierana jest opłata?`
  - Typ: `combobox`
  - Opcje: `jednorazowo`, `co rok`, `co miesiąc`
  - Domyślnie: `jednorazowo`
- Pole: `8.b Jak wyliczana jest opłata?`
  - Typ: `combobox`
  - Opcje: `% kwoty kredytu`, `% salda kredytu`, `znam kwotę`
  - Domyślnie: `znam kwotę`
- Pole wartości
  - Typ: `textbox` (numeryczne)
  - Domyślna wartość: `0,00`
  - Jednostka: `zł` (dla trybu `znam kwotę`)
- Pole: `8.c Okres ponoszenia kosztu` (`Od`)
  - Typ: pole daty
  - Domyślnie: `maj 2026`
- Przycisk `+`
  - Typ: `button`
  - Działanie: dodanie kolejnego rekordu kosztu.

## 2.9. Sekcja: Promocyjna wysokość oprocentowania

- Pole: `9. Bank obniża oprocentowanie o`
  - Typ: `textbox` (numeryczne)
  - Domyślna wartość: `0,00`
  - Jednostka: `%`
- Pola okresu promocji
  - Typ: pola daty (`Od`, `do`)
  - Domyślnie: `maj 2026` → `kwi 2027`
- Sposób wyliczania: obniżenie oprocentowania w zadanym okresie redukuje koszt odsetek i łączną sumę płatności.

## 3. Przyciski akcji

- `Wstaw domyślne`
  - Działanie: podstawia predefiniowane wartości sekcji kosztów/promocji.
  - Przykładowe efekty: prowizja `1,50%`, wycena `400,00 zł`, ubezpieczenie pomostowe `1,20%` przez `6` miesięcy.
- `Wyczyść dane`
  - Działanie: zeruje/usuwa dane w zakładce.
- `Zapisz kalkulację`
  - Działanie: zapisuje aktualny stan zakładki kalkulatora.
- `+` (w sekcji `Dodatkowe koszty`)
  - Działanie: dodaje nowy wpis kosztu.

## 4. Zweryfikowane reguły wyliczeń (testy funkcjonalne)

- Test 1: `Prowizja za udzielenie = 1,00%` przy kwocie kredytu `400 000 zł`
  - Wynik: `prowizja za udzielenie = 4 000,00 zł`, `Koszty okołokredytowe = 4 000,00 zł`.
- Test 2: dodatkowo `Opłata za wycenę = 1 000 zł`
  - Wynik: `Koszty okołokredytowe = 5 000,00 zł`.
- Wniosek: koszty sekcyjne są sumowane do pozycji `Koszty okołokredytowe`, a następnie do `Suma wszystkich płatności`.

## 5. Uwagi implementacyjne dla odtworzenia w Angularze

- Wszystkie pola numeryczne wymagają maskowania formatu PL (`przecinek` jako separator dziesiętny, separatory tysięcy).
- Pola dat powinny operować na miesiącu/roku (`MMM RRRR`) i obsługiwać zakresy (`Od`/`do`).
- Obliczenia należy wykonywać reaktywnie po każdej zmianie wartości i synchronizować:
  - panel podsumowania,
  - tabelę szczegółową kosztów,
  - harmonogram spłaty,
  - wizualizacje struktury płatności.
