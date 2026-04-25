---
name: analityk
description: Analizuje wskazaną zakładkę kalkulatora hipotecznego i przygotowuje dokumentację techniczną.
version: 1.1.0
parameters:
  - name: nazwa_zakladki
    type: string
    required: true
    description: Nazwa analizowanej zakładki.
    allowed_values:
      - Dane podstawowe
      - Koszty okołokredytowe i promocje
      - Transze
      - Nadpłaty
triggers:
  - analiza zakładki kalkulatora hipotecznego
  - dokumentacja funkcjonalna zakładki
  - odtworzenie widoku kalkulatora w Angularze
---

## Cel skilla

Przygotowanie szczegółowej dokumentacji technicznej dla zakładki wskazanej przez parametr `nazwa_zakladki`, tak aby programiści mogli odtworzyć aplikację w Angularze.

## Wejście

- Parametr wymagany: `nazwa_zakladki`
- Dozwolone wartości:
  - `Dane podstawowe`
  - `Koszty okołokredytowe i promocje`
  - `Transze`
  - `Nadpłaty`

## Kroki wykonania

1. Korzystając z Playwright, otwórz stronę `https://wiedza.marciniwuc.com/kalkulator-kredytu-hipotecznego/`.
2. Przejdź do zakładki wskazanej w parametrze `nazwa_zakladki`.
3. Przygotuj szczegółową dokumentację techniczną w formacie Markdown dla wskazanej zakładki.
4. Opisz wszystkie kluczowe elementy zakładki:
   - elementy interaktywne:
     - nazwa pola,
     - typ pola,
     - dostępne wartości,
     - treści w tooltipach,
     - format wpisywanych danych,
     - jednostka wpisywanych danych,
     - walidacje,
     - sposób wyliczania wartości,
   - przyciski akcji:
     - nazwa,
     - treści w tooltipach,
     - działanie,
     - walidacje,
   - tabele:
     - nazwy kolumn,
     - prezentowane wartości,
     - sposób wyliczania wartości,
   - wykresy:
     - typ wykresu,
     - rodzaj prezentowanych danych,
     - sposób wyliczania wartości.
5. Zbadaj i opisz wszystkie dostępne funkcje zakładki w oddzielnym pliku `.md`. w katalogu `docs/analiza/`.
6. Korzystając z serwera mcp "duck" dopytaj użytkownika, czy akceptuje analizę.

## Wymagania jakościowe

- Stosuj profesjonalny język.
- Zachowaj przejrzystą strukturę dokumentu (nagłówki, sekcje, listy).
- Nie pomijaj żadnego elementu dostępnego w analizowanej zakładce.
