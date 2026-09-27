import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  MortgageResults,
  RateChartAxisTick,
  RateChartGeometry,
  RateChartPoint,
  RateChartTooltipModel,
} from '../../../model';
import { CardComponent } from '../../ui/card/card.component';

const RATE_FORMATTER = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('pl-PL', {
  month: 'short',
  year: 'numeric',
});

function formatRate(value: number): string {
  return `${RATE_FORMATTER.format(value)} %`;
}

function formatMonthLabel(date: string): string {
  const [year, month] = date.split('-').map((v) => parseInt(v, 10));
  return MONTH_LABEL_FORMATTER.format(new Date(year, month - 1));
}

function pickYStep(maxRate: number): number {
  const range = maxRate * 1.1;
  if (range <= 5) return 0.5;
  if (range <= 10) return 1.0;
  return 2.0;
}

function buildStepPath(points: RateChartPoint[], rightEdgeX: number): string {
  if (points.length === 0) return '';
  const first = points[0];
  const parts: string[] = [`M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`H ${points[i].x.toFixed(1)}`);
    parts.push(`V ${points[i].y.toFixed(1)}`);
  }
  parts.push(`H ${rightEdgeX.toFixed(1)}`);
  return parts.join(' ');
}

@Component({
  selector: 'app-results-rate-chart',
  standalone: true,
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-rate-chart.component.html',
  styleUrl: './results-rate-chart.component.scss',
})
export class ResultsRateChartComponent {
  results = input.required<MortgageResults>();

  protected readonly hoveredMonthIndex = signal<number | null>(null);

  protected readonly geometry = computed<RateChartGeometry | null>(() => {
    const schedule = this.results().schedule;
    if (!schedule || schedule.length === 0) return null;

    const width = 1100;
    const height = 400;
    const paddingLeft = 112;
    const paddingRight = 32;
    const paddingTop = 16;
    const paddingBottom = 72;
    const innerWidth = width - paddingLeft - paddingRight;
    const innerHeight = height - paddingTop - paddingBottom;

    const monthCount = schedule.length;
    const columnWidth = innerWidth / monthCount;
    const xForIndex = (index: number) => paddingLeft + (index + 0.5) * columnWidth;

    const maxRate = Math.max(...schedule.map((row) => row.interestRate));
    const yStep = pickYStep(maxRate);
    const yAxisMax = Math.ceil((maxRate * 1.1) / yStep) * yStep;

    const yForRate = (rate: number) => paddingTop + innerHeight - (rate / yAxisMax) * innerHeight;

    const points: RateChartPoint[] = schedule.map((row, index) => ({
      x: xForIndex(index),
      y: yForRate(row.interestRate),
      interestRate: row.interestRate,
      date: row.date,
    }));

    const rightEdgeX = paddingLeft + innerWidth;

    const stepPath = buildStepPath(points, rightEdgeX);

    const changePoints: RateChartPoint[] = points.filter(
      (point, index) => index === 0 || point.interestRate !== points[index - 1].interestRate,
    );

    const yTicks: RateChartAxisTick[] = [];
    for (
      let tickValue = 0;
      tickValue <= yAxisMax + yStep * 0.01;
      tickValue = Math.round((tickValue + yStep) * 100) / 100
    ) {
      yTicks.push({
        value: tickValue,
        position: yForRate(tickValue),
        label: formatRate(tickValue),
      });
    }

    const seenYears = new Set<number>();
    const xTicks: RateChartAxisTick[] = [];
    schedule.forEach((row, index) => {
      const year = parseInt(row.date.split('-')[0], 10);
      if (!seenYears.has(year)) {
        seenYears.add(year);
        xTicks.push({ value: year, position: xForIndex(index), label: String(year) });
      }
    });

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      innerWidth,
      innerHeight,
      stepPath,
      points,
      changePoints,
      yTicks,
      xTicks,
      columnWidth,
    };
  });

  protected readonly tooltip = computed<RateChartTooltipModel | null>(() => {
    const geometry = this.geometry();
    const index = this.hoveredMonthIndex();
    if (!geometry || index === null) return null;

    const point = geometry.points[index];
    if (!point) return null;

    const tooltipWidth = 200;
    const tooltipHeight = 72;
    const paddingX = 12;
    const paddingY = 12;

    const chartRightEdge = geometry.paddingLeft + geometry.innerWidth;
    const placeOnLeftSide = point.x > geometry.paddingLeft + geometry.innerWidth / 2;
    const horizontalOffset = 16;
    let tooltipX = placeOnLeftSide
      ? point.x - horizontalOffset - tooltipWidth
      : point.x + horizontalOffset;
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
      tooltipX,
      tooltipY,
      tooltipWidth,
      tooltipHeight,
      paddingX,
      paddingY,
      rateLabel: formatRate(point.interestRate),
      dateLabel: formatMonthLabel(point.date),
    };
  });

  protected setHoveredIndex(index: number | null): void {
    this.hoveredMonthIndex.set(index);
  }
}
