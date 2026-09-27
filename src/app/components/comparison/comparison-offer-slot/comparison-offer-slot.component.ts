import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  BadgeVariant,
  ComparableOffer,
  ComparableOfferKind,
  ComparisonSlot,
} from '../../../model';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { BtnRemoveComponent } from '../../ui/btn-remove/btn-remove.component';
import { IconPlusComponent } from '../../icons/icon-plus/icon-plus.component';
import { IconSlotAComponent } from '../../icons/icon-slot-a/icon-slot-a.component';
import { IconSlotBComponent } from '../../icons/icon-slot-b/icon-slot-b.component';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatLoanPeriodPipe } from '../../../pipes/format-loan-period/format-loan-period.pipe';
import { FormatRatePipe } from '../../../pipes/format-rate/format-rate.pipe';
import { FormatWholeAmountPipe } from '../../../pipes/format-whole-amount/format-whole-amount.pipe';

/**
 * Kafel pojedynczego slotu oferty na pasku „Porównanie ofert" — stan wypełniony
 * (nazwa, plakietka „bieżąca" dla draftu, linia meta i przycisk usunięcia) lub pusty
 * (placeholder „Wybierz ofertę"). Komponent prezentacyjny: dane wchodzą przez inputy,
 * akcje wychodzą przez outputy.
 */
@Component({
  selector: 'app-comparison-offer-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BadgeComponent,
    BtnRemoveComponent,
    IconPlusComponent,
    IconSlotAComponent,
    IconSlotBComponent,
    FormatAmountPipe,
    FormatLoanPeriodPipe,
    FormatRatePipe,
    FormatWholeAmountPipe,
  ],
  templateUrl: './comparison-offer-slot.component.html',
  styleUrl: './comparison-offer-slot.component.scss',
})
export class ComparisonOfferSlotComponent {
  /** Którego slotu dotyczy kafel — steruje ikoną A/B oraz kolorowym paskiem bocznym. */
  readonly slot = input.required<ComparisonSlot>();

  /** Dane oferty w slocie lub `undefined` (stan pusty). */
  readonly offer = input.required<ComparableOffer | undefined>();

  /** Czy oferta w tym slocie zawiera błędy walidacji (obramowanie błędu). */
  readonly invalid = input<boolean>(false);

  /** Kliknięcie kafla — otwarcie pickera wyboru oferty. */
  readonly pick = output<void>();

  /** Kliknięcie przycisku usunięcia — zwolnienie slotu. */
  readonly clear = output<void>();

  protected readonly ComparisonSlot = ComparisonSlot;
  protected readonly ComparableOfferKind = ComparableOfferKind;
  protected readonly BadgeVariant = BadgeVariant;
}
