import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CalcService } from '../calc.service';
import { PlnPipe } from '../pipes/pln.pipe';
import { MonthLabelPipe } from '../pipes/month-label.pipe';

@Component({
  selector: 'app-schedule-table',
  standalone: true,
  imports: [PlnPipe, MonthLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card--table">
      <div class="card-head">
        <h3>Tabela harmonogramu</h3>
        <div class="muted small">agregacja roczna · kliknij rok aby rozwinąć</div>
      </div>
      <div class="tbl">
        <div class="tbl-head">
          <div>Okres</div>
          <div>Rata</div>
          <div><span class="col-dot col-dot--cap"></span>Kapitał</div>
          <div><span class="col-dot col-dot--int"></span>Odsetki</div>
          <div><span class="col-dot col-dot--over"></span>Nadpłaty</div>
          <div><span class="col-dot col-dot--cost"></span>Koszty</div>
          <div>Pozostało</div>
        </div>
        @for (y of visibleYears(); track y.year) {
          <button
            class="tbl-row tbl-row--year"
            [class.is-open]="expandedYear() === y.year"
            (click)="toggle(y.year)"
          >
            <div class="cell-year"><span class="chev">▸</span>{{ y.year }}</div>
            <div class="mono">{{ y.rata | pln }}</div>
            <div class="mono num--cap" [class.num--zero]="!y.principal">
              {{ y.principal | pln }}
            </div>
            <div class="mono num--int" [class.num--zero]="!y.interest">{{ y.interest | pln }}</div>
            <div class="mono num--over" [class.num--zero]="!y.overpayment">
              {{ y.overpayment | pln }}
            </div>
            <div class="mono num--cost" [class.num--zero]="!y.monthlyCost">
              {{ y.monthlyCost | pln }}
            </div>
            <div class="mono">
              <b>{{ y.balance | pln }}</b>
            </div>
          </button>
          @if (expandedYear() === y.year) {
            @for (r of y.rows; track r.idx) {
              <div class="tbl-row tbl-row--month">
                <div class="cell-month">{{ r.date | monthLabel }}</div>
                <div class="mono">{{ r.rata | pln }}</div>
                <div class="mono num--cap" [class.num--zero]="!r.principal">
                  {{ r.principal | pln }}
                </div>
                <div class="mono num--int" [class.num--zero]="!r.interest">
                  {{ r.interest | pln }}
                </div>
                <div class="mono num--over" [class.num--zero]="!r.overpayment">
                  {{ r.overpayment | pln }}
                </div>
                <div class="mono num--cost" [class.num--zero]="!r.monthlyCost">
                  {{ r.monthlyCost | pln }}
                </div>
                <div class="mono">{{ r.balance | pln }}</div>
              </div>
            }
          }
        }
        @if (totalYears() > 8) {
          <div class="tbl-foot muted small">…{{ totalYears() - 8 }} kolejnych lat</div>
        }
      </div>
    </div>
  `,
})
export class ScheduleTableComponent {
  calc = inject(CalcService);
  expandedYear = signal<number | null>(null);
  visibleYears = computed(() => this.calc.schedule().yearly.slice(0, 8));
  totalYears = computed(() => this.calc.schedule().yearly.length);

  toggle(y: number) {
    this.expandedYear.update((curr) => (curr === y ? null : y));
  }
}
