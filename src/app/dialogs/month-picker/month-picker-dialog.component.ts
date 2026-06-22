import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  viewChild,
  inject,
} from '@angular/core';

import { AbstractDialog } from '../../components/ui/dialog/abstract-dialog';
import { DialogComponent } from '../../components/ui/dialog/dialog.component';
import { IconChevronRightComponent } from '../../components/icons/icon-chevron-right/icon-chevron-right.component';
import { FormatMonthPipe } from '../../pipes/format-month/format-month.pipe';
import { FormService } from '../../services/form/form';
import { buildMonthPickerShortcuts } from '../../helpers/month-picker-shortcuts.helper';
import { MonthPickerShortcut } from '../../model';

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
  imports: [DialogComponent, IconChevronRightComponent, FormatMonthPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './month-picker-dialog.component.html',
  styleUrl: './month-picker-dialog.component.scss',
})
export class MonthPickerDialogComponent extends AbstractDialog<string | null> {
  protected readonly dialog = viewChild.required(DialogComponent);
  private readonly formService = inject(FormService);

  protected readonly monthNamesShort = MONTH_NAMES_SHORT;
  private readonly todayYear = new Date().getFullYear();
  private readonly todayMonth = new Date().getMonth();

  protected readonly stagedYear = signal(this.todayYear);
  protected readonly stagedMonth = signal(this.todayMonth);
  protected readonly decadeStart = signal(Math.floor(this.todayYear / 10) * 10);
  private readonly committedYear = signal(this.todayYear);
  private readonly committedMonth = signal(this.todayMonth);

  protected readonly shortcuts = signal<MonthPickerShortcut[]>([]);

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

  open(currentValue: string, showShortcuts = false): Promise<string | null> {
    const [year, month] = this.parseYearMonth(currentValue);
    this.committedYear.set(year);
    this.committedMonth.set(month - 1);
    this.stagedYear.set(year);
    this.stagedMonth.set(month - 1);
    this.decadeStart.set(Math.floor(year / 10) * 10);
    this.shortcuts.set(
      showShortcuts ? buildMonthPickerShortcuts(this.formService.monthPickerReferenceDates) : [],
    );
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

  protected pickShortcut(value: string): void {
    this.closeWith(value);
  }

  protected confirm(): void {
    const year = this.stagedYear();
    const month = String(this.stagedMonth() + 1).padStart(2, '0');
    this.closeWith(`${year}-${month}`);
  }
}
