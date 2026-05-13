export type FrequencyAll = 'jednorazowo' | 'co miesiąc' | 'co kwartał' | 'co rok';
export type InstallmentType = 'równe' | 'malejące';
export type RateType = 'zmienna' | 'stała';
export type OverpaymentEffect = 'niższa rata' | 'skrócenie okresu';
export type PeriodUnit = 'lata' | 'miesiące';

export interface Costs {
  commissionPct: number;
  valuationFee: number;
  bridgeRate: number;
  bridgeMonths: number;
  insurancePct: number; // % wartości nieruchomości / rok
}

export type PropertyInsuranceFreq = 'co rok' | 'co miesiąc';
export type PropertyInsuranceMode =
  | '% wartości nieruchomości'
  | '% kwoty kredytu'
  | '% salda kredytu'
  | 'znam kwotę';
export type LifeInsuranceFreq = 'co rok' | 'co miesiąc' | 'jednorazowo';
export type LifeInsuranceMode = '% kwoty kredytu' | '% salda kredytu' | 'znam kwotę';
export type ExtraCostFreq = 'jednorazowo' | 'co rok' | 'co miesiąc';
export type ExtraCostMode = '% kwoty kredytu' | '% salda kredytu' | 'znam kwotę';

export interface ExtraCost {
  id: number;
  name: string;
  freq: ExtraCostFreq;
  mode: ExtraCostMode;
  value: number;
  from: Date;
}

export interface Overpayments {
  frequency: FrequencyAll;
  amount: number;
  effect: OverpaymentEffect;
}

export interface Tranche {
  amount: number;
  date: Date;
  fee?: number;
}

export interface ScheduleRow {
  idx: number;
  date: Date;
  rata: number;
  principal: number;
  interest: number;
  overpayment: number;
  balance: number;
  monthlyCost: number;
}

export interface YearAggregate {
  year: number;
  rata: number;
  principal: number;
  interest: number;
  overpayment: number;
  monthlyCost: number;
  balance: number;
  rows: ScheduleRow[];
}

export interface ScheduleResult {
  rows: ScheduleRow[];
  yearly: YearAggregate[];
  totalInterest: number;
  totalPayments: number;
  firstInstallment: number;
  totalCosts: number;
  totalOverpayments: number;
  commission: number;
  valuationFee: number;
}

export interface RatePeriod {
  id: number;
  fromMonth: number;
  rateType: RateType;
  rate: number;
  wibor: number;
  margin: number;
}

export interface CalcInput {
  propertyValue: number;
  loanAmount: number;
  years: number;
  months: number;
  installmentType: InstallmentType;
  rateType: RateType;
  rate: number;
  wibor: number;
  margin: number;
  startDate: Date;
  costs: Costs;
  overpayments: Overpayments;
  tranches: Tranche[];
  ratePeriods?: RatePeriod[];
}

export type Palette = 'sage' | 'peach' | 'lavender' | 'mist';
export type Density = 'cozy' | 'comfy' | 'roomy';
export type FontPair = 'inter' | 'fraunces' | 'system';

export interface Tweaks {
  palette: Palette;
  density: Density;
  fontPair: FontPair;
}
