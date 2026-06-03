import { Component, input, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import {
  MortgageResults,
  ScheduleRow,
  ColorCodeArea,
  ChartSlice,
  OverheadCostItem,
  LEGEND_TOTAL_ACTIVE,
} from '../../../model';
import { OverheadCostKindLabelPipe } from '../../../pipes/overhead-cost-kind-label/overhead-cost-kind-label.pipe';
import { SelectedMonthService } from '../../../services/selected-month/selected-month.service';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { DonutComponent } from '../../ui/donut/donut.component';
import { LegendComponent } from '../../ui/legend/legend.component';
import { FormService } from '../../../services/form/form';
import { CardComponent } from '../../ui/card/card.component';

@Component({
  selector: 'app-results-donut-chart-total',
  standalone: true,
  imports: [DonutComponent, LegendComponent, FormatMonthPipe, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-donut-chart-total.component.html',
  styleUrl: './results-donut-chart-total.component.scss',
})
export class ResultsDonutChartTotalComponent {
  results = input.required<MortgageResults | null>();
  protected readonly activeLabel = signal<string | null>(null);
  private readonly formService = inject(FormService);
  private readonly selectedMonthService = inject(SelectedMonthService);
  private readonly percentageFormat1 = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  private readonly percentageFormat2 = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly costKindLabel = new OverheadCostKindLabelPipe();

  private buildCostChildren(items: OverheadCostItem[]): ChartSlice[] {
    return items
      .filter((item) => item.value > 0)
      .map((item) => ({
        label: this.costKindLabel.transform(item),
        value: item.value,
        color: 'var(--c-cost)',
        variant: ColorCodeArea.COST,
      }));
  }

  /** agreguje rozbicie kosztów wielu wierszy po rodzaju (i nazwie dla kosztów dodatkowych). */
  private aggregateBreakdown(rows: ScheduleRow[]): OverheadCostItem[] {
    const byKey = new Map<string, OverheadCostItem>();
    for (const row of rows) {
      for (const item of row.costBreakdown) {
        const key = item.name ? `${item.kind}:${item.name}` : item.kind;
        const existing = byKey.get(key);
        if (existing) {
          existing.value += item.value;
        } else {
          byKey.set(key, { kind: item.kind, name: item.name, value: item.value });
        }
      }
    }
    return [...byKey.values()];
  }

  selectedRow = computed<ScheduleRow | null>(() => {
    const selectedIndex = this.selectedMonthService.selectedMonthIndex();
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
      costBreakdown: this.aggregateBreakdown(rowsUpToSelected),
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
        {
          label: 'Odsetki',
          value: cumulative.interest,
          color: 'var(--c-int)',
          variant: ColorCodeArea.INTEREST,
        },
      ];
      if (this.formService.isOverheadCostsEnabled && cumulative.costs > 0) {
        slices.push({
          label: 'Koszty okołokredytowe',
          value: cumulative.costs,
          color: 'var(--c-cost)',
          variant: ColorCodeArea.COST,
          children: this.buildCostChildren(cumulative.costBreakdown),
        });
      }
      if (this.formService.isPrepaymentEnabled && cumulative.prepayments > 0) {
        slices.push({
          label: 'Nadpłaty',
          value: cumulative.prepayments,
          color: 'var(--c-over)',
          variant: ColorCodeArea.PREPAYMENT,
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
      {
        label: 'Odsetki',
        value: results.totals.totalInterest,
        color: 'var(--c-int)',
        variant: ColorCodeArea.INTEREST,
      },
    ];
    if (this.formService.isOverheadCostsEnabled && results.totals.overheadCosts > 0) {
      slices.push({
        label: 'Koszty okołokredytowe',
        value: results.totals.overheadCosts,
        color: 'var(--c-cost)',
        variant: ColorCodeArea.COST,
        children: this.buildCostChildren(results.totals.overheadCostsBreakdown),
      });
    }
    if (this.formService.isPrepaymentEnabled && results.totals.prepayments > 0) {
      slices.push({
        label: 'Nadpłaty',
        value: results.totals.prepayments,
        color: 'var(--c-over)',
        variant: ColorCodeArea.PREPAYMENT,
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

  clearSelection(): void {
    this.selectedMonthService.clearSelectedMonth();
  }
}
