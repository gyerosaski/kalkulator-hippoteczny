import { CalculatorService, MortgageInputs, PrepaymentEffect } from './calculator.service';

function baseInputs(effect: PrepaymentEffect = 'skrócenie okresu'): MortgageInputs {
  return {
    propertyValue: 500_000,
    loanAmount: 300_000,
    ltv: 60,
    years: 20,
    months: 0,
    startDate: '2026-01',
    capitalStartDate: '2026-02',
    installmentType: 'rowne',
    rateType: 'stala',
    nominalRate: 8,
    wibor: 0,
    margin: 0,
    prepaymentRules: [
      {
        frequency: 'jednorazowo',
        from: '2026-03',
        to: '2026-03',
        amount: 10_000,
        effect,
      },
    ],
    targetInstallmentRule: {
      targetRate: 0,
      from: '2026-01',
      to: '2026-01',
      effect: 'niższa rata',
    },
    earlyRepaymentCommission: {
      ratePct: 2,
      validUntil: '2026-12',
    },
  };
}

describe('MortgageCalcService (nadpłaty)', () => {
  let service: CalculatorService;

  beforeEach(() => {
    service = new CalculatorService();
  });

  it('powinien naliczyć nadpłatę i prowizję w aktywnym okresie prowizji', () => {
    const result = service.compute(baseInputs());

    const eventRow = result.schedule.find((r) => r.date === '2026-03');
    expect(eventRow).toBeTruthy();
    expect(eventRow!.prepayment).toBe(10_000);
    expect(eventRow!.commission).toBe(200);
    expect(result.totals.prepayments).toBeGreaterThan(0);
    expect(result.totals.overheadCosts).toBeGreaterThan(0);
  });

  it('nie powinien naliczać prowizji po dacie granicznej', () => {
    const inputs = baseInputs();
    inputs.prepaymentRules = [
      {
        frequency: 'jednorazowo',
        from: '2027-01',
        to: '2027-01',
        amount: 5_000,
        effect: 'skrócenie okresu',
      },
    ];

    const result = service.compute(inputs);
    const eventRow = result.schedule.find((r) => r.date === '2027-01');

    expect(eventRow).toBeTruthy();
    expect(eventRow!.prepayment).toBe(5_000);
    expect(eventRow!.commission).toBe(0);
  });

  it('powinien uwzględnić jednorazową nadpłatę wskazaną pojedynczą datą (bez pola "do")', () => {
    const inputs = baseInputs();
    inputs.prepaymentRules = [
      {
        frequency: 'jednorazowo',
        from: '2026-05',
        to: '',
        amount: 7_500,
        effect: 'skrócenie okresu',
      },
    ];

    const result = service.compute(inputs);
    const eventRow = result.schedule.find((r) => r.date === '2026-05');

    expect(eventRow).toBeTruthy();
    expect(eventRow!.prepayment).toBe(7_500);
  });

  it('dla efektu "niższa rata" powinien obniżyć kolejną ratę względem "skrócenia okresu"', () => {
    const withLowerRate = service.compute(baseInputs('niższa rata'));
    const withShorten = service.compute(baseInputs('skrócenie okresu'));

    const rowAfterEventLower = withLowerRate.schedule.find((r) => r.date === '2026-04');
    const rowAfterEventShorten = withShorten.schedule.find((r) => r.date === '2026-04');

    expect(rowAfterEventLower).toBeTruthy();
    expect(rowAfterEventShorten).toBeTruthy();
    expect(rowAfterEventLower!.rate).toBeLessThan(rowAfterEventShorten!.rate);
  });

  it('powinien dodać automatyczną nadpłatę dla reguły docelowej raty', () => {
    const inputs = baseInputs();
    inputs.prepaymentRules = [];
    inputs.targetInstallmentRule = {
      targetRate: 3_000,
      from: '2026-02',
      to: '2026-06',
      effect: 'skrócenie okresu',
    };

    const result = service.compute(inputs);
    const row = result.schedule.find((r) => r.date === '2026-02');

    expect(row).toBeTruthy();
    expect(row!.prepayment).toBeGreaterThan(0);
    expect(result.totals.prepayments).toBeGreaterThan(0);
  });

  it('nie powinien dodawać nadpłaty z reguły docelowej raty, gdy rata docelowa jest niższa', () => {
    const inputs = baseInputs();
    inputs.prepaymentRules = [];
    inputs.targetInstallmentRule = {
      targetRate: 100,
      from: '2026-02',
      to: '2026-06',
      effect: 'skrócenie okresu',
    };

    const result = service.compute(inputs);
    const rowsInRange = result.schedule.filter((r) => r.date >= '2026-02' && r.date <= '2026-06');

    expect(rowsInRange.length).toBeGreaterThan(0);
    expect(rowsInRange.every((r) => r.prepayment === 0)).toBe(true);
  });
});
