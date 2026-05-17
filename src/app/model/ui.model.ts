import { ColorCodeArea } from './mortgage.model';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export interface ChartSlice extends DonutSlice {
  variant: ColorCodeArea;
}

export interface TrendStackSegmentTotal {
  label: string;
  value: number;
  color: string;
}

export interface TrendBarSegmentRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface TrendBarColumn {
  year: number;
  centerX: number;
  segments: TrendBarSegmentRect[];
  segmentTotals: TrendStackSegmentTotal[];
  totalSum: number;
  endingBalance: number;
}

export interface TrendLinePoint {
  x: number;
  y: number;
  value: number;
  year: number;
}

export interface TrendAxisTick {
  value: number;
  position: number;
  label: string;
}

export interface TrendXTick {
  year: number;
  x: number;
}

export interface TrendChartGeometry {
  width: number;
  height: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  innerWidth: number;
  innerHeight: number;
  columnWidth: number;
  bars: TrendBarColumn[];
  linePath: string;
  linePoints: TrendLinePoint[];
  balanceTicks: TrendAxisTick[];
  stackTicks: TrendAxisTick[];
  xTicks: TrendXTick[];
}

export interface TrendTooltipModel {
  bar: TrendBarColumn;
  tooltipX: number;
  tooltipY: number;
  tooltipWidth: number;
  tooltipHeight: number;
  paddingX: number;
  paddingY: number;
  lineHeight: number;
  dividerGap: number;
}
