import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CalcService } from '../calc.service';
import { DonutComponent, DonutSlice } from './donut.component';
import { PlnPipe } from '../pipes/pln.pipe';

@Component({
  selector: 'app-first-installment',
  standalone: true,
  imports: [DonutComponent, PlnPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-head">
        <h3>Struktura pierwszej raty</h3>
      </div>
      <div class="donut-row donut-row--single">
        <app-donut
          [data]="slices()"
          [size]="160"
          [thickness]="22"
          centerLabel="rata"
          [centerValue]="calc.schedule().firstInstallment | pln: 0"
        />
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
export class FirstInstallmentComponent {
  calc = inject(CalcService);
  slices = computed<DonutSlice[]>(() => {
    const first = this.calc.schedule().rows[0];
    if (!first) return [];
    return [
      { label: 'Kapitał', value: first.principal, color: 'var(--c-cap)' },
      { label: 'Odsetki', value: first.interest, color: 'var(--c-int)' },
    ];
  });
}
