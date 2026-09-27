import { SavedCalculationRecord } from '../model';
import {
  buildUniqueCalculationName,
  extractImportableRecords,
  isSavedCalculationRecord,
} from './saved-calculation-import.helper';

function buildRecord(name: string): SavedCalculationRecord {
  return {
    name,
    createdAt: '2026-01-01T00:00:00.000Z',
    data: { basicData: { loanAmount: 100000 } },
  };
}

describe('isSavedCalculationRecord', () => {
  it('akceptuje poprawny rekord', () => {
    expect(isSavedCalculationRecord(buildRecord('A'))).toBe(true);
  });

  it('odrzuca obiekt bez wymaganych pól', () => {
    expect(isSavedCalculationRecord({ name: 'A' })).toBe(false);
    expect(isSavedCalculationRecord({ createdAt: 'x', data: {} })).toBe(false);
    expect(isSavedCalculationRecord(null)).toBe(false);
    expect(isSavedCalculationRecord('A')).toBe(false);
  });

  it('odrzuca rekord z nietekstową nazwą', () => {
    expect(isSavedCalculationRecord({ name: 1, createdAt: 'x', data: {} })).toBe(false);
  });
});

describe('extractImportableRecords', () => {
  it('zwraca pojedynczy rekord opakowany w tablicę', () => {
    const record = buildRecord('A');
    expect(extractImportableRecords(record)).toEqual([record]);
  });

  it('zwraca elementy gołej tablicy', () => {
    const records = [buildRecord('A'), buildRecord('B')];
    expect(extractImportableRecords(records)).toEqual(records);
  });

  it('rozpakowuje format z exportAllToFile', () => {
    const records = [buildRecord('A'), buildRecord('B')];
    const payload = { exportedAt: '2026-01-01T00:00:00.000Z', count: 2, calculations: records };
    expect(extractImportableRecords(payload)).toEqual(records);
  });

  it('odfiltrowuje nieprawidłowe elementy z mieszanki', () => {
    const valid = buildRecord('A');
    expect(extractImportableRecords([valid, { name: 'X' }, null, 42])).toEqual([valid]);
  });

  it('zwraca pustą tablicę dla nieprawidłowych danych', () => {
    expect(extractImportableRecords({ foo: 'bar' })).toEqual([]);
    expect(extractImportableRecords('not json object')).toEqual([]);
    expect(extractImportableRecords([])).toEqual([]);
  });
});

describe('buildUniqueCalculationName', () => {
  it('zwraca pierwotną nazwę, gdy jest wolna', () => {
    expect(buildUniqueCalculationName('Kredyt', [])).toBe('Kredyt');
    expect(buildUniqueCalculationName('Kredyt', ['Inny'])).toBe('Kredyt');
  });

  it('dokleja „ — kopia” przy pojedynczej kolizji', () => {
    expect(buildUniqueCalculationName('Kredyt', ['Kredyt'])).toBe('Kredyt — kopia');
  });

  it('numeruje kolejne kolizje', () => {
    expect(buildUniqueCalculationName('Kredyt', ['Kredyt', 'Kredyt — kopia'])).toBe(
      'Kredyt — kopia (2)',
    );
    expect(
      buildUniqueCalculationName(
        'Kredyt',
        new Set(['Kredyt', 'Kredyt — kopia', 'Kredyt — kopia (2)']),
      ),
    ).toBe('Kredyt — kopia (3)');
  });
});
