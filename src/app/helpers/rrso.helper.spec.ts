import { computeRrso } from './rrso.helper';

describe('computeRrso', () => {
  it('zwraca 10% dla pożyczki 1000 spłaconej kwotą 1100 po roku', () => {
    const rrso = computeRrso(
      [{ monthOffset: 0, amount: 1000 }],
      [{ monthOffset: 12, amount: 1100 }],
    );
    expect(rrso).not.toBeNull();
    expect(rrso!).toBeCloseTo(10, 6);
  });

  it('zwraca 0% gdy spłata równa się wypłacie', () => {
    const rrso = computeRrso(
      [{ monthOffset: 0, amount: 1000 }],
      [{ monthOffset: 12, amount: 1000 }],
    );
    expect(rrso).not.toBeNull();
    expect(rrso!).toBeCloseTo(0, 6);
  });

  it('zwraca 10% dla dwóch rocznych okresów kapitalizacji (1000 → 1210 po 2 latach)', () => {
    const rrso = computeRrso(
      [{ monthOffset: 0, amount: 1000 }],
      [{ monthOffset: 24, amount: 1210 }],
    );
    expect(rrso).not.toBeNull();
    expect(rrso!).toBeCloseTo(10, 6);
  });

  it('uwzględnia wypłaty w transzach (późniejsza wypłata podnosi RRSO przy tych samych płatnościach)', () => {
    const singleDisbursement = computeRrso(
      [{ monthOffset: 0, amount: 1000 }],
      [{ monthOffset: 12, amount: 1100 }],
    );
    const tranchedDisbursement = computeRrso(
      [
        { monthOffset: 0, amount: 500 },
        { monthOffset: 6, amount: 500 },
      ],
      [{ monthOffset: 12, amount: 1100 }],
    );
    expect(tranchedDisbursement!).toBeGreaterThan(singleDisbursement!);
  });

  it('zwraca null dla pustych wypłat lub płatności', () => {
    expect(computeRrso([], [{ monthOffset: 12, amount: 1100 }])).toBeNull();
    expect(computeRrso([{ monthOffset: 0, amount: 1000 }], [])).toBeNull();
  });

  it('zwraca null gdy RRSO przekracza górną granicę solvera', () => {
    // 1 zł pożyczki spłacane kwotą 1 000 000 zł po miesiącu — stopa poza zakresem 10 000%
    const rrso = computeRrso(
      [{ monthOffset: 0, amount: 1 }],
      [{ monthOffset: 1, amount: 1_000_000 }],
    );
    expect(rrso).toBeNull();
  });
});
