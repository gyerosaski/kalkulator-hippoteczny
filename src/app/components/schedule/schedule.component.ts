import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { YearGroup } from '../../model/mortgage.model';
import { FormatMonthPlPipe } from '../../pipes/format-month-pl.pipe';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatTableModule, FormatMonthPlPipe],
  templateUrl: './schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent {
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
