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
import { DonutComponent } from '../../ui/donut/donut.component';
import { LegendComponent } from '../../ui/legend/legend.component';
import { FormService } from '../../../services/form/form';
import { CardComponent } from '../../ui/card/card.component';
import { OverheadCostBreakdownService } from '../../../services/overhead-cost-breakdown/overhead-cost-breakdown.service';
import { InterestBreakdownService } from '../../../services/interest-breakdown/interest-breakdown.service';
import { PREPAYMENTS_NAVIGATION_TARGET } from '../../../helpers/form-navigation.helper';

@Component({
  selector: 'app-results-donut-chart-installment',
  standalone: true,
  imports: [DonutComponent, LegendComponent, FormatMonthPipe, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-donut-chart-installment.component.html',
  styleUrl: './results-donut-chart-installment.component.scss',
})
export class ResultsDonutChartInstallmentComponent {
  results = input.required<MortgageResults | null>();
  protected readonly LegendId = LegendId;
  protected readonly activeLabel = signal<string | null>(null);
  private readonly formService = inject(FormService);
  private readonly uiStateService = inject(UiStateService);
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
    const selectedIndex = this.uiStateService.selectedMonthIndex();
    if (selectedIndex === null) return null;
    return this.results()?.schedule.find((row) => row.index === selectedIndex) ?? null;
  });

  firstSlices = computed<ChartSlice[]>(() => {
    const selectedRow = this.selectedRow();
    if (selectedRow) {
      const slices: ChartSlice[] = [
        {
          label: 'Kapitał',
          value: selectedRow.capital,
          color: 'var(--c-cap)',
          variant: ColorCodeArea.CAPITAL,
        },
        this.buildInterestSlice(selectedRow.interest, selectedRow.interestBreakdown),
      ];
      if (this.formService.isOverheadCostsEnabled && selectedRow.insuranceCost > 0) {
        slices.push({
          label: 'Koszty okołokredytowe',
          value: selectedRow.insuranceCost,
          color: 'var(--c-cost)',
          variant: ColorCodeArea.COST,
          children: this.overheadCostBreakdownService.buildCostChildren(selectedRow.costBreakdown),
        });
      }
      if (this.formService.isPrepaymentEnabled && selectedRow.prepayment > 0) {
        slices.push({
          label: 'Nadpłaty',
          value: selectedRow.prepayment,
          color: 'var(--c-over)',
          variant: ColorCodeArea.PREPAYMENT,
          navigationTarget: PREPAYMENTS_NAVIGATION_TARGET,
        });
      }
      return slices;
    }
    const results = this.results();
    const firstInstallment = results?.firstInstallment;
    if (!firstInstallment) return [];
    return [
      {
        label: 'Kapitał',
        value: firstInstallment.capital,
        color: 'var(--c-cap)',
        variant: ColorCodeArea.CAPITAL,
      },
      this.buildInterestSlice(firstInstallment.interest, firstInstallment.interestBreakdown),
    ];
  });

  private formatPercentage(value: number): string {
    const formatter = value < 0.05 ? this.percentageFormat2 : this.percentageFormat1;
    return `${formatter.format(value)}%`;
  }

  centerContent = computed<{ label: string; value: string }>(() => {
    const label = this.activeLabel();
    if (!label || label === LEGEND_TOTAL_ACTIVE) return { label: '', value: '' };

    const slices = this.firstSlices();
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);

    for (const slice of slices) {
      if (slice.label === label) {
        const percentage = total > 0 ? (slice.value / total) * 100 : 0;
        return { label: '% raty', value: this.formatPercentage(percentage) };
      }
      for (const child of slice.children ?? []) {
        if (child.label === label) {
          const percentage = total > 0 ? (child.value / total) * 100 : 0;
          return { label: '% raty', value: this.formatPercentage(percentage) };
        }
      }
    }

    return { label: '', value: '' };
  });
}
