import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CalcService } from '../calc.service';
import { DonutComponent, DonutSlice } from './donut.component';
import { PlnPipe } from '../pipes/pln.pipe';
import { MonthLabelPipe } from '../pipes/month-label.pipe';

@Component({
  selector: 'app-first-installment',
  standalone: true,
  imports: [DonutComponent, PlnPipe, MonthLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-head">
        <h3>
          @if (selectedRow(); as row) {
            Struktura raty w miesiącu
            <span class="card-head-suffix">{{ row.date | monthLabel }}</span>
          } @else {
            Struktura pierwszej raty
          }
        </h3>
      </div>
      <div class="donut-row donut-row--single">
        <app-donut
          [data]="slices()"
          [size]="160"
          [thickness]="22"
          centerLabel="rata"
          [centerValue]="rataValue() | pln: 0"
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
  selectedRow = this.calc.selectedRow;

  /** Wiersz, którego strukturę pokazujemy: zaznaczony przez użytkownika albo pierwszy. */
  private displayRow = computed(() => this.selectedRow() ?? this.calc.schedule().rows[0] ?? null);

  slices = computed<DonutSlice[]>(() => {
    const row = this.displayRow();
    if (!row) return [];
    return [
      { label: 'Kapitał', value: row.principal, color: 'var(--c-cap)' },
      { label: 'Odsetki', value: row.interest, color: 'var(--c-int)' },
    ];
  });

  rataValue = computed(() => this.displayRow()?.rata ?? this.calc.schedule().firstInstallment ?? 0);
}
