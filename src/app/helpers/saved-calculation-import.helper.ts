import { SavedCalculationRecord } from '../model';

/**
 * Sprawdza, czy dowolna wartość ma kształt rekordu zapisanej kalkulacji
 * (`SavedCalculationRecord`). Wymaga obecności pól `name` (string), `createdAt`
 * oraz `data`.
 */
export function isSavedCalculationRecord(value: unknown): value is SavedCalculationRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'createdAt' in value &&
    'data' in value &&
    typeof (value as { name: unknown }).name === 'string'
  );
}

/**
 * Wyłuskuje listę poprawnych rekordów kalkulacji z dowolnych sparsowanych danych JSON.
 * Akceptuje trzy kształty wejścia, które produkuje sama aplikacja:
 * - tablicę rekordów,
 * - obiekt-opakowanie z `exportAllToFile` (`{ exportedAt, count, calculations: [...] }`),
 * - pojedynczy rekord.
 * Elementy nieodpowiadające `SavedCalculationRecord` są odfiltrowywane; gdy nie ma
 * żadnego poprawnego rekordu, zwracana jest pusta tablica.
 */
export function extractImportableRecords(parsed: unknown): SavedCalculationRecord[] {
  // wybór kandydatów na rekordy w zależności od kształtu wejścia
  let candidates: unknown[];
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else if (
    typeof parsed === 'object' &&
    parsed !== null &&
    Array.isArray((parsed as { calculations?: unknown }).calculations)
  ) {
    candidates = (parsed as { calculations: unknown[] }).calculations;
  } else {
    candidates = [parsed];
  }

  // odfiltrowanie wszystkiego, co nie jest poprawnym rekordem
  return candidates.filter(isSavedCalculationRecord);
}

/**
 * Wyznacza unikalną nazwę kalkulacji względem już istniejących nazw. Gdy `desired`
 * jest wolne, zwraca je bez zmian. W przeciwnym razie dokleja sufiks „ — kopia”,
 * a przy kolejnych kolizjach „ — kopia (2)”, „ — kopia (3)” itd.
 */
export function buildUniqueCalculationName(
  desired: string,
  existingNames: ReadonlySet<string> | readonly string[],
): string {
  const taken = existingNames instanceof Set ? existingNames : new Set(existingNames);
  if (!taken.has(desired)) return desired;

  const base = `${desired} — kopia`;
  if (!taken.has(base)) return base;

  let counter = 2;
  while (taken.has(`${base} (${counter})`)) {
    counter += 1;
  }
  return `${base} (${counter})`;
}
