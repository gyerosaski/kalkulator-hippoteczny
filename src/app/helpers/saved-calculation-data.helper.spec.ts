import { normalizeCalculationData } from './saved-calculation-data.helper';

describe('normalizeCalculationData', () => {
  it('zwraca null dla danych niebędących obiektem', () => {
    expect(normalizeCalculationData(null)).toBeNull();
    expect(normalizeCalculationData('x')).toBeNull();
  });

  it('mapuje legacy pole `wibor` na `referenceIndex` w okresach oprocentowania', () => {
    const legacy = {
      ratePeriods: { items: [{ from: '2026-01', wibor: 5.5, margin: 2 }] },
    };

    const normalized = normalizeCalculationData(legacy);

    const firstPeriod = normalized?.ratePeriods.items[0] as Record<string, unknown>;
    expect(firstPeriod['referenceIndex']).toBe(5.5);
    expect('wibor' in firstPeriod).toBe(false);
  });

  it('zachowuje istniejące `referenceIndex` i pomija legacy `wibor`', () => {
    const mixed = {
      ratePeriods: { items: [{ from: '2026-01', referenceIndex: 7, wibor: 5.5, margin: 2 }] },
    };

    const normalized = normalizeCalculationData(mixed);

    const firstPeriod = normalized?.ratePeriods.items[0] as Record<string, unknown>;
    expect(firstPeriod['referenceIndex']).toBe(7);
    expect('wibor' in firstPeriod).toBe(false);
  });

  it('migruje też starsze okresy trzymane w `basicData.ratePeriods`', () => {
    const legacy = {
      basicData: { ratePeriods: [{ from: '2026-01', wibor: 4, margin: 1 }] },
    };

    const normalized = normalizeCalculationData(legacy);

    const firstPeriod = normalized?.ratePeriods.items[0] as Record<string, unknown>;
    expect(firstPeriod['referenceIndex']).toBe(4);
  });
});
