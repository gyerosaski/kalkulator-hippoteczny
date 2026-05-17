import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MortgageResults } from '../../../model';
import {
  TrendAxisTick,
  TrendBarColumn,
  TrendBarSegmentRect,
  TrendChartGeometry,
  TrendLinePoint,
  TrendStackSegmentTotal,
  TrendTooltipModel,
  TrendXTick,
  YearGroup,
} from '../../../model';
import { FormatAmountPipe } from '../../../pipes/format-amount/format-amount.pipe';

interface StackSegmentDescriptor {
  readonly fieldKey: 'sumInterest' | 'sumInsuranceCost' | 'sumCapital' | 'sumPrepayment';
  readonly label: string;
  readonly color: string;
}

const STACK_SEGMENT_DESCRIPTORS: readonly StackSegmentDescriptor[] = [
  { fieldKey: 'sumInterest', label: 'Odsetki', color: 'var(--c-int)' },
  { fieldKey: 'sumInsuranceCost', label: 'Koszty okołokredytowe', color: 'var(--c-cost)' },
  { fieldKey: 'sumCapital', label: 'Kapitał', color: 'var(--c-cap)' },
  { fieldKey: 'sumPrepayment', label: 'Nadpłaty', color: 'var(--c-over)' },
];

const STACK_TICK_STEP = 5_000;
const BALANCE_TICK_STEP = 50_000;

const AXIS_AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const TITLE_MONTH_FORMATTER = new Intl.DateTimeFormat('pl-PL', {
  month: 'long',
  year: 'numeric',
});

function roundUpToStep(value: number, step: number): number {
  if (value <= 0) return step;
  return Math.ceil(value / step) * step;
}

function formatAxisAmount(value: number): string {
  return `${AXIS_AMOUNT_FORMATTER.format(value)} zł`;
}

function formatMonthYearLong(monthString: string | null | undefined): string {
  if (!monthString || !/^\d{4}-\d{2}$/.test(monthString)) return '';
  const [year, month] = monthString.split('-').map((part) => parseInt(part, 10));
  return TITLE_MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

@Component({
  selector: 'app-results-trend-chart',
  standalone: true,
  imports: [FormatAmountPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-trend-chart.component.html',
  styleUrl: './results-trend-chart.component.scss',
})
export class ResultsTrendChartComponent {
  yearlyGroups = input.required<YearGroup[] | null>();
  loanAmount = input.required<number | null>();
  results = input.required<MortgageResults>();
  overheadCostsEnabled = input.required<boolean>();
  prepaymentsEnabled = input.required<boolean>();

  protected readonly hoveredYearIndex = signal<number | null>(null);

  protected readonly chartTitle = computed(() => {
    const schedule = this.results().schedule;
    const startLabel = formatMonthYearLong(schedule[0]?.date);
    const endLabel = formatMonthYearLong(schedule[schedule.length - 1]?.date);
    if (!startLabel || !endLabel) return 'Harmonogram spłaty kredytu';
    return `Harmonogram spłaty kredytu: ${startLabel} - ${endLabel}`;
  });

  protected readonly geometry = computed<TrendChartGeometry | null>(() => {
    const groups = this.yearlyGroups();
    const loanAmount = this.loanAmount();
    if (!groups || groups.length === 0 || loanAmount === null || loanAmount <= 0) return null;

    const width = 1100;
    const height = 520;
    const paddingLeft = 96;
    const paddingRight = 96;
    const paddingTop = 16;
    const paddingBottom = 72;
    const innerWidth = width - paddingLeft - paddingRight;
    const innerHeight = height - paddingTop - paddingBottom;
    const yearCount = groups.length;

    const columnWidth = innerWidth / yearCount;
    const barWidth = Math.max(8, columnWidth * 0.74);
    const xCenterForIndex = (index: number) => paddingLeft + columnWidth * (index + 0.5);

    const visibleDescriptors = new Set(
      STACK_SEGMENT_DESCRIPTORS.filter((descriptor) => {
        if (descriptor.fieldKey === 'sumInsuranceCost') return this.overheadCostsEnabled();
        if (descriptor.fieldKey === 'sumPrepayment') return this.prepaymentsEnabled();
        return true;
      }),
    );

    const stackTotals = groups.map(
      (year) => year.sumInterest + year.sumInsuranceCost + year.sumCapital + year.sumPrepayment,
    );
    const maxStack = Math.max(0, ...stackTotals);
    const maxBalance = Math.max(loanAmount, ...groups.map((year) => year.lastRemaining));

    const stackAxisMax = roundUpToStep(maxStack, STACK_TICK_STEP);
    const balanceAxisMax = roundUpToStep(maxBalance, BALANCE_TICK_STEP);

    const yForStackValue = (value: number) =>
      paddingTop + innerHeight - (value / stackAxisMax) * innerHeight;
    const yForBalanceValue = (value: number) =>
      paddingTop + innerHeight - (value / balanceAxisMax) * innerHeight;

    const balanceTicks: TrendAxisTick[] = [];
    for (let tickValue = 0; tickValue <= balanceAxisMax + 0.5; tickValue += BALANCE_TICK_STEP) {
      balanceTicks.push({
        value: tickValue,
        position: yForBalanceValue(tickValue),
        label: formatAxisAmount(tickValue),
      });
    }

    const stackTicks: TrendAxisTick[] = [];
    for (let tickValue = 0; tickValue <= stackAxisMax + 0.5; tickValue += STACK_TICK_STEP) {
      stackTicks.push({
        value: tickValue,
        position: yForStackValue(tickValue),
        label: formatAxisAmount(tickValue),
      });
    }

    const bars: TrendBarColumn[] = groups.map((year, index) => {
      const centerX = xCenterForIndex(index);
      const segments: TrendBarSegmentRect[] = [];
      const segmentTotals: TrendStackSegmentTotal[] = [];
      let stackedSum = 0;
      let totalSum = 0;
      for (const descriptor of STACK_SEGMENT_DESCRIPTORS) {
        const segmentValue = year[descriptor.fieldKey];
        if (visibleDescriptors.has(descriptor)) {
          segmentTotals.push({
            label: descriptor.label,
            value: segmentValue,
            color: descriptor.color,
          });
        }
        totalSum += segmentValue;
        if (segmentValue <= 0) continue;
        const topY = yForStackValue(stackedSum + segmentValue);
        const bottomY = yForStackValue(stackedSum);
        stackedSum += segmentValue;
        segments.push({
          x: centerX - barWidth / 2,
          y: topY,
          width: barWidth,
          height: Math.max(0, bottomY - topY),
          color: descriptor.color,
        });
      }
      return {
        year: year.year,
        centerX,
        segments,
        segmentTotals,
        totalSum,
        endingBalance: year.lastRemaining,
      };
    });

    const linePoints: TrendLinePoint[] = [
      {
        x: paddingLeft,
        y: yForBalanceValue(loanAmount),
        value: loanAmount,
        year: null,
      },
      ...groups.map((year, index) => ({
        x: xCenterForIndex(index),
        y: yForBalanceValue(year.lastRemaining),
        value: year.lastRemaining,
        year: year.year,
      })),
    ];

    const linePath = linePoints
      .map(
        (point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
      )
      .join(' ');

    const xTicks: TrendXTick[] = groups.map((year, index) => ({
      year: year.year,
      x: xCenterForIndex(index),
    }));

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      innerWidth,
      innerHeight,
      columnWidth,
      bars,
      linePath,
      linePoints,
      balanceTicks,
      stackTicks,
      xTicks,
    };
  });

  protected readonly tooltip = computed<TrendTooltipModel | null>(() => {
    const geometry = this.geometry();
    const index = this.hoveredYearIndex();
    if (!geometry || index === null) return null;
    const bar = geometry.bars[index];
    if (!bar) return null;

    const paddingX = 12;
    const paddingY = 12;
    const lineHeight = 18;
    const segmentLineCount = bar.segmentTotals.length;
    const tooltipWidth = 240;
    const tooltipHeight = paddingY * 2 + lineHeight * (segmentLineCount + 3) + 8;

    const chartRightEdge = geometry.paddingLeft + geometry.innerWidth;
    const placeOnLeftSide = bar.centerX > geometry.paddingLeft + geometry.innerWidth / 2;
    const horizontalOffset = 16;
    let tooltipX = placeOnLeftSide
      ? bar.centerX - horizontalOffset - tooltipWidth
      : bar.centerX + horizontalOffset;
    if (tooltipX < geometry.paddingLeft) tooltipX = geometry.paddingLeft;
    if (tooltipX + tooltipWidth > chartRightEdge) tooltipX = chartRightEdge - tooltipWidth;

    const tooltipY = Math.max(
      geometry.paddingTop + 4,
      Math.min(
        geometry.paddingTop + geometry.innerHeight - tooltipHeight - 4,
        geometry.paddingTop + 24,
      ),
    );

    return {
      bar,
      tooltipX,
      tooltipY,
      tooltipWidth,
      tooltipHeight,
      paddingX,
      paddingY,
      lineHeight,
    };
  });

  protected setHoveredIndex(index: number | null): void {
    this.hoveredYearIndex.set(index);
  }
}
