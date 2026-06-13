import { Component, input, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import {
  MortgageResults,
  ScheduleRow,
  ColorCodeArea,
  ChartSlice,
  LEGEND_TOTAL_ACTIVE,
  LegendId,
  InterestComponentItem,
} from '../../../model';
import { UiStateService } from '../../../services/ui-state/ui-state.service';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { FormatRatePipe } from '../../../pipes/format-rate/format-rate.pipe';
import { DecimalPipe } from '@angular/common';
import { DonutComponent } from '../../ui/donut/donut.component';
import { LegendComponent } from '../../ui/legend/legend.component';
import { FormService } from '../../../services/form/form';
import { CardComponent } from '../../ui/card/card.component';
import { OverheadCostBreakdownService } from '../../../services/overhead-cost-breakdown/overhead-cost-breakdown.service';
import { InterestBreakdownService } from '../../../services/interest-breakdown/interest-breakdown.service';
import { PREPAYMENTS_NAVIGATION_TARGET } from '../../../helpers/form-navigation.helper';

@Component({
  selector: 'app-results-donut-chart-total',
  standalone: true,
  imports: [DonutComponent, LegendComponent, FormatMonthPipe, CardComponent],
  providers: [FormatRatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-donut-chart-total.component.html',
  styleUrl: './results-donut-chart-total.component.scss',
})
export class ResultsDonutChartTotalComponent {
  results = input.required<MortgageResults | null>();
  readonly embedded = input<boolean>(false);
  readonly followsMonthSelection = input<boolean>(true);
  protected readonly LegendId = LegendId;
  protected readonly activeLabel = signal<string | null>(null);
  private readonly formService = inject(FormService);
  private readonly uiStateService = inject(UiStateService);
  private readonly formatRatePipe = inject(FormatRatePipe);

  /**
   * Etykieta stopki legendy z RRSO; pusta, gdy RRSO nie jest dostępne lub gdy donut
   * dotyczy wybranego miesiąca (RRSO jest stałe dla całego kredytu, więc nie ma sensu dla miesiąca).
   */
  protected readonly rrsoFooterLabel = computed<string>(() =>
    !this.selectedRow() && this.results()?.rrso != null ? 'RRSO' : '',
  );

  /** Sformatowana wartość RRSO prezentowana w stopce legendy; pusta dla widoku wybranego miesiąca. */
  protected readonly rrsoFooterValue = computed<string>(() => {
    if (this.selectedRow()) return '';
    const rrso = this.results()?.rrso;
    return rrso != null ? (this.formatRatePipe.transform(rrso) ?? '') : '';
  });

  private readonly percentageFormat1 = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  private readonly percentageFormat2 = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly overheadCostBreakdownService = inject(OverheadCostBreakdownService);
  private readonly interestBreakdownService = inject(InterestBreakdownService);

  /** Buduje slice „Odsetki"; dołącza rozwijane dzieci tylko gdy są dopłaty poza bazą. */
  private buildInterestSlice(value: number, breakdown: InterestComponentItem[]): ChartSlice {
    const slice: ChartSlice = {
      label: 'Odsetki',
      value,
      color: 'var(--c-int)',
      variant: ColorCodeArea.INTEREST,
    };
    if (this.interestBreakdownService.hasComponentBeyondBase(breakdown)) {
      slice.children = this.interestBreakdownService.buildInterestChildren(breakdown);
    }
    return slice;
  }

  selectedRow = computed<ScheduleRow | null>(() => {
    if (!this.followsMonthSelection()) return null;
    const selectedIndex = this.uiStateService.selectedMonthIndex();
    if (selectedIndex === null) return null;
    return this.results()?.schedule.find((row) => row.index === selectedIndex) ?? null;
  });

  cumulativeToSelected = computed(() => {
    const selectedRow = this.selectedRow();
    const schedule = this.results()?.schedule;
    if (!selectedRow || !schedule) return null;
    const rowsUpToSelected = schedule.filter((row) => row.index <= selectedRow.index);
    return {
      capital: rowsUpToSelected.reduce((sum, row) => sum + row.capital, 0),
      interest: rowsUpToSelected.reduce((sum, row) => sum + row.interest, 0),
      costs: rowsUpToSelected.reduce((sum, row) => sum + row.insuranceCost, 0),
      prepayments: rowsUpToSelected.reduce((sum, row) => sum + row.prepayment, 0),
      total: rowsUpToSelected.reduce(
        (sum, row) => sum + row.rate + row.insuranceCost + row.prepayment + row.commission,
        0,
      ),
      costBreakdown: this.overheadCostBreakdownService.aggregateBreakdown(rowsUpToSelected),
      interestBreakdown: this.interestBreakdownService.aggregateBreakdown(rowsUpToSelected),
    };
  });

  totalSlices = computed<ChartSlice[]>(() => {
    const cumulative = this.cumulativeToSelected();
    if (cumulative) {
      const slices: ChartSlice[] = [
        {
          label: 'Kapitał',
          value: cumulative.capital,
          color: 'var(--c-cap)',
          variant: ColorCodeArea.CAPITAL,
        },
        this.buildInterestSlice(cumulative.interest, cumulative.interestBreakdown),
      ];
      if (this.formService.isOverheadCostsEnabled && cumulative.costs > 0) {
        slices.push({
          label: 'Koszty okołokredytowe',
          value: cumulative.costs,
          color: 'var(--c-cost)',
          variant: ColorCodeArea.COST,
          children: this.overheadCostBreakdownService.buildCostChildren(cumulative.costBreakdown),
        });
      }
      if (this.formService.isPrepaymentEnabled && cumulative.prepayments > 0) {
        slices.push({
          label: 'Nadpłaty',
          value: cumulative.prepayments,
          color: 'var(--c-over)',
          variant: ColorCodeArea.PREPAYMENT,
          navigationTarget: PREPAYMENTS_NAVIGATION_TARGET,
        });
      }
      return slices;
    }
    const results = this.results();
    if (!results) return [];
    const slices: ChartSlice[] = [
      {
        label: 'Kapitał',
        value: results.totals.totalCapital,
        color: 'var(--c-cap)',
        variant: ColorCodeArea.CAPITAL,
      },
      this.buildInterestSlice(results.totals.totalInterest, results.totals.totalInterestBreakdown),
    ];
    if (this.formService.isOverheadCostsEnabled && results.totals.overheadCosts > 0) {
      slices.push({
        label: 'Koszty okołokredytowe',
        value: results.totals.overheadCosts,
        color: 'var(--c-cost)',
        variant: ColorCodeArea.COST,
        children: this.overheadCostBreakdownService.buildCostChildren(
          results.totals.overheadCostsBreakdown,
        ),
      });
    }
    if (this.formService.isPrepaymentEnabled && results.totals.prepayments > 0) {
      slices.push({
        label: 'Nadpłaty',
        value: results.totals.prepayments,
        color: 'var(--c-over)',
        variant: ColorCodeArea.PREPAYMENT,
        navigationTarget: PREPAYMENTS_NAVIGATION_TARGET,
      });
    }
    return slices;
  });

  private formatPercentage(value: number): string {
    const formatter = value < 0.05 ? this.percentageFormat2 : this.percentageFormat1;
    return `${formatter.format(value)}%`;
  }

  centerContent = computed<{ label: string; value: string }>(() => {
    const label = this.activeLabel();
    const results = this.results();
    if (!label || !results) return { label: '', value: '' };

    const cumulative = this.cumulativeToSelected();
    const totalAllPayments = cumulative?.total ?? results.totals.totalAllPayments;
    const loanAmount = results.totals.totalCapital;

    if (label === LEGEND_TOTAL_ACTIVE) {
      const percentage = loanAmount > 0 ? (totalAllPayments / loanAmount) * 100 : 0;
      return { label: '% kwoty kredytu', value: this.formatPercentage(percentage) };
    }

    for (const slice of this.totalSlices()) {
      if (slice.label === label) {
        const percentage = totalAllPayments > 0 ? (slice.value / totalAllPayments) * 100 : 0;
        return { label: '% sumy płatności', value: this.formatPercentage(percentage) };
      }
      for (const child of slice.children ?? []) {
        if (child.label === label) {
          const percentage = totalAllPayments > 0 ? (child.value / totalAllPayments) * 100 : 0;
          return { label: '% sumy płatności', value: this.formatPercentage(percentage) };
        }
      }
    }

    return { label: '', value: '' };
  });
}
