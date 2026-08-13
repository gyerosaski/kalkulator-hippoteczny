import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import {
  ComparisonTrendColumn,
  ComparisonTrendGeometry,
  ComparisonTrendPoint,
  ComparisonTrendSeries,
  ComparisonTrendSeriesGeometry,
  ComparisonTrendTooltipModel,
  TrendAxisTick,
  TrendXTick,
  YearGroup,
} from '../../../model';
import { roundUpToStep } from '../../../helpers/chart-scale.helper';
import { SectionComponent } from '../../ui/section/section.component';

const BALANCE_TICK_STEP = 50_000;

const AXIS_AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });

function formatAxisAmount(value: number): string {
  return `${AXIS_AMOUNT_FORMATTER.format(value)} zł`;
}

function sign(value: number): string {
  return value > 0 ? '+' : value < 0 ? '−' : '';
}

@Component({
  selector: 'app-comparison-trend-chart',
  standalone: true,
  imports: [SectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comparison-trend-chart.component.html',
  styleUrl: './comparison-trend-chart.component.scss',
})
export class ComparisonTrendChartComponent {
  readonly seriesA = input.required<ComparisonTrendSeries>();
  readonly seriesB = input.required<ComparisonTrendSeries>();

  protected readonly hoveredColumnIndex = signal<number | null>(null);

  protected readonly chartTitle = computed<string>(() => {
    const geometry = this.geometry();
    if (!geometry || geometry.columns.length === 0) return 'Harmonogram spłaty — porównanie';
    const firstYear = geometry.columns[0].year;
    const lastYear = geometry.columns[geometry.columns.length - 1].year;
    return `Harmonogram spłaty — porównanie: ${firstYear} – ${lastYear}`;
  });

  protected readonly geometry = computed<ComparisonTrendGeometry | null>(() => {
    const seriesA = this.seriesA();
    const seriesB = this.seriesB();
    if (seriesA.yearlyGroups.length === 0 || seriesB.yearlyGroups.length === 0) return null;

    const width = 1100;
    const height = 520;
    const paddingLeft = 112;
    const paddingRight = 32;
    const paddingTop = 16;
    const paddingBottom = 72;
    const innerWidth = width - paddingLeft - paddingRight;
    const innerHeight = height - paddingTop - paddingBottom;

    // Oś X: unia zakresów lat obu ofert (najwcześniejszy rok startu → najpóźniejszy rok końca).
    const allYears = [...seriesA.yearlyGroups, ...seriesB.yearlyGroups].map((group) => group.year);
    const firstYear = Math.min(...allYears);
    const lastYear = Math.max(...allYears);
    const yearCount = lastYear - firstYear + 1;
    const columnWidth = innerWidth / yearCount;
    const xCenterForYear = (year: number) => paddingLeft + columnWidth * (year - firstYear + 0.5);

    const maxBalance = Math.max(
      seriesA.loanAmount,
      seriesB.loanAmount,
      ...seriesA.yearlyGroups.map((group) => group.lastRemaining),
      ...seriesB.yearlyGroups.map((group) => group.lastRemaining),
    );
    const balanceAxisMax = roundUpToStep(maxBalance, BALANCE_TICK_STEP);
    const yForBalanceValue = (value: number) =>
      paddingTop + innerHeight - (value / balanceAxisMax) * innerHeight;

    const buildSeriesGeometry = (
      series: ComparisonTrendSeries,
      sideLabel: string,
    ): ComparisonTrendSeriesGeometry => {
      const points: ComparisonTrendPoint[] = series.yearlyGroups.map((group) => ({
        x: xCenterForYear(group.year),
        y: yForBalanceValue(group.lastRemaining),
        value: group.lastRemaining,
        year: group.year,
      }));
      const linePath = points
        .map(
          (point, index) =>
            `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
        )
        .join(' ');
      const lastGroup = series.yearlyGroups[series.yearlyGroups.length - 1];
      return {
        name: series.name,
        color: series.color,
        linePath,
        points,
        titleText: `${sideLabel}: ${series.name} — saldo na koniec ${lastGroup.year}: ${formatAxisAmount(lastGroup.lastRemaining)}`,
      };
    };

    const balanceByYear = (groups: YearGroup[]) =>
      new Map(groups.map((group) => [group.year, group.lastRemaining]));
    const balancesA = balanceByYear(seriesA.yearlyGroups);
    const balancesB = balanceByYear(seriesB.yearlyGroups);

    const columns: ComparisonTrendColumn[] = [];
    for (let year = firstYear; year <= lastYear; year++) {
      columns.push({
        year,
        centerX: xCenterForYear(year),
        balanceA: balancesA.get(year) ?? null,
        balanceB: balancesB.get(year) ?? null,
      });
    }

    const balanceTicks: TrendAxisTick[] = [];
    for (let tickValue = 0; tickValue <= balanceAxisMax + 0.5; tickValue += BALANCE_TICK_STEP) {
      balanceTicks.push({
        value: tickValue,
        position: yForBalanceValue(tickValue),
        label: formatAxisAmount(tickValue),
      });
    }

    const xTicks: TrendXTick[] = columns.map((column) => ({
      year: column.year,
      x: column.centerX,
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
      seriesA: buildSeriesGeometry(seriesA, 'A'),
      seriesB: buildSeriesGeometry(seriesB, 'B'),
      balanceTicks,
      xTicks,
      columns,
    };
  });

  protected readonly tooltip = computed<ComparisonTrendTooltipModel | null>(() => {
    const geometry = this.geometry();
    const columnIndex = this.hoveredColumnIndex();
    if (!geometry || columnIndex === null) return null;

    const column = geometry.columns[columnIndex];
    if (!column) return null;

    const tooltipWidth = 240;
    const tooltipHeight = 94;
    const paddingX = 12;
    const paddingY = 12;

    const chartRightEdge = geometry.paddingLeft + geometry.innerWidth;
    const placeOnLeftSide = column.centerX > geometry.paddingLeft + geometry.innerWidth / 2;
    const horizontalOffset = 16;
    let tooltipX = placeOnLeftSide
      ? column.centerX - horizontalOffset - tooltipWidth
      : column.centerX + horizontalOffset;
    if (tooltipX < geometry.paddingLeft) tooltipX = geometry.paddingLeft;
    if (tooltipX + tooltipWidth > chartRightEdge) tooltipX = chartRightEdge - tooltipWidth;

    const tooltipY = geometry.paddingTop + 24;

    const delta =
      column.balanceA !== null && column.balanceB !== null
        ? column.balanceB - column.balanceA
        : null;

    return {
      tooltipX,
      tooltipY,
      tooltipWidth,
      tooltipHeight,
      paddingX,
      paddingY,
      yearLabel: String(column.year),
      aLabel: column.balanceA !== null ? formatAxisAmount(column.balanceA) : null,
      bLabel: column.balanceB !== null ? formatAxisAmount(column.balanceB) : null,
      deltaLabel: delta !== null ? `${sign(delta)}${formatAxisAmount(Math.abs(delta))}` : null,
    };
  });

  protected setHoveredColumnIndex(index: number | null): void {
    this.hoveredColumnIndex.set(index);
  }
}
