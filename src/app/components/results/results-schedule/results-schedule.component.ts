import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { YearGroup } from '../../../model/mortgage.model';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';

@Component({
  selector: 'app-results-schedule',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatTableModule, FormatMonthPipe, FormatAmountPipe],
  templateUrl: './results-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsScheduleComponent {
  yearlyGroups = input.required<YearGroup[] | null>();
  displayedColumns: string[] = [
    'date',
    'rate',
    'capital',
    'interest',
    'prepayment',
    'commission',
    'remaining',
  ];
}
