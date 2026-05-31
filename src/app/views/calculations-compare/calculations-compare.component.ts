import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';

import { AppRoute, BadgeVariant, ComparableOfferKind, ComparisonSlot } from '../../model';
import { ComparisonStateService } from '../../services/comparison-state/comparison-state.service';
import { SavedCalculationsStateService } from '../../services/saved-calculations-state/saved-calculations-state.service';
import { SelectOfferDialogComponent } from '../../dialogs/select-offer/select-offer-dialog.component';
import { BadgeComponent } from '../../components/ui/badge/badge.component';
import { BtnRemoveComponent } from '../../components/ui/btn-remove/btn-remove.component';
import { IconSwapComponent } from '../../components/icons/icon-swap/icon-swap.component';
import { IconPlusComponent } from '../../components/icons/icon-plus/icon-plus.component';
import { IconDeltaComponent } from '../../components/icons/icon-delta/icon-delta.component';
import { IconCheckCircleComponent } from '../../components/icons/icon-check-circle/icon-check-circle.component';
import { IconCompareComponent } from '../../components/icons/icon-compare/icon-compare.component';
import { FormatAmountPipe } from '../../pipes/format-amount/format-amount.pipe';
import { FormatLoanPeriodPipe } from '../../pipes/format-loan-period/format-loan-period.pipe';
import { FormatRatePipe } from '../../pipes/format-rate/format-rate.pipe';
import { FormatWholeAmountPipe } from '../../pipes/format-whole-amount/format-whole-amount.pipe';

@Component({
  selector: 'app-calculations-compare',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    SelectOfferDialogComponent,
    BadgeComponent,
    BtnRemoveComponent,
    IconSwapComponent,
    IconPlusComponent,
    IconDeltaComponent,
    IconCheckCircleComponent,
    IconCompareComponent,
    FormatAmountPipe,
    FormatLoanPeriodPipe,
    FormatRatePipe,
    FormatWholeAmountPipe,
  ],
  templateUrl: './calculations-compare.component.html',
  styleUrls: ['./calculations-compare.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculationsCompareComponent implements OnInit {
  protected readonly comparisonState = inject(ComparisonStateService);
  private readonly savedCalculationsState = inject(SavedCalculationsStateService);
  private readonly router = inject(Router);
  private readonly selectOfferDialog = viewChild.required(SelectOfferDialogComponent);

  protected readonly ComparisonSlot = ComparisonSlot;
  protected readonly ComparableOfferKind = ComparableOfferKind;
  protected readonly BadgeVariant = BadgeVariant;

  /** Krok kreatora: 1 — wybór oferty A, 2 — wybór oferty B, 3 — gotowe do porównania. */
  protected readonly currentStep = computed<1 | 2 | 3>(() => {
    if (!this.comparisonState.offerA()) return 1;
    if (!this.comparisonState.offerB()) return 2;
    return 3;
  });

  protected readonly targetSlot = computed<ComparisonSlot>(() =>
    this.currentStep() === 1 ? ComparisonSlot.A : ComparisonSlot.B,
  );

  protected readonly hasEnoughOffers = computed<boolean>(
    () => this.comparisonState.availableOffers().length >= 2,
  );

  async ngOnInit(): Promise<void> {
    await this.savedCalculationsState.loadAll();
  }

  protected async openPicker(slot: ComparisonSlot): Promise<void> {
    const excludedOfferId =
      slot === ComparisonSlot.A ? this.comparisonState.offerBId() : this.comparisonState.offerAId();
    const selectedOfferId = await this.selectOfferDialog().open({
      slot,
      excludedOfferId,
      offers: this.comparisonState.availableOffers(),
    });
    if (selectedOfferId !== null) {
      this.comparisonState.selectOffer(slot, selectedOfferId);
    }
  }

  protected clearSlot(slot: ComparisonSlot): void {
    this.comparisonState.clearSlot(slot);
  }

  protected swap(): void {
    this.comparisonState.swap();
  }

  protected navigateToCalculator(): void {
    void this.router.navigate([AppRoute.CALCULATOR]);
  }
}
