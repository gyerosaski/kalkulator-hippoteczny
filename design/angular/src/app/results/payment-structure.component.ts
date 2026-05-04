import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CalcService } from '../calc.service';
import { DonutComponent, DonutSlice } from './donut.component';
import { PlnPipe } from '../pipes/pln.pipe';

@Component({
  selector: 'app-payment-structure',
  standalone: true,
  imports: [DonutComponent, PlnPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-head">
        <div>
          <h3>Struktura wszystkich płatności</h3>
          <div class="muted small">cały okres kredytowania</div>
        </div>
        <button class="btn btn--mini">drukuj</button>
      </div>
      <div class="donut-row">
        <app-donut [data]="slices()" [centerLabel]="'Razem'" [centerValue]="centerVal()"/>
        <ul class="legend">
          @for (s of slices(); track s.label) {
            <li>
              <span class="dot" [style.background]="s.color"></span>
              <span class="leg-lab">{{ s.label }}</span>
              <span class="leg-val mono">{{ s.value | pln }} zł</span>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class PaymentStructureComponent {
  calc = inject(CalcService);
  slices = computed<DonutSlice[]>(() => {
    const r = this.calc.schedule();
    return [
      { label: 'Kapitał', value: this.calc.loanAmount(), color: 'var(--c-cap)' },
      { label: 'Odsetki', value: r.totalInterest, color: 'var(--c-int)' },
      { label: 'Koszty okołokredytowe', value: r.totalCosts, color: 'var(--c-cost)' },
      { label: 'Nadpłaty', value: r.totalOverpayments, color: 'var(--c-over)' },
    ];
  });
  centerVal = computed(() => `${(this.calc.schedule().totalPayments / 1000).toFixed(0)}k`);
}
