#!/usr/bin/env node
// Skaner nieużywanych klas CSS dla repozytorium kalkulator-hipoteczny.
//
// Implementuje metodykę z docs/technikalia/skanowanie-nieuzywanych-klas-css.md:
//   - Etap A (wysoka pewność): każdy *.component.scss zestawiany TYLKO ze swoim
//     rodzeństwem (*.component.html + *.component.ts). Możliwe dzięki temu, że
//     w projekcie nigdzie nie ma ViewEncapsulation.None (style są scoped).
//   - Etap B (do ręcznej weryfikacji): src/styles.scss zestawiany ze WSZYSTKIMI
//     szablonami i plikami .ts.
//
// Narzędzie NIE usuwa żadnego kodu — generuje raport kandydatów do ręcznego
// przeglądu. Klasy niepewne (::ng-deep, :host-context, dynamiczne bindowania,
// globalne) są raportowane osobno i nigdy nie trafiają do listy „pewnych".
//
// Uruchomienie:
//   node scripts/scan-unused-css.mjs            # raport tekstowy
//   node scripts/scan-unused-css.mjs --json     # raport JSON (do dalszej obróbki)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(projectRoot, 'src');
const globalStylesheetPath = join(sourceRoot, 'styles.scss');
const outputJson = process.argv.includes('--json');

const CLASS_NAME_PATTERN = /\.-?[_a-zA-Z][_a-zA-Z0-9-]*/g;

// --- Przechodzenie drzewa plików --------------------------------------------

function collectFiles(directory, extension, accumulator = []) {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      collectFiles(fullPath, extension, accumulator);
    } else if (entry.endsWith(extension)) {
      accumulator.push(fullPath);
    }
  }
  return accumulator;
}

function readFileSafe(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

// --- Ekstrakcja klas zdefiniowanych w SCSS ----------------------------------
// Tokenizuje SCSS znak po znaku, śledząc kontekst zagnieżdżenia, aby poprawnie
// rozwinąć konkatenacje BEM (`&--error` pod `.toast` -> `.toast--error`).
// Klasy w selektorach z ::ng-deep / :host-context / :host(...) są niepewne
// (stylują elementy spoza własnego szablonu) i trafiają do osobnego zbioru.

function stripScssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function resolveSelectorList(selectorText, parentSelectors) {
  const parts = selectorText
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const resolved = [];
  for (const part of parts) {
    if (part.includes('&')) {
      for (const parent of parentSelectors) {
        resolved.push(part.replaceAll('&', parent));
      }
    } else {
      for (const parent of parentSelectors) {
        resolved.push(parent ? `${parent} ${part}` : part);
      }
    }
  }
  return resolved.length > 0 ? resolved : [''];
}

function extractClassesFromScss(source) {
  const cleaned = stripScssComments(source);
  const definiteClasses = new Set();
  const uncertainClasses = new Set();
  const selectorStack = [];
  let buffer = '';

  const recordSelector = (resolvedSelector) => {
    const isUncertain =
      resolvedSelector.includes('::ng-deep') ||
      resolvedSelector.includes(':host-context') ||
      resolvedSelector.includes(':host(');
    const matches = resolvedSelector.match(CLASS_NAME_PATTERN);
    if (!matches) return;
    for (const match of matches) {
      const className = match.slice(1); // odetnij wiodącą kropkę
      (isUncertain ? uncertainClasses : definiteClasses).add(className);
    }
  };

  for (const character of cleaned) {
    if (character === '{') {
      const selectorText = buffer.trim();
      buffer = '';
      const parentSelectors =
        selectorStack.length > 0 ? selectorStack[selectorStack.length - 1] : [''];

      if (selectorText.startsWith('@')) {
        // Reguły at (@media, @if, @each…) nie tworzą selektorów — dzieci
        // dziedziczą bieżący kontekst rodzica.
        selectorStack.push(parentSelectors);
        continue;
      }

      const resolved = resolveSelectorList(selectorText, parentSelectors);
      for (const selector of resolved) recordSelector(selector);
      selectorStack.push(resolved);
    } else if (character === '}') {
      selectorStack.pop();
      buffer = '';
    } else if (character === ';') {
      buffer = ''; // koniec deklaracji — odrzuć (to nie selektor)
    } else {
      buffer += character;
    }
  }

  return { definiteClasses, uncertainClasses };
}

// --- Ekstrakcja klas UŻYWANYCH w szablonach (.html) i kodzie (.ts) ----------

function addTokens(target, rawValue) {
  for (const token of rawValue.split(/\s+/)) {
    const trimmed = token.trim();
    if (trimmed && !trimmed.includes('{{')) target.add(trimmed);
  }
}

function extractUsedFromHtml(source, usedTokens) {
  let dynamicBinding = false;

  // Statyczny atrybut class="..." / class='...'
  for (const match of source.matchAll(/class\s*=\s*"([^"]*)"|class\s*=\s*'([^']*)'/g)) {
    addTokens(usedTokens, match[1] ?? match[2] ?? '');
  }
  // [class.NAZWA]="..."  oraz  [attr.class.NAZWA] (rzadkie)
  for (const match of source.matchAll(/\[class\.([a-zA-Z0-9_-]+)\]/g)) {
    usedTokens.add(match[1]);
  }
  // [class]="..." / [ngClass]="..." / [attr.class]="..." — dynamiczne.
  // Wyciągamy literały stringowe z wyrażenia; flagujemy obecność dynamiki.
  for (const match of source.matchAll(/\[(?:class|ngClass|attr\.class)\]\s*=\s*"([^"]*)"/g)) {
    dynamicBinding = true;
    for (const literal of match[1].matchAll(/'([^']*)'/g)) addTokens(usedTokens, literal[1]);
  }

  return dynamicBinding;
}

function extractUsedFromTypescript(source, usedTokens) {
  // host: { '[class.NAZWA]': '...' }
  for (const match of source.matchAll(/\[class\.([a-zA-Z0-9_-]+)\]/g)) {
    usedTokens.add(match[1]);
  }
  // Wszystkie literały stringowe (apostrofy, cudzysłowy, backticki) jako sieć
  // bezpieczeństwa: łapie host: { class: '...' }, wartości typu
  // ComparisonDeltaClass i nazwy klas budowane w kodzie. Świadomie zachowawcze
  // — woli oznaczyć klasę jako używaną niż błędnie jako martwą.
  for (const match of source.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)) {
    addTokens(usedTokens, match[1] ?? match[2] ?? match[3] ?? '');
  }
}

// Klasa jest „pokryta przez prefiks", gdy któryś używany token kończy się na
// `-` i jest prefiksem nazwy klasy (np. token `delta--` z template literala
// pokrywa `delta--up`). Ogranicza fałszywe trafienia dla rodzin klas.
function isCoveredByPrefix(className, usedPrefixes) {
  for (const prefix of usedPrefixes) {
    if (className.startsWith(prefix)) return true;
  }
  return false;
}

function collectPrefixes(usedTokens) {
  const prefixes = new Set();
  for (const token of usedTokens) {
    if (token.length >= 3 && token.endsWith('-')) prefixes.add(token);
  }
  return prefixes;
}

// --- Grupowanie plików komponentu (foo.component.{scss,html,ts}) ------------

function componentStem(scssPath) {
  // foo.component.scss -> foo.component ; foo.scss -> foo
  return join(dirname(scssPath), basename(scssPath).replace(/\.scss$/, ''));
}

// --- Etap A: SCSS scoped -----------------------------------------------------

function runStageA() {
  const scssFiles = collectFiles(sourceRoot, '.scss').filter(
    (path) => path !== globalStylesheetPath,
  );

  const findings = [];

  for (const scssPath of scssFiles) {
    const stem = componentStem(scssPath);
    const htmlPath = `${stem}.html`;
    const typescriptPath = `${stem}.ts`;

    // Bez pary szablon/kod nie da się wiarygodnie ocenić — pomijamy
    // (np. SCSS-owe partiale), trafia do raportu jako ostrzeżenie.
    if (!existsSync(htmlPath) && !existsSync(typescriptPath)) {
      findings.push({
        file: relative(projectRoot, scssPath),
        skipped: true,
        reason: 'brak rodzeństwa .html/.ts — pomięto (zweryfikuj ręcznie)',
        dead: [],
        uncertain: [],
      });
      continue;
    }

    const { definiteClasses, uncertainClasses } = extractClassesFromScss(readFileSafe(scssPath));
    const usedTokens = new Set();
    const dynamicBinding = extractUsedFromHtml(readFileSafe(htmlPath), usedTokens);
    extractUsedFromTypescript(readFileSafe(typescriptPath), usedTokens);
    const usedPrefixes = collectPrefixes(usedTokens);

    const dead = [...definiteClasses]
      .filter((className) => !usedTokens.has(className))
      .filter((className) => !isCoveredByPrefix(className, usedPrefixes))
      .sort();

    if (dead.length > 0 || uncertainClasses.size > 0) {
      findings.push({
        file: relative(projectRoot, scssPath),
        skipped: false,
        dynamicBinding,
        dead,
        uncertain: [...uncertainClasses].sort(),
      });
    }
  }

  return findings;
}

// --- Etap B: styles.scss (globalny) -----------------------------------------

function runStageB() {
  const { definiteClasses, uncertainClasses } = extractClassesFromScss(
    readFileSafe(globalStylesheetPath),
  );

  const usedTokens = new Set();
  for (const htmlPath of collectFiles(sourceRoot, '.html')) {
    extractUsedFromHtml(readFileSafe(htmlPath), usedTokens);
  }
  for (const typescriptPath of collectFiles(sourceRoot, '.ts')) {
    extractUsedFromTypescript(readFileSafe(typescriptPath), usedTokens);
  }
  const usedPrefixes = collectPrefixes(usedTokens);

  const candidates = [...definiteClasses]
    .filter((className) => !usedTokens.has(className))
    .filter((className) => !isCoveredByPrefix(className, usedPrefixes))
    .sort();

  return {
    file: relative(projectRoot, globalStylesheetPath),
    candidates,
    uncertain: [...uncertainClasses].sort(),
  };
}

// --- Raportowanie ------------------------------------------------------------

function printTextReport(stageA, stageB) {
  const definiteDead = stageA.filter((finding) => !finding.skipped && finding.dead.length > 0);
  const withUncertain = stageA.filter((finding) => finding.uncertain.length > 0);
  const skipped = stageA.filter((finding) => finding.skipped);
  const totalDead = definiteDead.reduce((sum, finding) => sum + finding.dead.length, 0);

  console.log('═'.repeat(72));
  console.log('  SKANER NIEUŻYWANYCH KLAS CSS');
  console.log('═'.repeat(72));

  console.log('\n▶ ETAP A — SCSS scoped (wysoka pewność, kandydaci do usunięcia)\n');
  if (definiteDead.length === 0) {
    console.log('  ✓ Nie znaleziono nieużywanych klas w stylach komponentów.');
  } else {
    for (const finding of definiteDead) {
      console.log(`  ${finding.file}`);
      for (const className of finding.dead) console.log(`      .${className}`);
      if (finding.dynamicBinding) {
        console.log('      (uwaga: szablon używa [class]="…" — sprawdź dynamikę)');
      }
      console.log('');
    }
  }

  console.log('\n▶ ETAP B — styles.scss (globalne, DO RĘCZNEJ WERYFIKACJI)\n');
  if (stageB.candidates.length === 0) {
    console.log('  ✓ Brak globalnych klas bez znalezionego użycia.');
  } else {
    console.log(`  ${stageB.file}`);
    console.log('  Mogą być używane w odległych miejscach lub przez [class] z TS —');
    console.log('  NIE usuwaj automatycznie, potwierdź każdą ręcznie:');
    for (const className of stageB.candidates) console.log(`      .${className}`);
  }

  if (withUncertain.length > 0 || stageB.uncertain.length > 0) {
    console.log('\n▶ NIEPEWNE — selektory ::ng-deep / :host-context / :host(…)\n');
    console.log('  Stylują elementy spoza własnego szablonu — zweryfikuj ręcznie:');
    for (const finding of withUncertain) {
      console.log(`  ${finding.file}`);
      for (const className of finding.uncertain) console.log(`      .${className}`);
    }
    for (const className of stageB.uncertain) console.log(`  ${stageB.file}  .${className}`);
  }

  if (skipped.length > 0) {
    console.log('\n▶ POMINIĘTE — SCSS bez pary .html/.ts\n');
    for (const finding of skipped) console.log(`  ${finding.file}`);
  }

  console.log('\n' + '─'.repeat(72));
  console.log(
    `  Podsumowanie: ${totalDead} pewnych kandydatów (etap A), ` +
      `${stageB.candidates.length} globalnych do weryfikacji (etap B).`,
  );
  console.log('─'.repeat(72));
}

// --- Wejście -----------------------------------------------------------------

const stageA = runStageA();
const stageB = runStageB();

if (outputJson) {
  console.log(JSON.stringify({ stageA, stageB }, null, 2));
} else {
  printTextReport(stageA, stageB);
}
