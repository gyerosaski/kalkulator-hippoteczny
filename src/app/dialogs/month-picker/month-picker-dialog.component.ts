import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  viewChild,
  ElementRef,
} from '@angular/core';
import { IconChevronRightComponent } from '../../components/icons/icon-chevron-right/icon-chevron-right.component';

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
  imports: [IconChevronRightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './month-picker-dialog.component.html',
  styleUrl: './month-picker-dialog.component.scss',
})
export class MonthPickerDialogComponent {
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  protected readonly monthNamesShort = MONTH_NAMES_SHORT;
  private readonly todayYear = new Date().getFullYear();
  private readonly todayMonth = new Date().getMonth();

  protected readonly stagedYear = signal(this.todayYear);
  protected readonly stagedMonth = signal(this.todayMonth);
  protected readonly decadeStart = signal(Math.floor(this.todayYear / 10) * 10);
  private readonly committedYear = signal(this.todayYear);
  private readonly committedMonth = signal(this.todayMonth);

  private resolvePromise?: (value: string | null) => void;
  private resolvedValue: string | null = null;

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
    this.resolvedValue = null;
    this.dialogRef().nativeElement.showModal();
    return new Promise((resolve) => (this.resolvePromise = resolve));
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
    this.resolvedValue = `${year}-${month}`;
    this.dialogRef().nativeElement.close();
  }

  protected cancel(): void {
    this.dialogRef().nativeElement.close();
  }

  protected onClose(): void {
    this.resolvePromise?.(this.resolvedValue);
    this.resolvePromise = undefined;
    this.resolvedValue = null;
  }
}
