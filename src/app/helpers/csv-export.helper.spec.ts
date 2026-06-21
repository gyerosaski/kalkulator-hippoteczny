import { buildScheduleCsv, buildSummaryCsv, formatCsvNumber, toCsv } from './csv-export.helper';
import { InstallmentType, RateType, SavedCalculation, ScheduleRow } from '../model';

const UTF8_BOM = '﻿';

function sampleCalculation(overrides: Partial<SavedCalculation> = {}): SavedCalculation {
  return {
    name: 'Oferta A',
    loanAmount: 300000,
    propertyValue: 500000,
    loanPeriodMonths: 240,
    loanPeriodYears: 20,
    loanPeriodExtraMonths: 0,
    installmentType: InstallmentType.EQUAL,
    rateType: RateType.VARIABLE,
    referenceIndex: 5.5,
    margin: 2,
    nominalRate: 7.5,
    firstInstallment: 2417.5,
    totalInterest: 280000,
    totalCosts: 5000,
    commission: 3000,
    appraisalFee: 400,
    totalOverpayments: 0,
    totalPayments: 585000,
    overpaymentsEnabled: false,
    trancheCount: 1,
    hasErrors: false,
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-02-20T10:00:00Z'),
    ...overrides,
  };
}

function sampleScheduleRow(overrides: Partial<ScheduleRow> = {}): ScheduleRow {
  return {
    index: 1,
    date: '2026-02',
    rate: 2417.5,
    capital: 542.5,
    interest: 1875,
    interestRate: 7.5,
    prepayment: 0,
    commission: 0,
    remaining: 299457.5,
    insuranceCost: 25,
    costBreakdown: [],
    interestBreakdown: [],
    ...overrides,
  };
}

describe('formatCsvNumber', () => {
  it('używa przecinka dziesiętnego i dwóch miejsc po przecinku', () => {
    expect(formatCsvNumber(1234.5)).toBe('1234,50');
    expect(formatCsvNumber(0)).toBe('0,00');
  });

  it('zwraca zero dla wartości nieskończonych i NaN', () => {
    expect(formatCsvNumber(Number.NaN)).toBe('0,00');
    expect(formatCsvNumber(Number.POSITIVE_INFINITY)).toBe('0,00');
  });
});

describe('toCsv', () => {
  it('rozdziela kolumny średnikiem, wiersze CRLF i dodaje BOM', () => {
    const csv = toCsv(['A', 'B'], [['1', '2']]);
    expect(csv).toBe(`${UTF8_BOM}A;B\r\n1;2`);
  });

  it('otacza cudzysłowami pola zawierające separator lub cudzysłów', () => {
    const csv = toCsv(['A'], [['ma;średnik'], ['ma "cudzysłów"']]);
    expect(csv).toBe(`${UTF8_BOM}A\r\n"ma;średnik"\r\n"ma ""cudzysłów"""`);
  });
});

describe('buildSummaryCsv', () => {
  it('tworzy nagłówek i po jednym wierszu na kalkulację', () => {
    const csv = buildSummaryCsv([sampleCalculation(), sampleCalculation({ name: 'Oferta B' })]);
    const lines = csv.replace(UTF8_BOM, '').split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('Nazwa');
    expect(lines[1].startsWith('Oferta A;')).toBe(true);
    expect(lines[2].startsWith('Oferta B;')).toBe(true);
  });

  it('mapuje etykiety enumów oraz flagę nadpłat na polskie napisy', () => {
    const csv = buildSummaryCsv([
      sampleCalculation({
        installmentType: InstallmentType.DECREASING,
        rateType: RateType.FIXED,
        overpaymentsEnabled: true,
      }),
    ]);
    const row = csv.replace(UTF8_BOM, '').split('\r\n')[1];
    expect(row).toContain('malejące');
    expect(row).toContain('stała');
    expect(row).toContain('Tak');
  });
});

describe('buildScheduleCsv', () => {
  it('tworzy nagłówek i po jednym wierszu na miesiąc harmonogramu', () => {
    const csv = buildScheduleCsv([
      sampleScheduleRow(),
      sampleScheduleRow({ index: 2, date: '2026-03' }),
    ]);
    const lines = csv.replace(UTF8_BOM, '').split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      'Nr;Miesiąc;Rata;Kapitał;Odsetki;Oprocentowanie (%);Nadpłata;Prowizja;Pozostało;Koszty dodatkowe',
    );
    expect(lines[1]).toBe('1;2026-02;2417,50;542,50;1875,00;7,50;0,00;0,00;299457,50;25,00');
    expect(lines[2].startsWith('2;2026-03;')).toBe(true);
  });
});
