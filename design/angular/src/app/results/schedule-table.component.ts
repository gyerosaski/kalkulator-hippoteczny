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
        <div class="muted small">
          agregacja roczna · kliknij rok aby rozwinąć
          @if (selectedRow(); as row) {
            · zaznaczony: <b>{{ row.date | monthLabel }}</b>
            <button class="link-btn" (click)="clearSelection()">odznacz</button>
          }
        </div>
      </div>
      <div class="tbl" [class.tbl--with-rate]="hasRateChange()">
        <div class="tbl-head">
          <div>Okres</div>
          <div>Rata</div>
          <div><span class="col-dot col-dot--cap"></span>Kapitał</div>
          <div><span class="col-dot col-dot--int"></span>Odsetki</div>
          @if (hasRateChange()) {
            <div>Oprocentowanie</div>
          }
          <div><span class="col-dot col-dot--over"></span>Nadpłaty</div>
          <div><span class="col-dot col-dot--cost"></span>Koszty</div>
          <div>Pozostało</div>
        </div>
        @for (y of visibleYears(); track y.year; let yi = $index) {
          @let yearChanges = y.rateMax - y.rateMin > 0.001;
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
            @if (hasRateChange()) {
              <div class="mono num--rate" [class.num--rate-range]="yearChanges">
                @if (yearChanges) {
                  <span class="rate-from">{{ ratePct(y.rateStart) }}%</span>
                  <span class="rate-arrow">→</span>
                  <span class="rate-to">{{ ratePct(y.rateEnd) }}%</span>
                } @else {
                  {{ ratePct(y.rateEnd) }}%
                }
              </div>
            }
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
            @for (r of y.rows; track r.idx; let ri = $index) {
              @let prevRate =
                ri > 0 ? y.rows[ri - 1].rate : yi > 0 ? visibleYears()[yi - 1].rateEnd : null;
              @let rateJump = prevRate !== null && Math.abs(r.rate - prevRate) > 0.001;
              <button
                type="button"
                class="tbl-row tbl-row--month"
                [class.is-selected]="selectedIdx() === r.idx"
                [attr.aria-pressed]="selectedIdx() === r.idx"
                (click)="selectMonth(r.idx)"
              >
                <div class="cell-month">{{ r.date | monthLabel }}</div>
                <div class="mono">{{ r.rata | pln }}</div>
                <div class="mono num--cap" [class.num--zero]="!r.principal">
                  {{ r.principal | pln }}
                </div>
                <div class="mono num--int" [class.num--zero]="!r.interest">
                  {{ r.interest | pln }}
                </div>
                @if (hasRateChange()) {
                  <div
                    class="mono num--rate"
                    [class.num--rate-jump]="rateJump"
                    [attr.title]="rateJump ? 'zmiana oprocentowania w tym miesiącu' : null"
                  >
                    {{ ratePct(r.rate) }}%
                  </div>
                }
                <div class="mono num--over" [class.num--zero]="!r.overpayment">
                  {{ r.overpayment | pln }}
                </div>
                <div class="mono num--cost" [class.num--zero]="!r.monthlyCost">
                  {{ r.monthlyCost | pln }}
                </div>
                <div class="mono">{{ r.balance | pln }}</div>
              </button>
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
  Math = Math;
  expandedYear = signal<number | null>(null);
  visibleYears = computed(() => this.calc.schedule().yearly.slice(0, 8));
  totalYears = computed(() => this.calc.schedule().yearly.length);
  hasRateChange = computed(() => this.calc.schedule().hasRateChange);
  selectedIdx = this.calc.selectedMonthIdx;
  selectedRow = this.calc.selectedRow;

  toggle(y: number) {
    this.expandedYear.update((curr) => (curr === y ? null : y));
  }
  selectMonth(idx: number) {
    this.calc.toggleSelectedMonth(idx);
  }
  clearSelection() {
    this.calc.clearSelectedMonth();
  }
  ratePct(v: number): string {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);
  }
}
