import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';

import {
  BadgeVariant,
  ComparableOffer,
  ComparableOfferKind,
  DialogSize,
  SelectOfferDialogContext,
} from '../../model';
import { AbstractDialog } from '../../components/ui/dialog/abstract-dialog';
import { DialogComponent } from '../../components/ui/dialog/dialog.component';
import { BadgeComponent } from '../../components/ui/badge/badge.component';
import { FormatAmountPipe } from '../../pipes/format-amount/format-amount.pipe';
import { FormatLoanPeriodPipe } from '../../pipes/format-loan-period/format-loan-period.pipe';
import { FormatRatePipe } from '../../pipes/format-rate/format-rate.pipe';
import { FormatWholeAmountPipe } from '../../pipes/format-whole-amount/format-whole-amount.pipe';
import { InstallmentTypeLabelPipe } from '../../pipes/installment-type-label/installment-type-label.pipe';
import { RateTypeLabelPipe } from '../../pipes/rate-type-label/rate-type-label.pipe';

@Component({
  selector: 'app-select-offer-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogComponent,
    BadgeComponent,
    FormatAmountPipe,
    FormatLoanPeriodPipe,
    FormatRatePipe,
    FormatWholeAmountPipe,
    InstallmentTypeLabelPipe,
    RateTypeLabelPipe,
  ],
  templateUrl: './select-offer-dialog.component.html',
  styleUrl: './select-offer-dialog.component.scss',
})
export class SelectOfferDialogComponent extends AbstractDialog<string | null> {
  protected readonly dialog = viewChild.required(DialogComponent);

  protected readonly context = signal<SelectOfferDialogContext | null>(null);
  protected readonly ComparableOfferKind = ComparableOfferKind;
  protected readonly BadgeVariant = BadgeVariant;
  protected readonly DialogSize = DialogSize;

  /** Etykieta tagu nagłówka — numer slotu, do którego wybierana jest oferta. */
  protected readonly slotTag = computed<string>(() => {
    const context = this.context();
    return context ? `Slot ${context.slot}` : '';
  });

  /** Oferty możliwe do wyboru: bez tej z przeciwnego slotu i bez ofert z błędami walidacji. */
  protected readonly selectableOffers = computed<ComparableOffer[]>(() => {
    const context = this.context();
    if (!context) return [];
    return context.offers.filter(
      (offer) => offer.id !== context.excludedOfferId && !offer.hasErrors,
    );
  });

  /** Liczba ofert ukrytych z powodu błędów walidacji (do komunikatu pomocniczego). */
  protected readonly hiddenWithErrorsCount = computed<number>(() => {
    const context = this.context();
    if (!context) return 0;
    return context.offers.filter((offer) => offer.id !== context.excludedOfferId && offer.hasErrors)
      .length;
  });

  open(context: SelectOfferDialogContext): Promise<string | null> {
    this.context.set(context);
    return this.beginInteraction(null);
  }

  protected selectOffer(offerId: string): void {
    this.closeWith(offerId);
  }
}
