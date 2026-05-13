import { FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  InsuranceCalcMethod,
  InsuranceFrequency,
  InstallmentType,
  LifeInsuranceCalcMethod,
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

export interface AdditionalCostFormGroup {
  name: FormControl<string>;
  frequency: FormControl<InsuranceFrequency>;
  calcMethod: FormControl<LifeInsuranceCalcMethod>;
  value: FormControl<number>;
  from: FormControl<string>;
}

export interface OverheadCostsFormGroup {
  commissionPct: FormControl<number>;
  appraisalFee: FormControl<number>;
  bridgeRateIncrease: FormControl<number>;
  bridgeMonths: FormControl<number>;
  propInsFrequency: FormControl<InsuranceFrequency>;
  propInsCalcMethod: FormControl<InsuranceCalcMethod>;
  propInsValue: FormControl<number>;
  propInsFrom: FormControl<string>;
  propInsTo: FormControl<string>;
  lowEquityRateIncrease: FormControl<number>;
  lifeInsFrequency: FormControl<InsuranceFrequency>;
  lifeInsCalcMethod: FormControl<LifeInsuranceCalcMethod>;
  lifeInsValue: FormControl<number>;
  lifeInsFrom: FormControl<string>;
  lifeInsTo: FormControl<string>;
  jobLossInsFrequency: FormControl<InsuranceFrequency>;
  jobLossInsCalcMethod: FormControl<LifeInsuranceCalcMethod>;
  jobLossInsValue: FormControl<number>;
  jobLossInsFrom: FormControl<string>;
  additionalCosts: FormArray<FormGroup<AdditionalCostFormGroup>>;
  promoRateDecrease: FormControl<number>;
  promoFrom: FormControl<string>;
  promoTo: FormControl<string>;
}

export interface PrepaymentsFieldsFormGroup {
  prepaymentRules: FormArray<FormGroup<PrepaymentRuleFormGroup>>;
  rataDocelowaRegula: FormGroup<TargetInstallmentFormGroup>;
  prowizjaWczesniejszaSplata: FormGroup<EarlyRepaymentCommissionFormGroup>;
}

export interface TranchesFieldsFormGroup {
  transze: FormArray<FormGroup<TrancheFormGroup>>;
}

export interface ToggleableSectionFormGroup<
  T extends { [K in keyof T]: import('@angular/forms').AbstractControl },
> {
  included: FormControl<boolean>;
  fields: FormGroup<T>;
}

export interface BasicDataFormGroup {
  propertyValue: FormControl<number>;
  loanAmount: FormControl<number>;
  ltv: FormControl<number>;
  loanPeriod: FormControl<number>;
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
