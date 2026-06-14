import { Component, ChangeDetectionStrategy, signal, computed, viewChild } from '@angular/core';

import { AbstractDialog } from '../../components/ui/dialog/abstract-dialog';
import { DialogComponent } from '../../components/ui/dialog/dialog.component';
import { IconChevronRightComponent } from '../../components/icons/icon-chevron-right/icon-chevron-right.component';

// TODO: pozbyć się na rzecz FormatMonthPipe
const MONTH_NAMES_SHORT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];

@Component({
  selector: 'ui-month-picker-dialog',
  standalone: true,
  imports: [DialogComponent, IconChevronRightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './month-picker-dialog.component.html',
  styleUrl: './month-picker-dialog.component.scss',
})
export class MonthPickerDialogComponent extends AbstractDialog<string | null> {
  protected readonly dialog = viewChild.required(DialogComponent);

  protected readonly monthNamesShort = MONTH_NAMES_SHORT;
  private readonly todayYear = new Date().getFullYear();
  private readonly todayMonth = new Date().getMonth();

  protected readonly stagedYear = signal(this.todayYear);
  protected readonly stagedMonth = signal(this.todayMonth);
  protected readonly decadeStart = signal(Math.floor(this.todayYear / 10) * 10);
  private readonly committedYear = signal(this.todayYear);
  private readonly committedMonth = signal(this.todayMonth);

  protected readonly years = computed(() => {
    const start = this.decadeStart();
    return Array.from({ length: 10 }, (_, index) => start + index);
  });

  protected isYearSelected(year: number): boolean {
    return year === this.committedYear();
  }

  protected isMonthSelected(monthIndex: number): boolean {
    return monthIndex === this.committedMonth() && this.stagedYear() === this.committedYear();
  }

  open(currentValue: string): Promise<string | null> {
    const [year, month] = this.parseYearMonth(currentValue);
    this.committedYear.set(year);
    this.committedMonth.set(month - 1);
    this.stagedYear.set(year);
    this.stagedMonth.set(month - 1);
    this.decadeStart.set(Math.floor(year / 10) * 10);
    return this.beginInteraction(null);
  }

  private parseYearMonth(value: string): [number, number] {
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      const [year, month] = value.split('-').map(Number);
      return [year, month];
    }
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1];
  }

  protected shiftDecade(delta: number): void {
    this.decadeStart.update((current) => current + delta);
  }

  protected pickMonth(monthIndex: number): void {
    this.stagedMonth.set(monthIndex);
    this.confirm();
  }

  protected confirm(): void {
    const year = this.stagedYear();
    const month = String(this.stagedMonth() + 1).padStart(2, '0');
    this.closeWith(`${year}-${month}`);
  }
}
