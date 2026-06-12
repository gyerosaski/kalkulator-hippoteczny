import {
  Component,
  input,
  ChangeDetectionStrategy,
  afterNextRender,
  inject,
  computed,
  signal,
} from '@angular/core';
import { YearGroup, ScheduleRow, MortgageResults } from '../../../model';
import { UiStateService } from '../../../services/ui-state/ui-state.service';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';
import { FormatMonthPipe } from '../../../pipes/format-month/format-month.pipe';
import { FormatRatePipe } from '../../../pipes/format-rate/format-rate.pipe';
import { FormService } from '../../../services/form/form';
import { IconChevronRightComponent } from '../../icons/icon-chevron-right/icon-chevron-right.component';
import { IconArrowRightComponent } from '../../icons/icon-arrow-right/icon-arrow-right.component';
import { ColorCodeArea } from '../../../model';
import { ColorCodeMarkerComponent } from '../../ui/color-code-marker/color-code-marker.component';
import { CardComponent } from '../../ui/card/card.component';

function formatMonthYearLong(monthString: string | null | undefined): string {
  if (!monthString || !/^\d{4}-\d{2}$/.test(monthString)) return '';
  const [year, month] = monthString.split('-').map((part) => parseInt(part, 10));
  return TITLE_MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

const TITLE_MONTH_FORMATTER = new Intl.DateTimeFormat('pl-PL', {
  month: 'long',
  year: 'numeric',
});

@Component({
  selector: 'app-results-schedule',
  standalone: true,
  imports: [
    FormatMonthPipe,
    FormatAmountPipe,
    FormatRatePipe,
    IconChevronRightComponent,
    IconArrowRightComponent,
    ColorCodeMarkerComponent,
    CardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-schedule.component.html',
  styleUrl: './results-schedule.component.scss',
})
export class ResultsScheduleComponent {
  yearlyGroups = input.required<YearGroup[] | null>();
  results = input.required<MortgageResults>();

  protected readonly ColorCodeMarkerVariant = ColorCodeArea;

  private readonly formService = inject(FormService);
  private readonly uiStateService = inject(UiStateService);

  readonly expandedYear = this.uiStateService.expandedScheduleYear;

  readonly selectedMonthIndex = this.uiStateService.selectedMonthIndex;

  protected readonly isAnimatable = signal(false);

  constructor() {
    afterNextRender(() => this.isAnimatable.set(true));
  }

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

  readonly isRateColumnEnabled = computed(() => this.results().hasRateChanges);

  get gridColumns(): string {
    const cols = ['1.4fr', '1fr', '1fr', '1fr'];
    if (this.isRateColumnEnabled()) cols.push('1fr');
    if (this.isPrepaymentEnabled) cols.push('1fr');
    if (this.isOverheadCostsEnabled) cols.push('1fr');
    cols.push('1.2fr');
    return cols.join(' ');
  }

  protected readonly chartTitle = computed(() => {
    const schedule = this.results().schedule;
    const startLabel = formatMonthYearLong(schedule[0]?.date);
    const endLabel = formatMonthYearLong(schedule[schedule.length - 1]?.date);
    if (!startLabel || !endLabel) return 'Harmonogram spłaty kredytu';
    return `Harmonogram spłaty kredytu: ${startLabel} - ${endLabel}`;
  });

  toggle(year: number): void {
    this.uiStateService.toggleScheduleYear(year);
  }

  selectMonth(rowIndex: number): void {
    this.uiStateService.toggleSelectedMonth(rowIndex);
  }

  clearSelection(): void {
    this.uiStateService.clearSelectedMonth();
  }
}
