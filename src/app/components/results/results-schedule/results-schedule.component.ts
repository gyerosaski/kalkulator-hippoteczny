import { Component, input, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { YearGroup } from '../../../model/mortgage.model';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { FormService } from '../../../services/form/form';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { IconChevronDownComponent } from '../../icons/icon-chevron-down/icon-chevron-down.component';

@Component({
  selector: 'app-results-schedule',
  standalone: true,
  imports: [FormatMonthPipe, FormatAmountPipe, IconChevronRightComponent, IconChevronDownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-schedule.component.html',
})
export class ResultsScheduleComponent {
  yearlyGroups = input.required<YearGroup[] | null>();
  private readonly formService = inject(FormService);

  expandedYear = signal<number | null>(null);

  get isPrepaymentEnabled(): boolean {
    return this.formService.isPrepaymentEnabled;
  }

  get isOverheadCostsEnabled(): boolean {
    return this.formService.isOverheadCostsEnabled;
  }

  get gridColumns(): string {
    const cols = ['1.4fr', '1fr', '1fr', '1fr'];
    if (this.isPrepaymentEnabled) cols.push('1fr');
    if (this.isOverheadCostsEnabled) cols.push('1fr');
    cols.push('1.2fr');
    return cols.join(' ');
  }

  toggle(year: number): void {
    this.expandedYear.update((curr) => (curr === year ? null : year));
  }
}
