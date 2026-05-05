import { Component, input, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MortgageResults } from '../../../model/mortgage.model';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormService } from '../../../services/form/form';

@Component({
  selector: 'app-results-summary',
  standalone: true,
  imports: [FormatAmountPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (results(); as r) {
      <div class="kpi-strip">
        <div class="kpi">
          <div class="kpi-lab">Pierwsza rata</div>
          <div class="kpi-val mono">{{ r.firstInstallment?.rate | formatAmount }}<span class="kpi-unit">zł</span></div>
          <div class="kpi-meta">{{ installmentTypeLabel }} · {{ rateTypeLabel }} {{ r.effectiveRate | number:'1.2-2' }}%</div>
        </div>
        <div class="kpi">
          <div class="kpi-lab">Suma wszystkich płatności</div>
          <div class="kpi-val mono">{{ r.totals.totalAllPayments | formatAmount }}<span class="kpi-unit">zł</span></div>
          <div class="kpi-meta">oddasz <b>{{ r.totals.bankReturnRatioPct | number:'1.0-0' }}%</b> pożyczonej kwoty</div>
        </div>
        <div class="kpi">
          <div class="kpi-lab">Odsetki</div>
          <div class="kpi-val mono">{{ r.totals.totalInterest | formatAmount }}<span class="kpi-unit">zł</span></div>
          <div class="kpi-meta">{{ intPct() | number:'1.1-1' }}% od kapitału</div>
        </div>
        <div class="kpi">
          <div class="kpi-lab">{{ kpi4Label }}</div>
          <div class="kpi-val mono">{{ kpi4Value() | formatAmount }}<span class="kpi-unit">zł</span></div>
          @if (kpi4Meta()) {
            <div class="kpi-meta">{{ kpi4Meta() }}</div>
          }
        </div>
      </div>
    }
  `,
})
export class ResultsSummaryComponent {
  results = input.required<MortgageResults | null>();
  private readonly formService = inject(FormService);
  private readonly fmt = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  get installmentTypeLabel(): string {
    const v = this.formService.form.controls.basicData.controls.installmentType.value;
    return v === 'malejace' ? 'malejące' : 'równe';
  }

  get rateTypeLabel(): string {
    const rp = this.formService.ratePeriodsArray.at(0);
    return rp?.value?.rateType === 'stala' ? 'stałe' : 'zmienne';
  }

  get isPrepaymentIncluded(): boolean {
    return this.formService.isPrepaymentIncluded;
  }

  get isOverheadCostsIncluded(): boolean {
    return this.formService.isOverheadCostsIncluded;
  }

  get kpi4Label(): string {
    if (this.isOverheadCostsIncluded && this.isPrepaymentIncluded) return 'Koszty i nadpłaty';
    if (this.isPrepaymentIncluded) return 'Nadpłaty';
    return 'Koszty okołokredytowe';
  }

  intPct = computed(() => {
    const r = this.results();
    if (!r || !r.totals.totalCapital) return 0;
    return r.totals.totalInterest / r.totals.totalCapital * 100;
  });

  kpi4Value = computed(() => {
    const r = this.results();
    if (!r) return 0;
    return r.totals.overheadCosts + r.totals.prepayments;
  });

  kpi4Meta = computed(() => {
    const r = this.results();
    if (!r) return '';
    const parts: string[] = [];
    if (this.isOverheadCostsIncluded && r.totals.overheadCosts) {
      parts.push(`koszty ${this.fmt.format(r.totals.overheadCosts)} zł`);
    }
    if (this.isPrepaymentIncluded && r.totals.prepayments) {
      parts.push(`nadpłaty ${this.fmt.format(r.totals.prepayments)} zł`);
    }
    return parts.join(' · ');
  });
}
