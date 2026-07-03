import { ColorCodeArea } from './mortgage.model';

export enum BadgeVariant {
  GREEN = 'GREEN',
  RED = 'RED',
  NEUTRAL = 'NEUTRAL',
}

export enum DividerVariant {
  DASHED = 'DASHED',
  SOLID = 'SOLID',
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export interface ChartSlice extends DonutSlice {
  variant: ColorCodeArea;
  children?: ChartSlice[]; // pod-składowe slice'a (sumują się do value rodzica); rozwijane w legendzie i na donucie
  navigationTarget?: FormSectionNavigationTarget; // klik w pozycję legendy przewija formularz do tej sekcji/podsekcji
}

/** Cel nawigacji z legendy do formularza: sekcja + opcjonalnie klucz podsekcji do otwarcia. */
export interface FormSectionNavigationTarget {
  sectionId: FormSectionId;
  subsectionKey?: string;
  /**
   * Identyfikator konkretnego elementu dynamicznej listy w podsekcji (np. nazwa kosztu
   * dodatkowego). Gdy ustawiony, przewinięcie i wyróżnienie celują w ten element,
   * a nie w tytuł podsekcji.
   */
  itemKey?: string;
}

export interface TrendBarSegmentRect {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string; // etykieta segmentu (np. „Kapitał") — używana do synchronizacji hovera z ui-legend
}

export interface TrendBarColumn {
  year: number;
  centerX: number;
  segments: TrendBarSegmentRect[];
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

export enum AppRoute {
  CALCULATOR = 'calculator',
  CALCULATOR_MANAGER = 'calculator-manager',
  CALCULATIONS_COMPARE = 'calculations-compare',
}

export enum BannerVariant {
  INFO = 'INFO',
  WARNING = 'WARNING',
}

export enum ToastVariant {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  OCHRA = 'OCHRA',
}

/** Gęstość interfejsu — steruje odstępami (`--pad`/`--gap`) i rozmiarem czcionki. */
export enum Density {
  COMPACT = 'COMPACT',
  STANDARD = 'STANDARD',
  ROOMY = 'ROOMY',
}

/** Ustawienia aplikacji persystowane w `settings.json`. */
export interface AppSettings {
  theme: Theme;
  density: Density;
}

/** Wariant kolorystyczny dialogu — neutralny lub ostrzegawczy (operacje nieodwracalne). */
export enum DialogVariant {
  DEFAULT = 'DEFAULT',
  DANGER = 'DANGER',
}

/** Rozmiar (szerokość) dialogu. */
export enum DialogSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
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
  readonly points: RateChartPoint[];
  readonly changePoints: RateChartPoint[];
  readonly yTicks: RateChartAxisTick[];
  readonly xTicks: RateChartAxisTick[];
  readonly columnWidth: number;
}

export const LEGEND_TOTAL_ACTIVE = '__legend_total__';

/** Identyfikatory sekcji formularza kalkulatora — klucze stanu UI (rozwinięcie sekcji/podsekcji). */
export enum FormSectionId {
  BASIC_DATA = 'BASIC_DATA',
  RATE_PERIODS = 'RATE_PERIODS',
  TRANCHES = 'TRANCHES',
  OVERHEAD_COSTS = 'OVERHEAD_COSTS',
  PREPAYMENTS = 'PREPAYMENTS',
}

/** Kierunek sortowania listy. */
export enum SortDirection {
  ASCENDING = 'ASCENDING',
  DESCENDING = 'DESCENDING',
}

/** Kierunek otwierania menu komponentu `ui-dropdown` względem przycisku. */
export enum DropdownPlacement {
  DOWN = 'DOWN',
  UP = 'UP',
}

/** Identyfikatory instancji legend wykresów — klucze stanu rozwinięcia pozycji legendy. */
export enum LegendId {
  DONUT_TOTAL = 'DONUT_TOTAL',
  DONUT_INSTALLMENT = 'DONUT_INSTALLMENT',
  TREND_CHART = 'TREND_CHART',
}

/** Pojedynczy skrót daty w oknie wyboru miesiąca (`ui-month-picker`). */
export interface MonthPickerShortcut {
  readonly label: string; // polska etykieta, np. „Data uruchomienia kredytu"
  readonly value: string; // YYYY-MM
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
