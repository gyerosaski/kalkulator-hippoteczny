# System projektowy — implementacja

Dokument techniczny: warstwa wizualna aplikacji — tokeny (zmienne CSS), palety motywów
oraz katalog generycznych kontrolek UI (`ui-*`). Źródła prawdy: globalny arkusz
`src/styles.scss` (tokeny + klasy strukturalne), `ThemeService`
(`src/app/services/theme/theme.service.ts`, przełączanie motywu) oraz komponenty
w `src/app/components/ui/`.

## Zasady ogólne

- **Tokeny i klasy globalne** żyją w jednym miejscu — `src/styles.scss`, blok `.app`.
  Komponenty nie definiują własnych kolorów ani odstępów; dziedziczą zmienne CSS.
- **Kolory w przestrzeni `oklch`** (paleta jasna/ciemna) — dzięki temu jaśniejsze/ciemniejsze
  warianty powstają przez modyfikację składowej L. Wyjątek: motyw „ochra” używa stałych
  hex (ciepłe odcienie z terminala).
- **Konwencje (z `CLAUDE.md`):** każdy komponent UI ma selektor z prefiksem `ui-`;
  nazwy klas CSS opisują rolę wizualną/strukturę, nie domenę (`.card-head`, `.row--2`,
  a nie `.tranche-fee-row`); ikony liniowe to osobne komponenty
  (`src/app/components/icons/<nazwa>/`), nie inline-SVG; szablony w osobnych plikach
  `.html`; wszystkie komponenty `standalone` + `OnPush`.
- **Bez surowych wartości** — nowe style konsumują tokeny zamiast literałów dla
  typografii (rozmiar/waga/interlinia/tracking/rodzina), odstępów i rozmiarów,
  promieni, ruchu (czas/krzywa) oraz z-index. Surowy `px`/`ms` dopuszczalny tylko dla
  wartości spoza skali (wymiary jednorazowe, mikrokorekty ≤ 3 px, geometria sprite'ów).

## Tokeny (zmienne CSS)

Definiowane w bloku `.app` (`src/styles.scss`), nadpisywane w blokach motywów.

### Powierzchnie i tekst

| Token                 | Rola                                              |
| --------------------- | ------------------------------------------------- |
| `--bg`                | tło aplikacji                                     |
| `--surface`           | tło kart, sekcji, paneli                          |
| `--surface-2`         | tło zagłębione (inputy, segmenty, nagłówki tabel) |
| `--surface-stripe`    | tło wierszy „miesięcznych” w harmonogramie        |
| `--ink`               | tekst podstawowy                                  |
| `--ink-2`             | tekst drugorzędny (etykiety)                      |
| `--muted`             | tekst wyciszony (podpowiedzi, jednostki)          |
| `--line` / `--line-2` | obrysy (słabszy / mocniejszy)                     |
| `--grid`              | linie siatki wykresów                             |
| `--track`             | tło torów (paski postępu)                         |

### Akcent (4 palety)

`--accent` i `--accent-deep` to aliasy wskazujące domyślnie na paletę „sage”. Dostępne
palety bazowe (każda w wariancie podstawowym i `-deep`): `--accent-sage`, `--accent-peach`,
`--accent-lav`, `--accent-mist`. Akcent steruje m.in. stanem focus inputów, podświetleniem
wierszy, przyciskiem „dodaj”, pierwszym kafelkiem KPI.

### Kolory semantyczne grup (niezależne od palety)

Stałe, niezależne od motywu i palety akcentu mapowanie barwy na znaczenie finansowe.
Każda grupa ma trzy intensywności: bazową, `-mid` i `-soft` (tło).

| Token                         | Znaczenie             | Barwa         |
| ----------------------------- | --------------------- | ------------- |
| `--c-cap` / `-mid` / `-soft`  | kapitał               | zielony       |
| `--c-int` / `-mid` / `-soft`  | odsetki               | czerwony      |
| `--c-over` / `-mid` / `-soft` | nadpłaty              | niebieski     |
| `--c-cost` / `-mid` / `-soft` | koszty okołokredytowe | żółty / amber |

Mapowanie jest powiązane z enumem `ColorCodeArea` (`src/app/model/mortgage.model.ts:270`:
`CAPITAL` / `INTEREST` / `COST` / `PREPAYMENT`) i renderowane przez `ui-color-code-marker`.
Te same zmienne zasilają donuty, legendy i wykresy (zob. `docs/technikalia/wykresy.md`).

### Kolory ofert

`--offer-a`, `--offer-b` — identyfikują oferty A/B w widoku „Porównanie ofert”
(niezależne od palety).

### Typografia

| Grupa         | Tokeny                                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rodziny       | `--font-sans` (Inter Tight), `--font-display` (Söhne — wariant `data-font='fraunces'`), `--font-mono` (IBM Plex Mono, cyfry tabelaryczne)                                    |
| Rozmiary      | `--text-xs` (10px), `--text-sm` (12px), `--text-base` (14px), `--text-lg` (16px), `--text-xl` (20px)                                                                         |
| Wagi          | `--font-weight-regular` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700)                                                      |
| Interlinia    | `--leading-tight` (1.1), `--leading-base` (1.45), `--leading-relaxed` (1.5)                                                                                                  |
| Światło liter | `--tracking-tighter` (−0.02em), `--tracking-tight` (−0.01em), `--tracking-normal` (0), `--tracking-wide` (0.02em), `--tracking-wider` (0.04em), `--tracking-widest` (0.08em) |

Skala rozmiarów to 5 tokenów (mikro-etykiety → drobny tekst → domyślny tekst UI
→ nagłówki sekcji → duże liczby KPI). Bazowa typografia `body` pozostaje
literałem — element `body` jest przodkiem `.app`, w którym zdefiniowane są
tokeny, więc nie może ich odczytać.

### Odstępy i rozmiary

| Grupa              | Tokeny                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Skala odstępów     | `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (20px), `--space-6` (24px), `--space-7` (28px), `--space-8` (32px)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Aliasy semantyczne | `--sec-pad`/`--sec-gap` (padding/gap treści sekcji), `--row-gap`/`--row-margin` (gap w `.row` / odstęp między wierszami formularza), `--card-pad`/`--card-gap` (padding karty / gap wewnątrz i między kartami), `--tbl-row-pad-x`/`--tbl-row-pad-y`/`--tbl-row-gap` (padding/gap wiersza tabeli harmonogramu), `--tbl-text`/`--tbl-text-sm` (rozmiar tekstu tabeli/nagłówka), `--panel-pad-y`/`--panel-pad-x`/`--panel-gap` (padding nagłówka/treści sekcji „panelowych” w Porównaniu ofert — KPI, tabela parametrów, tabela różnic, pary donutów, wykres trendu), `--panel-cell-pad-y`/`--panel-cell-pad-x` (padding komórki w tych tabelach), `--view-pad`/`--view-gap` (padding/gap widoku najwyższego poziomu — „Twoje kalkulacje”, „Porównanie ofert”), `--list-row-pad` (padding wiersza listy zapisanych kalkulacji) — wszystkie nadpisywane przez tryby gęstości |
| Rozmiary kontrolek | `--control-height` (38px), `--control-height-sm` (28px), `--icon-btn-size` (32px), `--switch-track-h` (18px)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

Baza skali to 4 px. Wartości spoza skali (np. 5 px, 56 px paddingu pustego stanu listy
kalkulacji, wymiary specyficzne) pozostają literałami.

### Promienie i cienie

| Grupa     | Tokeny                                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Promienie | `--r-2xs` (4px), `--r-xs` (6px), `--r-sm` (8px), `--r-control` (10px — inputy/segmenty/przyciski), `--r` (12px), `--r-lg` (18px), `--r-xl` (22px), `--r-pill` (999px — badge, switch, plakietki) |
| Cienie    | `--shadow-sm`, `--shadow`, `--shadow-lg`                                                                                                                                                         |

### Ruch

| Token               | Wartość / rola                                          |
| ------------------- | ------------------------------------------------------- |
| `--duration-fast`   | 0.15s — hover/focus inputów, drobne przejścia           |
| `--duration-base`   | 0.2s — chevrony, przełączniki                           |
| `--duration-slow`   | 0.3s — rozwijanie sekcji/legend                         |
| `--duration-slower` | 0.5s — animacja segmentów donutów                       |
| `--ease-standard`   | `cubic-bezier(0.4, 0, 0.2, 1)` — wspólna krzywa przejść |

### Z-index, focus i różne

| Token                | Wartość / rola                                          |
| -------------------- | ------------------------------------------------------- |
| `--z-base`           | 1 — warstwa wewnątrz komponentu                         |
| `--z-raised`         | 10 — przyklejony pasek górny                            |
| `--z-toast`          | 300 — powiadomienia toast                               |
| `--z-dropdown`       | 1000 — menu rozwijane, panele                           |
| `--z-modal`          | 1001 — nakładki nad menu                                |
| `--focus-ring`       | pierścień focus (`0 0 0 3px` z `color-mix` na akcencie) |
| `--border-width`     | 1px — domyślna grubość obrysów                          |
| `--opacity-disabled` | 0.55 — stan wyłączony                                   |
| `--opacity-muted`    | 0.4 — przyciski-ikony `:disabled`                       |

## Palety motywów

### Mechanika

Przełączaniem steruje `ThemeService` (`src/app/services/theme/theme.service.ts`):

- sygnał `theme: Theme` + `computed dataTheme()` (mapuje motyw na wartość atrybutu;
  dla `LIGHT` zwraca `null` — brak atrybutu),
- preferencja zapisywana w `localStorage('theme')` (z kompatybilnością wsteczną dla
  starych wartości `dark`/`light`); przy braku zapisu — fallback na
  `prefers-color-scheme`,
- atrybut `[attr.data-theme]` ustawiany na kontenerze `.app` (`src/app/app.html:1`),
- wybór z poziomu UI: `app-settings-dialog` (`src/app/dialogs/settings/`) →
  `ui-select` z etykietami z `ThemeLabelPipe`.

Enum `Theme` (`src/app/model/ui.model.ts:97`): `LIGHT` / `DARK` / `OCHRA`.

### Dostępne motywy

| Motyw  | `data-theme`      | Charakter                                         | Co nadpisuje                                                                                                                                                                      |
| ------ | ----------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jasny  | _(brak atrybutu)_ | bazowy, ciepła biel                               | blok bazowy `.app` — wartości domyślne tokenów                                                                                                                                    |
| Ciemny | `dark`            | chłodny ciemny                                    | powierzchnie, tekst, linie, cienie, palety akcentu + `.btn--primary:hover` (blok `.app[data-theme='dark']`)                                                                       |
| Ochra  | `ochra`           | ciepły wariant ciemny (ugier / oliwka / terakota) | powierzchnie i akcenty na stałych hex, przemapowane kolory semantyczne, `color-scheme: dark`, nadpisania `.btn--primary` oraz `.tbl-row--month` (blok `.app[data-theme='ochra']`) |

### Gęstość interfejsu

Analogicznie do motywu, przełączaniem steruje `DensityService`
(`src/app/services/density/density.service.ts`):

- sygnał `density: Density` + `computed dataDensity()` (mapuje gęstość na wartość atrybutu;
  dla `STANDARD` zwraca `null` — brak atrybutu),
- preferencja zapisywana w `localStorage('density')`; brak odpowiednika
  `prefers-color-scheme` (nie ma sensownego sygnału systemowego dla gęstości) — fallback to
  zawsze `STANDARD`,
- atrybut `[attr.data-density]` ustawiany na kontenerze `.app` (`src/app/app.html`),
- wybór z poziomu UI: `app-settings-dialog` (`src/app/dialogs/settings/`) →
  `ui-select` z etykietami z `DensityLabelPipe`.

Enum `Density` (`src/app/model/ui.model.ts`): `COMPACT` / `STANDARD` / `ROOMY`. Style w
`src/styles/_variables.scss` — bloki `.app[data-density='compact'|'roomy']` nadpisują
pełny zestaw aliasów semantycznych gęstości (`--sec-*`, `--row-*`, `--card-*`, `--tbl-*`,
`--panel-*`, `--view-*`, `--list-row-pad`, patrz sekcja „Odstępy i rozmiary”); `STANDARD`
to blok bazowy `.app` bez atrybutu (wartości domyślne tokenów). Tryb „roomy” świadomie nie
nadpisuje `--tbl-text`/`--tbl-text-sm` — gęstość „przestronna” powiększa tylko odstępy, nie
rozmiar tekstu. Komponenty widoków „Twoje kalkulacje” i „Porównanie ofert” (lista zapisanych
kalkulacji, siatka KPI, tabela parametrów, tabela różnic, para donutów, wykres trendu)
mają własne, lokalne klasy CSS niezależne od globalnych `.card`/`.tbl*` — ich padding/gap
konsumuje te same aliasy gęstości bezpośrednio, żeby uniknąć duplikowania logiki gęstości
w każdym pliku.

### Czcionka (obecnie niepodpięta)

W `src/styles.scss` istnieje blok `.app[data-font='fraunces'|'system']` (zmiana rodziny
czcionek — `fraunces` → `--font-display`). **Żaden serwis ani ustawienie obecnie go nie
ustawia** — to pozostałość z projektu wzorcowego (`design/angular`). Styl jest gotowy,
lecz brak mu kontrolki w UI; wystarczy ustawić atrybut `data-font` na `.app`, aby go aktywować.

## Katalog kontrolek UI (`src/app/components/ui/`)

Wszystkie komponenty są `standalone` + `OnPush`. Kontrolki formularzowe oznaczone
**(CVA)** implementują `ControlValueAccessor` i wiąże się je przez `[formControl]`
(zgodnie z konwencją projektu).

| Selektor                    | Przeznaczenie                                                                                             | Kluczowe `input` / `output`                                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `ui-badge`                  | etykieta-plakietka stanu                                                                                  | `label`, `variant: BadgeVariant` (`GREEN`/`RED`/`NEUTRAL`)                                                                      |
| `ui-banner`                 | pasek informacyjny / ostrzeżenie                                                                          | `variant: BannerVariant` (`INFO`/`WARNING`), treść przez `ng-content`                                                           |
| `ui-btn-add`                | przycisk „dodaj” (dashed, pełna szerokość)                                                                | `label`, `@add`                                                                                                                 |
| `ui-btn-remove`             | przycisk usuwania pozycji                                                                                 | `@remove`                                                                                                                       |
| `ui-card`                   | karta z opcjonalnym tagiem/usuwaniem                                                                      | `tag`, `removable`, `bare`, `@remove`                                                                                           |
| `ui-cards-group`            | grupa kart (zarządza odstępami)                                                                           | — (kontener `ng-content`)                                                                                                       |
| `ui-color-code-marker`      | znacznik barwy semantycznej grupy                                                                         | `variant: ColorCodeArea`                                                                                                        |
| `ui-divider`                | separator poziomy (linia przerywana lub ciągła)                                                           | `variant: DividerVariant` (`DASHED`/`SOLID`, domyślnie `DASHED`)                                                                |
| `ui-subsection`             | numerowana podsekcja zwijana                                                                              | `num`, `title`, `open`, `@openChange`, `context: ColorCodeArea \| null`                                                         |
| `ui-donut`                  | generyczny wykres pierścieniowy (SVG)                                                                     | `data: DonutSlice[]`, `size`, `thickness`, `centerLabel`, `centerValue`, `activeLabel`, `@sliceHover`                           |
| `ui-dropdown`               | menu rozwijane (akcje)                                                                                    | `options`, `labels`, `disabled`, `placement: DropdownPlacement`, `@select`                                                      |
| `ui-field`                  | opakowanie pola: etykieta + numer + hint                                                                  | `label`, `num`, `hint`, `inputId`                                                                                               |
| `ui-foldable-section`       | zwijana sekcja formularza (z opcją włącz/wyłącz)                                                          | `title`, `num`, `badge`, `defaultOpen`, `toggleable`, `enabled`, `sectionId: FormSectionId \| null`, `@enabledChange`           |
| `ui-legend`                 | legenda wykresu (pozycje + suma + stopka)                                                                 | `slices: ChartSlice[]`, `legendId`, `totalLabel`, `footerLabel`, `footerValue`, `footerValueText`, `activeLabel`, `@sliceHover` |
| `ui-month-picker` **(CVA)** | wybór miesiąca (`YYYY-MM`)                                                                                | `inputId`, `showShortcuts`, `@valueChange`                                                                                      |
| `ui-number-input` **(CVA)** | pole liczbowe z sufiksem i formatowaniem                                                                  | `value`, `inputId`, `suffix`, `hint`, `decimals`, `@valueChange`                                                                |
| `ui-segmented` **(CVA)**    | przełącznik segmentowy (2–3 opcje)                                                                        | `options`, `labels`, `compact`                                                                                                  |
| `ui-select` **(CVA)**       | lista wyboru                                                                                              | `options`, `labels`, `inputId`, `@valueChange`                                                                                  |
| `ui-switch` **(CVA)**       | przełącznik włącz/wyłącz (CVA lub dwukierunkowe `[(checked)]`; używany m.in. przez `ui-foldable-section`) | `label`, `checked` (model)                                                                                                      |
| `ui-toast`                  | host kolejki powiadomień toast                                                                            | — (sterowany serwisem; `ToastVariant`)                                                                                          |
| `ui-topbar`                 | górny pasek aplikacji                                                                                     | —                                                                                                                               |
| `ui-pixel-hippo`            | dekoracyjny logotyp (pixel-art)                                                                           | —                                                                                                                               |

Typy pomocnicze (`DonutSlice`, `ChartSlice`, `BadgeVariant`, `BannerVariant`,
`DividerVariant`, `ToastVariant`, `DropdownPlacement`, `LegendId`, `FormSectionId`) deklarowane w
`src/app/model/` (`ColorCodeArea` w `mortgage.model.ts`, reszta w `ui.model.ts`).

## Globalne klasy strukturalne / utility (`src/styles.scss`)

Sporo markupu używa współdzielonych klas globalnych zamiast osobnych komponentów —
poniżej skrótowy przegląd grup:

- **Przyciski:** `.btn` + modyfikatory `--primary` / `--ghost` / `--mini` / `--add`;
  `.ico-btn` (przycisk-ikona kwadratowy); `.link-btn` (link tekstowy).
- **Układ:** `.grid` (dwukolumnowy layout kalkulatora), `.col`, `.row` +
  `--2` / `--3` / `--4` (siatki pól).
- **Sekcje i formularz:** `.sec*` (sekcja zwijana — `-head`, `-chev`, `-title`,
  `-badge`, `-body`), `.field*`, `.inp*` (input + stany `--focus`/`--disabled`/`--date`),
  `.seg*` (segmented), `.switch-*` (track/thumb).
- **Wyniki:** `.kpi*` (kafelki KPI), `.card*`, `.donut-*`, `.legend-inline`, `.tbl*`
  (tabela harmonogramu — `-head`, `-row`, wiersze `--year`/`--month`, stany
  `.is-open`/`.is-selected`).
- **Dialogi:** generyczny komponent `ui-dialog` (`src/app/components/ui/dialog/`) jest powłoką
  wszystkich okien — owija natywny `<dialog>`, dostarcza „chrome” (ramka/cień/backdrop + warianty
  szerokości `data-size` `SMALL`/`MEDIUM`/`LARGE` oraz wariant `DANGER`), opcjonalny standardowy
  nagłówek z inputów (`tag`/`title`/`showClose`) i wstrzykuje treść przez content projection
  (domyślny slot + slot `head` do nadpisania nagłówka). Imperatywne API oparte na obietnicy
  (`open()` → Promise rozwiązywany przy zamknięciu) hermetyzuje klasa bazowa `AbstractDialog<TResult>`
  (`beginInteraction`/`closeWith`/`dismiss`/`handleClosed`), po której dziedziczą komponenty dialogów.
  Klasy CSS: `.dialog-head` / `-tag` (+ `--danger`) / `-title` / `-close` / `-hint` oraz wspólne
  `.dialog-body` / `.dialog-actions` (+ `.dialog--danger .btn--danger`) są globalne, bo treść
  projektowana z komponentów-funkcji jest poza enkapsulacją stylów `ui-dialog`; sam `dialog{}`
  i warianty szerokości żyją w stylach `ui-dialog`.
- **Skróty dat w pickerze:** `ui-month-picker` przyjmuje prosty input boolean `showShortcuts` i przekazuje
  go do `MonthPickerDialogComponent` przez rozszerzone `open(currentValue, showShortcuts?)`. Skróty buduje
  bezpośrednio dialog — przy `showShortcuts === true` woła czystą funkcję `buildMonthPickerShortcuts`
  (`helpers/month-picker-shortcuts.helper.ts`) na podstawie wartości referencyjnych z
  `FormService.monthPickerReferenceDates` (bieżący miesiąc, data uruchomienia, początek spłat kapitału,
  wyliczony ostatni miesiąc kredytu = uruchomienie + liczba rat, bo pierwsza rata przypada miesiąc po
  uruchomieniu) i zapisuje wynik do sygnału `shortcuts`. Funkcja pomija
  jedynie pozycje o pustej wartości; brak dodatkowego filtrowania kontekstowego. Dialog renderuje skróty
  jako przyciski (klasy `.mp-shortcuts` / `.mp-shortcut`); kliknięcie zamyka okno z wybraną datą.
  Komponenty formularza ustawiają `[showShortcuts]="true"` na polach dat — z wyjątkiem pól
  „Data uruchomienia kredytu” i „Początek spłat kapitału”, które skrótów nie pokazują.
- **Typografia / pomocnicze:** `.mono` (cyfry tabelaryczne, IBM Plex Mono),
  `.muted`, `.small`.

## Responsywność (RWD)

Aplikacja adaptuje układ do szerokości okna przez media queries `max-width`
(desktop-first — style bazowe opisują pełny układ, węższe ekrany je nadpisują).
Progi żyją jako zmienne SCSS w `src/styles/_variables.scss` (media queries nie
potrafią czytać CSS custom properties); katalog `src/styles` jest dodany do
`stylePreprocessorOptions.includePaths` w `angular.json`, więc SCSS komponentu
importuje je przez `@use 'variables' as *;`. Zawartość tokenów/motywów w
`_variables.scss` jest opakowana w mixin `design-tokens` (dołączany wyłącznie
w `src/styles.scss`), dzięki czemu `@use` z komponentów nie duplikuje CSS.

Zmienne progów i ich efekty:

- **`$breakpoint-desktop-wide` (1280px)** — `.row--4` zwija się do 2 kolumn
  (w układzie dwukolumnowym kolumna formularza robi się za ciasna na 4 pola).
- **`$breakpoint-desktop` (1100px)** — lista „Twoje kalkulacje”
  (`calculations-list`): znikają kolumny „Odsetki” i „Zmodyfikowano”.
- **`$breakpoint-tablet-wide` (1024px)** — widok kalkulatora:
  `.two-column-layout` przechodzi z dwóch niezależnie przewijanych kolumn na
  układ jednokolumnowy (formularz nad wynikami), a przewijanie przejmuje host
  widoku; widok porównania: wykresy trendu „obok siebie” układają się pionowo.
- **`$breakpoint-tablet` (900px)** — `ui-topbar`: siatka `1fr auto 1fr` zmienia
  się w dwa rzędy (marka + akcje, pod spodem zakładki pełną szerokością z
  poziomym przewijaniem; wskaźnik aktywnej zakładki jest przeliczany także na
  `window:resize`); lista kalkulacji chowa dodatkowo kolumny „Oproc.”
  i „Pierwsza rata”.
- **`$breakpoint-tablet-narrow` (860px) / `$breakpoint-phone-wide` (720px)** —
  komponenty porównania ofert (tabele parametrów/różnic, pary donutów, KPI,
  sloty A/B + hero) przechodzą na układy jednokolumnowe;
  przycisk zamiany ofert obraca strzałki w pion.
- **`$breakpoint-phone` (600px)** — siatki pól `.row--2/3/4` zwijają się do
  jednej kolumny; `.rate-period-from` przestaje mieć sztywną szerokość; donuty
  wyników układają legendę pod wykresem (donut wyśrodkowany, maks. 260px);
  tabela harmonogramu (`results-schedule`) dostaje poziome przewijanie
  (`min-width` na wierszach i wrapperach animacji rozwijania); wiersz listy
  kalkulacji zamienia się w kartę (nagłówek tabeli ukryty, nazwa i akcje pełną
  szerokością); toolbar menedżera kalkulacji układa się pionowo.

Nowe media queries piszemy per komponent (w SCSS komponentu) z użyciem powyższych
zmiennych — nie wprowadzamy nowych progów bez potrzeby.

## Wyrównanie pól w wierszach formularza (subgrid)

Pola w siatkach `.row--N` muszą mieć inputy wyrównane w pionie niezależnie od
tego, czy etykieta łamie się na dwie linie albo czy tylko jedno pole ma
podpowiedź. Realizuje to CSS subgrid: każdy `ui-field` będący dzieckiem `.row`
(oraz jego wewnętrzny `.field`) rozpina się przez `grid-template-rows: subgrid`
na trzy współdzielone wiersze — etykieta / kontrolka / podpowiedź — więc
wysokości tych stref są wspólne dla całego wiersza siatki. Odstępy między
strefami realizują paddingi na `.field-label` (dół) i `.field-hint` (góra),
a nie `gap`, żeby puste strefy nie dokładały pustej przestrzeni. Oba poziomy
subgrida deklarują kolumnę `minmax(0, 1fr)` — bez tego wewnętrzna kolumna
auto-wymiarowałaby się do max-content i zawartość (np. `.inline` z inputem
i segmentem) wystawałaby poza komórkę siatki.

Przyciski `ui-segmented` (`.seg-btn`) mają `flex: 1 1 auto` + przycinanie
z wielokropkiem: segment najpierw mieści swój tekst (podział nierówny), nadmiar
dzielony jest po równo, a etykieta nigdy nie wychodzi poza obrys kontrolki.

## Skalowanie donutów wyników

`ui-donut` rysuje SVG w układzie współrzędnych `viewBox` (o boku `size`,
domyślnie 216) i ma dwa tryby: sztywny (wrap dostaje `width`/`height` w px
równie `size` — tak działa m.in. w parach donutów porównania) oraz płynny
(`fluid` — wrap wypełnia szerokość kontenera, proporcje trzyma
`aspect-ratio: 1/1`). Karty „Struktura płatności” i „Struktura raty” używają
trybu płynnego, a ich `.donut-row` przydziela donutowi pas
`clamp(216px, 34%, 300px)` — donut skaluje się więc z szerokością kolumny
wyników w podobnym tempie co pełnoszerokościowy wykres trendu, co utrzymuje
oba komponenty w zbliżonej skali na każdej rozdzielczości.
