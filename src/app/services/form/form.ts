import { inject, Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  InsuranceCalcMethod,
  InsuranceFrequency,
  InstallmentType,
  LifeInsuranceCalcMethod,
  PrepaymentEffect,
  PrepaymentFrequency,
  RatePeriod,
  RateType,
  Tranche,
  PrepaymentRule,
} from '../../model/mortgage.model';
import {
  AdditionalCostFormGroup,
  BasicDataFormGroup,
  EarlyRepaymentCommissionFormGroup,
  MortgageFormGroup,
  OverheadCostsFormGroup,
  PrepaymentsFieldsFormGroup,
  PrepaymentRuleFormGroup,
  RatePeriodFormGroup,
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
  const basicData = group.controls.basicData;
  const pv = basicData.get('propertyValue')?.value ?? 0;
  const la = basicData.get('loanAmount')?.value ?? 0;
  const loanPeriod = basicData.get('loanPeriod')?.value ?? 0;
  const start = basicData.get('startDate')?.value as string;
  const capStart = basicData.get('capitalStartDate')?.value as string;

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

  if (tranchesIncluded && transzeArray && transzeArray.length >= 1 && la > 0) {
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
  if (Math.trunc(loanPeriod) <= 0) errors['totalMonthsInvalid'] = true;
  if (start && capStart) {
    if (capStart < start) errors['capitalBeforeStart'] = true;
  }

  if (prepaymentsIncluded) {
    for (const rule of prepaymentRules) {
      if (
        rule.frequency !== PrepaymentFrequency.ONE_TIME &&
        rule.from &&
        rule.to &&
        rule.to < rule.from
      ) {
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

  constructor() {
    this.form.controls.basicData.controls.startDate.valueChanges.subscribe((newDate) => {
      this.transzeArray.at(0)?.controls.date.setValue(newDate, { emitEvent: false });
    });
  }

  get ratePeriodsArray(): FormArray<FormGroup<RatePeriodFormGroup>> {
    return this.form.controls.basicData.controls.ratePeriods;
  }

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

  get isPrepaymentIncluded() {
    return this.form.controls.prepayments.controls.included.value;
  }

  get isOverheadCostsIncluded() {
    return this.form.controls.overheadCosts.controls.included.value;
  }

  get isTrancheIncluded() {
    return this.form.controls.tranches.controls.included.value;
  }

  get tranchesSection(): FormGroup<ToggleableSectionFormGroup<TranchesFieldsFormGroup>> {
    return this.form.controls.tranches;
  }

  get overheadCostsSection(): FormGroup<ToggleableSectionFormGroup<OverheadCostsFormGroup>> {
    return this.form.controls.overheadCosts;
  }

  createRatePeriodGroup(initial?: Partial<RatePeriod>): FormGroup<RatePeriodFormGroup> {
    const from = initial?.from ?? (this.form?.controls.basicData?.get('startDate')?.value || ym());
    return new FormGroup<RatePeriodFormGroup>({
      from: new FormControl(from, { nonNullable: true, validators: [Validators.required] }),
      rateType: new FormControl<RateType>(initial?.rateType ?? RateType.VARIABLE, {
        nonNullable: true,
      }),
      nominalRate: new FormControl(initial?.nominalRate ?? 9.0, {
        nonNullable: true,
        validators: [Validators.min(0), Validators.max(50)],
      }),
      wibor: new FormControl(initial?.wibor ?? 7.0, {
        nonNullable: true,
        validators: [Validators.min(0), Validators.max(50)],
      }),
      margin: new FormControl(initial?.margin ?? 2.0, {
        nonNullable: true,
        validators: [Validators.min(0), Validators.max(50)],
      }),
    });
  }

  private createBasicDataGroup(): FormGroup<BasicDataFormGroup> {
    const today = ym();
    return new FormGroup<BasicDataFormGroup>({
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
      loanPeriod: new FormControl(20 * 12, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      startDate: new FormControl(today, { nonNullable: true, validators: [Validators.required] }),
      capitalStartDate: new FormControl(nextMonthStr(), {
        nonNullable: true,
        validators: [Validators.required],
      }),
      installmentType: new FormControl<InstallmentType>(InstallmentType.EQUAL, {
        nonNullable: true,
      }),
      ratePeriods: new FormArray([this.createRatePeriodGroup({ from: today })]) as FormArray<
        FormGroup<RatePeriodFormGroup>
      >,
    });
  }

  private createForm(): FormGroup<MortgageFormGroup> {
    const form = new FormGroup<MortgageFormGroup>(
      {
        basicData: this.createBasicDataGroup(),
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
              effect: new FormControl<PrepaymentEffect>(PrepaymentEffect.LOWER_INSTALLMENT, {
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
      propInsFrequency: new FormControl<InsuranceFrequency>(InsuranceFrequency.YEARLY, {
        nonNullable: true,
      }),
      propInsCalcMethod: new FormControl<InsuranceCalcMethod>(
        InsuranceCalcMethod.PCT_PROPERTY_VALUE,
        {
          nonNullable: true,
        },
      ),
      propInsValue: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      propInsFrom: new FormControl(nextMonthStr(), { nonNullable: true }),
      propInsTo: new FormControl(endOfLoanDate(), { nonNullable: true }),
      lowEquityRateIncrease: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.min(0)],
      }),
      lifeInsFrequency: new FormControl<InsuranceFrequency>(InsuranceFrequency.YEARLY, {
        nonNullable: true,
      }),
      lifeInsCalcMethod: new FormControl<LifeInsuranceCalcMethod>(
        LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT,
        {
          nonNullable: true,
        },
      ),
      lifeInsValue: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      lifeInsFrom: new FormControl(nextMonthStr(), { nonNullable: true }),
      lifeInsTo: new FormControl(endOfLoanDate(), { nonNullable: true }),
      jobLossInsFrequency: new FormControl<InsuranceFrequency>(InsuranceFrequency.ONE_TIME, {
        nonNullable: true,
      }),
      jobLossInsCalcMethod: new FormControl<LifeInsuranceCalcMethod>(
        LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT,
        {
          nonNullable: true,
        },
      ),
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
    const startDate = this.form?.controls.basicData?.get('startDate')?.value || ym();
    const amount =
      initial.amount ??
      (isFirst ? this.form?.controls.basicData?.get('loanAmount')?.value || 0 : 0);
    const date = isFirst ? startDate : (initial.date ?? startDate);
    return new FormGroup<TrancheFormGroup>({
      amount: new FormControl(amount, {
        nonNullable: true,
        validators: isFirst ? [] : [Validators.required, Validators.min(0.01)],
      }),
      date: new FormControl(
        { value: date, disabled: isFirst },
        { nonNullable: true, validators: [Validators.required] },
      ),
      disbursementFee: new FormControl(initial.disbursementFee ?? 0, {
        nonNullable: true,
        validators: [Validators.min(0), Validators.max(1000)],
      }),
    });
  }

  createPrepaymentRuleGroup(
    initial: Partial<PrepaymentRule> = {},
  ): FormGroup<PrepaymentRuleFormGroup> {
    const frequency = initial.frequency ?? PrepaymentFrequency.ONE_TIME;
    const from = initial.from ?? nextMonthStr();
    const to =
      frequency === PrepaymentFrequency.ONE_TIME ? from : (initial.to ?? addMonthsStr(from, 12));
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
      effect: new FormControl<PrepaymentEffect>(
        initial.effect ?? PrepaymentEffect.LOWER_INSTALLMENT,
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
    });
  }

  createAdditionalCostGroup(): FormGroup<AdditionalCostFormGroup> {
    return new FormGroup<AdditionalCostFormGroup>({
      name: new FormControl('', { nonNullable: true }),
      frequency: new FormControl<InsuranceFrequency>(InsuranceFrequency.ONE_TIME, {
        nonNullable: true,
      }),
      calcMethod: new FormControl<LifeInsuranceCalcMethod>(LifeInsuranceCalcMethod.FIXED_AMOUNT, {
        nonNullable: true,
      }),
      value: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      from: new FormControl(nextMonthStr(), { nonNullable: true }),
    });
  }

  addRatePeriod(): void {
    const lastPeriod = this.ratePeriodsArray.at(this.ratePeriodsArray.length - 1);
    const lastValues = lastPeriod?.getRawValue();
    const lastFrom =
      lastValues?.from || this.form.controls.basicData.get('startDate')?.value || ym();
    const newFrom = addMonthsStr(lastFrom, 12);
    this.ratePeriodsArray.push(
      this.createRatePeriodGroup({
        from: newFrom,
        rateType: lastValues?.rateType,
        nominalRate: lastValues?.nominalRate,
        wibor: lastValues?.wibor,
        margin: lastValues?.margin,
      }),
    );
    this.form.updateValueAndValidity();
  }

  removeRatePeriod(index: number): void {
    if (index === 0 || this.ratePeriodsArray.length <= 1) return;
    this.ratePeriodsArray.removeAt(index);
    this.form.updateValueAndValidity();
  }

  addTransza(): void {
    const startDate = this.form.controls.basicData.get('startDate')?.value || ym();
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
    const loanAmount = this.form.controls.basicData.get('loanAmount')?.value || 0;
    const startDate = this.form.controls.basicData.get('startDate')?.value || ym();
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

    if (frequency === PrepaymentFrequency.ONE_TIME && from) {
      toControl.setValue(from);
    } else if (frequency !== PrepaymentFrequency.ONE_TIME && !toControl.value && from) {
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
    if (frequency === PrepaymentFrequency.ONE_TIME && from && toControl.value !== from) {
      toControl.setValue(from);
    }
    this.form.updateValueAndValidity();
  }

  setDefaults(): void {
    this.form.patchValue({
      basicData: {
        propertyValue: 500_000,
        loanAmount: 400_000,
        ltv: 80,
        loanPeriod: 20 * 12,
        startDate: ym(),
        capitalStartDate: nextMonthStr(),
        installmentType: InstallmentType.EQUAL,
      },
      prepayments: {
        fields: {
          rataDocelowaRegula: {
            targetRate: 0,
            from: nextMonthStr(),
            to: addMonthsStr(nextMonthStr(), 12),
            effect: PrepaymentEffect.LOWER_INSTALLMENT,
          },
          prowizjaWczesniejszaSplata: {
            ratePct: 0,
            validUntil: addMonthsStr(nextMonthStr(), 36),
          },
        },
      },
    });
    this.form.controls.basicData.setControl(
      'ratePeriods',
      new FormArray([
        this.createRatePeriodGroup({
          from: ym(),
          rateType: RateType.VARIABLE,
          wibor: 7.0,
          margin: 2.0,
          nominalRate: 9.0,
        }),
      ]) as FormArray<FormGroup<RatePeriodFormGroup>>,
    );
    this.form.controls.prepayments.controls.fields.setControl(
      'prepaymentRules',
      new FormArray([this.createPrepaymentRuleGroup()]),
    );
    this.form.controls.tranches.controls.fields.setControl(
      'transze',
      new FormArray([this.createTrancheGroup(true)]),
    );
  }

  setOverheadDefaults(): void {
    this.overheadCostsGroup.patchValue({
      commissionPct: 0,
      appraisalFee: 400,
      bridgeRateIncrease: 1.2,
      bridgeMonths: 6,
      propInsFrequency: InsuranceFrequency.YEARLY,
      propInsCalcMethod: InsuranceCalcMethod.PCT_PROPERTY_VALUE,
      propInsValue: 0.0008,
      propInsFrom: nextMonthStr(),
      propInsTo: endOfLoanDate(),
      lowEquityRateIncrease: 0,
      lifeInsFrequency: InsuranceFrequency.YEARLY,
      lifeInsCalcMethod: LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT,
      lifeInsValue: 0,
      lifeInsFrom: nextMonthStr(),
      lifeInsTo: endOfLoanDate(),
      jobLossInsFrequency: InsuranceFrequency.ONE_TIME,
      jobLossInsCalcMethod: LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT,
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

  loadFromFile(savedData: any): void {
    const data = savedData?.data ?? savedData;

    const ratePeriods: any[] = data?.basicData?.ratePeriods ?? [];
    this.form.controls.basicData.setControl(
      'ratePeriods',
      new FormArray(
        ratePeriods.length > 0
          ? ratePeriods.map((rp: any) => this.createRatePeriodGroup(rp))
          : [this.createRatePeriodGroup()],
      ) as FormArray<FormGroup<RatePeriodFormGroup>>,
    );

    const transze: any[] = data?.tranches?.fields?.transze ?? [];
    this.form.controls.tranches.controls.fields.setControl(
      'transze',
      new FormArray(
        transze.length > 0
          ? transze.map((t: any, i: number) => this.createTrancheGroup(i === 0, t))
          : [this.createTrancheGroup(true)],
      ),
    );

    const prepaymentRules: any[] = data?.prepayments?.fields?.prepaymentRules ?? [];
    this.form.controls.prepayments.controls.fields.setControl(
      'prepaymentRules',
      new FormArray(
        prepaymentRules.length > 0
          ? prepaymentRules.map((r: any) => this.createPrepaymentRuleGroup(r))
          : [this.createPrepaymentRuleGroup()],
      ),
    );

    const additionalCosts: any[] = data?.overheadCosts?.fields?.additionalCosts ?? [];
    this.overheadCostsGroup.setControl(
      'additionalCosts',
      new FormArray(
        additionalCosts.length > 0
          ? additionalCosts.map((ac: any) => {
              const g = this.createAdditionalCostGroup();
              g.patchValue(ac);
              return g;
            })
          : [this.createAdditionalCostGroup()],
      ),
    );

    this.form.patchValue(data);
    this.form.updateValueAndValidity();
  }
}
