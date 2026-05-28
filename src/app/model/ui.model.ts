import { ColorCodeArea } from './mortgage.model';

export enum BadgeVariant {
  GREEN = 'GREEN',
  RED = 'RED',
  NEUTRAL = 'NEUTRAL',
}

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

export enum AppRoute {
  CALCULATOR = 'calculator',
  CALCULATOR_MANAGER = 'calculator-manager',
  CALCULATIONS_COMPARE = 'calculations-compare',
}

export enum ToastVariant {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
}

export interface Toast {
  message: string;
  variant: ToastVariant;
}

export interface RateChartPoint {
  readonly x: number;
  readonly y: number;
  readonly interestRate: number;
  readonly date: string;
}

export interface RateChartAxisTick {
  readonly value: number;
  readonly position: number;
  readonly label: string;
}

export interface RateChartGeometry {
  readonly width: number;
  readonly height: number;
  readonly paddingLeft: number;
  readonly paddingRight: number;
  readonly paddingTop: number;
  readonly paddingBottom: number;
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly stepPath: string;
  readonly areaPath: string;
  readonly points: RateChartPoint[];
  readonly yTicks: RateChartAxisTick[];
  readonly xTicks: RateChartAxisTick[];
  readonly columnWidth: number;
}

export interface RateChartTooltipModel {
  readonly tooltipX: number;
  readonly tooltipY: number;
  readonly tooltipWidth: number;
  readonly tooltipHeight: number;
  readonly paddingX: number;
  readonly paddingY: number;
  readonly rateLabel: string;
  readonly dateLabel: string;
}
