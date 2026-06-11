import { computed, inject, Injectable, signal } from '@angular/core';

import {
  ComparableOffer,
  ComparableOfferKind,
  ComparisonOfferData,
  ComparisonSlot,
  DRAFT_OFFER_ID,
  MortgageFormRawValue,
  OfferComputation,
  OverheadCostItem,
  OverheadCostKind,
  RateType,
  SavedCalculationRecord,
} from '../../model';
import { buildMortgageInputs } from '../../helpers/mortgage-inputs.helper';
import { groupByYear } from '../../helpers/year-group.helper';
import { CalculatorService } from '../calculator/calculator.service';
import { FormService } from '../form/form';
import {
  SavedCalculationsStateService,
  toSavedCalculation,
} from '../saved-calculations-state/saved-calculations-state.service';

const DRAFT_OFFER_NAME = 'Bieżąca kalkulacja';

function sumOverheadCostsOfKind(breakdown: OverheadCostItem[], kind: OverheadCostKind): number {
  return breakdown.filter((item) => item.kind === kind).reduce((sum, item) => sum + item.value, 0);
}

@Injectable({ providedIn: 'root' })
export class ComparisonStateService {
  private readonly savedCalculationsState = inject(SavedCalculationsStateService);
  private readonly formService = inject(FormService);
  private readonly calculatorService = inject(CalculatorService);

  private readonly offerAIdSignal = signal<string | null>(null);
  private readonly offerBIdSignal = signal<string | null>(null);

  /** Memoizacja przeliczeń zapisanych ofert; klucz: `nazwa::data ostatniego zapisu`. */
  private readonly savedComputationCache = new Map<string, OfferComputation | null>();

  readonly offerAId = this.offerAIdSignal.asReadonly();
  readonly offerBId = this.offerBIdSignal.asReadonly();

  /** Pełne przeliczenie bieżącej (niezapisanej) kalkulacji — `null` przy błędach walidacji. */
  private readonly draftComputation = computed<OfferComputation | null>(() => {
    const formValue = this.formService.formValue();
    if (this.formService.form.invalid) return null;
    return this.computeFromFormValue(formValue);
  });

  /** Bieżąca, niezapisana kalkulacja jako oferta — odświeżana na każdą zmianę formularza. */
  private readonly draftOffer = computed<ComparableOffer>(() => {
    const formValue = this.formService.formValue();
    const basicData = formValue.basicData;
    const firstRatePeriod = basicData.ratePeriods[0];
    const rateType = firstRatePeriod?.rateType ?? RateType.VARIABLE;
    const nominalRate =
      rateType === RateType.VARIABLE
        ? (firstRatePeriod?.wibor ?? 0) + (firstRatePeriod?.margin ?? 0)
        : (firstRatePeriod?.nominalRate ?? 0);
    const loanPeriodMonths = basicData.loanPeriod;
    const results = this.draftComputation()?.results ?? null;
    const breakdown = results?.totals.overheadCostsBreakdown ?? [];

    return {
      id: DRAFT_OFFER_ID,
      kind: ComparableOfferKind.DRAFT,
      name: DRAFT_OFFER_NAME,
      loanAmount: basicData.loanAmount,
      propertyValue: basicData.propertyValue,
      loanPeriodYears: Math.floor(loanPeriodMonths / 12),
      loanPeriodExtraMonths: loanPeriodMonths % 12,
      nominalRate,
      rateType,
      installmentType: basicData.installmentType,
      firstInstallment: results?.firstInstallment?.rate ?? 0,
      totalInterest: results?.totals.totalInterest ?? 0,
      totalCosts: results?.totals.overheadCosts ?? 0,
      commission: sumOverheadCostsOfKind(breakdown, OverheadCostKind.LOAN_COMMISSION),
      appraisalFee: sumOverheadCostsOfKind(breakdown, OverheadCostKind.APPRAISAL_FEE),
      totalOverpayments: results?.totals.prepayments ?? 0,
      totalPayments: results?.totals.totalAllPayments ?? 0,
      hasErrors: this.formService.form.invalid,
    };
  });

  private readonly savedOffers = computed<ComparableOffer[]>(() =>
    this.savedCalculationsState.records().map((record) => {
      const saved = toSavedCalculation(record);
      return {
        id: saved.name,
        kind: ComparableOfferKind.SAVED,
        name: saved.name,
        loanAmount: saved.loanAmount,
        propertyValue: saved.propertyValue,
        loanPeriodYears: saved.loanPeriodYears,
        loanPeriodExtraMonths: saved.loanPeriodExtraMonths,
        nominalRate: saved.nominalRate,
        rateType: saved.rateType,
        installmentType: saved.installmentType,
        firstInstallment: saved.firstInstallment,
        totalInterest: saved.totalInterest,
        totalCosts: saved.totalCosts,
        commission: saved.commission,
        appraisalFee: saved.appraisalFee,
        totalOverpayments: saved.totalOverpayments,
        totalPayments: saved.totalPayments,
        hasErrors: saved.hasErrors,
      };
    }),
  );

  /** Wszystkie oferty wybieralne w widoku porównania (bieżąca kalkulacja + zapisane). */
  readonly availableOffers = computed<ComparableOffer[]>(() => [
    this.draftOffer(),
    ...this.savedOffers(),
  ]);

  /**
   * Komplet danych oferty w slocie A — wartości liczbowe pochodzą z pełnego przeliczenia
   * bieżącym silnikiem (migawka wejść), a nie z metadanych zapisanych przy zapisie.
   */
  readonly sideA = computed<ComparisonOfferData | undefined>(() =>
    this.buildSideData(this.offerAIdSignal()),
  );

  /** Komplet danych oferty w slocie B — zob. {@link sideA}. */
  readonly sideB = computed<ComparisonOfferData | undefined>(() =>
    this.buildSideData(this.offerBIdSignal()),
  );

  readonly offerA = computed<ComparableOffer | undefined>(() => this.sideA()?.offer);

  readonly offerB = computed<ComparableOffer | undefined>(() => this.sideB()?.offer);

  readonly bothSelected = computed<boolean>(() => !!this.offerA() && !!this.offerB());

  selectOffer(slot: ComparisonSlot, offerId: string): void {
    if (slot === ComparisonSlot.A) {
      this.offerAIdSignal.set(offerId);
    } else {
      this.offerBIdSignal.set(offerId);
    }
  }

  clearSlot(slot: ComparisonSlot): void {
    if (slot === ComparisonSlot.A) {
      this.offerAIdSignal.set(null);
    } else {
      this.offerBIdSignal.set(null);
    }
  }

  swap(): void {
    const previousOfferAId = this.offerAIdSignal();
    this.offerAIdSignal.set(this.offerBIdSignal());
    this.offerBIdSignal.set(previousOfferAId);
  }

  private buildSideData(offerId: string | null): ComparisonOfferData | undefined {
    if (offerId === null) return undefined;

    if (offerId === DRAFT_OFFER_ID) {
      return {
        offer: this.draftOffer(),
        formValue: this.formService.formValue(),
        computation: this.draftComputation(),
      };
    }

    const record = this.savedCalculationsState
      .records()
      .find((savedRecord) => savedRecord.name === offerId);
    const baseOffer = this.savedOffers().find((offer) => offer.id === offerId);
    if (!record || !baseOffer) return undefined;

    const computation = this.computeSavedRecord(record);
    return {
      offer: computation ? this.withComputedTotals(baseOffer, computation) : baseOffer,
      formValue: this.extractFormValue(record),
      computation,
    };
  }

  private computeSavedRecord(record: SavedCalculationRecord): OfferComputation | null {
    const cacheKey = `${record.name}::${record.updatedAt ?? record.createdAt}`;
    const cached = this.savedComputationCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const formValue = this.extractFormValue(record);
    const hasErrors = record.metadata?.hasErrors ?? false;
    const computation = hasErrors || !formValue ? null : this.computeFromFormValue(formValue);
    this.savedComputationCache.set(cacheKey, computation);
    return computation;
  }

  private computeFromFormValue(formValue: MortgageFormRawValue): OfferComputation | null {
    try {
      const inputs = buildMortgageInputs(formValue);
      const results = this.calculatorService.compute(inputs);
      return { inputs, results, yearlyGroups: groupByYear(results.schedule) };
    } catch {
      return null;
    }
  }

  private extractFormValue(record: SavedCalculationRecord): MortgageFormRawValue | null {
    if (typeof record.data !== 'object' || record.data === null) return null;
    return record.data as MortgageFormRawValue;
  }

  /** Nadpisuje skalarne wyniki oferty wartościami z pełnego przeliczenia (jedno źródło prawdy dla sekcji 3.4–3.8). */
  private withComputedTotals(
    offer: ComparableOffer,
    computation: OfferComputation,
  ): ComparableOffer {
    const totals = computation.results.totals;
    const breakdown = totals.overheadCostsBreakdown;
    return {
      ...offer,
      firstInstallment: computation.results.firstInstallment?.rate ?? 0,
      totalInterest: totals.totalInterest,
      totalCosts: totals.overheadCosts,
      commission: sumOverheadCostsOfKind(breakdown, OverheadCostKind.LOAN_COMMISSION),
      appraisalFee: sumOverheadCostsOfKind(breakdown, OverheadCostKind.APPRAISAL_FEE),
      totalOverpayments: totals.prepayments,
      totalPayments: totals.totalAllPayments,
    };
  }
}
