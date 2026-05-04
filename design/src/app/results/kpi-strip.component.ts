import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CalcService } from '../calc.service';
import { PlnPipe } from '../pipes/pln.pipe';

@Component({
  selector: 'app-kpi-strip',
  standalone: true,
  imports: [PlnPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpi-strip">
      <div class="kpi">
        <div class="kpi-lab">Pierwsza rata</div>
        <div class="kpi-val mono">{{ calc.schedule().firstInstallment | pln }}<span class="kpi-unit">zł</span></div>
        <div class="kpi-meta">{{ calc.installmentType() }} · {{ calc.rateType() }} {{ effRate() | number:'1.2-2' }}%</div>
      </div>
      <div class="kpi">
        <div class="kpi-lab">Suma wszystkich płatności</div>
        <div class="kpi-val mono">{{ calc.schedule().totalPayments | pln }}<span class="kpi-unit">zł</span></div>
        <div class="kpi-meta">oddasz <b>{{ oddasz() | number:'1.0-0' }}%</b> pożyczonej kwoty</div>
      </div>
      <div class="kpi">
        <div class="kpi-lab">Odsetki</div>
        <div class="kpi-val mono">{{ calc.schedule().totalInterest | pln }}<span class="kpi-unit">zł</span></div>
        <div class="kpi-meta">{{ intPct() | number:'1.1-1' }}% od kapitału</div>
      </div>
      <div class="kpi">
        <div class="kpi-lab">Koszty okołokredytowe</div>
        <div class="kpi-val mono">{{ calc.schedule().totalCosts | pln }}<span class="kpi-unit">zł</span></div>
        <div class="kpi-meta">prowizja {{ calc.schedule().commission | pln }} · wycena {{ calc.schedule().valuationFee | pln }}</div>
      </div>
    </div>
  `,
})
export class KpiStripComponent {
  calc = inject(CalcService);
  effRate = computed(() =>
    this.calc.rateType() === 'zmienna' ? this.calc.wibor() + this.calc.margin() : this.calc.rate()
  );
  oddasz = computed(() => this.calc.schedule().totalPayments / this.calc.loanAmount() * 100);
  intPct = computed(() => this.calc.schedule().totalInterest / this.calc.loanAmount() * 100);
}
