# Wersja desktopowa (Tauri V2)

Kalkulator jest pakowany jako aplikacja desktopowa Windows przy użyciu Tauri V2. Niniejszy dokument opisuje sposób uruchomienia, konfigurację i kluczowe wybory architektoniczne.

## Wymagania środowiskowe (Windows)

- Node.js 20+
- Rust stable + cargo (`rustup-init.exe`, target `x86_64-pc-windows-msvc`)
- Microsoft C++ Build Tools (komponent „Desktop development with C++") — zawiera `link.exe`, bez którego cargo nie zlinkuje natywnych zależności
- WebView2 Runtime (Windows 11 ma już z systemu)

## Polecenia

```bash
npm run tauri:dev     # Angular dev server (port 4200) + okno Tauri z HMR
npm run tauri:build   # Buduje frontend, kompiluje binarkę, pakuje MSI i NSIS
```

Po `tauri:build` artefakty znajdziesz w `src-tauri/target/release/bundle/`:

- `msi/Kalkulator Hippoteczny_<version>_x64_pl-PL.msi`
- `nsis/Kalkulator Hippoteczny_<version>_x64-setup.exe`

## Persystencja kalkulacji

`@tauri-apps/plugin-store` trzyma listę kalkulacji w pojedynczym pliku JSON:

```
%APPDATA%/com.gyerosaski.kalkulator-hipoteczny/calculations.json
```

Dostęp przez `CalculationsStoreService` (`src/app/services/calculations-store/`). Klucz `calculations` przechowuje `SavedCalculationRecord[]`. Eksport do pliku (np. dla backupu lub współdzielenia) używa `@tauri-apps/plugin-dialog` (`save` / `open`) i `@tauri-apps/plugin-fs` (`writeTextFile` / `readTextFile`).

Pełny model rekordu, operacje serwisu, kształty importu/eksportu i logika listy kalkulacji — patrz `docs/technikalia/persystencja-kalkulacji.md`.

## Uprawnienia (`src-tauri/capabilities/default.json`)

- `core:default`, `store:default`, `dialog:default`
- `fs:allow-read-text-file` i `fs:allow-write-text-file` ograniczone do **plików `.json`** w katalogach: `$DOCUMENT`, `$DOWNLOAD`, `$DESKTOP`, `$HOME`. Dzięki temu użytkownik wybiera plik wyłącznie przez systemowy dialog, a aplikacja nie ma swobodnego dostępu do całego dysku.

## Routing

Aplikacja używa `withHashLocation()` (`src/app/app.config.ts`) — to eliminuje problemy `base href` w obrębie `tauri://localhost/` i jest odporne na dodawanie kolejnych tras w przyszłości.

## Fonty

Aplikacja nie pobiera fontów zdalnie. Stylowanie opiera się o stack `'Inter Tight', system-ui, sans-serif` z fallbackiem na Segoe UI. Jeśli kiedyś będziesz chciał dodać konkretny font:

1. Wrzuć `.woff2` do `public/fonts/`.
2. Dodaj `@font-face` na początku `src/styles.scss` z `font-display: swap`.
3. Upewnij się, że CSP w `tauri.conf.json` ma `font-src 'self'` (już ma).

## Ikona aplikacji

Bieżący zestaw ikon w `src-tauri/icons/` jest **placeholderem** wygenerowanym przez `tauri init`. Aby podmienić:

```bash
npx tauri icon path/do/twoja-ikona-1024x1024.png
```

Polecenie nadpisze cały zestaw (PNG/ICO/ICNS) z jednego źródłowego PNG min. 1024×1024. Naturalne źródło to upscale `public/favicon.ico` albo render SVG z `src/app/components/icons/icon-calculator/`.

## CSP

W `tauri.conf.json`:

```
default-src 'self';
img-src 'self' data:;
style-src 'self' 'unsafe-inline';
font-src 'self';
script-src 'self' 'wasm-unsafe-eval';
connect-src 'self' ipc: http://ipc.localhost
```

`'unsafe-inline'` dla `style-src` jest wymagane przez Angulara (`OnPush` komponenty wstrzykują inline style do shadow DOM). `wasm-unsafe-eval` jest profilaktyczne — gdyby `chart.js` lub inna zależność potrzebowała WASM.

## Bundle (Windows)

`tauri.conf.json` → `bundle`:

- `targets: ["msi", "nsis"]`
- `bundle.windows.wix.language: ["pl-PL"]` — instalator MSI po polsku
- `bundle.windows.nsis.languages: ["Polish"]` — instalator NSIS po polsku
- `identifier: "com.gyerosaski.kalkulator-hipoteczny"` — używany jako reverse-DNS bundle ID
