### Dokumentacja funkcjonalna — Ustawienia aplikacji

Zakres: specyfikacja okna ustawień aplikacji oraz dostępnych w nim opcji.

---

## 1. Cel i zakres

Ustawienia aplikacji to zbiór globalnych preferencji użytkownika, niezależnych od konkretnej kalkulacji.
Dostęp zapewnia **ikona koła zębatego** umieszczona po prawej stronie paska górnego (zastąpiła wcześniejszy
bezpośredni przełącznik motywu słońce/księżyc).

Kliknięcie ikony otwiera modalne okno **„Ustawienia”** z listą dostępnych opcji. Zmiany aplikują się
**na żywo** — okno nie wymaga zatwierdzania, zawiera jedynie przycisk „Gotowe” zamykający okno.

---

## 2. Dostępne ustawienia

### 2.1. Motyw

- Kontrolka: lista rozwijana (gotowa na rozszerzenie o kolejne warianty w przyszłości).
- Wartości:
  - „jasny”,
  - „ciemny”,
  - „ochra” (ciepły, ziemisty wariant motywu ciemnego — ugier/oliwka/terakota).
- Wybór jest utrwalany między sesjami. Przy starcie aplikacji odczytywany jest zapisany motyw; w razie
  jego braku stosowana jest preferencja systemowa (jasny/ciemny), a w środowisku bez takiej informacji —
  motyw jasny.

### 2.2. Gęstość interfejsu

- Kontrolka: lista rozwijana.
- Wartości:
  - „kompaktowa” — mniejsze odstępy między elementami formularza, kartami wyników,
    wierszami tabeli harmonogramu spłat, wierszami listy „Twoje kalkulacje” oraz
    sekcjami widoku „Porównanie ofert”; dodatkowo tekst tabeli harmonogramu
    oraz etykiety nagłówków są nieznacznie mniejsze,
  - „standardowa” — domyślne odstępy i rozmiar tekstu,
  - „przestronna” — większe odstępy między elementami formularza, kartami wyników,
    wierszami tabeli harmonogramu spłat, wierszami listy „Twoje kalkulacje” oraz
    sekcjami widoku „Porównanie ofert” (rozmiar tekstu nie zmienia się względem
    trybu standardowego).
- Wysokość pól formularza i przycisków pozostaje taka sama we wszystkich trybach —
  gęstość wpływa wyłącznie na odstępy i (w trybie kompaktowym) na rozmiar tekstu
  w wybranych miejscach.
- Wybór jest utrwalany między sesjami. Przy starcie aplikacji odczytywana jest zapisana gęstość; w razie
  jej braku stosowana jest gęstość standardowa (brak odpowiednika preferencji systemowej).

### 2.3. Hipopotam Hippoteczny

- Kontrolka: przełącznik włącz/wyłącz.
- Steruje dekoracyjną animacją w pasku górnym: pixel-artowy hipopotam, który w losowych odstępach
  (kilka–kilkanaście sekund) wybiega zza paska nawigacji w losowo wybraną stronę, przystaje na chwilę
  i wraca na miejsce.
- Element jest wyłącznie ozdobny — nie niesie żadnej informacji i nie da się z nim wejść w interakcję.
  Wyłączenie nie wpływa na działanie ani wygląd pozostałych części aplikacji.
- Wyłączenie usuwa hipopotama z paska górnego natychmiast, bez zamykania okna ustawień; ponowne
  włączenie przywraca go, a animacja rusza po najbliższej losowej przerwie.
- Domyślnie włączony. Wybór jest utrwalany między sesjami.
