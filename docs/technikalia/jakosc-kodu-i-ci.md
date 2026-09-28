# Jakość kodu i CI

Opis narzędzi pilnujących jakości kodu (lint, testy, pokrycie) oraz przebiegu CI i wydania.

---

## 1. Lint (ESLint)

- Uruchomienie: `npm run lint` (`eslint .`), automatyczne poprawki: `npm run lint:fix`.
- Zakres wynika z konfiguracji (`eslint.config.js`), a nie z globu w skrypcie. Glob `src/**/*.ts`
  bez cudzysłowu był na Linuksie (CI) rozwijany przez `sh`, który nie obsługuje `**` — lint
  sprawdzał wtedy tylko pliki bezpośrednio w `src/app/`.
- Konfiguracja (flat config):
  - `src/**/*.ts` — `typescript-eslint` `recommendedTypeChecked` (reguły korzystające z informacji
    o typach, `projectService`) oraz `angular-eslint` `tsRecommended`;
  - `src/**/*.html` — `angular-eslint` `templateRecommended` i `templateAccessibility`
    (m.in. elementy klikalne muszą być dostępne z klawiatury — używamy `<button>`, a nie `span (click)`);
  - wyłączona reguła `@typescript-eslint/unbound-method` — statyczne walidatory Angulara
    (`Validators.required`) dawałyby wyłącznie fałszywe alarmy;
  - ignorowane katalogi: `dist/`, `out-tsc/`, `coverage/`, `.angular/`, `public/`, `src-tauri/`.

## 2. Testy i pokrycie

- `npm test` — testy jednostkowe (Vitest przez builder `@angular/build:unit-test`).
- `npm run test:coverage` — jednorazowy przebieg z pokryciem (`@vitest/coverage-v8`). Raport
  tekstowy trafia na konsolę, a HTML i `lcov` do katalogu `coverage/`. Zakres pokrycia:
  `src/app/**/*.ts` bez plików `*.spec.ts` i modelu (`src/app/model/`).
- Testy silnika (`calculator.service.spec.ts`) zawierają **wartości referencyjne** policzone
  niezależnie od silnika (wzór annuitetowy, raty malejące, stopa zmienna, karencja, nadpłaty
  kwartalne i roczne), a nie tylko porównania względne.
- **Znane błędy** są opisane testami `it.fails(...)`: test opisuje poprawne zachowanie, a `.fails`
  oznacza, że dziś ono nie występuje. Po naprawie błędu test zaczyna przechodzić, przez co
  `it.fails` zgłasza błąd — trzeba wtedy zdjąć `.fails`. Tak oznaczone są regresje z
  `docs/TODO.md` (Audyt 2026-09-28 — Etap 1) w `calculator.service.spec.ts` i `form.spec.ts`.

## 3. CI (`.github/workflows/ci.yml`)

Uruchamiane przy pushu i PR do `main` oraz wywoływane przez workflow wydania (`workflow_call`).

| Job        | Runner           | Kroki                                                                                       |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `frontend` | `ubuntu-latest`  | `npm ci` → `npm run lint` → `npm run test:coverage` (artefakt `coverage`) → `npm run build` |
| `tauri`    | `windows-latest` | `cargo clippy --locked --all-targets -- -D warnings` w `src-tauri`                          |

- Job `tauri` działa na Windows jak wydanie — nie wymaga bibliotek systemowych WebView (GTK/WebKit),
  które byłyby potrzebne na Linuksie.
- `tauri::generate_context!()` wymaga istnienia katalogu `frontendDist` już przy kompilacji, dlatego
  job tworzy zaślepkę `dist/kalkulator-hippoteczny/browser/index.html` zamiast budować frontend.

## 4. Wydanie (`.github/workflows/release.yml`)

- Wyzwalane tagiem `v*`. Job `release` ma `needs: ci` — instalatory powstają tylko wtedy, gdy
  pełne CI (lint, testy, build, clippy) przejdzie na tagowanym commicie.
- `tauri-apps/tauri-action` jest przypięty do SHA commita (`action-v0.6.2`), a nie do ruchomego
  tagu `v0`, żeby zmiana po stronie akcji nie zmieniła wydania bez naszej wiedzy.
