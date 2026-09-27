# Skanowanie repozytorium pod kątem nieużywanych klas CSS

Dokument opisuje **najefektywniejszą i najbezpieczniejszą metodykę** wykrywania martwych klas CSS
(selektorów zdefiniowanych w SCSS, do których nie odwołuje się żaden szablon ani kod), tak aby
można je potem **ręcznie** usunąć bez ryzyka skasowania klasy używanej dynamicznie.

To opis metodyki — nie zawiera gotowej listy klas ani implementacji skryptu. Lista nieużywanych
klas jest „migawką" i dezaktualizuje się przy każdej zmianie kodu, dlatego należy ją generować
na bieżąco wg poniższej procedury, a nie utrwalać w dokumentacji.

---

## 1. Dlaczego to repozytorium nadaje się do precyzyjnego skanowania

Decydujące ustalenia z analizy kodu:

1. **Brak `ViewEncapsulation.None`** w całym `src/`. Wszystkie style komponentów są scoped
   (emulated encapsulation Angulara — selektory są przepisywane na atrybutowe `[_ngcontent-…]`).
   **Konsekwencja krytyczna:** klasa zdefiniowana w `foo.component.scss` może pasować **wyłącznie**
   do `foo.component.html` oraz hosta tego komponentu. Nie „przecieka" do innych komponentów.
   To czyni analizę per-komponent **deterministyczną** i niemal wolną od fałszywych trafień.

2. **Dwa rozłączne zakresy**, które trzeba analizować osobno, różnymi regułami:
   - **SCSS scoped** (~45 plików `*.component.scss`) — każdy zestawiany **tylko** ze swoim
     rodzeństwem (`*.component.html` + `*.component.ts`).
   - **`src/styles.scss`** (globalny, ~93 selektory klas) — musi być zestawiony ze **wszystkimi**
     ~80 szablonami + wszystkimi bindowaniami klas w plikach `.ts` + dynamicznymi stringami.

3. **Brak gotowych narzędzi CSS** w repo — `npm run lint` to wyłącznie ESLint na `.ts`.
   Nie ma PurgeCSS ani Stylelint.

---

## 2. Pułapki — gdzie klasa jest używana w sposób niewidoczny dla naiwnego grepa

Klasa może być w pełni używana, mimo że nie pojawia się jako `class="…"` w szablonie. Pominięcie
któregokolwiek z poniższych źródeł generuje **fałszywe trafienia** (zgłoszenie żywej klasy jako martwej):

| Źródło użycia                       | Gdzie   | Przykład                                |
| ----------------------------------- | ------- | --------------------------------------- |
| Statyczny atrybut                   | `.html` | `class="card-head"`                     |
| Statyczne bindowanie warunkowe      | `.html` | `[class.row--2]="…"`                    |
| Dynamiczne bindowanie całości       | `.html` | `[class]="row.deltaClass"`              |
| **Host: `[class.x]` w dekoratorze** | `.ts`   | `host: { '[class.badge--green]': '…' }` |
| **Host: stały `class`**             | `.ts`   | `host: { class: 'icon' }`               |
| String budowany w kodzie            | `.ts`   | wartości typu `ComparisonDeltaClass`    |

**Wzorcowy przykład (`ui-badge`):** klasy `.badge--green`, `.badge--red`, `.badge--neutral`
są zdefiniowane w `badge.component.scss`, ale **nie ma ich w `badge.component.html`** — są
przypinane przez `host: { '[class.badge--green]': '…' }` w `badge.component.ts`. Skan
sprawdzający tylko HTML błędnie uznałby wszystkie trzy za martwe. **Dlatego dla każdego
komponentu trzeba przeszukiwać parę `.html` + `.ts` łącznie.**

Dodatkowo w SCSS występuje **konkatenacja BEM `&--` / `&__`** (np. `toast.component.scss`:
`&--error`, `&--info` zagnieżdżone pod `.toast`). Ekstraktor nazw klas musi odtworzyć pełną
nazwę z kontekstu rodzica (`.toast` + `&--error` = `.toast--error`), inaczej zgłosi fałsz.

---

## 3. Porównanie podejść

| Podejście                                      | Werdykt | Uzasadnienie                                                                                                                                                                |
| ---------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PurgeCSS**                                   | ❌      | Działa na _zbudowanym_ CSS+HTML. Słabo radzi sobie z atrybutowymi selektorami emulated encapsulation i z dynamicznymi bindowaniami; wymaga ręcznego `safelist`. Nadmiarowy. |
| **Stylelint**                                  | ❌      | Brak wiarygodnej wbudowanej reguły „unused class".                                                                                                                          |
| **Build / kompilator Angular**                 | ❌      | Nie ostrzega o nieużywanych klasach SCSS.                                                                                                                                   |
| **Skrypt custom dopasowany do konwencji repo** | ✅      | Najwiarygodniejszy: emulated encapsulation czyni mapowanie SCSS↔szablon deterministycznym, a wszystkie źródła dynamiczne są skończone i wyliczalne.                         |

**Rekomendacja:** podejście custom (ręczna procedura grepowa lub jednorazowy skrypt Node bez
nowych zależności). Poniżej opisana jest sama procedura — niezależnie od tego, czy wykonuje się ją
ręcznie, czy automatyzuje.

---

## 4. Rekomendowana metodyka — proces dwuetapowy

Proces rozdziela trafienia **pewne** (etap A) od **niepewnych** (etap B + sekcja 5).

### Etap A — SCSS scoped (wysoka pewność)

Dla każdego `*.component.scss`:

1. **Wyekstrahuj nazwy klas** z selektorów, rekonstruując konkatenacje `&--`/`&__` z kontekstu rodzica.
2. **Zbierz „używane" klasy z pary `.html` + `.ts`** tego samego komponentu:
   - z `.html`: literały `class="…"`, nazwy z `[class.x]`, oraz (ostrożnie) `[class]="…"`,
   - z `.ts`: `host: { class: '…' }` **oraz** `host: { '[class.x]': '…' }`.
3. Klasa obecna w SCSS, a nieobecna w tej parze → **pewny kandydat do usunięcia**
   (scoping gwarantuje, że nie jest używana nigdzie indziej).

> Wyjątek od pewności: jeśli `.ts` buduje nazwę klasy przez konkatenację/interpolację stringów
> (rzadkie), przenieś taką klasę do sekcji 5.

### Etap B — `src/styles.scss` (szerszy zakres, niższa pewność)

1. Wyekstrahuj wszystkie globalne selektory klas ze `styles.scss`.
2. Przeszukaj **wszystkie** `.html` + **wszystkie** `.ts` (host i stringi) pod kątem każdej z nich.
3. Klasy nieznalezione → kandydaci, ale traktowani ostrożniej — patrz sekcja 5.

---

## 5. Sekcja „do ręcznej weryfikacji" — NIGDY nie kasować automatycznie

Klasy z poniższych kategorii należy zgłaszać **osobno** i weryfikować ręcznie przed usunięciem,
nawet jeśli procedura nie znalazła ich użycia:

- **Rodzina `delta--*`** (`delta--up`, `delta--down`, `delta--flat`) — budowane jako string w TS,
  typ `ComparisonDeltaClass` (`src/app/model/comparison.model.ts`), wstrzykiwane przez
  `[class]="row.deltaClass"`. Grep po literale `delta--up` ich nie znajdzie w szablonie.
- **`icon`** i inne klasy ustawiane przez `host` w dekoratorach komponentów.
- **Wszystkie globalne klasy ze `styles.scss`** — mogą być użyte w wielu odległych miejscach
  lub przez `[class]` sterowane z TS.
- **Klasy budowane przez konkatenację/interpolację stringów** w `.ts` (np. prefiks + wartość).

Aby ograniczyć fałszywe trafienia dla rodzin klas, przy weryfikacji warto grepować również
**prefiks** rodziny (np. `delta--`, `badge--`), a nie tylko pełną nazwę.

---

## 6. Weryfikacja metodyki (spot-check)

1. **Brak globalnego przecieku stylów:** `grep -rn "ViewEncapsulation" src` → brak wyników.
2. **Lista klas dynamicznych delta:** sprawdź definicję `ComparisonDeltaClass` w
   `src/app/model/comparison.model.ts`.
3. **Test poprawności na realnym przykładzie (`ui-badge`):** wg procedury z etapu A klasy
   `.badge--*` muszą zostać uznane za **używane** dzięki uwzględnieniu `host` w `badge.component.ts`.
   Jeśli procedura zgłasza je jako martwe — pomija źródło „host `[class.x]`" i wymaga poprawy.

---

## 7. Implementacja narzędzia

Metodyka jest zaimplementowana jako skrypt Node bez dodatkowych zależności:
`scripts/scan-unused-css.mjs`.

```bash
npm run scan:unused-css          # raport tekstowy (etap A / etap B / niepewne)
node scripts/scan-unused-css.mjs --json   # ten sam wynik jako JSON
```

Skrypt **niczego nie usuwa** — generuje raport kandydatów do ręcznego przeglądu, podzielony na:

- **Etap A** — pewni kandydaci ze stylów komponentów (scoped),
- **Etap B** — globalne klasy ze `styles.scss` do ręcznej weryfikacji,
- **Niepewne** — klasy z selektorów `::ng-deep` / `:host-context` / `:host(…)`,
- **Pominięte** — partiale SCSS bez pary `.html`/`.ts` (np. `_variables.scss`, `*.shared.scss`);
  ich klasy trafiają do scope'u komponentów, które je importują, więc wymagają ręcznego sprawdzenia.

Raport jest „migawką" — uruchamiaj go ponownie po każdej zmianie stylów lub szablonów.
