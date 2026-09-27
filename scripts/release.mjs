#!/usr/bin/env node
// Przygotowanie i wypchnięcie nowego wydania (release) aplikacji.
//
// Podbija numer wersji we wszystkich miejscach, które muszą być ze sobą zgodne:
//   - package.json + package-lock.json          (wersja frontendu)
//   - src-tauri/tauri.conf.json                 (z niej biorą się nazwy instalatorów MSI/NSIS)
//   - src-tauri/Cargo.toml + src-tauri/Cargo.lock (wersja crate'a Rust)
//   - src/app/components/ui/topbar/topbar.component.html (wersja widoczna w interfejsie)
// następnie tworzy commit „Wydanie vX.Y.Z”, tag `vX.Y.Z` i wypycha oba na `origin`.
// Wypchnięcie tagu uruchamia workflow `.github/workflows/release.yml`, który buduje
// instalatory + wersję portable i tworzy szkic (draft) Release na GitHubie.
//
// Przed zmianami skrypt sprawdza: format wersji, gałąź `main`, czyste drzewo robocze,
// zgodność z `origin/main` oraz brak tagu o tej samej nazwie (lokalnie i zdalnie).
//
// Uruchomienie:
//   npm run release -- 0.2.0             # podbicie wersji, commit, tag, push
//   npm run release -- 0.2.0 --dry-run   # tylko walidacja i podgląd zmian, bez zapisu
//   npm run release                      # brak/niepoprawna wersja → skrypt zapyta o nią interaktywnie

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const versionPattern = /^\d+\.\d+\.\d+$/;

const commandLineArguments = process.argv.slice(2);
const isDryRun = commandLineArguments.includes('--dry-run');

function fail(message) {
  console.error(`[release] BŁĄD: ${message}`);
  process.exit(1);
}

function runGit(gitArguments) {
  return execFileSync('git', gitArguments, { cwd: projectRoot, encoding: 'utf8' }).trim();
}

async function promptForVersion() {
  if (!process.stdin.isTTY) {
    fail('Podaj numer wersji w formacie X.Y.Z, np. `npm run release -- 0.2.0`.');
  }

  const currentVersion = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')).version;
  const readlineInterface = createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      const answer = (
        await readlineInterface.question(
          `[release] Podaj nową wersję (bieżąca: ${currentVersion}, format X.Y.Z): `,
        )
      ).trim();
      if (versionPattern.test(answer)) {
        return answer;
      }
      console.error(`[release] Niepoprawny format wersji: „${answer}”. Spróbuj ponownie.`);
    }
  } finally {
    readlineInterface.close();
  }
}

// --- Walidacja wejścia -----------------------------------------------------
let version = commandLineArguments.find((argument) => !argument.startsWith('--'));
if (version !== undefined && !versionPattern.test(version)) {
  console.error(`[release] Niepoprawny format wersji: „${version}”.`);
  version = undefined;
}
if (version === undefined) {
  version = await promptForVersion();
}
const tagName = `v${version}`;

// --- Walidacja stanu repozytorium ------------------------------------------
const currentBranch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
if (currentBranch !== 'main') {
  fail(`Wydanie robimy z gałęzi \`main\` (bieżąca: \`${currentBranch}\`).`);
}

if (runGit(['status', '--porcelain']) !== '') {
  fail('Drzewo robocze nie jest czyste — zacommituj lub odłóż zmiany przed wydaniem.');
}

try {
  runGit(['remote', 'get-url', 'origin']);
} catch {
  fail('Brak remote `origin` — najpierw utwórz repo na GitHubie (`gh repo create ... --push`).');
}

console.log('[release] Pobieram stan z origin…');
runGit(['fetch', 'origin', '--tags']);

const hasRemoteMain = runGit(['ls-remote', '--heads', 'origin', 'main']) !== '';
if (hasRemoteMain) {
  const commitsBehind = Number(runGit(['rev-list', '--count', 'HEAD..origin/main']));
  if (commitsBehind > 0) {
    fail(
      `Lokalny \`main\` jest ${commitsBehind} commit(ów) za \`origin/main\` — zrób \`git pull\`.`,
    );
  }
}

if (runGit(['tag', '--list', tagName]) !== '') {
  fail(`Tag \`${tagName}\` już istnieje lokalnie.`);
}
if (runGit(['ls-remote', '--tags', 'origin', `refs/tags/${tagName}`]) !== '') {
  fail(`Tag \`${tagName}\` już istnieje na origin.`);
}

// --- Definicja podmian wersji ----------------------------------------------
// Każda reguła musi trafić dokładnie tyle razy, ile wynosi `expectedMatches`,
// inaczej skrypt przerywa działanie (ochrona przed cichym pominięciem pliku).
const versionReplacements = [
  {
    file: 'package.json',
    pattern: /^( {2}"version": ")[^"]*(")/m,
    expectedMatches: 1,
  },
  {
    file: 'package-lock.json',
    // wersja na poziomie głównym + wpis pakietu głównego w `packages[""]`
    pattern:
      /^( {2}"version": ")[^"]*(")|^( {4}"": \{\r?\n(?: {6}.*\r?\n)*? {6}"version": ")[^"]*(")/gm,
    expectedMatches: 2,
  },
  {
    file: 'src-tauri/tauri.conf.json',
    pattern: /^( {2}"version": ")[^"]*(")/m,
    expectedMatches: 1,
  },
  {
    file: 'src-tauri/Cargo.toml',
    pattern: /^(\[package\]\r?\n(?:(?!\[).*\r?\n)*?version = ")[^"]*(")/m,
    expectedMatches: 1,
  },
  {
    file: 'src-tauri/Cargo.lock',
    pattern: /^(name = "kalkulator-hippoteczny"\r?\nversion = ")[^"]*(")/m,
    expectedMatches: 1,
  },
  {
    file: 'src/app/components/ui/topbar/topbar.component.html',
    pattern: /(<div class="brand-sub">v)[^<]*(<\/div>)/,
    expectedMatches: 1,
  },
];

const pendingWrites = [];
for (const { file, pattern, expectedMatches } of versionReplacements) {
  const filePath = join(projectRoot, file);
  const originalContent = readFileSync(filePath, 'utf8');

  const globalPattern = new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
  );
  const matchCount = [...originalContent.matchAll(globalPattern)].length;
  if (matchCount !== expectedMatches) {
    fail(`${file}: oczekiwano ${expectedMatches} wystąpień wersji, znaleziono ${matchCount}.`);
  }

  const updatedContent = originalContent.replace(globalPattern, (...matchParts) => {
    const capturedGroups = matchParts.slice(1, -2).filter((group) => group !== undefined);
    const [prefix, suffix] = capturedGroups;
    return `${prefix}${version}${suffix}`;
  });

  const status = updatedContent === originalContent ? 'bez zmian' : `→ ${version}`;
  console.log(`[release]   ${file}: ${status}`);
  if (updatedContent !== originalContent) {
    pendingWrites.push({ filePath, file, updatedContent });
  }
}

if (isDryRun) {
  console.log(
    `[release] --dry-run: nic nie zapisano. Wydanie ${tagName} jest gotowe do wykonania.`,
  );
  process.exit(0);
}

// --- Zapis, commit, tag, push ----------------------------------------------
for (const { filePath, updatedContent } of pendingWrites) {
  writeFileSync(filePath, updatedContent, 'utf8');
}

try {
  if (pendingWrites.length > 0) {
    runGit(['add', ...pendingWrites.map(({ file }) => file)]);
    runGit(['commit', '-m', `Wydanie ${tagName}`]);
    console.log(`[release] Utworzono commit „Wydanie ${tagName}”.`);
  } else {
    console.log('[release] Wersja już była aktualna — pomijam commit, taguję bieżący HEAD.');
  }
  runGit(['tag', '-a', tagName, '-m', `Kalkulator Hippoteczny ${tagName}`]);
  console.log(`[release] Utworzono tag ${tagName}.`);
} catch (error) {
  fail(
    `Nie udało się utworzyć commita/tagu: ${error.message}\n` +
      'Przywróć pliki poleceniem `git checkout -- .` (lub `git reset --hard HEAD~1`, jeśli commit powstał).',
  );
}

console.log('[release] Wypycham main i tag na origin…');
runGit(['push', 'origin', 'main']);
runGit(['push', 'origin', tagName]);

console.log(`[release] Gotowe. Workflow „Release” buduje szkic wydania ${tagName}.`);
console.log('[release] Podgląd buildu:  gh run watch');
console.log(`[release] Publikacja szkicu:  gh release edit ${tagName} --draft=false`);
