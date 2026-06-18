import {
  InstallmentType,
  RateType,
  SavedCalculation,
  SavedCalculationSortOption,
  SortDirection,
} from '../model';
import { DEFAULT_SORT_DIRECTIONS, sortSavedCalculations } from './saved-calculation-sort.helper';

function buildCalculation(overrides: Partial<SavedCalculation>): SavedCalculation {
  return {
    name: 'Kalkulacja',
    loanAmount: 400000,
    propertyValue: 500000,
    loanPeriodMonths: 300,
    loanPeriodYears: 25,
    loanPeriodExtraMonths: 0,
    installmentType: InstallmentType.EQUAL,
    rateType: RateType.VARIABLE,
    referenceIndex: 5.8,
    margin: 2,
    nominalRate: 7.8,
    firstInstallment: 3000,
    totalInterest: 500000,
    totalCosts: 20000,
    commission: 0,
    appraisalFee: 0,
    totalOverpayments: 0,
    totalPayments: 900000,
    overpaymentsEnabled: false,
    trancheCount: 1,
    hasErrors: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('sortSavedCalculations', () => {
  const older = buildCalculation({
    name: 'Bank A',
    loanAmount: 300000,
    firstInstallment: 2500,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-02-01'),
  });
  const newer = buildCalculation({
    name: 'Bank C',
    loanAmount: 500000,
    firstInstallment: 3500,
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-04-01'),
  });
  const middle = buildCalculation({
    name: 'Bank B',
    loanAmount: 400000,
    firstInstallment: 3000,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-03-01'),
  });
  const calculations = [older, newer, middle];

  it('sortuje rosnąco po dacie modyfikacji', () => {
    const sorted = sortSavedCalculations(
      calculations,
      SavedCalculationSortOption.UPDATED,
      SortDirection.ASCENDING,
    );
    expect(sorted.map((item) => item.name)).toEqual(['Bank A', 'Bank B', 'Bank C']);
  });

  it('odwraca kolejność przy kierunku malejącym', () => {
    const sorted = sortSavedCalculations(
      calculations,
      SavedCalculationSortOption.UPDATED,
      SortDirection.DESCENDING,
    );
    expect(sorted.map((item) => item.name)).toEqual(['Bank C', 'Bank B', 'Bank A']);
  });

  it('sortuje po nazwie z polską kolacją', () => {
    const withDiacritics = [
      buildCalculation({ name: 'Żubr' }),
      buildCalculation({ name: 'Zebra' }),
      buildCalculation({ name: 'Łoś' }),
    ];
    const sorted = sortSavedCalculations(
      withDiacritics,
      SavedCalculationSortOption.NAME,
      SortDirection.ASCENDING,
    );
    expect(sorted.map((item) => item.name)).toEqual(['Łoś', 'Zebra', 'Żubr']);
  });

  it('sortuje po kwocie kredytu i wysokości raty', () => {
    const byLoanAmount = sortSavedCalculations(
      calculations,
      SavedCalculationSortOption.LOAN_AMOUNT,
      SortDirection.DESCENDING,
    );
    expect(byLoanAmount.map((item) => item.loanAmount)).toEqual([500000, 400000, 300000]);

    const byInstallment = sortSavedCalculations(
      calculations,
      SavedCalculationSortOption.FIRST_INSTALLMENT,
      SortDirection.ASCENDING,
    );
    expect(byInstallment.map((item) => item.firstInstallment)).toEqual([2500, 3000, 3500]);
  });

  it('nie modyfikuje wejściowej tablicy', () => {
    const input = [...calculations];
    sortSavedCalculations(input, SavedCalculationSortOption.NAME, SortDirection.ASCENDING);
    expect(input).toEqual(calculations);
  });
});

describe('DEFAULT_SORT_DIRECTIONS', () => {
  it('daty i kwota kredytu domyślnie malejąco, nazwa i rata rosnąco', () => {
    expect(DEFAULT_SORT_DIRECTIONS[SavedCalculationSortOption.UPDATED]).toBe(
      SortDirection.DESCENDING,
    );
    expect(DEFAULT_SORT_DIRECTIONS[SavedCalculationSortOption.CREATED]).toBe(
      SortDirection.DESCENDING,
    );
    expect(DEFAULT_SORT_DIRECTIONS[SavedCalculationSortOption.LOAN_AMOUNT]).toBe(
      SortDirection.DESCENDING,
    );
    expect(DEFAULT_SORT_DIRECTIONS[SavedCalculationSortOption.NAME]).toBe(SortDirection.ASCENDING);
    expect(DEFAULT_SORT_DIRECTIONS[SavedCalculationSortOption.FIRST_INSTALLMENT]).toBe(
      SortDirection.ASCENDING,
    );
  });
});
