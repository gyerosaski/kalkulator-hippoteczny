import { Component, input, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { YearGroup, ScheduleRow } from '../../../model/mortgage.model';
import { SelectedMonthService } from '../../../services/selected-month/selected-month.service';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { FormService } from '../../../services/form/form';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { IconChevronDownComponent } from '../../icons/icon-chevron-down/icon-chevron-down.component';
import { ColorCodeMarkerVariant } from '../../../model';
import { ColorCodeMarkerComponent } from '../../ui/color-code-marker/color-code-marker.component';
import { CardComponent } from '../../ui/card/card.component';

@Component({
  selector: 'app-results-schedule',
  standalone: true,
  imports: [
    FormatMonthPipe,
    FormatAmountPipe,
    IconChevronRightComponent,
    IconChevronDownComponent,
    ColorCodeMarkerComponent,
    CardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-schedule.component.html',
  styleUrl: './results-schedule.component.scss',
})
export class ResultsScheduleComponent {
  protected readonly ColorCodeMarkerVariant = ColorCodeMarkerVariant;

  yearlyGroups = input.required<YearGroup[] | null>();
  private readonly formService = inject(FormService);
  private readonly selectedMonthService = inject(SelectedMonthService);

  expandedYear = signal<number | null>(null);

  readonly selectedMonthIndex = this.selectedMonthService.selectedMonthIndex;

  readonly selectedScheduleRow = computed<ScheduleRow | null>(() => {
    const selectedIndex = this.selectedMonthIndex();
    if (selectedIndex === null) return null;
    for (const yearGroup of this.yearlyGroups() ?? []) {
      const foundRow = yearGroup.rows.find((row) => row.index === selectedIndex);
      if (foundRow) return foundRow;
    }
    return null;
  });

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

  selectMonth(rowIndex: number): void {
    this.selectedMonthService.toggleSelectedMonth(rowIndex);
  }

  clearSelection(): void {
    this.selectedMonthService.clearSelectedMonth();
  }
}
