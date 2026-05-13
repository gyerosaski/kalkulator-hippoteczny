export enum InstallmentType {
  EQUAL = 'EQUAL',
  DECREASING = 'DECREASING',
}

export enum RateType {
  VARIABLE = 'VARIABLE',
  FIXED = 'FIXED',
}

export interface RatePeriod {
  from: string; // 'YYYY-MM' - start date for this rate period
  rateType: RateType;
  nominalRate: number; // % (used when rateType === RateType.FIXED)
  wibor: number; // % (used when rateType === RateType.VARIABLE)
  margin: number; // % (used when rateType === RateType.VARIABLE)
}

export enum PrepaymentFrequency {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum PrepaymentEffect {
  LOWER_INSTALLMENT = 'LOWER_INSTALLMENT',
  SHORTEN_PERIOD = 'SHORTEN_PERIOD',
}

export interface PrepaymentRule {
  frequency: PrepaymentFrequency;
  from: string; // 'YYYY-MM'
  to?: string; // 'YYYY-MM' (opcjonalne dla jednorazowej nadpłaty)
  amount: number; // PLN
  effect: PrepaymentEffect;
}

export interface TargetInstallmentRule {
  targetRate: number; // PLN
  from: string; // 'YYYY-MM'
  to: string; // 'YYYY-MM'
  effect: PrepaymentEffect;
}

export interface EarlyRepaymentCommission {
  ratePct: number; // %
  validUntil: string; // 'YYYY-MM'
}

export interface Tranche {
  amount: number; // PLN
  date: string; // 'YYYY-MM'
  disbursementFee?: number; // PLN (dla transz dodatkowych)
}

export enum InsuranceFrequency {
  YEARLY = 'YEARLY',
  MONTHLY = 'MONTHLY',
  ONE_TIME = 'ONE_TIME',
}

export enum InsuranceCalcMethod {
  PCT_PROPERTY_VALUE = 'PCT_PROPERTY_VALUE',
  PCT_LOAN_AMOUNT = 'PCT_LOAN_AMOUNT',
  PCT_BALANCE = 'PCT_BALANCE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum LifeInsuranceCalcMethod {
  PCT_LOAN_AMOUNT = 'PCT_LOAN_AMOUNT',
  PCT_BALANCE = 'PCT_BALANCE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum LoanPeriodUnit {
  YEARS = 'YEARS',
  MONTHS = 'MONTHS',
}

export interface BridgeInsurance {
  rateIncrease: number; // % podwyższenia oprocentowania
  months: number; // liczba miesięcy
}

export interface PropertyInsurance {
  frequency: InsuranceFrequency;
  calcMethod: InsuranceCalcMethod;
  value: number; // % lub kwota zł
  from: string; // 'YYYY-MM'
  to: string; // 'YYYY-MM'
}

export interface LowEquityInsurance {
  rateIncrease: number; // % podwyższenia oprocentowania
}

export interface LifeInsurance {
  frequency: InsuranceFrequency;
  calcMethod: LifeInsuranceCalcMethod;
  value: number;
  from: string;
  to: string;
}

export interface JobLossInsurance {
  frequency: InsuranceFrequency;
  calcMethod: LifeInsuranceCalcMethod;
  value: number;
  from: string;
}

export interface AdditionalCost {
  name: string;
  frequency: InsuranceFrequency;
  calcMethod: LifeInsuranceCalcMethod;
  value: number;
  from: string;
}

export interface PromotionalRate {
  rateDecrease: number; // %
  from: string;
  to: string;
}

export interface OverheadCostsInputs {
  commissionPct: number; // % prowizji za udzielenie
  appraisalFee: number; // zł opłata za wycenę
  bridgeInsurance?: BridgeInsurance;
  propertyInsurance?: PropertyInsurance;
  lowEquityInsurance?: LowEquityInsurance;
  lifeInsurance?: LifeInsurance;
  jobLossInsurance?: JobLossInsurance;
  additionalCosts?: AdditionalCost[];
  promotionalRate?: PromotionalRate;
}

export interface MortgageInputs {
  propertyValue: number; // Wartość nieruchomości (PLN)
  loanAmount: number; // Kwota kredytu (PLN)
  ltv: number; // % 0-100
  loanPeriod: number; // okres kredytowania w miesiącach
  startDate: string; // 'YYYY-MM' (pierwszy miesiąc kredytu)
  capitalStartDate: string; // 'YYYY-MM' (początek spłat kapitału)
  installmentType: InstallmentType; // równe | malejące (jeden typ na cały kredyt)
  ratePeriods: RatePeriod[]; // co najmniej jeden; posortowane wg from
  prepaymentRules?: PrepaymentRule[];
  targetInstallmentRule?: TargetInstallmentRule;
  earlyRepaymentCommission?: EarlyRepaymentCommission;
  tranches?: Tranche[];
  overheadCosts?: OverheadCostsInputs;
}

export interface ScheduleRow {
  index: number; // 1-based
  date: string; // 'YYYY-MM'
  rate: number; // Rata
  capital: number; // Kapitał
  interest: number; // Odsetki
  prepayment: number; // Nadpłata
  commission: number; // Prowizja za wcześniejszą spłatę
  remaining: number; // Pozostało do spłaty po racie
  insuranceCost: number; // Koszt ubezpieczeń i dodatkowych kosztów w danym miesiącu
}

export interface MortgageResults {
  effectiveRate: number; // nominalna %
  totalMonths: number; // n łącznie (lata*12+miesiące)
  amortizationMonths: number; // n po karencji
  firstInstallment: { rate: number; capital: number; interest: number } | null;
  totals: {
    totalRate: number;
    totalCapital: number;
    totalInterest: number;
    overheadCosts: number; // koszty okołokredytowe
    prepayments: number;
    bankReturnRatioPct: number; // Suma wszystkich płatności / Kwota kredytu * 100
    totalAllPayments: number; // Suma wszystkich płatności = totalRate + overheadCosts + prepayments
  };
  schedule: ScheduleRow[];
}

export interface YearGroup {
  year: number;
  sumRate: number;
  sumCapital: number;
  sumInterest: number;
  sumPrepayment: number;
  sumCommission: number;
  sumInsuranceCost: number;
  lastRemaining: number;
  rows: ScheduleRow[];
}
