import { InstallmentType, RateType } from './mortgage.model';

export enum ComparisonSlot {
  A = 'A',
  B = 'B',
}

export enum ComparableOfferKind {
  SAVED = 'SAVED',
  DRAFT = 'DRAFT',
}

/** Zarezerwowany identyfikator bieżącej (niezapisanej) kalkulacji w widoku porównania. */
export const DRAFT_OFFER_ID = '__draft__';

/**
 * Oferta możliwa do zestawienia w widoku „Porównanie ofert” — model widoku dla slotu i dialogu wyboru.
 * Identyfikator zapisanej kalkulacji to jej nazwa; dla bieżącej kalkulacji to {@link DRAFT_OFFER_ID}.
 */
export interface ComparableOffer {
  id: string;
  kind: ComparableOfferKind;
  name: string;
  loanAmount: number;
  propertyValue: number;
  loanPeriodYears: number;
  loanPeriodExtraMonths: number;
  nominalRate: number;
  rateType: RateType;
  installmentType: InstallmentType;
  firstInstallment: number;
  totalInterest: number;
  totalCosts: number;
  commission: number;
  appraisalFee: number;
  totalOverpayments: number;
  totalPayments: number;
  hasErrors: boolean;
}

/** Wiersz tabeli różnic kosztowych (sekcja 3.8) w widoku „Porównanie ofert”. */
export interface ComparisonDiffRow {
  label: string;
  aText: string;
  bText: string;
  deltaText: string;
  unit: string;
  deltaClass: 'delta--up' | 'delta--down' | 'delta--flat';
  aIsLeader: boolean;
  bIsLeader: boolean;
  isEmphasized: boolean;
}

/** Kontekst przekazywany do dialogu wyboru oferty (`SelectOfferDialogComponent.open`). */
export interface SelectOfferDialogContext {
  slot: ComparisonSlot;
  excludedOfferId: string | null;
  offers: ComparableOffer[];
}
