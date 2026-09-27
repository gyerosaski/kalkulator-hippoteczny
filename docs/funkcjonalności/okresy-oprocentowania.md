# Okresy oprocentowania

## 1. Kontekst

- Sekcja formularza: „Oprocentowanie”.
- Pozycja w lewej kolumnie: bezpośrednio pod sekcją „Dane podstawowe”, nad sekcją „Transze”.
- Sekcja jest **zwijana** (domyślnie rozwinięta), ale **nie jest wyłączalna** — co najmniej jeden okres
  oprocentowania jest zawsze wymagany do przeprowadzenia obliczeń.

Sekcja pozwala zdefiniować jeden lub wiele okresów oprocentowania, z których każdy określa typ stopy
i jej wartość obowiązującą od wskazanej daty.

## 2. Pola w karcie okresu

Sekcja zawiera listę kart `OKRES n`. Domyślnie istnieje jeden okres startujący od daty uruchomienia kredytu.

- `Stopa`: `zmienna` / `stała`. Domyślnie `zmienna`.
- `Oprocentowanie`: `%`, 2 miejsca. Widoczne tylko dla stopy stałej. Dla stopy zmiennej zastąpione polem
  tylko do odczytu prezentującym sumę `wskaźnik referencyjny + marża`.
- `Wskaźnik referencyjny`: `%`, 2 miejsca. Widoczne tylko dla stopy zmiennej. Domyślnie `7,00`.
- `Marża`: `%`, 2 miejsca. Widoczne tylko dla stopy zmiennej. Domyślnie `2,00`.

Reguły: wszystkie pola liczbowe z zakresu 0–50.

Pierwszy okres ma stałą datę startu „od daty uruchomienia kredytu” (bez wyboru daty). Kolejne okresy mają
edytowalne pole daty „od” w nagłówku karty oraz przycisk usuwania.

Przycisk `+ Dodaj okres oprocentowania` tworzy nowy okres z datą o 12 miesięcy późniejszą niż poprzedni
i kopiuje pozostałe wartości z poprzedniego okresu.

## 3. Zachowanie w obliczeniach

Okresy są uporządkowane rosnąco po dacie „od”. Dla danego miesiąca obowiązuje ostatni okres, którego
data „od” nie jest późniejsza niż ten miesiąc. Każda zmiana oprocentowania w trakcie spłaty powoduje
rekalkulację raty (równej lub malejącej) od bieżącego salda i pozostałej liczby rat.
