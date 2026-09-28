import { MortgageFormRawValue } from './form.model';
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
  /** Stabilny identyfikator rekordu (UUID) — nie zmienia się przy zmianie nazwy. */
  id: string;
  /** Nazwa kalkulacji — unikalna w obrębie zapisanych kalkulacji. */
  name: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: SavedCalculationMetadata;
  data: MortgageFormRawValue;
}

export interface SavedCalculation {
  id: string;
  name: string;
  loanAmount: number;
  propertyValue: number;
  loanPeriodMonths: number;
  loanPeriodYears: number;
  loanPeriodExtraMonths: number;
  installmentType: InstallmentType;
  rateType: RateType;
  referenceIndex: number;
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

export enum CalculationImportStatus {
  SUCCESS = 'SUCCESS',
  CANCELED = 'CANCELED',
  INVALID_FILE = 'INVALID_FILE',
}

export enum SavedCalculationSortOption {
  UPDATED = 'UPDATED',
  CREATED = 'CREATED',
  NAME = 'NAME',
  LOAN_AMOUNT = 'LOAN_AMOUNT',
  FIRST_INSTALLMENT = 'FIRST_INSTALLMENT',
}

export enum ExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
}

export enum ExportScope {
  PARAMETERS = 'PARAMETERS',
  SCHEDULE = 'SCHEDULE',
}

export interface ExportSelection {
  scope: ExportScope;
  format: ExportFormat;
}

export interface CalculationImportResult {
  status: CalculationImportStatus;
  importedCount: number;
}

/** Wynik porządkowania tożsamości zapisanych kalkulacji (identyfikatory i unikalne nazwy). */
export interface NormalizedSavedCalculationRecords {
  records: SavedCalculationRecord[];
  /** `true`, gdy któryś rekord dostał nowy identyfikator lub nazwę — należy je ponownie zapisać. */
  changed: boolean;
}
