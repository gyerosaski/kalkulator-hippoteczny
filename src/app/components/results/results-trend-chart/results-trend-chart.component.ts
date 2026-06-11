import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ChartSlice, ColorCodeArea, LEGEND_TOTAL_ACTIVE, MortgageResults } from '../../../model';
import {
  TrendAxisTick,
  TrendBarColumn,
  TrendBarSegmentRect,
  TrendChartGeometry,
  TrendLinePoint,
  TrendXTick,
  YearGroup,
} from '../../../model';
import { CardComponent } from '../../ui/card/card.component';
import { ColorCodeMarkerComponent } from '../../ui/color-code-marker/color-code-marker.component';
import { LegendComponent } from '../../ui/legend/legend.component';
import { OverheadCostBreakdownService } from '../../../services/overhead-cost-breakdown/overhead-cost-breakdown.service';
import { roundUpToStep } from '../../../helpers/chart-scale.helper';

interface StackSegmentDescriptor {
  readonly fieldKey: 'sumInterest' | 'sumInsuranceCost' | 'sumCapital' | 'sumPrepayment';
  readonly label: string;
  readonly color: string;
  readonly variant: ColorCodeArea;
}

const STACK_SEGMENT_DESCRIPTORS: readonly StackSegmentDescriptor[] = [
  {
    fieldKey: 'sumPrepayment',
    label: 'Nadpłaty',
    color: 'var(--c-over)',
    variant: ColorCodeArea.PREPAYMENT,
  },
  {
    fieldKey: 'sumCapital',
    label: 'Kapitał',
    color: 'var(--c-cap)',
    variant: ColorCodeArea.CAPITAL,
  },
  {
    fieldKey: 'sumInsuranceCost',
    label: 'Koszty okołokredytowe',
    color: 'var(--c-cost)',
    variant: ColorCodeArea.COST,
  },
  {
    fieldKey: 'sumInterest',
    label: 'Odsetki',
    color: 'var(--c-int)',
    variant: ColorCodeArea.INTEREST,
  },
];

const STACK_TICK_STEP = 5_000;
const BALANCE_TICK_STEP = 50_000;

const AXIS_AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });

function formatAxisAmount(value: number): string {
  return `${AXIS_AMOUNT_FORMATTER.format(value)} zł`;
}

@Component({
  selector: 'app-results-trend-chart',
  standalone: true,
  imports: [CardComponent, ColorCodeMarkerComponent, LegendComponent],
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
  /** Wymuszone maksimum osi salda — używane w widoku porównania do wspólnej skali obu wykresów. */
  forcedBalanceAxisMax = input<number | null>(null);
  /** Wymuszone maksimum osi sum rocznych — używane w widoku porównania do wspólnej skali obu wykresów. */
  forcedStackAxisMax = input<number | null>(null);

  protected readonly ColorCodeMarkerVariant = ColorCodeArea;
  protected readonly selectedYearIndex = signal<number | null>(null);
  protected readonly activeLabel = signal<string | null>(null);

  private readonly overheadCostBreakdownService = inject(OverheadCostBreakdownService);

  protected readonly geometry = computed<TrendChartGeometry | null>(() => {
    const groups = this.yearlyGroups();
    const loanAmount = this.loanAmount();
    if (!groups || groups.length === 0 || loanAmount === null || loanAmount <= 0) return null;

    const width = 1100;
    const height = 520;
    const paddingLeft = 112;
    const paddingRight = 112;
    const paddingTop = 16;
    const paddingBottom = 72;
    const innerWidth = width - paddingLeft - paddingRight;
    const innerHeight = height - paddingTop - paddingBottom;
    const yearCount = groups.length;

    const columnWidth = innerWidth / yearCount;
    const barWidth = Math.max(8, columnWidth * 0.74);
    const xCenterForIndex = (index: number) => paddingLeft + columnWidth * (index + 0.5);

    const stackTotals = groups.map(
      (year) => year.sumInterest + year.sumInsuranceCost + year.sumCapital + year.sumPrepayment,
    );
    const maxStack = Math.max(0, ...stackTotals);
    const maxBalance = Math.max(loanAmount, ...groups.map((year) => year.lastRemaining));

    const stackAxisMax = this.forcedStackAxisMax() ?? roundUpToStep(maxStack, STACK_TICK_STEP);
    const balanceAxisMax =
      this.forcedBalanceAxisMax() ?? roundUpToStep(maxBalance, BALANCE_TICK_STEP);

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
      let stackedSum = 0;
      let totalSum = 0;
      for (const descriptor of STACK_SEGMENT_DESCRIPTORS) {
        const segmentValue = year[descriptor.fieldKey];
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
          label: descriptor.label,
        });
      }
      return {
        year: year.year,
        centerX,
        segments,
        totalSum,
        endingBalance: year.lastRemaining,
      };
    });

    const linePoints: TrendLinePoint[] = groups.map((year, index) => ({
      x: xCenterForIndex(index),
      y: yForBalanceValue(year.lastRemaining),
      value: year.lastRemaining,
      year: year.year,
    }));

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

  protected readonly selectedYear = computed<YearGroup | null>(() => {
    const index = this.selectedYearIndex();
    const groups = this.yearlyGroups();
    if (index === null || !groups) return null;
    return groups[index] ?? null;
  });

  protected readonly selectedYearSlices = computed<ChartSlice[]>(() => {
    const year = this.selectedYear();
    if (!year) return [];
    const slices: ChartSlice[] = [];
    for (const descriptor of STACK_SEGMENT_DESCRIPTORS) {
      const value = year[descriptor.fieldKey];
      if (descriptor.fieldKey === 'sumPrepayment' && !this.prepaymentsEnabled()) continue;
      if (descriptor.fieldKey === 'sumInsuranceCost' && !this.overheadCostsEnabled()) continue;
      const slice: ChartSlice = {
        label: descriptor.label,
        value,
        color: descriptor.color,
        variant: descriptor.variant,
      };
      if (descriptor.fieldKey === 'sumInsuranceCost' && value > 0) {
        slice.children = this.overheadCostBreakdownService.buildCostChildren(
          this.overheadCostBreakdownService.aggregateBreakdown(year.rows),
        );
      }
      slices.push(slice);
    }
    return slices;
  });

  protected selectYear(index: number): void {
    this.selectedYearIndex.update((current) => (current === index ? null : index));
  }

  protected setActiveLabel(label: string | null): void {
    this.activeLabel.set(label);
  }

  protected isSegmentDimmed(segmentLabel: string, yearIndex: number): boolean {
    if (this.selectedYearIndex() !== yearIndex) return false;
    const active = this.activeLabel();
    if (!active) return false;
    if (active === LEGEND_TOTAL_ACTIVE) return false;
    if (active === segmentLabel) return false;
    const matchingSlice = this.selectedYearSlices().find((slice) => slice.label === segmentLabel);
    if (matchingSlice?.children?.some((child) => child.label === active)) return false;
    return true;
  }
}
