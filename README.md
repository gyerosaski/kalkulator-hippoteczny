# Kalkulator Hippoteczny

Kalkulator kredytu hipotecznego (Angular 21 + Tauri V2). Aplikacja docelowo działa jako program
desktopowy (Windows, pakowany do MSI/NSIS), a dane kalkulacji przechowuje lokalnie w pliku JSON.

## Tryby uruchamiania w developmencie

Aplikację można rozwijać na dwa sposoby. Różnią się warstwą persystencji.

### Tryb przeglądarkowy (szybki dev / HMR)

```bash
npm start
```

Uruchamia dev server Angulara pod `http://localhost:4200/` (automatyczny reload po zmianach).
Najszybsza ścieżka do pracy nad UI i logiką kalkulacji — **bez** uruchamiania okna desktopowego.

Poza środowiskiem Tauri wtyczki `@tauri-apps/*` nie działają, więc persystencja korzysta z
**fallbacku na `localStorage`**. To odizolowana kopia robocza — nie modyfikuje realnego pliku store'a
aplikacji desktopowej. Przy pierwszym starcie lista kalkulacji jest zasilana snapshotem realnych
danych:

```bash
npm run seed:calc
```

Skrypt kopiuje `%APPDATA%/kalkulator-hippoteczny/calculations.json` do `public/dev-seed/` (asset
serwowany w dev). Jest też uruchamiany automatycznie jako `prestart` przed `npm start`. Gdy realny
plik nie istnieje, dev startuje z pustą listą. Szczegóły: `docs/technikalia/persystencja-kalkulacji.md`
(sekcja „Fallback przeglądarkowy”).

### Tryb desktop / Tauri (pełne środowisko)

```bash
npm run tauri:dev
```

Uruchamia dev server Angulara wraz z oknem Tauri (desktop, HMR). Persystencja idzie przez realny store
Tauri — plik `%APPDATA%/kalkulator-hippoteczny/calculations.json`. Ten tryb jest wymagany do
weryfikacji natywnych okien dialogowych (zapis/otwarcie pliku) i realnego zapisu danych.

Spakowanie do instalatorów (MSI + NSIS) — artefakty w `src-tauri/target/release/bundle/`:

```bash
npm run tauri:build
```

## Pozostałe polecenia

```bash
npm run build      # produkcyjny build frontendu (dist/)
npm run watch      # build dev w trybie watch
npm test           # testy jednostkowe (Vitest)
npm run prettier   # formatowanie kodu
npm run lint       # ESLint
npm run seed:calc  # odświeżenie snapshotu kalkulacji dla trybu przeglądarkowego
```

Pojedynczy plik testowy:

```bash
npx vitest run src/app/services/calculator/calculator.service.spec.ts
```

## Dokumentacja

- `docs/funkcjonalności/` — opis funkcjonalny (reguły biznesowe, walidacje, zachowania UI).
- `docs/technikalia/` — architektura i decyzje implementacyjne (silnik obliczeniowy, persystencja,
  Tauri, wykresy, system projektowy).

## Angular CLI

Projekt wygenerowany za pomocą [Angular CLI](https://github.com/angular/angular-cli). Pełny opis
poleceń: [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
