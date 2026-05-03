### Funkcje dostępne na zakładce „Dane podstawowe” – opis techniczny

Aplikacja: Kalkulator kredytu hipotecznego 2.0
Zakres: Szczegółowy opis funkcji (akcji użytkownika i zachowań systemu) dostępnych na zakładce „Dane podstawowe”.
Data: 2026-04-25

---

## 1. Edycja pól wejściowych i przeliczanie wyników

- Funkcja: Wprowadzanie wartości do pól formularza:
  - 1. Wartość nieruchomości [waluta – zł],
  - 2. Kwota kredytu [waluta – zł],
  - 3. LTV [%],
  - 4. Okres kredytowania [lata, miesiące],
  - 5. Data uruchomienia kredytu [miesiąc/rok],
  - 6. Początek spłat kapitału [miesiąc/rok],
  - 7–11. Parametry oprocentowania (rodzaj stopy, WIBOR, Marża lub Oprocentowanie stałe).
- Działanie: Każda zmiana wartości uruchamia natychmiastową rekalkulację:
  - przeliczenie liczby rat (n),
  - wyznaczenie rat (równe/malejące), odsetek i salda,
  - aktualizacja sum i wskaźników,
  - odświeżenie wykresów i tabel (w tym agregacji rocznej).
- Walidacje: pola wymagane, zakresy liczbowe, spójność (np. Kwota ≤ Wartość; LTV w [0;100]), poprawny format daty.
- Formatowanie: maski wejściowe dla walut (spacja jako separator tysięcy, przecinek dziesiętny) i procentów (2 miejsca po przecinku).

## 2. Powiązania pól (logika LTV i kwoty)

- Funkcja: Spójność między polami 1–3.
- Działanie:
  - LTV = Kwota / Wartość × 100,
  - Gdy użytkownik edytuje LTV – automatycznie wyliczana jest „Kwota kredytu” = Wartość × LTV/100,
  - Gdy użytkownik edytuje „Kwotę” lub „Wartość” – LTV przeliczane automatycznie.

## 3. Ustawienie okresu kredytowania

- Funkcja: Edycja „lat” i „m‑cy”.
- Działanie: Łączna liczba miesięcy n = lata × 12 + miesiące; w razie wpisania 12 m‑cy – rekomendowane auto-przeniesienie 1 roku do „lat”.
- Walidacje: łączna liczba miesięcy > 0; miesiące 0–11.

## 4. Wybór daty uruchomienia kredytu (MonthPicker)

- Funkcja: Zmiana miesiąca/roku startu kredytu.
- Działanie: Zmiana przesuwa zakres harmonogramu i wykresów; domyślny „Początek spłat” to kolejny miesiąc.

## 5. Edycja „Początek spłat kapitału”

- Funkcja: Przycisk „EDYTUJ” odblokowuje pole miesiąc/rok.
- Działanie: Pozwala ustawić karencję (spłacane tylko odsetki do wskazanej daty).
- Walidacje: „Początek spłat” ≥ „Data uruchomienia”.

## 6. Wybór trybu rat – „Jakie raty?”

- Funkcja: Przełącznik „równe” | „malejące”.
- Działanie:
  - „równe”: zastosowanie wzoru annuitetowego do wyznaczenia stałej raty,
  - „malejące”: stały kapitał, malejące odsetki.
- Skutek: natychmiastowa zmiana harmonogramu, podsumowań i wykresów.

## 7. Wybór rodzaju stopy (oprocentowania)

- Funkcja: Select „zmienna” | „stała”.
- Działanie:
  - „zmienna”: edytowalne pola „WIBOR” i „Marża”, „Oprocentowanie” (8) tylko do odczytu = WIBOR + Marża,
  - „stała”: edytowalne pole „Oprocentowanie”, pola „WIBOR/Marża” ukryte lub ignorowane.

## 8. Dodawanie okresu oprocentowania – przycisk „+”

- Funkcja: Dodaje kolejny okres stopy (z nowym poziomem oprocentowania od wybranej daty).
- Działanie: Harmonogram dzieli się na odcinki stałego oprocentowania; wyliczenia dla każdego odcinka prowadzone są niezależnie.
- Walidacje/reguły: brak nakładania i luk między okresami; dodatnia długość każdego okresu.

## 9. Wstawianie wartości domyślnych – „Wstaw domyślne”

- Funkcja: Reset formularza do zestawu domyślnego.
- Działanie: Ustawia wartości wejściowe na domyślne i rekonstruuje wyniki.
- Uwagi: Operacja może nadpisywać dane bez pytania lub z potwierdzeniem (wg projektu UX).

## 10. Czyszczenie danych – „Wyczyść dane”

- Funkcja: Zeruje wszystkie pola wejściowe.
- Działanie: Czyści formularz, zeruje wyniki, wykresy i tabelę.
- Uwagi: Zalecane potwierdzenie przy niezapisanych zmianach.

## 11. Zapisywanie kalkulacji – „Zapisz kalkulację”

- Funkcja: Otwiera modal zapisu.
- Działanie: Użytkownik podaje nazwę (i opcjonalnie opis). Dane wejściowe zapisywane są lokalnie lub do backendu (zależnie od architektury docelowej).
- Walidacje: nazwa wymagana; opcjonalnie ostrzeżenie przy nadpisaniu istniejącej nazwy.
- Powiązanie: Lista zapisanych pozycji dostępna z sekcji „Twoje kalkulacje” (nawigacja poza zakładką).

## 12. Podgląd szczegółów podsumowania – „pokaż szczegóły”

- Funkcja: Rozwijanie sekcji podsumowania kosztów.
- Działanie: Pokazuje szczegółowy rozkład „Struktury wszystkich płatności” oraz listę kosztów okołokredytowych (domyślnie 0,00, jeśli nie skonfigurowano na innych zakładkach).

## 13. Drukowanie – „drukuj”

- Funkcja: Generowanie widoku do wydruku (lub PDF przez drukarkę wirtualną).
- Działanie: Drukuje bieżące podsumowania, wykresy i/lub harmonogram.

## 14. Przeglądanie harmonogramu spłaty

- Funkcja: Rozwijanie rocznych agregatów do widoku miesięcznego (wiersze „+ RRRR …”).
- Działanie: Kliknięcie w wiersz roku rozwija listę miesięcy z kolumnami: Data, Rata, Kapitał, Odsetki, Nadpłaty, Pozostało do spłaty, Koszty okołokredytowe.

## 15. Aktualizacja wykresów w czasie rzeczywistym

- Funkcja: Dynamiczne odświeżanie wykresów (Chart.js) po każdej zmianie formularza.
- Działanie:
  - Donut „Struktura wszystkich płatności”: przelicza udziały Kapitał/Odsetki/Koszty/Nadpłaty,
  - Donut „Struktura pierwszej raty”: przelicza udział kapitału i odsetek w pierwszej racie,
  - Wykres trendu „Harmonogram spłaty kredytu …”: aktualizuje serie w czasie.

## 16. Walidacje i komunikaty błędów

- Funkcja: Sprawdzenie poprawności wejść i relacji między polami.
- Działanie:
  - blokuje zapis i kalkulacje przy wartościach nieprawidłowych,
  - wyświetla komunikaty (inline) i/lub oznacza pola (np. czerwone obramowanie),
  - przykłady: brak wartości, liczba ujemna, LTV spoza [0;100], Kwota > Wartość, niepoprawny miesiąc/rok.

## 17. Dostępność i obsługa klawiatury

- Funkcja: Umożliwienie pełnej obsługi formularza z klawiatury.
- Działanie: Focus management, skróty do przełączników (równe/malejące), nawigacja po pickerze dat (strzałki), etykiety ARIA.

## 18. Formatowanie i lokalizacja

- Funkcja: Prezentacja zgodna z PL (pl-PL).
- Działanie: Waluty w zł, spacja tysięcy, przecinek dziesiętny, nazwy miesięcy w języku polskim, procenty z dwoma miejscami po przecinku.

## 19. Odzyskiwanie/utrzymanie stanu (opcjonalne)

- Funkcja: Zachowanie bieżącego stanu formularza pomiędzy odświeżeniami strony (jeśli projekt tak zakłada).
- Działanie: LocalStorage/sessionStorage do buforowania ostatnich danych wejściowych; przy uruchomieniu – załadowanie bufora lub domyślnych wartości.

---

## Zależności między funkcjami

- Zmiana któregokolwiek z pól 1–11 wpływa na funkcje 12–15 (podsumowania, tabele, wykresy) oraz walidacje (16).
- Przełączenie „rodzaju stopy” steruje dostępnością/trybem edycji pól „Oprocentowanie” vs „WIBOR/Marża” oraz działaniem przycisku „+” (8).
- Ustawienie „Początek spłat” decyduje o pojawieniu się okresu karencji w harmonogramie oraz o datach serii na wykresach.

---

Uwaga: W badanej wersji UI nie zidentyfikowano jawnych tooltipów przy elementach w tej zakładce. Jeśli wymagane – należy doprecyzować treści tooltipów w materiałach produktowych i zaimplementować je w UI.
