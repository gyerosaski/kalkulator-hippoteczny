import { InstallmentType, RateType } from './mortgage.model';

export interface SavedCalculationMetadata {
  firstInstallment: number;
  totalInterest: number;
  totalCosts: number;
  overpaymentsEnabled: boolean;
  trancheCount: number;
  hasErrors: boolean;
  commission?: number;
  appraisalFee?: number;
  totalOverpayments?: number;
  totalPayments?: number;
}

export interface SavedCalculationRecord {
  name: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: SavedCalculationMetadata;
  data: unknown;
}

export interface SavedCalculation {
  name: string;
  loanAmount: number;
  propertyValue: number;
  loanPeriodMonths: number;
  loanPeriodYears: number;
  loanPeriodExtraMonths: number;
  installmentType: InstallmentType;
  rateType: RateType;
  wibor: number;
  margin: number;
  nominalRate: number;
  firstInstallment: number;
  totalInterest: number;
  totalCosts: number;
  commission: number;
  appraisalFee: number;
  totalOverpayments: number;
  totalPayments: number;
  overpaymentsEnabled: boolean;
  trancheCount: number;
  hasErrors: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum SavedCalculationSortOption {
  UPDATED = 'UPDATED',
  CREATED = 'CREATED',
  NAME = 'NAME',
  LOAN_AMOUNT = 'LOAN_AMOUNT',
  FIRST_INSTALLMENT = 'FIRST_INSTALLMENT',
}
