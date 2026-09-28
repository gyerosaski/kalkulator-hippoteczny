import { MortgageFormRawValue, SavedCalculationRecord } from '../model';
import { normalizeSavedCalculationRecords } from './saved-calculation-identity.helper';

function buildRecord(name: string, id?: string): SavedCalculationRecord {
  // rekordy sprzed wprowadzenia identyfikatorów nie mają pola `id`
  return {
    ...(id === undefined ? {} : { id }),
    name,
    createdAt: '2026-01-01T00:00:00.000Z',
    data: {} as MortgageFormRawValue,
  } as SavedCalculationRecord;
}

function sequentialIds(): () => string {
  let counter = 0;
  return () => `new-${++counter}`;
}

describe('normalizeSavedCalculationRecords', () => {
  it('nie zmienia rekordów z unikalnymi identyfikatorami i nazwami', () => {
    const records = [buildRecord('A', 'id-a'), buildRecord('B', 'id-b')];

    const result = normalizeSavedCalculationRecords(records, sequentialIds());

    expect(result.changed).toBe(false);
    expect(result.records).toEqual(records);
  });

  it('nadaje identyfikatory rekordom bez `id`', () => {
    const result = normalizeSavedCalculationRecords(
      [buildRecord('A'), buildRecord('B', 'id-b')],
      sequentialIds(),
    );

    expect(result.changed).toBe(true);
    expect(result.records.map((record) => record.id)).toEqual(['new-1', 'id-b']);
  });

  it('zastępuje zdublowany identyfikator nowym, zachowując go w pierwszym rekordzie', () => {
    const result = normalizeSavedCalculationRecords(
      [buildRecord('A', 'same'), buildRecord('B', 'same')],
      sequentialIds(),
    );

    expect(result.records.map((record) => record.id)).toEqual(['same', 'new-1']);
  });

  it('rozwiązuje zdublowane nazwy sufiksem „ — kopia”', () => {
    const result = normalizeSavedCalculationRecords(
      [buildRecord('A', 'id-1'), buildRecord('A', 'id-2'), buildRecord('A', 'id-3')],
      sequentialIds(),
    );

    expect(result.changed).toBe(true);
    expect(result.records.map((record) => record.name)).toEqual([
      'A',
      'A — kopia',
      'A — kopia (2)',
    ]);
  });
});
