import { Component, input, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MortgageResults } from '../../../model/mortgage.model';
import { FormService } from '../../../services/form/form';
import { KpiComponent } from '../../ui/kpi/kpi.component';

@Component({
  selector: 'app-results-summary',
  standalone: true,
  imports: [DecimalPipe, KpiComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-summary.component.html',
})
export class ResultsSummaryComponent {
  results = input.required<MortgageResults | null>();
  private readonly formService = inject(FormService);
  private readonly fmt = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

  get isTrancheIncluded(): boolean {
    return this.formService.isTrancheIncluded;
  }

  get firstInstallmentLabel(): string {
    return this.isTrancheIncluded ? 'Pierwsza pełna rata' : 'Pierwsza rata';
  }

  get kpi4Label(): string {
    if (this.isOverheadCostsIncluded && this.isPrepaymentIncluded) return 'Koszty i nadpłaty';
    if (this.isPrepaymentIncluded) return 'Nadpłaty';
    return 'Koszty okołokredytowe';
  }

  intPct = computed(() => {
    const r = this.results();
    if (!r || !r.totals.totalCapital) return 0;
    return (r.totals.totalInterest / r.totals.totalCapital) * 100;
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
