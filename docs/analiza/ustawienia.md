### Dokumentacja techniczna – Ustawienia aplikacji

Aplikacja: Kalkulator Hipoteczny (Angular 21, standalone components, Reactive Forms, Vitest)
Zakres: Specyfikacja okna ustawień aplikacji oraz dostępnych w nim opcji, odzwierciedlająca aktualny stan implementacji.
Data aktualizacji: 2026-05-29

---

## 1. Cel i zakres

Ustawienia aplikacji to zbiór globalnych preferencji użytkownika, niezależnych od konkretnej kalkulacji. Dostęp do nich zapewnia **ikona koła zębatego** (`icon-settings`) umieszczona po prawej stronie paska górnego (`TopbarComponent`, plik `src/app/components/ui/topbar/`). Ikona ta zastąpiła wcześniejszy bezpośredni przełącznik motywu (słońce/księżyc).

Kliknięcie ikony otwiera modalne okno dialogowe **„Ustawienia"** (`SettingsDialogComponent`, plik `src/app/dialogs/settings/`), w którym prezentowana jest lista dostępnych ustawień. Okno zbudowane jest na natywnym elemencie `<dialog>` i udostępnia API `open(): Promise<void>` (wzorzec wspólny dla wszystkich dialogów w `src/app/dialogs/`). Zmiany w ustawieniach aplikują się **na żywo** — okno nie wymaga zatwierdzania, zawiera jedynie przycisk „Gotowe" zamykający modal.

---

## 2. Dostępne ustawienia

### 2.1. Motyw (`theme`)

- Kontrolka: generyczny komponent `ui-select` (lista rozwijana), gotowy na rozszerzenie o kolejne wartości motywu w przyszłości.
- Wartości (enum `Theme`, plik `src/app/model/ui.model.ts`):
  - `Theme.LIGHT` — etykieta „jasny",
  - `Theme.DARK` — etykieta „ciemny",
  - `Theme.OCHRA` — etykieta „ochra" (ciepły, ziemisty wariant motywu ciemnego — ugier/oliwka/terakota).
- Etykiety polskie pochodzą wyłącznie z dedykowanego pipe `ThemeLabelPipe` (`src/app/pipes/theme-label/`); nie są zapisane na stałe w komponencie ani serwisie.
- Stan zarządzany jest przez `ThemeService` (`src/app/services/theme/theme.service.ts`):
  - źródłem prawdy jest sygnał `theme = signal<Theme>(...)`,
  - `dataTheme = computed<string | null>(...)` zwraca wartość atrybutu `data-theme`: `null` dla motywu jasnego oraz `'dark'` / `'ochra'` (małe litery wartości enuma) dla pozostałych; jest używany w `app.html` jako `[attr.data-theme]="themeService.dataTheme()"` na kontenerze `.app` (selektory `.app[data-theme='dark']` i `.app[data-theme='ochra']` w `src/styles.scss`),
  - `setTheme(theme: Theme)` ustawia bieżący motyw.
- Utrwalanie: `effect` w `ThemeService` zapisuje wybór w `localStorage` pod kluczem `theme` jako wartość enuma `Theme` (np. `'OCHRA'`). Przy starcie aplikacji `loadPreference()` odczytuje tę wartość (z kompatybilnością wsteczną dla starych zapisów `'dark'`/`'light'`); w razie jej braku korzysta z preferencji systemowej (`prefers-color-scheme`), a w środowisku bez `window`/`localStorage` przyjmuje motyw jasny.

---

## 3. Powiązania i konwencje

- Dialog wstrzykuje `ThemeService` i wiąże wartość przez `FormControl<Theme>` (binding `[formControl]` na `ui-select`), inicjowany bieżącym motywem przy każdym `open()`; zmiana wartości wywołuje `ThemeService.setTheme(...)`.
- Dodanie kolejnego ustawienia sprowadza się do: zdefiniowania (w razie potrzeby) enuma w `src/app/model/`, dedykowanego pipe etykiet w `src/app/pipes/`, ewentualnego stanu w odpowiednim serwisie oraz nowego wiersza (`.setting-row`) w szablonie `SettingsDialogComponent`.
