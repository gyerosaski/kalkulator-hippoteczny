### Dokumentacja funkcjonalna sekcji formularza — „Dane podstawowe”

Zakres: specyfikacja elementów i logiki sekcji „Dane podstawowe” z perspektywy użytkownika i domeny.

---

## 1. Cel i zakres sekcji

Sekcja „Dane podstawowe” służy do zdefiniowania kluczowych parametrów kredytu hipotecznego oraz
natychmiastowego wyliczenia:

- wysokości pierwszej raty,
- całkowitych kosztów (odsetki + koszty okołokredytowe + nadpłaty + prowizje),
- harmonogramu spłaty (tabela agregowana rocznie, rozwijana do widoku miesięcznego),
- udziału poszczególnych składników płatności (donuty „Struktura wszystkich płatności” i „Struktura pierwszej raty”).

Wyniki aktualizują się na bieżąco po każdej zmianie pola formularza. Sekcja „Dane podstawowe” jest jedyną
domyślnie rozwiniętą i niewyłączalną — pozostałe sekcje („Koszty okołokredytowe i promocje”, „Transze”,
„Nadpłaty”) są opcjonalne i włączane przełącznikiem w nagłówku.

---

## 2. Pola wejściowe i przełączniki

Wszystkie pola walutowe i procentowe formatują wartość według lokalizacji `pl-PL` (separator tysięcy:
spacja, separator dziesiętny: przecinek). Pola dat operują na miesiącu i roku.

### 2.0. Skróty dat w oknie wyboru miesiąca

Każde pole daty otwiera okno wyboru miesiąca, w którym — oprócz wyboru roku i miesiąca — mogą pojawić się
przyciski-skróty:

- **Bieżący miesiąc** — aktualny miesiąc kalendarzowy,
- **Data uruchomienia** — bieżąca wartość pola „Data uruchomienia kredytu”,
- **Początek spłat kapitału** — bieżąca wartość pola „Początek spłat kapitału”,
- **Ostatni miesiąc kredytu** — wyliczony jako miesiąc ostatniej raty (data uruchomienia powiększona
  o liczbę rat; pierwsza rata przypada miesiąc po uruchomieniu, więc ostatnia z `n` rat wypada `n`
  miesięcy po dacie uruchomienia).

Każdy przycisk-skrót pokazuje swoją etykietę (wielkimi literami) oraz konkretny miesiąc i rok, który
zostanie wprowadzony po jego wciśnięciu. Kliknięcie skrótu ustawia daną datę i zamyka okno.

Skróty są dostępne dla wszystkich pól dat **z wyjątkiem** pól „Data uruchomienia kredytu” oraz
„Początek spłat kapitału” — przy nich okno wyboru miesiąca nie pokazuje żadnych skrótów. Przy
pozostałych polach dat (np. okresy oprocentowania, daty transz, daty nadpłat, daty obowiązywania
ubezpieczeń, kosztów i promocji) dostępne są wszystkie skróty.

Pojedynczy skrót jest pomijany tylko wtedy, gdy jego wartość nie jest określona (np. brak okresu
kredytowania ukrywa „Ostatni miesiąc kredytu”).

### 2.1. Wartość nieruchomości

- Jednostka: `zł`, bez miejsc dziesiętnych.
- Domyślna wartość startowa: `500 000`.
- Reguły: wartość obowiązkowa, większa od zera.
- Zależności: zmiana przelicza LTV (`LTV = kwota kredytu / wartość nieruchomości × 100`). Jeśli kwota
  kredytu przekracza wartość nieruchomości, kwota kredytu zostaje obcięta do wartości nieruchomości.

### 2.2. Kwota kredytu

- Jednostka: `zł`, bez miejsc dziesiętnych.
- Domyślna wartość startowa: `400 000`.
- Reguły: wartość obowiązkowa, większa od zera. Kwota kredytu nie może przekraczać wartości nieruchomości.
- Zależności: zmiana przelicza LTV.

### 2.3. LTV

- Jednostka: `%`, 2 miejsca dziesiętne.
- Domyślna wartość startowa: `80`.
- Reguły: wartość obowiązkowa, z zakresu 0–100.
- Zależności: zmiana przelicza kwotę kredytu (`kwota kredytu = wartość nieruchomości × LTV / 100`).
  Wartość powyżej 100 jest sprowadzana do 100.

### 2.4. Okres kredytowania

- Wprowadzany w latach lub miesiącach (przełącznik jednostki); przechowywany zawsze w miesiącach
  (`miesiące = round(lata × 12)`).
- Domyślna wartość startowa: `240` miesięcy (20 lat).
- Reguły: wartość obowiązkowa, co najmniej 1 miesiąc.
- Zależności: liczba rat równa się okresowi kredytowania; karencja wynika z odstępu między datą
  uruchomienia a początkiem spłat kapitału.

### 2.5. Data uruchomienia kredytu

- Format: miesiąc i rok.
- Domyślna wartość startowa: bieżący miesiąc.
- Reguły: wartość obowiązkowa.
- Zależności: data pierwszej transzy jest zsynchronizowana z datą uruchomienia (pierwsza transza nie ma
  odrębnej daty); pierwsza rata przypada na miesiąc następujący po dacie uruchomienia.

### 2.6. Początek spłat kapitału

- Format: miesiąc i rok. Pole jest zawsze edytowalne.
- Domyślna wartość startowa: miesiąc po dacie uruchomienia.
- Reguły: wartość obowiązkowa; nie może być wcześniejsza niż data uruchomienia. Gdy włączone są transze
  i zdefiniowano więcej niż jedną, początek spłat kapitału musi przypadać ściśle po dacie ostatniej transzy.
- Zależności: ustawienie daty późniejszej niż miesiąc po uruchomieniu skutkuje karencją (w okresie
  karencji harmonogram zawiera wyłącznie odsetki, część kapitałowa wynosi 0).

### 2.7. Typ rat

- Wartości: `równe`, `malejące`. Domyślnie `równe`.
- Wartość obowiązuje globalnie dla całego okresu kredytu (jeden typ rat dla wszystkich okresów oprocentowania).
- Zależności:
  - `równe` (annuitet): rata stała `R = saldo × i_m / (1 − (1 + i_m)^(−n_pozostałe))`,
  - `malejące`: część kapitałowa stała `Kapitał_m = saldo / n_pozostałe`, odsetki
    `Odsetki_m = saldo_{m-1} × i_m`, rata `R_m = Kapitał_m + Odsetki_m`,
    gdzie `i_m` to miesięczna stopa (stopa roczna / 12), a `n_pozostałe` — liczba pozostałych rat.
- Przy zmianie okresu oprocentowania, dołączeniu transzy lub nadpłacie ze skutkiem „niższa rata” rata
  jest przeliczana ponownie od bieżącego salda i pozostałej liczby rat.

### 2.8. Oprocentowanie

Okresy oprocentowania są wydzielone do osobnej, zwijanej sekcji „Oprocentowanie”, prezentowanej
bezpośrednio pod sekcją „Dane podstawowe”. Pełny opis: `docs/funkcjonalności/okresy-oprocentowania.md`.

---

## 3. Akcje globalne

Sekcja danych podstawowych nie ma osobnego paska akcji — globalne przyciski znajdują się w nagłówku aplikacji.

### 3.1. „Wstaw domyślne”

Wstawia komplet przykładowych wartości: resetuje dane podstawowe, regułę docelowej raty, prowizję za
wcześniejszą spłatę, listę okresów oprocentowania (jeden okres — stopa zmienna, wskaźnik 7% + marża 2%),
reguły nadpłat oraz transze (jedna transza równa kwocie kredytu), a także przykładowe koszty okołokredytowe
(m.in. opłata za wycenę 400 zł, ubezpieczenie pomostowe +1,2% przez 6 miesięcy, ubezpieczenie
nieruchomości 0,0008%). Akcja nie pyta o potwierdzenie.

### 3.2. „Zapisz kalkulację”

Otwiera okno zapisu z polem nazwy. Po zatwierdzeniu kalkulacja zostaje zapisana lokalnie; jeśli kalkulacja
o tej nazwie już istnieje, użytkownik jest pytany o nadpisanie. Dane są zapisywane lokalnie i mogą być
eksportowane/importowane jako JSON (szczegóły: `docs/funkcjonalności/twoje-kalkulacje.md`).

---

## 4. Panel wyników

Wyniki prezentowane są w prawej kolumnie jako seria kart (wykresy + harmonogram) — opis poszczególnych
kart w `docs/funkcjonalności/wykresy.md` i `docs/funkcjonalności/harmonogram-splaty.md`.

Wartości zbiorcze:

- suma wszystkich płatności = rata + nadpłata + prowizja za wcześniejszą spłatę, zsumowane po całym okresie,
- koszty okołokredytowe = prowizja za udzielenie + opłata za wycenę + ubezpieczenia + prowizje za
  wcześniejszą spłatę + opłaty za uruchomienie transz,
- nadpłaty = suma nadpłat,
- udział zwrotu do banku = suma wszystkich płatności / kwota kredytu × 100.

### 4.1. RRSO (Rzeczywista Roczna Stopa Oprocentowania)

RRSO (w %, pusta gdy nieobliczalna) wyliczana jest według formuły APRC z dyrektywy 2008/48/WE: szukana
jest stopa `X`, dla której suma zdyskontowanych wypłat kredytu równa się sumie zdyskontowanych płatności
kredytobiorcy:

```
Σ Dₖ·(1+X)^(−tₖ/12) = Σ Pⱼ·(1+X)^(−tⱼ/12)      (t — miesiące od uruchomienia, wykładnik w latach)
```

Montaż przepływów pieniężnych:

- **Wypłaty (Dₖ):** saldo początkowe w `t=0` (pierwsza transza lub cała kwota kredytu) + każda kolejna
  transza w miesiącu jej uruchomienia.
- **Płatności (Pⱼ):** dla każdego miesiąca rata + nadpłata + prowizja za wcześniejszą spłatę + koszty
  okołokredytowe, z dwiema korektami:
  - koszty wstępne (prowizja za udzielenie + opłata za wycenę) są przenoszone do `t=0` (zgodnie z konwencją
    dyrektywy — koszty płatne przy zawarciu umowy),
  - prowizje za uruchomienie transz są dodawane w miesiącach uruchomienia transz; pierwsza transza
    z definicji nie ma prowizji za uruchomienie, więc jest pomijana.

**Prezentacja:** RRSO wyświetlane jest w stopce legendy karty „Struktura płatności” (format `pl-PL`,
2 miejsca po przecinku). Stopka jest ukryta, gdy RRSO jest nieobliczalna.

---

## 5. Walidacje krzyżowe

Walidacje obejmujące wiele pól prezentowane są jako lista błędów globalnych:

| Warunek wyzwolenia                                                                               | Komunikat / efekt                                               |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Kwota kredytu większa od wartości nieruchomości                                                  | błąd: kwota kredytu nie może przekraczać wartości nieruchomości |
| Okres kredytowania ≤ 0 miesięcy                                                                  | błąd: niepoprawny okres kredytowania                            |
| Początek spłat kapitału wcześniejszy niż data uruchomienia                                       | błąd: spłata kapitału przed uruchomieniem                       |
| Transze włączone, liczba transz > 1, początek spłat kapitału nie późniejszy niż ostatnia transza | błąd: spłata kapitału musi zacząć się po ostatniej transzy      |
| Transze włączone i suma transz ≠ kwocie kredytu (tolerancja 0,01)                                | błąd: suma transz musi równać się kwocie kredytu                |
| Reguła nadpłaty (nie „jednorazowo”) z datą „do” wcześniejszą niż „od”                            | błąd: niepoprawny zakres dat nadpłaty                           |
| Ujemna kwota nadpłaty                                                                            | błąd: kwota nadpłaty nie może być ujemna                        |
| Reguła docelowej raty z datą „do” wcześniejszą niż „od”                                          | błąd: niepoprawny zakres dat docelowej raty                     |
| Ujemna docelowa rata                                                                             | błąd: docelowa rata nie może być ujemna                         |

Gdy formularz jest niepoprawny, panel wyników, donuty i tabela znikają, a w ich miejscu prezentowana jest
lista błędów.

---

## 6. Reguły aktualizacji wyników

- Każda zmiana dowolnego pola formularza wyzwala ponowne przeliczenie.
- Sekcje opcjonalne („Koszty okołokredytowe i promocje”, „Transze”, „Nadpłaty”) mają przełącznik włączenia.
  Gdy są wyłączone, ich dane nie wpływają na wynik (przyjmowane są wartości neutralne: zerowe ubezpieczenia,
  brak transz, brak nadpłat).
- Stan zwinięcia/rozwinięcia kart z okresami oprocentowania nie jest zapamiętywany — to czysto wizualna właściwość.
