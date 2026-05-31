import { computed, inject, Injectable, signal } from '@angular/core';

import {
  ComparableOffer,
  ComparableOfferKind,
  ComparisonSlot,
  DRAFT_OFFER_ID,
  RateType,
} from '../../model';
import { CalculatorStateService } from '../calculator-state/calculator-state.service';
import { FormService } from '../form/form';
import {
  SavedCalculationsStateService,
  toSavedCalculation,
} from '../saved-calculations-state/saved-calculations-state.service';

const DRAFT_OFFER_NAME = 'Bieżąca kalkulacja';

@Injectable({ providedIn: 'root' })
export class ComparisonStateService {
  private readonly savedCalculationsState = inject(SavedCalculationsStateService);
  private readonly formService = inject(FormService);
  private readonly calculatorState = inject(CalculatorStateService);

  private readonly offerAIdSignal = signal<string | null>(null);
  private readonly offerBIdSignal = signal<string | null>(null);

  readonly offerAId = this.offerAIdSignal.asReadonly();
  readonly offerBId = this.offerBIdSignal.asReadonly();

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
      firstInstallment: this.calculatorState.results()?.firstInstallment?.rate ?? 0,
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
        hasErrors: saved.hasErrors,
      };
    }),
  );

  /** Wszystkie oferty wybieralne w widoku porównania (bieżąca kalkulacja + zapisane). */
  readonly availableOffers = computed<ComparableOffer[]>(() => [
    this.draftOffer(),
    ...this.savedOffers(),
  ]);

  readonly offerA = computed<ComparableOffer | undefined>(() =>
    this.findOffer(this.offerAIdSignal()),
  );

  readonly offerB = computed<ComparableOffer | undefined>(() =>
    this.findOffer(this.offerBIdSignal()),
  );

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

  private findOffer(offerId: string | null): ComparableOffer | undefined {
    if (offerId === null) return undefined;
    return this.availableOffers().find((offer) => offer.id === offerId);
  }
}
