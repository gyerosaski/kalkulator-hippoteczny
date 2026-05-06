import { Component, input, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { YearGroup } from '../../../model/mortgage.model';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { FormService } from '../../../services/form/form';

@Component({
  selector: 'app-results-schedule',
  standalone: true,
  imports: [FormatMonthPipe, FormatAmountPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (yearlyGroups()?.length) {
      <div class="card card--table">
        <div class="card-head">
          <h3>Harmonogram spłaty</h3>
          <div class="muted small">agregacja roczna · kliknij rok aby rozwinąć</div>
        </div>
        <div class="tbl" [style.--tbl-cols]="gridColumns">
          <div class="tbl-head">
            <div>Okres</div>
            <div>Rata</div>
            <div>Kapitał</div>
            <div>Odsetki</div>
            @if (isPrepaymentIncluded) {
              <div>Nadpłaty</div>
            }
            @if (isOverheadCostsIncluded) {
              <div>Koszty</div>
            }
            <div>Pozostało</div>
          </div>
          @for (y of yearlyGroups()!; track y.year) {
            <button
              class="tbl-row tbl-row--year"
              [class.is-open]="expandedYear() === y.year"
              (click)="toggle(y.year)"
            >
              <div class="cell-year"><span class="chev">▸</span>{{ y.year }}</div>
              <div class="mono">{{ y.sumRate | formatAmount }}</div>
              <div class="mono">{{ y.sumCapital | formatAmount }}</div>
              <div class="mono">{{ y.sumInterest | formatAmount }}</div>
              @if (isPrepaymentIncluded) {
                <div class="mono">{{ y.sumPrepayment | formatAmount }}</div>
              }
              @if (isOverheadCostsIncluded) {
                <div class="mono">{{ y.sumInsuranceCost | formatAmount }}</div>
              }
              <div class="mono">
                <b>{{ y.lastRemaining | formatAmount }}</b>
              </div>
            </button>
            @if (expandedYear() === y.year) {
              @for (r of y.rows; track r.index) {
                <div class="tbl-row tbl-row--month">
                  <div class="cell-month">{{ r.date | formatMonth }}</div>
                  <div class="mono">{{ r.rate | formatAmount }}</div>
                  <div class="mono">{{ r.capital | formatAmount }}</div>
                  <div class="mono">{{ r.interest | formatAmount }}</div>
                  @if (isPrepaymentIncluded) {
                    <div class="mono">{{ r.prepayment | formatAmount }}</div>
                  }
                  @if (isOverheadCostsIncluded) {
                    <div class="mono">{{ r.insuranceCost | formatAmount }}</div>
                  }
                  <div class="mono">{{ r.remaining | formatAmount }}</div>
                </div>
              }
            }
          }
        </div>
      </div>
    }
  `,
})
export class ResultsScheduleComponent {
  yearlyGroups = input.required<YearGroup[] | null>();
  private readonly formService = inject(FormService);

  expandedYear = signal<number | null>(null);

  get isPrepaymentIncluded(): boolean {
    return this.formService.isPrepaymentIncluded;
  }

  get isOverheadCostsIncluded(): boolean {
    return this.formService.isOverheadCostsIncluded;
  }

  get gridColumns(): string {
    const cols = ['1.4fr', '1fr', '1fr', '1fr'];
    if (this.isPrepaymentIncluded) cols.push('1fr');
    if (this.isOverheadCostsIncluded) cols.push('1fr');
    cols.push('1.2fr');
    return cols.join(' ');
  }

  toggle(year: number): void {
    this.expandedYear.update((curr) => (curr === year ? null : year));
  }
}
