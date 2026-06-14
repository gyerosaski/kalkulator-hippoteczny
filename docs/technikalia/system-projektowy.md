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

## Tokeny (zmienne CSS)

Definiowane w bloku `.app` (`src/styles.scss:17-84`), nadpisywane w blokach motywów.

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

### Promienie, cienie, odstępy

| Grupa     | Tokeny                                                          |
| --------- | --------------------------------------------------------------- |
| Promienie | `--r-sm` (8px), `--r` (12px), `--r-lg` (18px), `--r-xl` (22px)  |
| Cienie    | `--shadow-sm`, `--shadow`, `--shadow-lg`                        |
| Odstępy   | `--pad` (padding sekcji), `--gap` (odstęp w kolumnach/sekcjach) |

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

| Motyw  | `data-theme`      | Charakter                                         | Co nadpisuje                                                                                                                                                        |
| ------ | ----------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jasny  | _(brak atrybutu)_ | bazowy, ciepła biel                               | blok `.app` (`styles.scss:17`) — wartości domyślne                                                                                                                  |
| Ciemny | `dark`            | chłodny ciemny                                    | powierzchnie, tekst, linie, cienie, palety akcentu + `.btn--primary:hover` (`styles.scss:104`)                                                                      |
| Ochra  | `ochra`           | ciepły wariant ciemny (ugier / oliwka / terakota) | powierzchnie i akcenty na stałych hex, przemapowane kolory semantyczne, `color-scheme: dark`, nadpisania `.btn--primary` oraz `.tbl-row--month` (`styles.scss:141`) |

### Gęstość i czcionka (obecnie niepodpięte)

W `src/styles.scss` istnieją bloki `data-density='cozy'|'roomy'` (`:86`, sterujące
`--pad`/`--gap`/`font-size`) oraz `data-font='fraunces'|'system'` (`:97`, zmiana
rodziny czcionek). **Żaden serwis ani ustawienie obecnie ich nie ustawia** — to
pozostałość z projektu wzorcowego (`design/angular`). Style są gotowe, lecz brak im
kontrolki w UI; wystarczy ustawić odpowiedni atrybut na `.app`, aby je aktywować.

## Katalog kontrolek UI (`src/app/components/ui/`)

Wszystkie komponenty są `standalone` + `OnPush`. Kontrolki formularzowe oznaczone
**(CVA)** implementują `ControlValueAccessor` i wiąże się je przez `[formControl]`
(zgodnie z konwencją projektu).

| Selektor                    | Przeznaczenie                                    | Kluczowe `input` / `output`                                                                                                     |
| --------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `ui-badge`                  | etykieta-plakietka stanu                         | `label`, `variant: BadgeVariant` (`GREEN`/`RED`/`NEUTRAL`)                                                                      |
| `ui-banner`                 | pasek informacyjny / ostrzeżenie                 | `variant: BannerVariant` (`INFO`/`WARNING`), treść przez `ng-content`                                                           |
| `ui-btn-add`                | przycisk „dodaj” (dashed, pełna szerokość)       | `label`, `@add`                                                                                                                 |
| `ui-btn-remove`             | przycisk usuwania pozycji                        | `@remove`                                                                                                                       |
| `ui-card`                   | karta z opcjonalnym tagiem/usuwaniem             | `tag`, `removable`, `bare`, `@remove`                                                                                           |
| `ui-cards-group`            | grupa kart (zarządza odstępami)                  | — (kontener `ng-content`)                                                                                                       |
| `ui-color-code-marker`      | znacznik barwy semantycznej grupy                | `variant: ColorCodeArea`                                                                                                        |
| `ui-divider`                | separator poziomy                                | —                                                                                                                               |
| `ui-subsection`             | numerowana podsekcja zwijana                     | `num`, `title`, `open`, `@openChange`, `context: ColorCodeArea \| null`                                                         |
| `ui-donut`                  | generyczny wykres pierścieniowy (SVG)            | `data: DonutSlice[]`, `size`, `thickness`, `centerLabel`, `centerValue`, `activeLabel`, `@sliceHover`                           |
| `ui-dropdown`               | menu rozwijane (akcje)                           | `options`, `labels`, `disabled`, `placement: DropdownPlacement`, `@select`                                                      |
| `ui-field`                  | opakowanie pola: etykieta + numer + hint         | `label`, `num`, `hint`, `inputId`                                                                                               |
| `ui-foldable-section`       | zwijana sekcja formularza (z opcją włącz/wyłącz) | `title`, `num`, `badge`, `defaultOpen`, `toggleable`, `enabled`, `sectionId: FormSectionId \| null`, `@enabledChange`           |
| `ui-legend`                 | legenda wykresu (pozycje + suma + stopka)        | `slices: ChartSlice[]`, `legendId`, `totalLabel`, `footerLabel`, `footerValue`, `footerValueText`, `activeLabel`, `@sliceHover` |
| `ui-month-picker` **(CVA)** | wybór miesiąca (`YYYY-MM`)                       | `inputId`, `@valueChange`                                                                                                       |
| `ui-number-input` **(CVA)** | pole liczbowe z sufiksem i formatowaniem         | `value`, `inputId`, `suffix`, `hint`, `decimals`, `@valueChange`                                                                |
| `ui-segmented` **(CVA)**    | przełącznik segmentowy (2–3 opcje)               | `options`, `labels`, `compact`                                                                                                  |
| `ui-select` **(CVA)**       | lista wyboru                                     | `options`, `labels`, `inputId`, `@valueChange`                                                                                  |
| `ui-switch` **(CVA)**       | przełącznik włącz/wyłącz                         | `label`                                                                                                                         |
| `ui-toast`                  | host kolejki powiadomień toast                   | — (sterowany serwisem; `ToastVariant`)                                                                                          |
| `ui-topbar`                 | górny pasek aplikacji                            | —                                                                                                                               |
| `ui-pixel-hippo`            | dekoracyjny logotyp (pixel-art)                  | —                                                                                                                               |

Typy pomocnicze (`DonutSlice`, `ChartSlice`, `BadgeVariant`, `BannerVariant`,
`ToastVariant`, `DropdownPlacement`, `LegendId`, `FormSectionId`) deklarowane w
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
- **Typografia / pomocnicze:** `.mono` (cyfry tabelaryczne, IBM Plex Mono),
  `.muted`, `.small`.
