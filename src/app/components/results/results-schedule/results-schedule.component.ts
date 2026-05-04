import { Component, input, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { YearGroup } from '../../../model/mortgage.model';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { FormatCurrencyAmountPipe } from '../../../pipes/format-currency-amount/format-currency-amount.pipe';
import { FormService } from '../../../services/form/form';
@Component({
  selector: 'app-results-schedule',
  standalone: true,
  imports: [
    MatExpansionModule,
    MatTableModule,
    FormatMonthPipe,
    FormatAmountPipe,
    FormatCurrencyAmountPipe,
  ],
  templateUrl: './results-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsScheduleComponent {
  yearlyGroups = input.required<YearGroup[] | null>();
  private readonly formService = inject(FormService);

  get isPrepaymentIncluded(): boolean {
    return this.formService.isPrepaymentIncluded;
  }

  get isOverheadCostsIncluded(): boolean {
    return this.formService.isOverheadCostsIncluded;
  }

  get displayedColumns(): string[] {
    const cols = ['date', 'rate', 'capital', 'interest'];
    if (this.isPrepaymentIncluded) cols.push('prepayment');
    if (this.isOverheadCostsIncluded) cols.push('overheadCosts');
    cols.push('remaining');
    return cols;
  }
}
