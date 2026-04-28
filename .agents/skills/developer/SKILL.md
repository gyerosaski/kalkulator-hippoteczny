---
name: developer
description: Wytwarza oprogramowanie Angular na podstawie wskazanej analizy z katalogu `docs/analiza`.
version: 1.0.0
parameters:
  - name: nazwa_analizy
    type: string
    required: true
    description: Nazwa pliku analizy (bez rozszerzenia `.md`) z katalogu `docs/analiza`.
triggers:
  - implementacja na podstawie analizy
  - wytworzenie aplikacji na podstawie dokumentacji
  - kodowanie funkcjonalności z pliku w docs/analiza
---

## Cel skilla

Wytworzenie lub rozwinięcie oprogramowania w Angularze na podstawie istniejącej analizy funkcjonalno-technicznej znajdującej się w katalogu `docs/analiza`.

## Wejście

- Parametr wymagany: `nazwa_analizy`
- Oczekiwany plik wejściowy: `docs/analiza/<nazwa_analizy>.md`

## Zakres odpowiedzialności

- Odczyt i zrozumienie analizy wskazanej parametrem `nazwa_analizy`.
- Przełożenie wymagań analizy na implementację w kodzie aplikacji.
- Użycie skilla `angular-developer` do przygotowania kodu zgodnego z dobrymi praktykami Angular.
- Dostosowanie struktury, komponentów, logiki, walidacji i przepływów UI do opisu z analizy.
- Weryfikacja zgodności implementacji z wymaganiami opisanymi w analizie.

## Kroki wykonania

1. Otwórz plik `docs/analiza/<nazwa_analizy>.md` i zidentyfikuj wymagania funkcjonalne, pola, walidacje, obliczenia i stany UI.
2. Zmapuj wymagania na elementy Angulara (komponenty, serwisy, modele, formularze, routing, widoki).
3. Zaimplementuj rozwiązanie, korzystając ze skilla `angular-developer`.
4. Do poruszania się po kodzie wykorzystuj serwer mcp "serena".
5. Uzupełnij brakujące elementy techniczne konieczne do działania funkcji (np. typy danych, domyślne wartości, obsługa błędów).
6. Zweryfikuj, czy działanie aplikacji odpowiada analizie i czy nie pominięto żadnego wymaganego scenariusza.

## Wymagania jakościowe

- Implementacja ma być spójna z analizą oraz stylem istniejącego kodu projektu.
- Nie zgaduj wymagań: gdy analiza jest niejednoznaczna, zgłoś potrzebę doprecyzowania.
- Zachowaj czytelność i modularność kodu.
- Uwzględniaj walidacje, przypadki brzegowe i komunikaty dla użytkownika.
- **Nie pisz testów** - testy zostaną napisane w osobnym skilu.
