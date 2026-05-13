import { Component, input, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { InstallmentType, MortgageResults, RateType } from '../../../model/mortgage.model';
import { FormService } from '../../../services/form/form';
import { InstallmentTypeLabelPipe } from '../../../pipes/installment-type-label/installment-type-label.pipe';
import { RateTypeLabelPipe } from '../../../pipes/rate-type-label/rate-type-label.pipe';
import { KpiComponent } from '../../ui/kpi/kpi.component';

@Component({
  selector: 'app-results-summary',
  standalone: true,
  imports: [DecimalPipe, KpiComponent, InstallmentTypeLabelPipe, RateTypeLabelPipe],
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

  get installmentType(): InstallmentType {
    return this.formService.form.controls.basicData.controls.installmentType.value;
  }

  get rateType(): RateType {
    return (
      (this.formService.ratePeriodsArray.at(0)?.value?.rateType as RateType) ?? RateType.VARIABLE
    );
  }

  get isPrepaymentEnabled(): boolean {
    return this.formService.isPrepaymentEnabled;
  }

  get isOverheadCostsEnabled(): boolean {
    return this.formService.isOverheadCostsEnabled;
  }

  get isTranchesEnabled(): boolean {
    return this.formService.isTranchesEnabled;
  }

  get firstInstallmentLabel(): string {
    return this.isTranchesEnabled ? 'Pierwsza pełna rata' : 'Pierwsza rata';
  }

  get kpi4Label(): string {
    if (this.isOverheadCostsEnabled && this.isPrepaymentEnabled) return 'Koszty i nadpłaty';
    if (this.isPrepaymentEnabled) return 'Nadpłaty';
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
    if (this.isOverheadCostsEnabled && r.totals.overheadCosts) {
      parts.push(`koszty ${this.fmt.format(r.totals.overheadCosts)} zł`);
    }
    if (this.isPrepaymentEnabled && r.totals.prepayments) {
      parts.push(`nadpłaty ${this.fmt.format(r.totals.prepayments)} zł`);
    }
    return parts.join(' · ');
  });
}
