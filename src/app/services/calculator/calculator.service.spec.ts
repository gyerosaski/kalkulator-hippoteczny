import {
  CalculatorService,
  CommissionCalcMethod,
  InstallmentType,
  InsuranceCalcMethod,
  InsuranceFrequency,
  LifeInsuranceCalcMethod,
  MortgageInputs,
  PrepaymentEffect,
  PrepaymentFrequency,
  RateType,
} from './calculator.service';

function baseInputs(effect: PrepaymentEffect = PrepaymentEffect.SHORTEN_PERIOD): MortgageInputs {
  return {
    propertyValue: 500_000,
    loanAmount: 300_000,
    ltv: 60,
    loanPeriod: 20 * 12,
    startDate: '2026-01',
    capitalStartDate: '2026-02',
    installmentType: InstallmentType.EQUAL,
    ratePeriods: [
      {
        from: '2026-01',
        rateType: RateType.FIXED,
        nominalRate: 8,
        wibor: 0,
        margin: 0,
      },
    ],
    prepaymentRules: [
      {
        frequency: PrepaymentFrequency.ONE_TIME,
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
      effect: PrepaymentEffect.LOWER_INSTALLMENT,
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
        frequency: PrepaymentFrequency.ONE_TIME,
        from: '2027-01',
        to: '2027-01',
        amount: 5_000,
        effect: PrepaymentEffect.SHORTEN_PERIOD,
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
        frequency: PrepaymentFrequency.ONE_TIME,
        from: '2026-05',
        to: '',
        amount: 7_500,
        effect: PrepaymentEffect.SHORTEN_PERIOD,
      },
    ];

    const result = service.compute(inputs);
    const eventRow = result.schedule.find((r) => r.date === '2026-05');

    expect(eventRow).toBeTruthy();
    expect(eventRow!.prepayment).toBe(7_500);
  });

  it('dla efektu "niższa rata" powinien obniżyć kolejną ratę względem "skrócenia okresu"', () => {
    const withLowerRate = service.compute(baseInputs(PrepaymentEffect.LOWER_INSTALLMENT));
    const withShorten = service.compute(baseInputs(PrepaymentEffect.SHORTEN_PERIOD));

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
      effect: PrepaymentEffect.SHORTEN_PERIOD,
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
      effect: PrepaymentEffect.SHORTEN_PERIOD,
    };

    const result = service.compute(inputs);
    const rowsInRange = result.schedule.filter((r) => r.date >= '2026-02' && r.date <= '2026-06');

    expect(rowsInRange.length).toBeGreaterThan(0);
    expect(rowsInRange.every((r) => r.prepayment === 0)).toBe(true);
  });

  it('powinien zastosować nowe oprocentowanie po zmianie okresu', () => {
    const inputs = baseInputs();
    inputs.prepaymentRules = [];
    inputs.ratePeriods = [
      { from: '2026-01', rateType: RateType.FIXED, nominalRate: 8, wibor: 0, margin: 0 },
      { from: '2027-01', rateType: RateType.FIXED, nominalRate: 4, wibor: 0, margin: 0 },
    ];

    const result = service.compute(inputs);
    const rowBefore = result.schedule.find((r) => r.date === '2026-12');
    const rowAfter = result.schedule.find((r) => r.date === '2027-01');

    expect(rowBefore).toBeTruthy();
    expect(rowAfter).toBeTruthy();
    expect(rowAfter!.interest).toBeLessThan(rowBefore!.interest);
  });
});

function trancheInputs(): MortgageInputs {
  return {
    propertyValue: 500_000,
    loanAmount: 300_000,
    ltv: 60,
    loanPeriod: 20 * 12,
    startDate: '2026-01',
    capitalStartDate: '2026-02',
    installmentType: InstallmentType.EQUAL,
    ratePeriods: [
      { from: '2026-01', rateType: RateType.FIXED, nominalRate: 8, wibor: 0, margin: 0 },
    ],
    prepaymentRules: [],
    targetInstallmentRule: {
      targetRate: 0,
      from: '2026-01',
      to: '2026-01',
      effect: PrepaymentEffect.LOWER_INSTALLMENT,
    },
    tranches: [
      { amount: 200_000, date: '2026-01', disbursementFee: 0 },
      { amount: 100_000, date: '2026-04', disbursementFee: 0 },
    ],
  };
}

describe('MortgageCalcService (transze)', () => {
  let service: CalculatorService;

  beforeEach(() => {
    service = new CalculatorService();
  });

  it('rata w miesiącu transzy powinna być taka sama jak miesiąc wcześniej', () => {
    const result = service.compute(trancheInputs());
    const rowBefore = result.schedule.find((r) => r.date === '2026-03');
    const rowTranche = result.schedule.find((r) => r.date === '2026-04');

    expect(rowBefore).toBeTruthy();
    expect(rowTranche).toBeTruthy();
    expect(rowTranche!.rate).toBeCloseTo(rowBefore!.rate, 0);
  });

  it('rata powinna wzrosnąć dopiero w miesiącu PO uruchomieniu transzy', () => {
    const result = service.compute(trancheInputs());
    const rowTranche = result.schedule.find((r) => r.date === '2026-04');
    const rowAfter = result.schedule.find((r) => r.date === '2026-05');

    expect(rowTranche).toBeTruthy();
    expect(rowAfter).toBeTruthy();
    expect(rowAfter!.rate).toBeGreaterThan(rowTranche!.rate);
  });

  it('"Pozostało" powinno wzrosnąć o kwotę transzy w miesiącu jej uruchomienia', () => {
    const result = service.compute(trancheInputs());
    const rowBefore = result.schedule.find((r) => r.date === '2026-03');
    const rowTranche = result.schedule.find((r) => r.date === '2026-04');

    expect(rowBefore).toBeTruthy();
    expect(rowTranche).toBeTruthy();
    // Saldo po racie z miesiąca transzy powinno być wyższe o ~100 000 (kwota transzy)
    expect(rowTranche!.remaining).toBeGreaterThan(rowBefore!.remaining + 90_000);
  });
});

describe('MortgageCalcService (ubezpieczenia % salda)', () => {
  let service: CalculatorService;

  beforeEach(() => {
    service = new CalculatorService();
  });

  it('składka ubezpieczenia nieruchomości % salda powinna być obliczana od salda na początku miesiąca', () => {
    // Kredyt 300 000 zł, ubezpieczenie nieruchomości 0.05% salda miesięcznie.
    // W pierwszym miesiącu kapitałowym saldo na początku okresu = 300 000 zł,
    // więc składka = 300 000 * 0.0005 = 150 zł (nie mniej po odliczeniu kapitału).
    const inputs: MortgageInputs = {
      propertyValue: 500_000,
      loanAmount: 300_000,
      ltv: 60,
      loanPeriod: 20 * 12,
      startDate: '2026-01',
      capitalStartDate: '2026-02',
      installmentType: InstallmentType.EQUAL,
      ratePeriods: [
        { from: '2026-01', rateType: RateType.FIXED, nominalRate: 8, wibor: 0, margin: 0 },
      ],
      prepaymentRules: [],
      targetInstallmentRule: {
        targetRate: 0,
        from: '2026-01',
        to: '2026-01',
        effect: PrepaymentEffect.LOWER_INSTALLMENT,
      },
      overheadCosts: {
        commissionCalcMethod: CommissionCalcMethod.FIXED_AMOUNT,
        commissionValue: 0,
        appraisalFee: 0,
        propertyInsurance: {
          calcMethod: InsuranceCalcMethod.PCT_BALANCE,
          frequency: InsuranceFrequency.MONTHLY,
          value: 0.05,
          from: '2026-02',
          to: '',
        },
      },
    };

    const result = service.compute(inputs);

    // Pierwszy miesiąc kapitałowy: saldo na początku = 300 000 zł → składka = 150 zł
    const firstCapitalRow = result.schedule.find((r) => r.date === '2026-02');
    expect(firstCapitalRow).toBeTruthy();
    expect(firstCapitalRow!.insuranceCost).toBeCloseTo(150, 2);
  });

  it('składka ubezpieczenia na życie % salda powinna być obliczana od salda na początku miesiąca', () => {
    // Kredyt 300 000 zł, ubezpieczenie na życie 0.05% salda miesięcznie.
    // W pierwszym miesiącu kapitałowym saldo na początku okresu = 300 000 zł,
    // więc składka = 300 000 * 0.0005 = 150 zł (nie mniej po odliczeniu kapitału).
    const inputs: MortgageInputs = {
      propertyValue: 500_000,
      loanAmount: 300_000,
      ltv: 60,
      loanPeriod: 20 * 12,
      startDate: '2026-01',
      capitalStartDate: '2026-02',
      installmentType: InstallmentType.EQUAL,
      ratePeriods: [
        { from: '2026-01', rateType: RateType.FIXED, nominalRate: 8, wibor: 0, margin: 0 },
      ],
      prepaymentRules: [],
      targetInstallmentRule: {
        targetRate: 0,
        from: '2026-01',
        to: '2026-01',
        effect: PrepaymentEffect.LOWER_INSTALLMENT,
      },
      overheadCosts: {
        commissionCalcMethod: CommissionCalcMethod.FIXED_AMOUNT,
        commissionValue: 0,
        appraisalFee: 0,
        lifeInsurance: {
          calcMethod: LifeInsuranceCalcMethod.PCT_BALANCE,
          frequency: InsuranceFrequency.MONTHLY,
          value: 0.05,
          from: '2026-02',
          to: '',
        },
      },
    };

    const result = service.compute(inputs);

    // Pierwszy miesiąc kapitałowy: saldo na początku = 300 000 zł → składka = 150 zł
    const firstCapitalRow = result.schedule.find((r) => r.date === '2026-02');
    expect(firstCapitalRow).toBeTruthy();
    expect(firstCapitalRow!.insuranceCost).toBeCloseTo(150, 2);
  });
});

describe('MortgageCalcService (ubezpieczenie niskiego wkładu)', () => {
  let service: CalculatorService;

  beforeEach(() => {
    service = new CalculatorService();
  });

  function buildLowEquityInsuranceOverheadCosts(): OverheadCostsInputs {
    return {
      commissionValue: 0,
      commissionCalcMethod: CommissionCalcMethod.PERCENTAGE,
      appraisalFee: 0,
      lowEquityInsurance: { rateIncrease: 2 },
    };
  }

  function buildLowEquityInputs(loanAmount: number, propertyValue: number): MortgageInputs {
    return {
      propertyValue,
      loanAmount,
      ltv: propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0,
      loanPeriod: 20 * 12,
      startDate: '2026-01',
      capitalStartDate: '2026-02',
      installmentType: InstallmentType.EQUAL,
      ratePeriods: [
        {
          from: '2026-01',
          rateType: RateType.FIXED,
          nominalRate: 6,
          wibor: 0,
          margin: 0,
        },
      ],
      prepaymentRules: [],
      targetInstallmentRule: {
        targetRate: 0,
        from: '2026-01',
        to: '2026-01',
        effect: PrepaymentEffect.LOWER_INSTALLMENT,
      },
      overheadCosts: buildLowEquityInsuranceOverheadCosts(),
    };
  }

  it('podwyżka oprocentowania aktywna gdy LTV > 80%', () => {
    // LTV = 450_000 / 500_000 = 90% > 80%
    const inputsWithLei = buildLowEquityInputs(450_000, 500_000);
    const inputsWithoutLei = { ...inputsWithLei, overheadCosts: undefined };

    const resultWithLei = service.compute(inputsWithLei);
    const resultWithoutLei = service.compute(inputsWithoutLei);

    const rowWithLei = resultWithLei.schedule[0];
    const rowWithoutLei = resultWithoutLei.schedule[0];

    expect(rowWithLei).toBeTruthy();
    expect(rowWithoutLei).toBeTruthy();
    // Przy LTV 90% ubezpieczenie niskiego wkładu powinno podwyższać odsetki
    expect(rowWithLei.interest).toBeGreaterThan(rowWithoutLei.interest);
  });

  it('podwyżka oprocentowania nieaktywna gdy LTV <= 80%', () => {
    // LTV = 300_000 / 500_000 = 60% <= 80%
    const inputsWithLei = buildLowEquityInputs(300_000, 500_000);
    const inputsWithoutLei = { ...inputsWithLei, overheadCosts: undefined };

    const resultWithLei = service.compute(inputsWithLei);
    const resultWithoutLei = service.compute(inputsWithoutLei);

    const rowWithLei = resultWithLei.schedule[0];
    const rowWithoutLei = resultWithoutLei.schedule[0];

    expect(rowWithLei).toBeTruthy();
    expect(rowWithoutLei).toBeTruthy();
    // Przy LTV 60% ubezpieczenie niskiego wkładu nie powinno podwyższać odsetek
    expect(rowWithLei.interest).toBeCloseTo(rowWithoutLei.interest, 2);
  });

  it('po nadpłacie redukującej LTV poniżej 80%, podwyżka przestaje obowiązywać', () => {
    // Kredyt 420_000 przy wartości nieruchomości 500_000 → LTV = 84% > 80%
    // Jednorazowa nadpłata 30_000 w 2026-03 obniża saldo poniżej 400_000 → LTV < 80%
    const inputs: MortgageInputs = {
      propertyValue: 500_000,
      loanAmount: 420_000,
      ltv: 84,
      loanPeriod: 20 * 12,
      startDate: '2026-01',
      capitalStartDate: '2026-02',
      installmentType: InstallmentType.EQUAL,
      ratePeriods: [
        {
          from: '2026-01',
          rateType: RateType.FIXED,
          nominalRate: 6,
          wibor: 0,
          margin: 0,
        },
      ],
      prepaymentRules: [
        {
          frequency: PrepaymentFrequency.ONE_TIME,
          from: '2026-03',
          to: '2026-03',
          amount: 30_000,
          effect: PrepaymentEffect.SHORTEN_PERIOD,
        },
      ],
      targetInstallmentRule: {
        targetRate: 0,
        from: '2026-01',
        to: '2026-01',
        effect: PrepaymentEffect.LOWER_INSTALLMENT,
      },
      overheadCosts: buildLowEquityInsuranceOverheadCosts(),
    };

    const result = service.compute(inputs);

    // Po nadpłacie 30_000 saldo spada poniżej 400_000 → LTV < 80%
    const rowAfterPrepayment = result.schedule.find((row) => row.date === '2026-04');
    const rowBeforePrepayment = result.schedule.find((row) => row.date === '2026-02');

    expect(rowBeforePrepayment).toBeTruthy();
    expect(rowAfterPrepayment).toBeTruthy();

    // Saldo w 2026-03 (po nadpłacie) powinno być poniżej progu 80% LTV (400_000)
    const balanceAfterPrepaymentMonth = result.schedule.find(
      (row) => row.date === '2026-03',
    )!.remaining;
    expect(balanceAfterPrepaymentMonth).toBeLessThan(400_000);

    // Efektywna stopa odsetkowa (odsetki / saldo) powinna być niższa po spadku LTV poniżej 80%
    const balanceBeforePrepayment = rowBeforePrepayment!.remaining + rowBeforePrepayment!.capital;
    const balanceForApril = rowAfterPrepayment!.remaining + rowAfterPrepayment!.capital;
    const effectiveRateBeforePrepayment = rowBeforePrepayment!.interest / balanceBeforePrepayment;
    const effectiveRateAfterPrepayment = rowAfterPrepayment!.interest / balanceForApril;
    expect(effectiveRateAfterPrepayment).toBeLessThan(effectiveRateBeforePrepayment);
  });
});
