import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';

import {
  BadgeVariant,
  ComparableOffer,
  ComparableOfferKind,
  SelectOfferDialogContext,
} from '../../model';
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
export class SelectOfferDialogComponent {
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly context = signal<SelectOfferDialogContext | null>(null);
  protected readonly ComparableOfferKind = ComparableOfferKind;
  protected readonly BadgeVariant = BadgeVariant;

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

  private resolvePromise?: (value: string | null) => void;
  private resolvedValue: string | null = null;

  open(context: SelectOfferDialogContext): Promise<string | null> {
    this.context.set(context);
    this.resolvedValue = null;
    this.dialogRef().nativeElement.showModal();
    return new Promise((resolve) => (this.resolvePromise = resolve));
  }

  protected selectOffer(offerId: string): void {
    this.resolvedValue = offerId;
    this.dialogRef().nativeElement.close();
  }

  protected cancel(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onClose(): void {
    this.resolvePromise?.(this.resolvedValue);
    this.resolvePromise = undefined;
    this.resolvedValue = null;
  }
}
