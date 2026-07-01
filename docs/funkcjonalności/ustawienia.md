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
  - „kompaktowa” — mniejsze odstępy między elementami formularza i wyników,
  - „standardowa” — domyślne odstępy,
  - „przestronna” — większe odstępy.
- Wybór jest utrwalany między sesjami. Przy starcie aplikacji odczytywana jest zapisana gęstość; w razie
  jej braku stosowana jest gęstość standardowa (brak odpowiednika preferencji systemowej).
