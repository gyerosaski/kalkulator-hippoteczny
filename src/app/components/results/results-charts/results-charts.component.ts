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
  template: `
    @if (results()) {
      <div class="result-grid">
        <div class="card">
          <div class="card-head">
            <div>
              <h3>Struktura wszystkich płatności</h3>
              <div class="muted small">cały okres kredytowania</div>
            </div>
          </div>
          <div class="donut-row">
            <app-donut [data]="totalSlices()" centerLabel="razem" [centerValue]="totalCenter()" />
            <ul class="legend">
              @for (s of totalSlices(); track s.label) {
                <li>
                  <span class="dot" [style.background]="s.color"></span>
                  <span class="leg-lab">{{ s.label }}</span>
                  <span class="leg-val mono">{{ s.value | formatAmount }} zł</span>
                </li>
              }
            </ul>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>Struktura pierwszej raty</h3>
          </div>
          <div class="donut-row donut-row--single">
            <app-donut
              [data]="firstSlices()"
              [size]="160"
              [thickness]="22"
              centerLabel="rata"
              [centerValue]="firstCenter()"
            />
            <ul class="legend">
              @for (s of firstSlices(); track s.label) {
                <li>
                  <span class="dot" [style.background]="s.color"></span>
                  <span class="leg-lab">{{ s.label }}</span>
                  <span class="leg-val mono">{{ s.value | formatAmount }} zł</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </div>
    }
  `,
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
