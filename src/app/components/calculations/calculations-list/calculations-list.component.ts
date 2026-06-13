import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { SlicePipe } from '@angular/common';

import {
  BadgeVariant,
  ExportFormat,
  InstallmentType,
  RateType,
  SavedCalculation,
} from '../../../model';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { ExportFormatLabelPipe } from '../../../pipes/export-format-label/export-format-label.pipe';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatExactDatePipe } from '../../../pipes/format-exact-date/format-exact-date.pipe';
import { FormatLoanPeriodPipe } from '../../../pipes/format-loan-period/format-loan-period.pipe';
import { FormatRatePipe } from '../../../pipes/format-rate/format-rate.pipe';
import { FormatWholeAmountPipe } from '../../../pipes/format-whole-amount/format-whole-amount.pipe';
import { RelativeTimePipe } from '../../../pipes/relative-time/relative-time.pipe';
import { IconArrowRightComponent } from '../../icons/icon-arrow-right/icon-arrow-right.component';
import { IconCalendarListComponent } from '../../icons/icon-calendar-list/icon-calendar-list.component';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { IconDotsComponent } from '../../icons/icon-dots/icon-dots.component';
import { IconDuplicateComponent } from '../../icons/icon-duplicate/icon-duplicate.component';
import { IconEditComponent } from '../../icons/icon-edit/icon-edit.component';
import { IconExportComponent } from '../../icons/icon-export/icon-export.component';
import { IconSaveComponent } from '../../icons/icon-save/icon-save.component';
import { IconTrashComponent } from '../../icons/icon-trash/icon-trash.component';

@Component({
  selector: 'app-calculations-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculations-list.component.html',
  styleUrl: './calculations-list.component.scss',
  imports: [
    SlicePipe,
    RelativeTimePipe,
    FormatWholeAmountPipe,
    FormatAmountPipe,
    FormatRatePipe,
    FormatLoanPeriodPipe,
    FormatExactDatePipe,
    IconArrowRightComponent,
    IconCalendarListComponent,
    IconChevronRightComponent,
    IconDotsComponent,
    IconEditComponent,
    IconDuplicateComponent,
    IconExportComponent,
    IconSaveComponent,
    IconTrashComponent,
    BadgeComponent,
    ExportFormatLabelPipe,
  ],
})
export class CalculationsListComponent {
  readonly calculations = input.required<SavedCalculation[]>();
  readonly activeCalculationName = input.required<string | null>();
  readonly isLoadedCalculationModified = input<boolean>(false);
  readonly hasActiveFilter = input.required<boolean>();

  readonly load = output<SavedCalculation>();
  readonly saveChanges = output<SavedCalculation>();
  readonly rename = output<SavedCalculation>();
  readonly delete = output<SavedCalculation>();
  readonly duplicate = output<SavedCalculation>();
  readonly exportRequested = output<{ calculation: SavedCalculation; format: ExportFormat }>();
  readonly clearFilters = output<void>();

  protected readonly InstallmentType = InstallmentType;
  protected readonly RateType = RateType;
  protected readonly BadgeVariant = BadgeVariant;
  protected readonly ExportFormat = ExportFormat;
  protected readonly exportFormats = Object.values(ExportFormat);

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

  ltvOf(calculation: SavedCalculation): number {
    return calculation.propertyValue
      ? (calculation.loanAmount / calculation.propertyValue) * 100
      : 0;
  }
}
