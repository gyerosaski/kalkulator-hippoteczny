## 5. Wykresy i prezentacja wizualna

### 5.1. „Struktura wszystkich płatności” (wykres kołowy/donut)
- Typ wykresu: donut (Chart.js).
- Dane: łączny udział w całkowitych płatnościach dla kategorii: Kapitał, Odsetki, Koszty okołokredytowe, Nadpłaty.
- Wyliczenia: sumy z całego harmonogramu zgodnie z punktami 4.1–4.2.

### 5.2. „Wysokość pierwszej raty” + „Struktura pierwszej raty”
- Wysokość pierwszej raty: wartość liczbowa (np. 3 598,90 zł) wynikająca z bieżących ustawień i_m, trybu rat oraz n.
- „Struktura pierwszej raty”: donut (Chart.js) – udział Kapitał vs Odsetki (+ ewentualne koszty okołokredytowe przypisane do raty).
- Dodatkowy przycisk „drukuj”: renderuje widok do wydruku (drukarka/PDF) zawierający podsumowania, wykresy i/lub harmonogram.

### 5.3. „Harmonogram spłaty kredytu …” (wykres trendu)
- Typ wykresu: wykres liniowy/warstwowy prezentujący komponenty w czasie (Odsetki, Kapitał, Nadpłaty, Koszty okołokredytowe, Pozostało do spłaty).
- Dane: miesięczne wartości z tabeli harmonogramu; zakres dat od „Początek spłat” do końca okresu.
- Wyliczenia: zgodnie z algorytmem z pkt 4.2.
