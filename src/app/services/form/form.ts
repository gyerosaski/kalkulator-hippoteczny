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
  OverheadCostKind,
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
  CapitalAfterLoanEndErrorDetails,
  CapitalBeforeLastTrancheErrorDetails,
  ItemPositionsErrorDetails,
  OverheadCostDatesErrorDetails,
  MortgageFormGroup,
  MortgageFormRawValue,
  OverheadCostsFormGroup,
  PrepaymentRuleFormGroup,
  PrepaymentsFieldsFormGroup,
  RatePeriodFormGroup,
  ToggleableSectionFormGroup,
  TrancheFormGroup,
  TrancheSumMismatchErrorDetails,
  TranchesFieldsFormGroup,
} from '../../model';
import { addMonthsStr, nextMonthStr, ym } from '../../helpers/date.helper';
import { MonthPickerReferenceDates } from '../../helpers/month-picker-shortcuts.helper';
import { UiStateService } from '../ui-state/ui-state.service';

function endOfLoanDate(): string {
  return addMonthsStr(nextMonthStr(), 20 * 12 - 1);
}

/**
 * Walidacje dat względem okresu spłaty kredytu — od miesiąca pierwszej raty (miesiąc po
 * uruchomieniu) do miesiąca ostatniej raty (uruchomienie + okres kredytowania). Silnik
 * harmonogramu nalicza zdarzenia wyłącznie w tym przedziale, więc daty spoza niego byłyby
 * po cichu pomijane.
 */
function repaymentPeriodDateErrors(group: FormGroup<MortgageFormGroup>): Record<string, unknown> {
  const errors: Record<string, unknown> = {};
  const basicData = group.controls.basicData.getRawValue();
  const loanPeriod = Math.trunc(basicData.loanPeriod ?? 0);
  if (!basicData.startDate || loanPeriod <= 0) return errors;

  const startDate = basicData.startDate;
  const firstInstallmentDate = addMonthsStr(startDate, 1);
  const loanEndDate = addMonthsStr(startDate, loanPeriod);
  const isWithinRepaymentPeriod = (month: string): boolean =>
    month >= firstInstallmentDate && month <= loanEndDate;

  // karencja musi być krótsza niż okres kredytowania
  if (basicData.capitalStartDate && basicData.capitalStartDate > loanEndDate) {
    errors['capitalAfterLoanEnd'] = { loanEndDate } satisfies CapitalAfterLoanEndErrorDetails;
  }

  // kolejne okresy oprocentowania (pierwszy obowiązuje od daty uruchomienia)
  const ratePeriodDates = group.controls.ratePeriods.controls.items
    .getRawValue()
    .map((ratePeriod) => ratePeriod.from);
  const ratePeriodsOutsideLoan: number[] = [];
  const ratePeriodsWithDuplicateDates: number[] = [];
  ratePeriodDates.forEach((from, index) => {
    if (index === 0 || !from) return;
    if (!isWithinRepaymentPeriod(from)) ratePeriodsOutsideLoan.push(index + 1);
    const isDuplicate = ratePeriodDates.some(
      (otherFrom, otherIndex) => otherIndex > 0 && otherIndex !== index && otherFrom === from,
    );
    if (isDuplicate) ratePeriodsWithDuplicateDates.push(index + 1);
  });
  if (ratePeriodsOutsideLoan.length) {
    errors['ratePeriodOutsideLoan'] = {
      positions: ratePeriodsOutsideLoan,
    } satisfies ItemPositionsErrorDetails;
  }
  if (ratePeriodsWithDuplicateDates.length) {
    errors['ratePeriodDuplicateDates'] = {
      positions: ratePeriodsWithDuplicateDates,
    } satisfies ItemPositionsErrorDetails;
  }

  // kolejne transze (pierwsza jest uruchamiana razem z kredytem)
  const tranchesSection = group.controls.tranches;
  if (tranchesSection.controls.enabled.value) {
    const tranchesNotAfterStart = tranchesSection.controls.fields.controls.tranches
      .getRawValue()
      .map((tranche, index) => ({ date: tranche.date, position: index + 1 }))
      .filter(({ date, position }) => position > 1 && !!date && date <= startDate)
      .map(({ position }) => position);
    if (tranchesNotAfterStart.length) {
      errors['trancheDateNotAfterStart'] = {
        positions: tranchesNotAfterStart,
      } satisfies ItemPositionsErrorDetails;
    }
  }

  // aktywne reguły nadpłat i docelowej raty
  const prepaymentsSection = group.controls.prepayments;
  if (prepaymentsSection.controls.enabled.value) {
    const prepaymentFields = prepaymentsSection.controls.fields.getRawValue();
    const prepaymentsOutsideLoan = prepaymentFields.prepaymentRules.items
      .map((rule, index) => ({ rule, position: index + 1 }))
      .filter(({ rule }) => (Number(rule.amount) || 0) > 0 && !!rule.from)
      .filter(({ rule }) => !isWithinRepaymentPeriod(rule.from))
      .map(({ position }) => position);
    if (prepaymentsOutsideLoan.length) {
      errors['prepaymentOutsideLoan'] = {
        positions: prepaymentsOutsideLoan,
      } satisfies ItemPositionsErrorDetails;
    }
    const targetInstallment = prepaymentFields.targetInstallment;
    if (
      (Number(targetInstallment.targetRate) || 0) > 0 &&
      targetInstallment.from &&
      !isWithinRepaymentPeriod(targetInstallment.from)
    ) {
      errors['targetInstallmentOutsideLoan'] = true;
    }
  }

  // aktywne (niezerowe) koszty okołokredytowe i promocja oprocentowania
  const overheadCostsSection = group.controls.overheadCosts;
  if (overheadCostsSection.controls.enabled.value) {
    const costFields = overheadCostsSection.controls.fields.getRawValue();
    const datedCosts = [
      {
        kind: OverheadCostKind.PROPERTY_INSURANCE,
        value: costFields.propertyInsurance.propInsValue,
        frequency: costFields.propertyInsurance.propInsFrequency,
        from: costFields.propertyInsurance.propInsFrom,
        to: costFields.propertyInsurance.propInsTo,
      },
      {
        kind: OverheadCostKind.LIFE_INSURANCE,
        value: costFields.lifeInsurance.lifeInsValue,
        frequency: costFields.lifeInsurance.lifeInsFrequency,
        from: costFields.lifeInsurance.lifeInsFrom,
        to: costFields.lifeInsurance.lifeInsTo,
      },
      {
        kind: OverheadCostKind.JOB_LOSS_INSURANCE,
        value: costFields.jobLossInsurance.jobLossInsValue,
        frequency: costFields.jobLossInsurance.jobLossInsFrequency,
        from: costFields.jobLossInsurance.jobLossInsFrom,
        to: costFields.jobLossInsurance.jobLossInsTo,
      },
      ...costFields.additionalCosts.items.map((additionalCost) => ({
        kind: OverheadCostKind.ADDITIONAL_COST,
        value: additionalCost.value,
        frequency: additionalCost.frequency,
        from: additionalCost.from,
        to: additionalCost.to,
      })),
    ].filter((cost) => (Number(cost.value) || 0) > 0 && !!cost.from);

    const distinctKinds = (costs: typeof datedCosts): OverheadCostKind[] => [
      ...new Set(costs.map((cost) => cost.kind)),
    ];
    const costsOutsideLoan = datedCosts.filter((cost) => !isWithinRepaymentPeriod(cost.from));
    if (costsOutsideLoan.length) {
      errors['overheadCostOutsideLoan'] = {
        kinds: distinctKinds(costsOutsideLoan),
      } satisfies OverheadCostDatesErrorDetails;
    }
    // koszt jednorazowy ma jedno pole daty — „do” nie jest wtedy brane pod uwagę
    const costsWithInvalidRange = datedCosts.filter(
      (cost) => cost.frequency !== InsuranceFrequency.ONE_TIME && !!cost.to && cost.to < cost.from,
    );
    if (costsWithInvalidRange.length) {
      errors['overheadCostDateRangeInvalid'] = {
        kinds: distinctKinds(costsWithInvalidRange),
      } satisfies OverheadCostDatesErrorDetails;
    }

    const promotionalRate = costFields.promoRate;
    if ((Number(promotionalRate.promoRateDecrease) || 0) > 0 && promotionalRate.promoFrom) {
      if (!isWithinRepaymentPeriod(promotionalRate.promoFrom)) {
        errors['promotionalRateOutsideLoan'] = true;
      }
      if (promotionalRate.promoTo && promotionalRate.promoTo < promotionalRate.promoFrom) {
        errors['promotionalRateDateRangeInvalid'] = true;
      }
    }
  }

  return errors;
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
  const targetInstallment = prepaymentsEnabled
    ? prepaymentsSection.controls.fields.controls.targetInstallment.getRawValue()
    : null;

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
      } satisfies TrancheSumMismatchErrorDetails;
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
      errors['capitalBeforeLastTranche'] = {
        lastTrancheDate,
      } satisfies CapitalBeforeLastTrancheErrorDetails;
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
      targetInstallment?.from &&
      targetInstallment.to &&
      targetInstallment.to < targetInstallment.from
    ) {
      errors['targetInstallmentDateRangeInvalid'] = true;
    }

    if ((Number(targetInstallment?.targetRate) || 0) < 0) {
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

  Object.assign(errors, repaymentPeriodDateErrors(group));

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
      this.ratePeriodsArray.at(0)?.controls.from.setValue(newDate, { emitEvent: false });
    });

    this.form.controls.tranches.controls.enabled.valueChanges.subscribe((enabled) =>
      this.syncTranchesFieldsEnabledState(enabled),
    );
    this.syncTranchesFieldsEnabledState(this.form.controls.tranches.controls.enabled.value);

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
            targetInstallment: this.fb.group({
              targetRate: this.fb.control(0, [Validators.min(0)]),
              from: this.fb.control(nextMonthStr(), [Validators.required]),
              to: this.fb.control(addMonthsStr(nextMonthStr(), 12), [Validators.required]),
              effect: this.fb.control<PrepaymentEffect>(PrepaymentEffect.LOWER_INSTALLMENT, [
                Validators.required,
              ]),
            }),
            earlyRepaymentCommission: this.fb.group({
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
    this.syncTranchesFieldsEnabledState(this.isTranchesEnabled);
    this.form.updateValueAndValidity();
  }

  removeTranche(index: number): void {
    if (index === 0 || this.tranchesArray.length <= 1) return;
    this.tranchesArray.removeAt(index);
    this.form.updateValueAndValidity();
  }

  private syncTranchesFieldsEnabledState(enabled: boolean): void {
    this.tranchesArray.controls.forEach((trancheGroup) => {
      if (enabled) {
        trancheGroup.controls.amount.enable({ emitEvent: false });
        trancheGroup.controls.disbursementFee.enable({ emitEvent: false });
      } else {
        trancheGroup.controls.amount.disable({ emitEvent: false });
        trancheGroup.controls.disbursementFee.disable({ emitEvent: false });
      }
    });
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

  loadFromSavedCalculation(data: MortgageFormRawValue, name: string): void {
    this.loadFromFile(data);
    this.loadedCalculationName.set(name);
    this.loadedCalculationSnapshot.set(JSON.stringify(this.form.getRawValue()));
    this.uiStateService.resetCalculationViewState();
  }

  refreshLoadedCalculationSnapshot(): void {
    this.loadedCalculationSnapshot.set(JSON.stringify(this.form.getRawValue()));
  }

  loadFromFile(data: MortgageFormRawValue): void {
    const ratePeriods = data.ratePeriods.items;
    this.ratePeriodsArray.clear();
    (ratePeriods.length > 0
      ? ratePeriods.map((ratePeriod) => this.createRatePeriodGroup(ratePeriod))
      : [this.createRatePeriodGroup()]
    ).forEach((group) => this.ratePeriodsArray.push(group));

    const tranches = data.tranches.fields.tranches;
    this.tranchesArray.clear();
    (tranches.length > 0
      ? tranches.map((tranche, index) => this.createTrancheGroup(index === 0, tranche))
      : [this.createTrancheGroup(true)]
    ).forEach((group) => this.tranchesArray.push(group));

    const prepaymentRules = data.prepayments.fields.prepaymentRules.items;
    this.prepaymentRulesArray.clear();
    (prepaymentRules.length > 0
      ? prepaymentRules.map((rule) => this.createPrepaymentRuleGroup(rule))
      : [this.createPrepaymentRuleGroup()]
    ).forEach((group) => this.prepaymentRulesArray.push(group));

    const additionalCosts = data.overheadCosts.fields.additionalCosts.items;
    this.additionalCostsArray.clear();
    (additionalCosts.length > 0
      ? additionalCosts.map((additionalCost) => {
          const group = this.createAdditionalCostGroup();
          group.patchValue(additionalCost);
          return group;
        })
      : [this.createAdditionalCostGroup()]
    ).forEach((group) => this.additionalCostsArray.push(group));

    this.form.patchValue(data);
    this.syncTranchesFieldsEnabledState(this.isTranchesEnabled);
    this.form.updateValueAndValidity();
  }
}
