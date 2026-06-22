import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import {
  CommissionCalcMethod,
  InstallmentType,
  InsuranceCalcMethod,
  InsuranceFrequency,
  LifeInsuranceCalcMethod,
  LoanPeriodUnit,
  PrepaymentEffect,
  PrepaymentFrequency,
  PrepaymentRule,
  RatePeriod,
  RateType,
  Tranche,
} from '../../model';
import {
  AdditionalCostFormGroup,
  BasicDataFormGroup,
  MortgageFormGroup,
  OverheadCostsFormGroup,
  PrepaymentRuleFormGroup,
  PrepaymentsFieldsFormGroup,
  RatePeriodFormGroup,
  ToggleableSectionFormGroup,
  TrancheFormGroup,
  TranchesFieldsFormGroup,
} from '../../model';
import { addMonthsStr, nextMonthStr, ym } from '../../helpers/date.helper';
import { MonthPickerReferenceDates } from '../../helpers/month-picker-shortcuts.helper';
import { normalizeCalculationData } from '../../helpers/saved-calculation-data.helper';
import { UiStateService } from '../ui-state/ui-state.service';

function endOfLoanDate(): string {
  return addMonthsStr(nextMonthStr(), 20 * 12 - 1);
}

function crossFieldValidator(control: AbstractControl) {
  const group = control as FormGroup<MortgageFormGroup>;
  const basicData = group.controls.basicData;
  const pv = basicData.get('propertyValue')?.value ?? 0;
  const la = basicData.get('loanAmount')?.value ?? 0;
  const loanPeriod = basicData.get('loanPeriod')?.value ?? 0;
  const start = basicData.get('startDate')?.value as string;
  const capStart = basicData.get('capitalStartDate')?.value as string;

  const tranchesSection = group.controls.tranches;
  const tranchesEnabled = tranchesSection.controls.enabled.value;
  const tranchesArray = tranchesSection.controls.fields.controls.tranches;

  const prepaymentsSection = group.controls.prepayments;
  const prepaymentsEnabled = prepaymentsSection.controls.enabled.value;
  const prepaymentRules = prepaymentsEnabled
    ? (prepaymentsSection.controls.fields.controls.prepaymentRules.value?.items ?? [])
    : [];
  const rataDocelowaRegula = prepaymentsEnabled
    ? ((
        prepaymentsSection.controls.fields.controls.rataDocelowaRegula as FormGroup
      )?.getRawValue() ?? ({} as any))
    : ({} as any);

  const errors: Record<string, unknown> = {};
  if (pv && la && la > pv) errors['loanGtProperty'] = true;

  if (tranchesEnabled && tranchesArray && tranchesArray.length >= 1 && la > 0) {
    let trancheSum = 0;
    for (let i = 0; i < tranchesArray.length; i++) {
      trancheSum += Number(tranchesArray.at(i).get('amount')?.value) || 0;
    }
    trancheSum = Math.round(trancheSum * 100) / 100;
    if (Math.abs(trancheSum - la) > 0.01) {
      errors['trancheSumMismatch'] = {
        expected: la,
        actual: trancheSum,
        diff: Math.round((trancheSum - la) * 100) / 100,
      };
    }
  }
  if (Math.trunc(loanPeriod) <= 0) errors['totalMonthsInvalid'] = true;
  if (start && capStart) {
    if (capStart < start) errors['capitalBeforeStart'] = true;
  }

  if (tranchesEnabled && tranchesArray && tranchesArray.length > 1 && capStart) {
    let lastTrancheDate = '';
    for (let i = 0; i < tranchesArray.length; i++) {
      const trancheDate = tranchesArray.at(i).getRawValue().date;
      if (trancheDate && trancheDate > lastTrancheDate) lastTrancheDate = trancheDate;
    }
    if (lastTrancheDate && capStart <= lastTrancheDate) {
      errors['capitalBeforeLastTranche'] = { lastTrancheDate };
    }
  }

  if (prepaymentsEnabled) {
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

  const overheadCostsSection = group.controls.overheadCosts;
  const overheadEnabled = overheadCostsSection.controls.enabled.value;
  if (overheadEnabled) {
    const commissionGroup = overheadCostsSection.controls.fields.controls.commission;
    const calcMethod = commissionGroup.controls.commissionCalcMethod.value;
    const commissionValue = commissionGroup.controls.commissionValue.value;
    if (calcMethod === CommissionCalcMethod.PERCENTAGE && commissionValue > 100) {
      errors['commissionPctOverMax'] = true;
    }
  }

  return Object.keys(errors).length ? errors : null;
}

@Injectable({
  providedIn: 'root',
})
export class FormService {
  private fb = inject(NonNullableFormBuilder);
  private readonly uiStateService = inject(UiStateService);

  readonly form: FormGroup<MortgageFormGroup> = this.createForm();
  /** Bieżąca, w pełni rozpakowana wartość formularza jako sygnał — dla konsumentów reaktywnych. */
  readonly formValue = toSignal(
    this.form.valueChanges.pipe(
      startWith(null),
      map(() => this.form.getRawValue()),
    ),
    { requireSync: true },
  );

  readonly loadedCalculationName = signal<string | null>(null);
  private readonly loadedCalculationSnapshot = signal<string | null>(null);
  readonly isLoadedCalculationModified: Signal<boolean>;

  constructor() {
    this.form.controls.basicData.controls.startDate.valueChanges.subscribe((newDate) => {
      this.tranchesArray.at(0)?.controls.date.setValue(newDate, { emitEvent: false });
    });

    const currentFormSnapshot = toSignal(
      this.form.valueChanges.pipe(
        startWith(null),
        map(() => JSON.stringify(this.form.getRawValue())),
      ),
      { requireSync: true },
    );

    this.isLoadedCalculationModified = computed(() => {
      const snapshot = this.loadedCalculationSnapshot();
      return snapshot !== null && currentFormSnapshot() !== snapshot;
    });
  }

  get ratePeriodsArray(): FormArray<FormGroup<RatePeriodFormGroup>> {
    return this.form.controls.ratePeriods.controls.items;
  }

  get prepaymentRulesArray(): FormArray<FormGroup<PrepaymentRuleFormGroup>> {
    return this.form.controls.prepayments.controls.fields.controls.prepaymentRules.controls.items;
  }

  get prepaymentsGroup(): FormGroup<PrepaymentsFieldsFormGroup> {
    return this.form.controls.prepayments.controls.fields;
  }

  get tranchesArray(): FormArray<FormGroup<TrancheFormGroup>> {
    return this.form.controls.tranches.controls.fields.controls.tranches;
  }

  get overheadCostsGroup(): FormGroup<OverheadCostsFormGroup> {
    return this.form.controls.overheadCosts.controls.fields;
  }

  get additionalCostsArray(): FormArray<FormGroup<AdditionalCostFormGroup>> {
    return this.overheadCostsGroup.controls.additionalCosts.controls.items;
  }

  /**
   * Aktualne wartości kluczowych dat kredytu używane jako skróty w oknie wyboru miesiąca.
   * Czyta z sygnału `formValue`, więc wywołana wewnątrz `computed` jest reaktywna na zmiany formularza.
   */
  get monthPickerReferenceDates(): MonthPickerReferenceDates {
    const basicData = this.formValue().basicData;
    const loanStart = basicData.startDate;
    const loanPeriod = basicData.loanPeriod;
    return {
      currentMonth: ym(),
      loanStart,
      capitalStart: basicData.capitalStartDate,
      loanEnd: loanStart && loanPeriod > 0 ? addMonthsStr(loanStart, loanPeriod) : '',
    };
  }

  get trancheSum(): number {
    return (
      Math.round(
        this.tranchesArray.controls.reduce(
          (sum, control) => sum + (Number(control.get('amount')?.value) || 0),
          0,
        ) * 100,
      ) / 100
    );
  }

  get prepaymentsSection(): FormGroup<ToggleableSectionFormGroup<PrepaymentsFieldsFormGroup>> {
    return this.form.controls.prepayments;
  }

  get isPrepaymentEnabled() {
    return this.form.controls.prepayments.controls.enabled.value;
  }

  get isOverheadCostsEnabled() {
    return this.form.controls.overheadCosts.controls.enabled.value;
  }

  get isTranchesEnabled() {
    return this.form.controls.tranches.controls.enabled.value;
  }

  get tranchesSection(): FormGroup<ToggleableSectionFormGroup<TranchesFieldsFormGroup>> {
    return this.form.controls.tranches;
  }

  get overheadCostsSection(): FormGroup<ToggleableSectionFormGroup<OverheadCostsFormGroup>> {
    return this.form.controls.overheadCosts;
  }

  createRatePeriodGroup(initial?: Partial<RatePeriod>): FormGroup<RatePeriodFormGroup> {
    const from = initial?.from ?? (this.form?.controls.basicData?.get('startDate')?.value || ym());
    return this.fb.group({
      from: this.fb.control(from, [Validators.required]),
      rateType: this.fb.control<RateType>(initial?.rateType ?? RateType.VARIABLE),
      nominalRate: this.fb.control(initial?.nominalRate ?? 9.0, [
        Validators.min(0),
        Validators.max(50),
      ]),
      referenceIndex: this.fb.control(initial?.referenceIndex ?? 7.0, [
        Validators.min(0),
        Validators.max(50),
      ]),
      margin: this.fb.control(initial?.margin ?? 2.0, [Validators.min(0), Validators.max(50)]),
    });
  }

  private createBasicDataGroup(): FormGroup<BasicDataFormGroup> {
    const today = ym();
    return this.fb.group({
      propertyValue: this.fb.control(500_000, [Validators.required, Validators.min(0.01)]),
      loanAmount: this.fb.control(400_000, [Validators.required, Validators.min(0.01)]),
      ltv: this.fb.control(80, [Validators.required, Validators.min(0), Validators.max(100)]),
      loanPeriod: this.fb.control(20 * 12, [Validators.required, Validators.min(1)]),
      loanPeriodUnit: this.fb.control<LoanPeriodUnit>(LoanPeriodUnit.YEARS),
      startDate: this.fb.control(today, [Validators.required]),
      capitalStartDate: this.fb.control(nextMonthStr(), [Validators.required]),
      installmentType: this.fb.control<InstallmentType>(InstallmentType.EQUAL),
    });
  }

  private createForm(): FormGroup<MortgageFormGroup> {
    return this.fb.group(
      {
        basicData: this.createBasicDataGroup(),
        ratePeriods: this.fb.group({
          items: this.fb.array([this.createRatePeriodGroup({ from: ym() })]),
        }),
        overheadCosts: this.fb.group({
          enabled: this.fb.control(false),
          fields: this.createOverheadCostsGroup(),
        }),
        tranches: this.fb.group({
          enabled: this.fb.control(false),
          fields: this.fb.group({
            tranches: this.fb.array([this.createTrancheGroup(true)]),
          }),
        }),
        prepayments: this.fb.group({
          enabled: this.fb.control(false),
          fields: this.fb.group({
            prepaymentRules: this.fb.group({
              items: this.fb.array([this.createPrepaymentRuleGroup()]),
            }),
            rataDocelowaRegula: this.fb.group({
              targetRate: this.fb.control(0, [Validators.min(0)]),
              from: this.fb.control(nextMonthStr(), [Validators.required]),
              to: this.fb.control(addMonthsStr(nextMonthStr(), 12), [Validators.required]),
              effect: this.fb.control<PrepaymentEffect>(PrepaymentEffect.LOWER_INSTALLMENT, [
                Validators.required,
              ]),
            }),
            prowizjaWczesniejszaSplata: this.fb.group({
              ratePct: this.fb.control(0, [Validators.min(0), Validators.max(100)]),
              validUntil: this.fb.control(addMonthsStr(nextMonthStr(), 36), [Validators.required]),
            }),
          }),
        }),
      },
      { validators: [crossFieldValidator] },
    );
  }

  private createOverheadCostsGroup(): FormGroup<OverheadCostsFormGroup> {
    return this.fb.group({
      commission: this.fb.group({
        commissionValue: this.fb.control(0, [Validators.min(0)]),
        commissionCalcMethod: this.fb.control<CommissionCalcMethod>(
          CommissionCalcMethod.PERCENTAGE,
        ),
      }),
      appraisal: this.fb.group({ appraisalFee: this.fb.control(0, [Validators.min(0)]) }),
      bridge: this.fb.group({
        bridgeRateIncrease: this.fb.control(0, [Validators.min(0)]),
        bridgeMonths: this.fb.control(0, [Validators.min(0)]),
      }),
      propertyInsurance: this.fb.group({
        propInsFrequency: this.fb.control<InsuranceFrequency>(InsuranceFrequency.YEARLY),
        propInsCalcMethod: this.fb.control<InsuranceCalcMethod>(
          InsuranceCalcMethod.PCT_PROPERTY_VALUE,
        ),
        propInsValue: this.fb.control(0, [Validators.min(0)]),
        propInsFrom: this.fb.control(nextMonthStr()),
        propInsTo: this.fb.control(endOfLoanDate()),
      }),
      lowEquityInsurance: this.fb.group({
        lowEquityRateIncrease: this.fb.control(0, [Validators.min(0)]),
      }),
      lifeInsurance: this.fb.group({
        lifeInsFrequency: this.fb.control<InsuranceFrequency>(InsuranceFrequency.YEARLY),
        lifeInsCalcMethod: this.fb.control<LifeInsuranceCalcMethod>(
          LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT,
        ),
        lifeInsValue: this.fb.control(0, [Validators.min(0)]),
        lifeInsFrom: this.fb.control(nextMonthStr()),
        lifeInsTo: this.fb.control(endOfLoanDate()),
      }),
      jobLossInsurance: this.fb.group({
        jobLossInsFrequency: this.fb.control<InsuranceFrequency>(InsuranceFrequency.ONE_TIME),
        jobLossInsCalcMethod: this.fb.control<LifeInsuranceCalcMethod>(
          LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT,
        ),
        jobLossInsValue: this.fb.control(0, [Validators.min(0)]),
        jobLossInsFrom: this.fb.control(nextMonthStr()),
        jobLossInsTo: this.fb.control(endOfLoanDate()),
      }),
      additionalCosts: this.fb.group({ items: this.fb.array([this.createAdditionalCostGroup()]) }),
      promoRate: this.fb.group({
        promoRateDecrease: this.fb.control(0, [Validators.min(0)]),
        promoFrom: this.fb.control(nextMonthStr()),
        promoTo: this.fb.control(addMonthsStr(nextMonthStr(), 12)),
      }),
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
    return this.fb.group({
      amount: this.fb.control(amount, isFirst ? [] : [Validators.required, Validators.min(0.01)]),
      date: this.fb.control({ value: date, disabled: isFirst }, [Validators.required]),
      disbursementFee: this.fb.control(initial.disbursementFee ?? 0, [
        Validators.min(0),
        Validators.max(1000),
      ]),
    });
  }

  createPrepaymentRuleGroup(
    initial: Partial<PrepaymentRule> = {},
  ): FormGroup<PrepaymentRuleFormGroup> {
    const frequency = initial.frequency ?? PrepaymentFrequency.ONE_TIME;
    const from = initial.from ?? nextMonthStr();
    const to =
      frequency === PrepaymentFrequency.ONE_TIME ? from : (initial.to ?? addMonthsStr(from, 12));
    return this.fb.group({
      frequency: this.fb.control<PrepaymentFrequency>(frequency, [Validators.required]),
      from: this.fb.control(from, [Validators.required]),
      to: this.fb.control(to, [Validators.required]),
      amount: this.fb.control(initial.amount ?? 0, [Validators.min(0)]),
      effect: this.fb.control<PrepaymentEffect>(
        initial.effect ?? PrepaymentEffect.LOWER_INSTALLMENT,
        [Validators.required],
      ),
    });
  }

  createAdditionalCostGroup(): FormGroup<AdditionalCostFormGroup> {
    return this.fb.group({
      name: this.fb.control(''),
      frequency: this.fb.control<InsuranceFrequency>(InsuranceFrequency.ONE_TIME),
      calcMethod: this.fb.control<LifeInsuranceCalcMethod>(LifeInsuranceCalcMethod.FIXED_AMOUNT),
      value: this.fb.control(0, [Validators.min(0)]),
      from: this.fb.control(nextMonthStr()),
      to: this.fb.control(endOfLoanDate()),
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
        referenceIndex: lastValues?.referenceIndex,
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

  addTranche(): void {
    const startDate = this.form.controls.basicData.get('startDate')?.value || ym();
    const nextDate = addMonthsStr(startDate, this.tranchesArray.length);
    this.tranchesArray.push(this.createTrancheGroup(false, { date: nextDate }));
    this.form.updateValueAndValidity();
  }

  removeTranche(index: number): void {
    if (index === 0 || this.tranchesArray.length <= 1) return;
    this.tranchesArray.removeAt(index);
    this.form.updateValueAndValidity();
  }

  clearFormArrayExceptFirst(formArray: FormArray): void {
    while (formArray.length > 1) {
      formArray.removeAt(formArray.length - 1);
    }
  }

  addPrepaymentRule(): void {
    this.prepaymentRulesArray.push(this.createPrepaymentRuleGroup());
    this.form.updateValueAndValidity();
  }

  removePrepaymentRule(index: number): void {
    if (this.prepaymentRulesArray.length <= 1) return;
    this.prepaymentRulesArray.removeAt(index);
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

  onPrepaymentFrequencyChanged(index: number): void {
    const ruleGroup = this.prepaymentRulesArray.at(index);
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

  onPrepaymentFromChanged(index: number): void {
    const ruleGroup = this.prepaymentRulesArray.at(index);
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
    this.ratePeriodsArray.clear();
    this.ratePeriodsArray.push(this.createRatePeriodGroup());
    this.tranchesArray.clear();
    this.tranchesArray.push(this.createTrancheGroup(true));
    this.additionalCostsArray.clear();
    this.additionalCostsArray.push(this.createAdditionalCostGroup());
    this.prepaymentRulesArray.clear();
    this.prepaymentRulesArray.push(this.createPrepaymentRuleGroup());
    this.form.reset();
    this.loadedCalculationName.set(null);
    this.loadedCalculationSnapshot.set(null);
    this.uiStateService.resetCalculationViewState();
  }

  loadFromSavedCalculation(data: unknown, name: string): void {
    this.loadFromFile(data);
    this.loadedCalculationName.set(name);
    this.loadedCalculationSnapshot.set(JSON.stringify(this.form.getRawValue()));
    this.uiStateService.resetCalculationViewState();
  }

  refreshLoadedCalculationSnapshot(): void {
    this.loadedCalculationSnapshot.set(JSON.stringify(this.form.getRawValue()));
  }

  loadFromFile(savedData: any): void {
    const data: any = normalizeCalculationData(savedData?.data ?? savedData);
    if (!data) return;

    const ratePeriods: any[] = data?.ratePeriods?.items ?? [];
    this.ratePeriodsArray.clear();
    (ratePeriods.length > 0
      ? ratePeriods.map((rp: any) => this.createRatePeriodGroup(rp))
      : [this.createRatePeriodGroup()]
    ).forEach((group) => this.ratePeriodsArray.push(group));

    const tranches: any[] = data?.tranches?.fields?.tranches ?? [];
    this.tranchesArray.clear();
    (tranches.length > 0
      ? tranches.map((t: any, i: number) => this.createTrancheGroup(i === 0, t))
      : [this.createTrancheGroup(true)]
    ).forEach((group) => this.tranchesArray.push(group));

    const prepaymentRulesSection = data?.prepayments?.fields?.prepaymentRules;
    const prepaymentRules: any[] = Array.isArray(prepaymentRulesSection?.items)
      ? prepaymentRulesSection.items
      : Array.isArray(prepaymentRulesSection)
        ? prepaymentRulesSection
        : [];
    this.prepaymentRulesArray.clear();
    (prepaymentRules.length > 0
      ? prepaymentRules.map((r: any) => this.createPrepaymentRuleGroup(r))
      : [this.createPrepaymentRuleGroup()]
    ).forEach((group) => this.prepaymentRulesArray.push(group));

    const additionalCosts: any[] = data?.overheadCosts?.fields?.additionalCosts?.items ?? [];
    this.additionalCostsArray.clear();
    (additionalCosts.length > 0
      ? additionalCosts.map((ac: any) => {
          const g = this.createAdditionalCostGroup();
          g.patchValue(ac);
          return g;
        })
      : [this.createAdditionalCostGroup()]
    ).forEach((group) => this.additionalCostsArray.push(group));

    this.form.patchValue(data);
    this.form.updateValueAndValidity();
  }
}
