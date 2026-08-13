#!/usr/bin/env node
// Seed danych kalkulacji dla trybu przeglądarkowego (dev bez Tauri).
//
// Kopiuje realny plik store'a Tauri:
//   %APPDATA%/kalkulator-hippoteczny/calculations.json
// do assetu serwowanego przez dev server:
//   public/dev-seed/calculations.json
//
// W trybie przeglądarkowym (npm start) wtyczka @tauri-apps/plugin-store nie działa —
// aplikacja korzysta z fallbacku na localStorage, który przy pierwszym starcie zasila
// się właśnie tym snapshotem. Dzięki temu w przeglądarce widać realną listę kalkulacji.
//
// Skrypt jest tolerancyjny: gdy źródła brak (inna maszyna / brak zapisanych kalkulacji),
// wypisuje ostrzeżenie i kończy się sukcesem, aby nie blokować `npm start`.
//
// Uruchomienie:
//   node scripts/seed-calculations.mjs      # odświeżenie snapshotu

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- Ustalenie ścieżki źródłowej (katalog danych aplikacji Tauri) -----------
const appDataDir = process.env.APPDATA ?? process.env.XDG_CONFIG_HOME ?? process.env.HOME;
if (!appDataDir) {
  console.warn('[seed:calc] Nie udało się ustalić katalogu danych aplikacji — pomijam seed.');
  process.exit(0);
}
const sourcePath = join(appDataDir, 'kalkulator-hippoteczny', 'calculations.json');

// --- Ustalenie ścieżki docelowej (asset dev serwera) ------------------------
const destinationDir = join(projectRoot, 'public', 'dev-seed');
const destinationPath = join(destinationDir, 'calculations.json');

// --- Kopiowanie (nie-fatalne przy braku źródła) -----------------------------
if (!existsSync(sourcePath)) {
  console.warn(`[seed:calc] Brak pliku źródłowego: ${sourcePath} — pomijam seed (pusta lista w dev).`);
  process.exit(0);
}

mkdirSync(destinationDir, { recursive: true });
copyFileSync(sourcePath, destinationPath);
console.log(`[seed:calc] Skopiowano snapshot kalkulacji → ${destinationPath}`);
