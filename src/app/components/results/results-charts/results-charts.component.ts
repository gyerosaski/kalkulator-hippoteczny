import { Component, input, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { MortgageResults } from '../../../model/mortgage.model';
import { DonutComponent, DonutSlice } from '../../ui/donut/donut.component';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormService } from '../../../services/form/form';

@Component({
  selector: 'app-results-charts',
  standalone: true,
  imports: [DonutComponent, FormatAmountPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-charts.component.html',
})
export class ResultsChartsComponent {
  results = input.required<MortgageResults | null>();
  private readonly formService = inject(FormService);
  private readonly intl = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });

  firstSlices = computed<DonutSlice[]>(() => {
    const r = this.results();
    const fi = r?.firstInstallment;
    if (!fi) return [];
    return [
      { label: 'Kapitał', value: fi.capital, color: 'var(--c-cap)' },
      { label: 'Odsetki', value: fi.interest, color: 'var(--c-int)' },
    ];
  });

  firstCenter = computed(() => {
    const fi = this.results()?.firstInstallment;
    if (!fi) return '';
    return this.intl.format(fi.rate);
  });

  totalSlices = computed<DonutSlice[]>(() => {
    const r = this.results();
    if (!r) return [];
    const slices: DonutSlice[] = [
      { label: 'Kapitał', value: r.totals.totalCapital, color: 'var(--c-cap)' },
      { label: 'Odsetki', value: r.totals.totalInterest, color: 'var(--c-int)' },
    ];
    if (this.formService.isOverheadCostsIncluded && r.totals.overheadCosts > 0) {
      slices.push({
        label: 'Koszty okołokredytowe',
        value: r.totals.overheadCosts,
        color: 'var(--c-cost)',
      });
    }
    if (this.formService.isPrepaymentIncluded && r.totals.prepayments > 0) {
      slices.push({ label: 'Nadpłaty', value: r.totals.prepayments, color: 'var(--c-over)' });
    }
    return slices;
  });

  totalCenter = computed(() => {
    const r = this.results();
    if (!r) return '';
    const k = Math.round(r.totals.totalAllPayments / 1000);
    return `${this.intl.format(k)}k`;
  });
}
