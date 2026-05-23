import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';

import { InstallmentType, RateType, SavedCalculation } from '../../../model';
import { RelativeTimePipe } from '../../../pipes/relative-time/relative-time.pipe';
import { IconArrowRightComponent } from '../../icons/icon-arrow-right/icon-arrow-right.component';
import { IconDotsComponent } from '../../icons/icon-dots/icon-dots.component';
import { IconDuplicateComponent } from '../../icons/icon-duplicate/icon-duplicate.component';
import { IconEditComponent } from '../../icons/icon-edit/icon-edit.component';
import { IconTrashComponent } from '../../icons/icon-trash/icon-trash.component';

@Component({
  selector: 'app-calculations-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculations-list.component.html',
  styleUrl: './calculations-list.component.scss',
  imports: [
    RelativeTimePipe,
    IconArrowRightComponent,
    IconDotsComponent,
    IconEditComponent,
    IconDuplicateComponent,
    IconTrashComponent,
  ],
})
export class CalculationsListComponent {
  readonly calculations = input.required<SavedCalculation[]>();
  readonly activeCalculationName = input.required<string | null>();
  readonly hasActiveFilter = input.required<boolean>();

  readonly load = output<SavedCalculation>();
  readonly rename = output<SavedCalculation>();
  readonly delete = output<SavedCalculation>();
  readonly duplicate = output<SavedCalculation>();
  readonly clearFilters = output<void>();

  protected readonly InstallmentType = InstallmentType;
  protected readonly RateType = RateType;

  readonly openMenuName = signal<string | null>(null);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openMenuName.set(null);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest?.('.actions-menu-wrap')) {
      this.openMenuName.set(null);
    }
  }

  toggleMenu(event: MouseEvent, name: string): void {
    event.stopPropagation();
    this.openMenuName.set(this.openMenuName() === name ? null : name);
  }

  formatWholeAmount(value: number): string {
    return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value);
  }

  formatDecimalAmount(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatPercent(value: number, decimals = 2): string {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  formatPeriod(calculation: SavedCalculation): string {
    if (calculation.loanPeriodExtraMonths === 0) {
      return `${calculation.loanPeriodYears} lat`;
    }
    return `${calculation.loanPeriodYears} l. ${calculation.loanPeriodExtraMonths} m-cy`;
  }

  ltvOf(calculation: SavedCalculation): number {
    return calculation.propertyValue
      ? (calculation.loanAmount / calculation.propertyValue) * 100
      : 0;
  }

  formatExactDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
