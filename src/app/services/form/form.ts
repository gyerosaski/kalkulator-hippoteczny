import { inject, Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  InsuranceCalcMethod,
  InsuranceFrequency,
  LifeInsuranceCalcMethod,
  PrepaymentEffect,
  PrepaymentFrequency,
  Tranche,
  PrepaymentRule,
} from '../../model/mortgage.model';
import {
  AdditionalCostFormGroup,
  EarlyRepaymentCommissionFormGroup,
  MortgageFormGroup,
  OverheadCostsFormGroup,
  PrepaymentsFieldsFormGroup,
  PrepaymentRuleFormGroup,
  TargetInstallmentFormGroup,
  ToggleableSectionFormGroup,
  TrancheFormGroup,
  TranchesFieldsFormGroup,
} from '../../model/form.model';

function ym(date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

function nextMonthStr(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return ym(d);
}

function addMonthsStr(baseYm: string, monthsToAdd: number): string {
  const [y, m] = baseYm.split('-').map((v) => parseInt(v, 10));
  const d = new Date(y, m - 1 + monthsToAdd, 1);
  return ym(d);
}

function endOfLoanDate(): string {
  return addMonthsStr(nextMonthStr(), 20 * 12 - 1);
}

function crossFieldValidator(control: import('@angular/forms').AbstractControl) {
  const group = control as FormGroup<MortgageFormGroup>;
  const pv = group.get('propertyValue')?.value ?? 0;
  const la = group.get('loanAmount')?.value ?? 0;
  const yrs = group.get('years')?.value ?? 0;
  const mos = group.get('months')?.value ?? 0;
  const start = group.get('startDate')?.value as string;
  const capStart = group.get('capitalStartDate')?.value as string;

  const tranchesSection = group.controls.tranches;
  const tranchesIncluded = tranchesSection.controls.included.value;
  const transzeArray = tranchesSection.controls.fields.controls.transze;

  const prepaymentsSection = group.controls.prepayments;
  const prepaymentsIncluded = prepaymentsSection.controls.included.value;
  const prepaymentRules = prepaymentsIncluded
    ? (prepaymentsSection.controls.fields.controls.prepaymentRules.value ?? [])
    : [];
  const rataDocelowaRegula = prepaymentsIncluded
    ? ((
        prepaymentsSection.controls.fields.controls.rataDocelowaRegula as FormGroup
      )?.getRawValue() ?? ({} as any))
    : ({} as any);

  const errors: Record<string, unknown> = {};
  if (pv && la && la > pv) errors['loanGtProperty'] = true;

  if (tranchesIncluded && transzeArray && transzeArray.length > 1 && la > 0) {
    let transzeSum = 0;
    for (let i = 0; i < transzeArray.length; i++) {
      transzeSum += Number(transzeArray.at(i).get('amount')?.value) || 0;
    }
    transzeSum = Math.round(transzeSum * 100) / 100;
    if (Math.abs(transzeSum - la) > 0.01) {
      errors['transzeSumMismatch'] = {
        expected: la,
        actual: transzeSum,
        diff: Math.round((transzeSum - la) * 100) / 100,
      };
    }
  }
  const n = Math.trunc(yrs) * 12 + Math.trunc(mos);
  if (n <= 0) errors['totalMonthsInvalid'] = true;
  if (start && capStart) {
    if (capStart < start) errors['capitalBeforeStart'] = true;
  }

  if (prepaymentsIncluded) {
    for (const rule of prepaymentRules) {
      if (rule.frequency !== 'jednorazowo' && rule.from && rule.to && rule.to < rule.from) {
        errors['prepaymentDateRangeInvalid'] = true;
      }
      if ((Number(rule.amount) || 0) < 0) {
        errors['prepaymentAmountInvalid'] = true;
      }
    }

    if (
      rataDocelowaRegula.from &&
      rataDocelowaRegula.to &&
      rataDocelowaRegula.to < rataDocelowaRegula.from
    ) {
      errors['targetInstallmentDateRangeInvalid'] = true;
    }

    if ((Number(rataDocelowaRegula.targetRate) || 0) < 0) {
      errors['targetInstallmentInvalid'] = true;
    }
  }

  return Object.keys(errors).length ? errors : null;
}

@Injectable({
  providedIn: 'root',
})
export class FormService {
  private fb = inject(FormBuilder);

  readonly form: FormGroup<MortgageFormGroup> = this.createForm();

  get nadplatyRegulyArray(): FormArray<FormGroup<PrepaymentRuleFormGroup>> {
    return this.form.controls.prepayments.controls.fields.controls.prepaymentRules;
  }

  get transzeArray(): FormArray<FormGroup<TrancheFormGroup>> {
    return this.form.controls.tranches.controls.fields.controls.transze;
  }

  get overheadCostsGroup(): FormGroup<OverheadCostsFormGroup> {
    return this.form.controls.overheadCosts.controls.fields;
  }

  get additionalCostsArray(): FormArray<FormGroup<AdditionalCostFormGroup>> {
    return this.overheadCostsGroup.controls.additionalCosts;
  }

  get transzeSuma(): number {
    const transze = this.transzeArray;
    if (!transze) return 0;
    let sum = 0;
    for (let i = 0; i < transze.length; i++) {
      sum += Number(transze.at(i).get('amount')?.value) || 0;
    }
    return Math.round(sum * 100) / 100;
  }

  get prepaymentsSection(): FormGroup<ToggleableSectionFormGroup<PrepaymentsFieldsFormGroup>> {
    return this.form.controls.prepayments;
  }

  get tranchesSection(): FormGroup<ToggleableSectionFormGroup<TranchesFieldsFormGroup>> {
    return this.form.controls.tranches;
  }

  get overheadCostsSection(): FormGroup<ToggleableSectionFormGroup<OverheadCostsFormGroup>> {
    return this.form.controls.overheadCosts;
  }

  private createForm(): FormGroup<MortgageFormGroup> {
    const form = new FormGroup<MortgageFormGroup>(
      {
        propertyValue: new FormControl(500_000, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0.01)],
        }),
        loanAmount: new FormControl(400_000, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0.01)],
        }),
        ltv: new FormControl(80, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0), Validators.max(100)],
        }),
        years: new FormControl(20, { nonNullable: true, validators: [Validators.min(0)] }),
        months: new FormControl(0, {
          nonNullable: true,
          validators: [Validators.min(0), Validators.max(11)],
        }),
        startDate: new FormControl(ym(), { nonNullable: true, validators: [Validators.required] }),
        capitalStartDate: new FormControl(nextMonthStr(), {
          nonNullable: true,
          validators: [Validators.required],
        }),
        installmentType: new FormControl<'rowne' | 'malejace'>('rowne', { nonNullable: true }),
        rateType: new FormControl<'zmienna' | 'stala'>('zmienna', { nonNullable: true }),
        nominalRate: new FormControl(9.0, {
          nonNullable: true,
          validators: [Validators.min(0), Validators.max(50)],
        }),
        wibor: new FormControl(7.0, {
          nonNullable: true,
          validators: [Validators.min(0), Validators.max(50)],
        }),
        margin: new FormControl(2.0, {
          nonNullable: true,
          validators: [Validators.min(0), Validators.max(50)],
        }),
        overheadCosts: new FormGroup<ToggleableSectionFormGroup<OverheadCostsFormGroup>>({
          included: new FormControl(false, { nonNullable: true }),
          fields: this.createOverheadCostsGroup(),
        }),
        tranches: new FormGroup<ToggleableSectionFormGroup<TranchesFieldsFormGroup>>({
          included: new FormControl(false, { nonNullable: true }),
          fields: new FormGroup<TranchesFieldsFormGroup>({
            transze: new FormArray([this.createTrancheGroup(true)]),
          }),
        }),
        prepayments: new FormGroup<ToggleableSectionFormGroup<PrepaymentsFieldsFormGroup>>({
          included: new FormControl(false, { nonNullable: true }),
          fields: new FormGroup<PrepaymentsFieldsFormGroup>({
            prepaymentRules: new FormArray([this.createPrepaymentRuleGroup()]),
            rataDocelowaRegula: new FormGroup<TargetInstallmentFormGroup>({
              targetRate: new FormControl(0, {
                nonNullable: true,
                validators: [Validators.min(0)],
              }),
              from: new FormControl(nextMonthStr(), {
                nonNullable: true,
                validators: [Validators.required],
              }),
              to: new FormControl(addMonthsStr(nextMonthStr(), 12), {
                nonNullable: true,
                validators: [Validators.required],
              }),
              effect: new FormControl<PrepaymentEffect>('niższa rata', {
                nonNullable: true,
                validators: [Validators.required],
              }),
            }),
            prowizjaWczesniejszaSplata: new FormGroup<EarlyRepaymentCommissionFormGroup>({
              ratePct: new FormControl(0, {
                nonNullable: true,
                validators: [Validators.min(0), Validators.max(100)],
              }),
              validUntil: new FormControl(addMonthsStr(nextMonthStr(), 36), {
                nonNullable: true,
                validators: [Validators.required],
              }),
            }),
          }),
        }),
      },
      { validators: [crossFieldValidator] },
    );
    return form;
  }

  private createOverheadCostsGroup(): FormGroup<OverheadCostsFormGroup> {
    return new FormGroup<OverheadCostsFormGroup>({
      commissionPct: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.min(0), Validators.max(100)],
      }),
      appraisalFee: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      bridgeRateIncrease: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.min(0)],
      }),
      bridgeMonths: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      propInsFrequency: new FormControl<'co rok' | 'co miesiąc'>('co rok', { nonNullable: true }),
      propInsCalcMethod: new FormControl<InsuranceCalcMethod>('% wartości nieruchomości', {
        nonNullable: true,
      }),
      propInsValue: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      propInsFrom: new FormControl(nextMonthStr(), { nonNullable: true }),
      propInsTo: new FormControl(endOfLoanDate(), { nonNullable: true }),
      lowEquityRateIncrease: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.min(0)],
      }),
      lifeInsFrequency: new FormControl<InsuranceFrequency>('co rok', { nonNullable: true }),
      lifeInsCalcMethod: new FormControl<LifeInsuranceCalcMethod>('% kwoty kredytu', {
        nonNullable: true,
      }),
      lifeInsValue: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      lifeInsFrom: new FormControl(nextMonthStr(), { nonNullable: true }),
      lifeInsTo: new FormControl(endOfLoanDate(), { nonNullable: true }),
      jobLossInsFrequency: new FormControl<InsuranceFrequency>('jednorazowo', {
        nonNullable: true,
      }),
      jobLossInsCalcMethod: new FormControl<LifeInsuranceCalcMethod>('% kwoty kredytu', {
        nonNullable: true,
      }),
      jobLossInsValue: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      jobLossInsFrom: new FormControl(nextMonthStr(), { nonNullable: true }),
      additionalCosts: new FormArray([this.createAdditionalCostGroup()]),
      promoRateDecrease: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      promoFrom: new FormControl(nextMonthStr(), { nonNullable: true }),
      promoTo: new FormControl(addMonthsStr(nextMonthStr(), 12), { nonNullable: true }),
    });
  }

  createTrancheGroup(
    isFirst: boolean,
    initial: Partial<Tranche> = {},
  ): FormGroup<TrancheFormGroup> {
    const startDate = this.form?.get('startDate')?.value || ym();
    const amount = initial.amount ?? (isFirst ? this.form?.get('loanAmount')?.value || 0 : 0);
    const date = initial.date ?? startDate;
    return new FormGroup<TrancheFormGroup>({
      amount: new FormControl(amount, {
        nonNullable: true,
        validators: isFirst ? [] : [Validators.required, Validators.min(0.01)],
      }),
      date: new FormControl(date, { nonNullable: true, validators: [Validators.required] }),
      disbursementFee: new FormControl(initial.disbursementFee ?? 0, {
        nonNullable: true,
        validators: [Validators.min(0), Validators.max(1000)],
      }),
    });
  }

  createPrepaymentRuleGroup(
    initial: Partial<PrepaymentRule> = {},
  ): FormGroup<PrepaymentRuleFormGroup> {
    const frequency = initial.frequency ?? 'jednorazowo';
    const from = initial.from ?? nextMonthStr();
    const to = frequency === 'jednorazowo' ? from : (initial.to ?? addMonthsStr(from, 12));
    return new FormGroup<PrepaymentRuleFormGroup>({
      frequency: new FormControl<PrepaymentFrequency>(frequency, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      from: new FormControl(from, { nonNullable: true, validators: [Validators.required] }),
      to: new FormControl(to, { nonNullable: true, validators: [Validators.required] }),
      amount: new FormControl(initial.amount ?? 0, {
        nonNullable: true,
        validators: [Validators.min(0)],
      }),
      effect: new FormControl<PrepaymentEffect>(initial.effect ?? 'niższa rata', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  createAdditionalCostGroup(): FormGroup<AdditionalCostFormGroup> {
    return new FormGroup<AdditionalCostFormGroup>({
      name: new FormControl('', { nonNullable: true }),
      frequency: new FormControl<InsuranceFrequency>('jednorazowo', { nonNullable: true }),
      calcMethod: new FormControl<LifeInsuranceCalcMethod>('znam kwotę', { nonNullable: true }),
      value: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      from: new FormControl(nextMonthStr(), { nonNullable: true }),
    });
  }

  addTransza(): void {
    const startDate = this.form.get('startDate')?.value || ym();
    const nextDate = addMonthsStr(startDate, this.transzeArray.length);
    this.transzeArray.push(this.createTrancheGroup(false, { date: nextDate }));
    this.form.updateValueAndValidity();
  }

  removeTransza(index: number): void {
    if (index === 0 || this.transzeArray.length <= 1) return;
    this.transzeArray.removeAt(index);
    this.form.updateValueAndValidity();
  }

  clearTransze(): void {
    const loanAmount = this.form.get('loanAmount')?.value || 0;
    const startDate = this.form.get('startDate')?.value || ym();
    this.form.controls.tranches.controls.fields.setControl(
      'transze',
      new FormArray([this.createTrancheGroup(true, { amount: loanAmount, date: startDate })]),
    );
    this.form.updateValueAndValidity();
  }

  addNadplataRegula(): void {
    this.nadplatyRegulyArray.push(this.createPrepaymentRuleGroup());
    this.form.updateValueAndValidity();
  }

  removeNadplataRegula(index: number): void {
    if (this.nadplatyRegulyArray.length <= 1) return;
    this.nadplatyRegulyArray.removeAt(index);
    this.form.updateValueAndValidity();
  }

  addAdditionalCost(): void {
    this.additionalCostsArray.push(this.createAdditionalCostGroup());
    this.form.updateValueAndValidity();
  }

  removeAdditionalCost(index: number): void {
    if (this.additionalCostsArray.length <= 1) return;
    this.additionalCostsArray.removeAt(index);
    this.form.updateValueAndValidity();
  }

  onNadplataFrequencyChanged(index: number): void {
    const ruleGroup = this.nadplatyRegulyArray.at(index);
    if (!ruleGroup) return;

    const frequency = ruleGroup.controls.frequency.value;
    const from = ruleGroup.controls.from.value;
    const toControl = ruleGroup.controls.to;

    if (frequency === 'jednorazowo' && from) {
      toControl.setValue(from);
    } else if (frequency !== 'jednorazowo' && !toControl.value && from) {
      toControl.setValue(addMonthsStr(from, 12));
    }

    this.form.updateValueAndValidity();
  }

  onNadplataFromChanged(index: number): void {
    const ruleGroup = this.nadplatyRegulyArray.at(index);
    if (!ruleGroup) return;

    const frequency = ruleGroup.controls.frequency.value;
    const from = ruleGroup.controls.from.value;
    const toControl = ruleGroup.controls.to;
    if (frequency === 'jednorazowo' && from && toControl.value !== from) {
      toControl.setValue(from);
    }
    this.form.updateValueAndValidity();
  }

  setDefaults(): void {
    this.form.patchValue({
      propertyValue: 500_000,
      loanAmount: 400_000,
      ltv: 80,
      years: 20,
      months: 0,
      startDate: ym(),
      capitalStartDate: nextMonthStr(),
      installmentType: 'rowne',
      rateType: 'zmienna',
      wibor: 7.0,
      margin: 2.0,
      nominalRate: 9.0,
      prepayments: {
        fields: {
          rataDocelowaRegula: {
            targetRate: 0,
            from: nextMonthStr(),
            to: addMonthsStr(nextMonthStr(), 12),
            effect: 'niższa rata',
          },
          prowizjaWczesniejszaSplata: {
            ratePct: 0,
            validUntil: addMonthsStr(nextMonthStr(), 36),
          },
        },
      },
    });
    this.form.controls.prepayments.controls.fields.setControl(
      'prepaymentRules',
      new FormArray([this.createPrepaymentRuleGroup()]),
    );
    this.form.controls.tranches.controls.fields.setControl(
      'transze',
      new FormArray([this.createTrancheGroup(true)]),
    );
  }

  clearAll(): void {
    this.form.patchValue({
      propertyValue: 0 as any,
      loanAmount: 0 as any,
      ltv: 0 as any,
      years: 0,
      months: 0,
      startDate: ym(),
      capitalStartDate: nextMonthStr(),
      installmentType: 'rowne',
      rateType: 'zmienna',
      nominalRate: 0,
      wibor: 0,
      margin: 0,
      prepayments: {
        fields: {
          rataDocelowaRegula: {
            targetRate: 0,
            from: nextMonthStr(),
            to: nextMonthStr(),
            effect: 'niższa rata',
          },
          prowizjaWczesniejszaSplata: {
            ratePct: 0,
            validUntil: nextMonthStr(),
          },
        },
      },
    });
    this.form.controls.prepayments.controls.fields.setControl(
      'prepaymentRules',
      new FormArray([this.createPrepaymentRuleGroup({ to: nextMonthStr() })]),
    );
    this.form.controls.tranches.controls.fields.setControl(
      'transze',
      new FormArray([this.createTrancheGroup(true, { amount: 0 })]),
    );
  }

  setOverheadDefaults(): void {
    this.overheadCostsGroup.patchValue({
      commissionPct: 1.5,
      appraisalFee: 400,
      bridgeRateIncrease: 1.2,
      bridgeMonths: 6,
      propInsFrequency: 'co rok',
      propInsCalcMethod: '% wartości nieruchomości',
      propInsValue: 0.0008,
      propInsFrom: nextMonthStr(),
      propInsTo: endOfLoanDate(),
      lowEquityRateIncrease: 0,
      lifeInsFrequency: 'co rok',
      lifeInsCalcMethod: '% kwoty kredytu',
      lifeInsValue: 0,
      lifeInsFrom: nextMonthStr(),
      lifeInsTo: endOfLoanDate(),
      jobLossInsFrequency: 'jednorazowo',
      jobLossInsCalcMethod: '% kwoty kredytu',
      jobLossInsValue: 0,
      jobLossInsFrom: nextMonthStr(),
      promoRateDecrease: 0,
      promoFrom: nextMonthStr(),
      promoTo: addMonthsStr(nextMonthStr(), 12),
    });
    this.overheadCostsGroup.setControl(
      'additionalCosts',
      new FormArray([this.createAdditionalCostGroup()]),
    );
  }

  clearOverheadCosts(): void {
    this.overheadCostsGroup.patchValue({
      commissionPct: 0,
      appraisalFee: 0,
      bridgeRateIncrease: 0,
      bridgeMonths: 0,
      propInsFrequency: 'co rok',
      propInsCalcMethod: '% wartości nieruchomości',
      propInsValue: 0,
      propInsFrom: nextMonthStr(),
      propInsTo: endOfLoanDate(),
      lowEquityRateIncrease: 0,
      lifeInsFrequency: 'co rok',
      lifeInsCalcMethod: '% kwoty kredytu',
      lifeInsValue: 0,
      lifeInsFrom: nextMonthStr(),
      lifeInsTo: endOfLoanDate(),
      jobLossInsFrequency: 'jednorazowo',
      jobLossInsCalcMethod: '% kwoty kredytu',
      jobLossInsValue: 0,
      jobLossInsFrom: nextMonthStr(),
      promoRateDecrease: 0,
      promoFrom: nextMonthStr(),
      promoTo: addMonthsStr(nextMonthStr(), 12),
    });
    this.overheadCostsGroup.setControl(
      'additionalCosts',
      new FormArray([this.createAdditionalCostGroup()]),
    );
  }
}
