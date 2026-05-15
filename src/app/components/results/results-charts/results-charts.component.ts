import { Component, input, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { MortgageResults } from '../../../model/mortgage.model';
import { DonutComponent, DonutSlice } from '../../ui/donut/donut.component';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormService } from '../../../services/form/form';
import {
  ColorCodeMarkerComponent,
  ColorCodeMarkerVariant,
} from '../../ui/color-code-marker/color-code-marker.component';

interface ChartSlice extends DonutSlice {
  variant: ColorCodeMarkerVariant;
}

@Component({
  selector: 'app-results-charts',
  standalone: true,
  imports: [DonutComponent, FormatAmountPipe, ColorCodeMarkerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-charts.component.html',
})
export class ResultsChartsComponent {
  results = input.required<MortgageResults | null>();
  private readonly formService = inject(FormService);
  private readonly intl = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });

  firstSlices = computed<ChartSlice[]>(() => {
    const results = this.results();
    const firstInstallment = results?.firstInstallment;
    if (!firstInstallment) return [];
    return [
      {
        label: 'Kapitał',
        value: firstInstallment.capital,
        color: 'var(--c-cap)',
        variant: ColorCodeMarkerVariant.CAPITAL,
      },
      {
        label: 'Odsetki',
        value: firstInstallment.interest,
        color: 'var(--c-int)',
        variant: ColorCodeMarkerVariant.INTEREST,
      },
    ];
  });

  firstCenter = computed(() => {
    const firstInstallment = this.results()?.firstInstallment;
    if (!firstInstallment) return '';
    return this.intl.format(firstInstallment.rate);
  });

  totalSlices = computed<ChartSlice[]>(() => {
    const results = this.results();
    if (!results) return [];
    const slices: ChartSlice[] = [
      {
        label: 'Kapitał',
        value: results.totals.totalCapital,
        color: 'var(--c-cap)',
        variant: ColorCodeMarkerVariant.CAPITAL,
      },
      {
        label: 'Odsetki',
        value: results.totals.totalInterest,
        color: 'var(--c-int)',
        variant: ColorCodeMarkerVariant.INTEREST,
      },
    ];
    if (this.formService.isOverheadCostsEnabled && results.totals.overheadCosts > 0) {
      slices.push({
        label: 'Koszty okołokredytowe',
        value: results.totals.overheadCosts,
        color: 'var(--c-cost)',
        variant: ColorCodeMarkerVariant.COST,
      });
    }
    if (this.formService.isPrepaymentEnabled && results.totals.prepayments > 0) {
      slices.push({
        label: 'Nadpłaty',
        value: results.totals.prepayments,
        color: 'var(--c-over)',
        variant: ColorCodeMarkerVariant.PREPAYMENT,
      });
    }
    return slices;
  });

  totalCenter = computed(() => {
    const results = this.results();
    if (!results) return '';
    const totalInThousands = Math.round(results.totals.totalAllPayments / 1000);
    return `${this.intl.format(totalInThousands)}k`;
  });
}
