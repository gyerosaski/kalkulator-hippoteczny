# Kalkulator Hippoteczny

Program na komputer z systemem Windows, który pomaga policzyć, ile naprawdę będzie kosztował kredyt
hipoteczny, i porównać ze sobą oferty różnych banków. Wszystkie dane zostają na Twoim komputerze.

## Co potrafi aplikacja

**Podstawowe wyliczenia**

- Po wpisaniu wartości nieruchomości, kwoty kredytu i okresu spłaty od razu pokazuje wysokość raty,
  sumę odsetek, całkowity koszt kredytu oraz RRSO (rzeczywistą roczną stopę oprocentowania).
- Pokazuje wkład własny w postaci wskaźnika LTV (jaka część nieruchomości jest finansowana kredytem).
- Obsługuje raty równe i malejące oraz okres, w którym spłaca się tylko odsetki (karencja).

**Oprocentowanie**

- Oprocentowanie zmienne (wskaźnik referencyjny, np. WIBOR/WIRON, plus marża banku) lub stałe.
- Możliwość zaplanowania kilku okresów o różnym oprocentowaniu, np. stała stopa przez 5 lat, a potem
  zmienna — i sprawdzenia, jak zmieni się wtedy rata.

**Transze**

- Kredyt wypłacany w częściach (np. przy budowie domu) — z datami wypłat i ewentualnymi opłatami
  za ich uruchomienie.

**Koszty dodatkowe i promocje**

- Prowizja banku, opłata za wycenę nieruchomości.
- Ubezpieczenia: pomostowe, nieruchomości, niskiego wkładu, na życie i od utraty pracy.
- Inne dodatkowe koszty oraz promocyjne obniżki oprocentowania.
- Dzięki temu widać pełny koszt oferty, a nie tylko samą ratę.

**Nadpłaty**

- Nadpłaty jednorazowe albo regularne (co miesiąc, co kwartał, co rok).
- Wybór, czy nadpłata ma obniżyć ratę, czy skrócić okres spłaty.
- Opcja „chcę płacić co miesiąc stałą kwotę” — nadwyżka ponad ratę jest automatycznie traktowana
  jako nadpłata.
- Uwzględnienie prowizji banku za wcześniejszą spłatę.
- Od razu widać, ile pieniędzy pozwalają zaoszczędzić nadpłaty.

**Harmonogram i wykresy**

- Harmonogram spłat rok po roku, z możliwością rozwinięcia każdego roku na poszczególne miesiące.
- Czytelne wykresy: z czego składają się wszystkie płatności, z czego składa się rata, jak w kolejnych
  latach maleje dług oraz jak zmienia się oprocentowanie.

**Twoje kalkulacje i porównanie ofert**

- Zapisywanie kalkulacji pod własną nazwą, wyszukiwanie, sortowanie, zmiana nazwy, kopiowanie
  i usuwanie.
- Eksport kalkulacji do pliku (JSON, a harmonogramu także do CSV otwieranego w Excelu) oraz import
  z pliku — np. żeby przenieść dane na inny komputer.
- Porównanie dwóch zapisanych ofert obok siebie: która jest tańsza w sumie, która ma niższą pierwszą
  ratę, niższe odsetki i niższe koszty dodatkowe, oraz o ile się różnią.

**Wygoda**

- Podpowiedzi przy błędnie wpisanych danych (np. kwota kredytu większa niż wartość nieruchomości).
- Ustawienia wyglądu: motyw jasny, ciemny lub „ochra” oraz wielkość odstępów w interfejsie.
- Hipopotam Hippoteczny, który od czasu do czasu wybiega na pasek u góry okna (można go wyłączyć).

## Jak zacząć

1. Wejdź w zakładkę [**Releases**](https://github.com/gyerosaski/kalkulator-hippoteczny/releases)
   i pobierz najnowszą wersję:
   - **instalator** (plik `.msi` albo `setup.exe`) — program zostanie zainstalowany i pojawi się
     w menu Start,
   - **wersję bez instalacji** (plik `…-portable.exe`) — wystarczy ją uruchomić.
2. Przy pierwszym uruchomieniu Windows może wyświetlić ostrzeżenie SmartScreen (program nie jest
   podpisany cyfrowo). Wybierz „Więcej informacji” → „Uruchom mimo to”.

Program działa na Windows 10 i 11.

## Gdzie są moje dane

Kalkulacje zapisywane są wyłącznie lokalnie, w pliku na Twoim komputerze. Aplikacja niczego nie wysyła
do internetu. Kopię danych możesz w każdej chwili zrobić, eksportując kalkulacje do pliku.

## Dla programistów

Informacje techniczne — uruchamianie w trybie deweloperskim, polecenia, proces wydawania nowych
wersji i odnośniki do dokumentacji architektury — znajdziesz w
[**wiki projektu**](https://github.com/gyerosaski/kalkulator-hippoteczny/wiki).
