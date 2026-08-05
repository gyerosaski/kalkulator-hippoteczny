import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  NgZone,
  OnInit,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  AppRoute,
  BadgeVariant,
  BannerVariant,
  ComparableOffer,
  ComparableOfferKind,
  ComparisonOfferData,
  ComparisonSlot,
  ComparisonTrendMode,
  ComparisonTrendSeries,
  ComparisonTrendSharedAxisMax,
  ComparisonTrendSideModel,
  DRAFT_OFFER_ID,
  IconSize,
  YearGroup,
} from '../../model';
import { roundUpToStep } from '../../helpers/chart-scale.helper';
import { ComparisonStateService } from '../../services/comparison-state/comparison-state.service';
import { UiStateService } from '../../services/ui-state/ui-state.service';
import { SavedCalculationsStateService } from '../../services/saved-calculations-state/saved-calculations-state.service';
import { FormService } from '../../services/form/form';
import { ToastService } from '../../services/toast/toast.service';
import { SelectOfferDialogComponent } from '../../dialogs/select-offer/select-offer-dialog.component';
import { BadgeComponent } from '../../components/ui/badge/badge.component';
import { BannerComponent } from '../../components/ui/banner/banner.component';
import { BtnRemoveComponent } from '../../components/ui/btn-remove/btn-remove.component';
import { IconSwapComponent } from '../../components/icons/icon-swap/icon-swap.component';
import { IconPlusComponent } from '../../components/icons/icon-plus/icon-plus.component';
import { IconDeltaComponent } from '../../components/icons/icon-delta/icon-delta.component';
import { IconCheckCircleComponent } from '../../components/icons/icon-check-circle/icon-check-circle.component';
import { IconCompareComponent } from '../../components/icons/icon-compare/icon-compare.component';
import { IconCalculatorComponent } from '../../components/icons/icon-calculator/icon-calculator.component';
import { IconSlotAComponent } from '../../components/icons/icon-slot-a/icon-slot-a.component';
import { IconSlotBComponent } from '../../components/icons/icon-slot-b/icon-slot-b.component';
import { FormatAmountPipe } from '../../pipes/format-amount/format-amount.pipe';
import { FormatLoanPeriodPipe } from '../../pipes/format-loan-period/format-loan-period.pipe';
import { FormatRatePipe } from '../../pipes/format-rate/format-rate.pipe';
import { FormatWholeAmountPipe } from '../../pipes/format-whole-amount/format-whole-amount.pipe';
import { ComparisonDiffTableComponent } from '../../components/comparison/comparison-diff-table/comparison-diff-table.component';
import { ComparisonParamsTableComponent } from '../../components/comparison/comparison-params-table/comparison-params-table.component';
import { ComparisonKpiGridComponent } from '../../components/comparison/comparison-kpi-grid/comparison-kpi-grid.component';
import { ComparisonDonutsTotalComponent } from '../../components/comparison/comparison-donuts-total/comparison-donuts-total.component';
import { ComparisonDonutsInstallmentComponent } from '../../components/comparison/comparison-donuts-installment/comparison-donuts-installment.component';
import { ComparisonTrendChartComponent } from '../../components/comparison/comparison-trend-chart/comparison-trend-chart.component';
import { ResultsTrendChartComponent } from '../../components/results/results-trend-chart/results-trend-chart.component';
import { SwitchComponent } from '../../components/ui/switch/switch.component';
import { SegmentedComponent } from '../../components/ui/segmented/segmented.component';
import { ComparisonTrendModeLabelPipe } from '../../pipes/comparison-trend-mode-label/comparison-trend-mode-label.pipe';

const TREND_BALANCE_TICK_STEP = 50_000;
const TREND_STACK_TICK_STEP = 5_000;

@Component({
  selector: 'app-calculations-compare',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    SelectOfferDialogComponent,
    BadgeComponent,
    BtnRemoveComponent,
    IconSwapComponent,
    IconPlusComponent,
    IconDeltaComponent,
    IconCheckCircleComponent,
    IconCompareComponent,
    BannerComponent,
    IconCalculatorComponent,
    IconSlotAComponent,
    IconSlotBComponent,
    FormatAmountPipe,
    FormatLoanPeriodPipe,
    FormatRatePipe,
    FormatWholeAmountPipe,
    ComparisonDiffTableComponent,
    ComparisonParamsTableComponent,
    ComparisonKpiGridComponent,
    ComparisonDonutsTotalComponent,
    ComparisonDonutsInstallmentComponent,
    ComparisonTrendChartComponent,
    ResultsTrendChartComponent,
    SwitchComponent,
    SegmentedComponent,
    ComparisonTrendModeLabelPipe,
  ],
  templateUrl: './calculations-compare.component.html',
  styleUrls: ['./calculations-compare.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(scroll)': 'onScroll()' },
})
export class CalculationsCompareComponent implements OnInit {
  protected readonly comparisonState = inject(ComparisonStateService);
  private readonly savedCalculationsState = inject(SavedCalculationsStateService);
  private readonly formService = inject(FormService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly uiStateService = inject(UiStateService);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly selectOfferDialog = viewChild.required(SelectOfferDialogComponent);

  constructor() {
    afterNextRender(() => {
      this.hostElement.nativeElement.scrollTop = this.uiStateService.calculationsCompareScrollTop();
    });
  }

  protected onScroll(): void {
    this.uiStateService.setCalculationsCompareScrollTop(this.hostElement.nativeElement.scrollTop);
  }

  protected readonly ComparisonSlot = ComparisonSlot;
  protected readonly ComparableOfferKind = ComparableOfferKind;
  protected readonly BadgeVariant = BadgeVariant;
  protected readonly BannerVariant = BannerVariant;
  protected readonly IconSize = IconSize;

  protected readonly ComparisonTrendMode = ComparisonTrendMode;
  protected readonly trendModeOptions = Object.values(ComparisonTrendMode);

  /** Tryb wykresu trendu (4.2): nakładka (domyślnie) lub dwa pełne wykresy obok siebie. */
  protected readonly trendModeControl = new FormControl<ComparisonTrendMode>(
    ComparisonTrendMode.OVERLAY,
    { nonNullable: true },
  );

  protected readonly trendMode = toSignal(this.trendModeControl.valueChanges, {
    initialValue: this.trendModeControl.value,
  });

  protected readonly trendSeriesA = computed<ComparisonTrendSeries | null>(() =>
    this.buildTrendSeries(this.comparisonState.sideA(), 'var(--offer-a)'),
  );

  protected readonly trendSeriesB = computed<ComparisonTrendSeries | null>(() =>
    this.buildTrendSeries(this.comparisonState.sideB(), 'var(--offer-b)'),
  );

  protected readonly trendSideA = computed<ComparisonTrendSideModel | null>(() =>
    this.buildTrendSideModel(this.comparisonState.sideA()),
  );

  protected readonly trendSideB = computed<ComparisonTrendSideModel | null>(() =>
    this.buildTrendSideModel(this.comparisonState.sideB()),
  );

  protected readonly loanPeriodsDiffer = computed<boolean>(() => {
    const computationA = this.comparisonState.sideA()?.computation;
    const computationB = this.comparisonState.sideB()?.computation;
    return (
      !!computationA &&
      !!computationB &&
      computationA.inputs.loanPeriod !== computationB.inputs.loanPeriod
    );
  });

  /** Wspólne maksima osi obu wykresów w trybie „obok siebie” — bez nich porównanie kształtu krzywych jest mylące. */
  protected readonly sharedTrendAxisMax = computed<ComparisonTrendSharedAxisMax | null>(() => {
    const computationA = this.comparisonState.sideA()?.computation;
    const computationB = this.comparisonState.sideB()?.computation;
    if (!computationA || !computationB) return null;
    const stackTotal = (group: YearGroup) =>
      group.sumInterest + group.sumInsuranceCost + group.sumCapital + group.sumPrepayment;
    const maxBalance = Math.max(
      computationA.inputs.loanAmount,
      computationB.inputs.loanAmount,
      ...computationA.yearlyGroups.map((group) => group.lastRemaining),
      ...computationB.yearlyGroups.map((group) => group.lastRemaining),
    );
    const maxStack = Math.max(
      0,
      ...computationA.yearlyGroups.map(stackTotal),
      ...computationB.yearlyGroups.map(stackTotal),
    );
    return {
      balance: roundUpToStep(maxBalance, TREND_BALANCE_TICK_STEP),
      stack: roundUpToStep(maxStack, TREND_STACK_TICK_STEP),
    };
  });

  /** Toggle „Pokaż wykluczone segmenty” (4.2) — steruje widocznością zerowych segmentów donutów. */
  protected readonly showExcludedSegmentsControl = new FormControl<boolean>(false, {
    nonNullable: true,
  });

  protected readonly showExcludedSegments = toSignal(
    this.showExcludedSegmentsControl.valueChanges,
    { initialValue: this.showExcludedSegmentsControl.value },
  );

  /** Oferta, której nie udało się przeliczyć (błędy walidacji) — blokuje sekcje 3.4–3.8. */
  protected readonly invalidOffer = computed<ComparableOffer | null>(() => {
    const sideA = this.comparisonState.sideA();
    const sideB = this.comparisonState.sideB();
    if (!sideA || !sideB) return null;
    if (!sideA.computation) return sideA.offer;
    if (!sideB.computation) return sideB.offer;
    return null;
  });

  protected readonly loanAmountsDiffer = computed<boolean>(() => {
    const computationA = this.comparisonState.sideA()?.computation;
    const computationB = this.comparisonState.sideB()?.computation;
    return (
      !!computationA &&
      !!computationB &&
      computationA.inputs.loanAmount !== computationB.inputs.loanAmount
    );
  });

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
    this.clearSlotsWithRemovedOffers();
  }

  /**
   * Zwalnia sloty wskazujące na kalkulacje usunięte ze store'a (np. w widoku „Twoje kalkulacje”).
   * Celowo wywoływane raz po `loadAll()`, a nie jako effect — przed wczytaniem store'a lista
   * rekordów jest pusta i effect czyściłby sloty fałszywie.
   */
  private clearSlotsWithRemovedOffers(): void {
    const savedNames = new Set(this.savedCalculationsState.records().map((record) => record.name));
    const removedFromA = this.clearSlotIfOfferRemoved(
      ComparisonSlot.A,
      this.comparisonState.offerAId(),
      savedNames,
    );
    const removedFromB = this.clearSlotIfOfferRemoved(
      ComparisonSlot.B,
      this.comparisonState.offerBId(),
      savedNames,
    );
    if (removedFromA || removedFromB) {
      this.toastService.show('Oferta została usunięta');
    }
  }

  private clearSlotIfOfferRemoved(
    slot: ComparisonSlot,
    offerId: string | null,
    savedNames: Set<string>,
  ): boolean {
    if (offerId === null || offerId === DRAFT_OFFER_ID || savedNames.has(offerId)) {
      return false;
    }
    this.comparisonState.clearSlot(slot);
    return true;
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

  private buildTrendSeries(
    side: ComparisonOfferData | undefined,
    color: string,
  ): ComparisonTrendSeries | null {
    const computation = side?.computation;
    if (!side || !computation) return null;
    return {
      name: side.offer.name,
      color,
      loanAmount: computation.inputs.loanAmount,
      yearlyGroups: computation.yearlyGroups,
    };
  }

  private buildTrendSideModel(
    side: ComparisonOfferData | undefined,
  ): ComparisonTrendSideModel | null {
    const computation = side?.computation;
    if (!side || !computation) return null;
    return {
      name: side.offer.name,
      results: computation.results,
      yearlyGroups: computation.yearlyGroups,
      loanAmount: computation.inputs.loanAmount,
      overheadCostsEnabled: side.formValue?.overheadCosts.enabled ?? false,
      prepaymentsEnabled: side.formValue?.prepayments.enabled ?? false,
    };
  }

  /** Ładuje wskazaną ofertę do formularza i przełącza na zakładkę „Kalkulator”. */
  protected async openInCalculator(offer: ComparableOffer): Promise<void> {
    if (offer.kind === ComparableOfferKind.DRAFT) {
      await this.router.navigate([AppRoute.CALCULATOR]);
      return;
    }
    const record = this.savedCalculationsState
      .records()
      .find((savedRecord) => savedRecord.name === offer.id);
    if (!record) return;
    this.ngZone.run(() => {
      this.formService.loadFromSavedCalculation(record.data, record.name);
    });
    await this.router.navigate([AppRoute.CALCULATOR]);
    this.toastService.show(`Wczytano kalkulację „${record.name}"`);
  }
}
