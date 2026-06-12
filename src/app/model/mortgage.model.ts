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

export enum CommissionCalcMethod {
  PERCENTAGE = 'PERCENTAGE',
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
  to?: string;
}

export interface AdditionalCost {
  name: string;
  frequency: InsuranceFrequency;
  calcMethod: LifeInsuranceCalcMethod;
  value: number;
  from: string;
  to?: string;
}

export interface PromotionalRate {
  rateDecrease: number; // %
  from: string;
  to: string;
}

export interface OverheadCostsInputs {
  commissionValue: number; // wartość prowizji za udzielenie (% lub zł)
  commissionCalcMethod: CommissionCalcMethod;
  appraisalFee: number; // zł opłata za wycenę
  bridgeInsurance?: BridgeInsurance;
  propertyInsurance?: PropertyInsurance;
  lowEquityInsurance?: LowEquityInsurance;
  lifeInsurance?: LifeInsurance;
  jobLossInsurance?: JobLossInsurance;
  additionalCosts?: AdditionalCost[];
  promotionalRate?: PromotionalRate;
}

export enum OverheadCostKind {
  LOAN_COMMISSION = 'LOAN_COMMISSION',
  APPRAISAL_FEE = 'APPRAISAL_FEE',
  PROPERTY_INSURANCE = 'PROPERTY_INSURANCE',
  LIFE_INSURANCE = 'LIFE_INSURANCE',
  JOB_LOSS_INSURANCE = 'JOB_LOSS_INSURANCE',
  ADDITIONAL_COST = 'ADDITIONAL_COST',
  EARLY_REPAYMENT_COMMISSION = 'EARLY_REPAYMENT_COMMISSION',
  TRANCHE_DISBURSEMENT_FEE = 'TRANCHE_DISBURSEMENT_FEE',
}

export interface OverheadCostItem {
  kind: OverheadCostKind;
  name?: string; // wypełniane tylko dla ADDITIONAL_COST (nazwa kosztu z formularza)
  value: number; // PLN
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
  interestRate: number; // Efektywna stopa roczna w % dla tego miesiąca, np. 7.90
  prepayment: number; // Nadpłata
  commission: number; // Prowizja za wcześniejszą spłatę
  remaining: number; // Pozostało do spłaty po racie
  insuranceCost: number; // Koszt ubezpieczeń i dodatkowych kosztów w danym miesiącu
  costBreakdown: OverheadCostItem[]; // Rozbicie insuranceCost na składowe (suma value == insuranceCost)
}

/** Pojedynczy przepływ pieniężny na osi czasu kredytu (do wyliczenia RRSO). */
export interface CashFlowEvent {
  monthOffset: number; // liczba miesięcy od daty uruchomienia kredytu (0 = moment uruchomienia)
  amount: number;
}

export interface MortgageResults {
  effectiveRate: number; // nominalna %
  rrso: number | null; // Rzeczywista Roczna Stopa Oprocentowania w %; null gdy nieobliczalna
  totalMonths: number; // n łącznie (lata*12+miesiące)
  amortizationMonths: number; // n po karencji
  firstInstallment: { rate: number; capital: number; interest: number } | null;
  hasRateChanges: boolean; // true jeśli jakakolwiek stopa różni się od pierwszego wiersza
  totals: {
    totalRate: number;
    totalCapital: number;
    totalInterest: number;
    overheadCosts: number; // koszty okołokredytowe
    overheadCostsBreakdown: OverheadCostItem[]; // rozbicie overheadCosts na składowe (suma value == overheadCosts)
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
  firstInterestRate: number; // interestRate pierwszego wiersza roku
  lastInterestRate: number; // interestRate ostatniego wiersza roku
  rows: ScheduleRow[];
}

export enum FormErrorSection {
  BASIC_DATA = 'Dane podstawowe',
  TRANCHES = 'Transze',
  PREPAYMENTS = 'Nadpłaty',
  OVERHEAD_COSTS = 'Koszty okołokredytowe i promocje',
}

export interface FormError {
  section: FormErrorSection;
  message: string;
  detail?: string;
  fieldNum?: string;
  fieldLabel: string;
  fieldId: string;
}

export enum ColorCodeArea {
  CAPITAL = 'CAPITAL',
  INTEREST = 'INTEREST',
  COST = 'COST',
  PREPAYMENT = 'PREPAYMENT',
}

export interface ValidationError {
  path: string;
  message: string;
}
