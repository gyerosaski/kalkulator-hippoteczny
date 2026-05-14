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
  expanded: FormControl<boolean>;
  targetRate: FormControl<number>;
  from: FormControl<string>;
  to: FormControl<string>;
  effect: FormControl<PrepaymentEffect>;
}

export interface EarlyRepaymentCommissionFormGroup {
  expanded: FormControl<boolean>;
  ratePct: FormControl<number>;
  validUntil: FormControl<string>;
}

export interface PrepaymentRulesSectionFormGroup {
  expanded: FormControl<boolean>;
  items: FormArray<FormGroup<PrepaymentRuleFormGroup>>;
}

export interface AdditionalCostFormGroup {
  name: FormControl<string>;
  frequency: FormControl<InsuranceFrequency>;
  calcMethod: FormControl<LifeInsuranceCalcMethod>;
  value: FormControl<number>;
  from: FormControl<string>;
}

export interface CommissionFormGroup {
  expanded: FormControl<boolean>;
  commissionPct: FormControl<number>;
}

export interface AppraisalFormGroup {
  expanded: FormControl<boolean>;
  appraisalFee: FormControl<number>;
}

export interface BridgeInsuranceFormGroup {
  expanded: FormControl<boolean>;
  bridgeRateIncrease: FormControl<number>;
  bridgeMonths: FormControl<number>;
}

export interface PropertyInsuranceFormGroup {
  expanded: FormControl<boolean>;
  propInsFrequency: FormControl<InsuranceFrequency>;
  propInsCalcMethod: FormControl<InsuranceCalcMethod>;
  propInsValue: FormControl<number>;
  propInsFrom: FormControl<string>;
  propInsTo: FormControl<string>;
}

export interface LowEquityInsuranceFormGroup {
  expanded: FormControl<boolean>;
  lowEquityRateIncrease: FormControl<number>;
}

export interface LifeInsuranceFormGroup {
  expanded: FormControl<boolean>;
  lifeInsFrequency: FormControl<InsuranceFrequency>;
  lifeInsCalcMethod: FormControl<LifeInsuranceCalcMethod>;
  lifeInsValue: FormControl<number>;
  lifeInsFrom: FormControl<string>;
  lifeInsTo: FormControl<string>;
}

export interface JobLossInsuranceFormGroup {
  expanded: FormControl<boolean>;
  jobLossInsFrequency: FormControl<InsuranceFrequency>;
  jobLossInsCalcMethod: FormControl<LifeInsuranceCalcMethod>;
  jobLossInsValue: FormControl<number>;
  jobLossInsFrom: FormControl<string>;
}

export interface AdditionalCostsSectionFormGroup {
  expanded: FormControl<boolean>;
  items: FormArray<FormGroup<AdditionalCostFormGroup>>;
}

export interface PromoRateFormGroup {
  expanded: FormControl<boolean>;
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
  transze: FormArray<FormGroup<TrancheFormGroup>>;
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
