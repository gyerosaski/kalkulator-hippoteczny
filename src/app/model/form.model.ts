import { FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  CommissionCalcMethod,
  InsuranceCalcMethod,
  InsuranceFrequency,
  InstallmentType,
  LifeInsuranceCalcMethod,
  LoanPeriodUnit,
  PrepaymentEffect,
  PrepaymentFrequency,
  RateType,
} from './mortgage.model';

export interface RatePeriodFormGroup {
  from: FormControl<string>;
  rateType: FormControl<RateType>;
  nominalRate: FormControl<number>;
  wibor: FormControl<number>;
  margin: FormControl<number>;
}

export interface TrancheFormGroup {
  amount: FormControl<number>;
  date: FormControl<string>;
  disbursementFee: FormControl<number>;
}

export interface PrepaymentRuleFormGroup {
  frequency: FormControl<PrepaymentFrequency>;
  from: FormControl<string>;
  to: FormControl<string>;
  amount: FormControl<number>;
  effect: FormControl<PrepaymentEffect>;
}

export interface TargetInstallmentFormGroup {
  targetRate: FormControl<number>;
  from: FormControl<string>;
  to: FormControl<string>;
  effect: FormControl<PrepaymentEffect>;
}

export interface EarlyRepaymentCommissionFormGroup {
  ratePct: FormControl<number>;
  validUntil: FormControl<string>;
}

export interface PrepaymentRulesSectionFormGroup {
  items: FormArray<FormGroup<PrepaymentRuleFormGroup>>;
}

export interface AdditionalCostFormGroup {
  name: FormControl<string>;
  frequency: FormControl<InsuranceFrequency>;
  calcMethod: FormControl<LifeInsuranceCalcMethod>;
  value: FormControl<number>;
  from: FormControl<string>;
  to: FormControl<string>;
}

export interface CommissionFormGroup {
  commissionValue: FormControl<number>;
  commissionCalcMethod: FormControl<CommissionCalcMethod>;
}

export interface AppraisalFormGroup {
  appraisalFee: FormControl<number>;
}

export interface BridgeInsuranceFormGroup {
  bridgeRateIncrease: FormControl<number>;
  bridgeMonths: FormControl<number>;
}

export interface PropertyInsuranceFormGroup {
  propInsFrequency: FormControl<InsuranceFrequency>;
  propInsCalcMethod: FormControl<InsuranceCalcMethod>;
  propInsValue: FormControl<number>;
  propInsFrom: FormControl<string>;
  propInsTo: FormControl<string>;
}

export interface LowEquityInsuranceFormGroup {
  lowEquityRateIncrease: FormControl<number>;
}

export interface LifeInsuranceFormGroup {
  lifeInsFrequency: FormControl<InsuranceFrequency>;
  lifeInsCalcMethod: FormControl<LifeInsuranceCalcMethod>;
  lifeInsValue: FormControl<number>;
  lifeInsFrom: FormControl<string>;
  lifeInsTo: FormControl<string>;
}

export interface JobLossInsuranceFormGroup {
  jobLossInsFrequency: FormControl<InsuranceFrequency>;
  jobLossInsCalcMethod: FormControl<LifeInsuranceCalcMethod>;
  jobLossInsValue: FormControl<number>;
  jobLossInsFrom: FormControl<string>;
  jobLossInsTo: FormControl<string>;
}

export interface AdditionalCostsSectionFormGroup {
  items: FormArray<FormGroup<AdditionalCostFormGroup>>;
}

export interface PromoRateFormGroup {
  promoRateDecrease: FormControl<number>;
  promoFrom: FormControl<string>;
  promoTo: FormControl<string>;
}

export interface OverheadCostsFormGroup {
  commission: FormGroup<CommissionFormGroup>;
  appraisal: FormGroup<AppraisalFormGroup>;
  bridge: FormGroup<BridgeInsuranceFormGroup>;
  propertyInsurance: FormGroup<PropertyInsuranceFormGroup>;
  lowEquityInsurance: FormGroup<LowEquityInsuranceFormGroup>;
  lifeInsurance: FormGroup<LifeInsuranceFormGroup>;
  jobLossInsurance: FormGroup<JobLossInsuranceFormGroup>;
  additionalCosts: FormGroup<AdditionalCostsSectionFormGroup>;
  promoRate: FormGroup<PromoRateFormGroup>;
}

export interface PrepaymentsFieldsFormGroup {
  prepaymentRules: FormGroup<PrepaymentRulesSectionFormGroup>;
  rataDocelowaRegula: FormGroup<TargetInstallmentFormGroup>;
  prowizjaWczesniejszaSplata: FormGroup<EarlyRepaymentCommissionFormGroup>;
}

export interface TranchesFieldsFormGroup {
  tranches: FormArray<FormGroup<TrancheFormGroup>>;
}

export interface ToggleableSectionFormGroup<
  T extends { [K in keyof T]: import('@angular/forms').AbstractControl },
> {
  enabled: FormControl<boolean>;
  fields: FormGroup<T>;
}

export interface BasicDataFormGroup {
  propertyValue: FormControl<number>;
  loanAmount: FormControl<number>;
  ltv: FormControl<number>;
  loanPeriod: FormControl<number>;
  loanPeriodUnit: FormControl<LoanPeriodUnit>; // Tylko na potrzeby prezentacji, wewnętrznie wartość przechowywana jest zawsze w miesiącach
  startDate: FormControl<string>;
  capitalStartDate: FormControl<string>;
  installmentType: FormControl<InstallmentType>;
  ratePeriods: FormArray<FormGroup<RatePeriodFormGroup>>;
}

export interface MortgageFormGroup {
  basicData: FormGroup<BasicDataFormGroup>;
  overheadCosts: FormGroup<ToggleableSectionFormGroup<OverheadCostsFormGroup>>;
  tranches: FormGroup<ToggleableSectionFormGroup<TranchesFieldsFormGroup>>;
  prepayments: FormGroup<ToggleableSectionFormGroup<PrepaymentsFieldsFormGroup>>;
}

/**
 * Migawka wartości formularza kalkulatora (`form.getRawValue()`) — dokładnie ten kształt
 * jest zapisywany jako `SavedCalculationRecord.data` i odtwarzany w widoku porównania.
 */
export type MortgageFormRawValue = ReturnType<FormGroup<MortgageFormGroup>['getRawValue']>;

/** Migawka wartości sekcji „Dane podstawowe” formularza kalkulatora. */
export type BasicDataRawValue = MortgageFormRawValue['basicData'];

/** Migawka wartości pól sekcji „Koszty okołokredytowe i promocje” (bez flagi `enabled`). */
export type OverheadCostsRawValue = MortgageFormRawValue['overheadCosts']['fields'];

/** Migawka wartości pól sekcji „Transze” (bez flagi `enabled`). */
export type TranchesRawValue = MortgageFormRawValue['tranches']['fields'];

/** Migawka wartości pól sekcji „Nadpłaty” (bez flagi `enabled`). */
export type PrepaymentsRawValue = MortgageFormRawValue['prepayments']['fields'];
