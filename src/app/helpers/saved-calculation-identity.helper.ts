import { NormalizedSavedCalculationRecords, SavedCalculationRecord } from '../model';
import { buildUniqueCalculationName } from './saved-calculation-import.helper';

/** Tworzy nowy, stabilny identyfikator zapisanej kalkulacji. */
export function createCalculationId(): string {
  return crypto.randomUUID();
}

/**
 * Porządkuje tożsamość zapisanych kalkulacji wczytanych ze store'a:
 * - nadaje identyfikator rekordom bez `id` (zapisy sprzed wprowadzenia identyfikatorów) oraz
 *   rekordom ze zdublowanym `id`,
 * - rozwiązuje zdublowane nazwy (nazwa jest w interfejsie kluczem kalkulacji) sufiksem
 *   „ — kopia”, tak jak przy imporcie.
 *
 * Kolejność rekordów jest zachowana; pierwszy rekord z danym `id` lub nazwą je zachowuje.
 *
 * @param records rekordy odczytane ze store'a.
 * @param createId fabryka identyfikatorów (w testach deterministyczna).
 */
export function normalizeSavedCalculationRecords(
  records: SavedCalculationRecord[],
  createId: () => string = createCalculationId,
): NormalizedSavedCalculationRecords {
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();
  let changed = false;

  const normalizedRecords = records.map((record) => {
    // identyfikator: brakujący lub zdublowany → nowy
    let id = typeof record.id === 'string' && record.id ? record.id : '';
    if (!id || usedIds.has(id)) {
      id = createId();
      changed = true;
    }
    usedIds.add(id);

    // nazwa: zdublowana → unikalny wariant
    const name = buildUniqueCalculationName(record.name, usedNames);
    if (name !== record.name) changed = true;
    usedNames.add(name);

    return id === record.id && name === record.name ? record : { ...record, id, name };
  });

  return { records: normalizedRecords, changed };
}
