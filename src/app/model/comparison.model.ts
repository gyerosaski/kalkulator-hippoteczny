import {
  ColorCodeArea,
  InstallmentType,
  MortgageInputs,
  MortgageResults,
  RateType,
  YearGroup,
} from './mortgage.model';
import { MortgageFormRawValue } from './form.model';
import { TrendAxisTick, TrendXTick } from './ui.model';

export enum ComparisonSlot {
  A = 'A',
  B = 'B',
}

export enum ComparableOfferKind {
  SAVED = 'SAVED',
  DRAFT = 'DRAFT',
}

/** Zarezerwowany identyfikator bieżącej (niezapisanej) kalkulacji w widoku porównania. */
export const DRAFT_OFFER_ID = '__draft__';

/**
 * Oferta możliwa do zestawienia w widoku „Porównanie ofert” — model widoku dla slotu i dialogu wyboru.
 * Identyfikator zapisanej kalkulacji to jej nazwa; dla bieżącej kalkulacji to {@link DRAFT_OFFER_ID}.
 */
export interface ComparableOffer {
  id: string;
  kind: ComparableOfferKind;
  name: string;
  loanAmount: number;
  propertyValue: number;
  loanPeriodYears: number;
  loanPeriodExtraMonths: number;
  nominalRate: number;
  rateType: RateType;
  installmentType: InstallmentType;
  firstInstallment: number;
  totalInterest: number;
  totalCosts: number;
  commission: number;
  appraisalFee: number;
  totalOverpayments: number;
  totalPayments: number;
  hasErrors: boolean;
}

/** Pełny wynik przeliczenia oferty bieżącym silnikiem kalkulacyjnym — podstawa sekcji 3.4–3.8. */
export interface OfferComputation {
  inputs: MortgageInputs;
  results: MortgageResults;
  yearlyGroups: YearGroup[];
}

/**
 * Komplet danych oferty wybranej do slotu porównania.
 * `formValue` to migawka wejść (dla zapisanych ofert — `SavedCalculationRecord.data`);
 * `computation` jest `null`, gdy oferta ma błędy walidacji lub przeliczenie się nie powiodło.
 */
export interface ComparisonOfferData {
  offer: ComparableOffer;
  formValue: MortgageFormRawValue | null;
  computation: OfferComputation | null;
}

/** Kierunek prezentacji delty (klasa CSS): wzrost = B gorsza, spadek = B lepsza, brak różnicy. */
export type ComparisonDeltaClass = 'delta--up' | 'delta--down' | 'delta--flat';

/** Wiersz tabeli różnic kosztowych (sekcja 3.8) w widoku „Porównanie ofert”; teksty komórek zawierają jednostki. */
export interface ComparisonDiffRow {
  label: string;
  aText: string;
  bText: string;
  deltaText: string;
  deltaClass: ComparisonDeltaClass;
  aIsLeader: boolean;
  bIsLeader: boolean;
  isEmphasized: boolean;
}

/** Wartość komórki liczbowego wiersza tabeli parametrów (sekcja 3.3); `value: null` = sekcja wyłączona / brak danych. */
export interface ComparisonParamCell {
  value: number | null;
  text: string | null;
}

/** Opcje budowy liczbowego wiersza tabeli parametrów wejściowych (sekcja 3.3). */
export interface ComparisonParamNumericRowOptions {
  formatDelta: (delta: number) => string;
  lessIsBetter?: boolean;
}

/** Wiersz tabeli parametrów wejściowych (sekcja 3.3); teksty komórek zawierają jednostki. */
export interface ComparisonParamRow {
  label: string;
  aText: string;
  bText: string;
  deltaText: string;
  deltaClass: ComparisonDeltaClass;
  aIsLeader: boolean;
  bIsLeader: boolean;
  isEqual: boolean;
}

/** Grupa wierszy tabeli parametrów wejściowych — nazwa sekcji formularza i jej wiersze. */
export interface ComparisonParamGroup {
  name: string;
  rows: ComparisonParamRow[];
}

/** Wiersz siatki KPI (sekcja 3.4) — kafelek oferty A, środkowa kolumna delty, kafelek oferty B. */
export interface ComparisonKpiRow {
  label: string;
  aValueText: string;
  aMetaText: string;
  bValueText: string;
  bMetaText: string;
  deltaText: string;
  deltaPercentText: string;
  deltaClass: ComparisonDeltaClass;
  aIsLeader: boolean;
  bIsLeader: boolean;
}

/** Wiersz kolumny delt między parą donutów (sekcje 3.5 i 3.6). */
export interface ComparisonDonutDeltaRow {
  label: string;
  variant: ColorCodeArea;
  deltaText: string;
  deltaClass: ComparisonDeltaClass;
}

/** Tryb renderowania sekcji 3.7 „Wykres trendu” w widoku „Porównanie ofert”. */
export enum ComparisonTrendMode {
  OVERLAY = 'OVERLAY',
  SIDE_BY_SIDE = 'SIDE_BY_SIDE',
}

/** Jedna seria wykresu nakładki (sekcja 3.7): linia „Pozostało do spłaty” jednej oferty. */
export interface ComparisonTrendSeries {
  name: string;
  color: string;
  loanAmount: number;
  yearlyGroups: YearGroup[];
}

export interface ComparisonTrendPoint {
  x: number;
  y: number;
  value: number;
  year: number;
}

/** Wyliczona geometria linii jednej serii nakładki. */
export interface ComparisonTrendSeriesGeometry {
  name: string;
  color: string;
  linePath: string;
  points: ComparisonTrendPoint[];
  titleText: string;
}

/** Kolumna roku w nakładce — salda obu ofert na koniec roku (`null`, gdy oferta nie obejmuje roku). */
export interface ComparisonTrendColumn {
  year: number;
  centerX: number;
  balanceA: number | null;
  balanceB: number | null;
}

export interface ComparisonTrendGeometry {
  width: number;
  height: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  innerWidth: number;
  innerHeight: number;
  columnWidth: number;
  seriesA: ComparisonTrendSeriesGeometry;
  seriesB: ComparisonTrendSeriesGeometry;
  balanceTicks: TrendAxisTick[];
  xTicks: TrendXTick[];
  columns: ComparisonTrendColumn[];
}

/** Dane jednej strony dla trybu „obok siebie” sekcji 3.7 (pełny wykres trendu per oferta). */
export interface ComparisonTrendSideModel {
  name: string;
  results: MortgageResults;
  yearlyGroups: YearGroup[];
  loanAmount: number;
  overheadCostsEnabled: boolean;
  prepaymentsEnabled: boolean;
}

/** Wspólne maksima osi wykresów trendu w trybie „obok siebie” — porównywalność wzrokowa skal. */
export interface ComparisonTrendSharedAxisMax {
  balance: number;
  stack: number;
}

/** Model tooltipa nakładki — salda A/B i delta dla najechanego roku. */
export interface ComparisonTrendTooltipModel {
  tooltipX: number;
  tooltipY: number;
  tooltipWidth: number;
  tooltipHeight: number;
  paddingX: number;
  paddingY: number;
  yearLabel: string;
  aLabel: string | null;
  bLabel: string | null;
  deltaLabel: string | null;
}

/** Kontekst przekazywany do dialogu wyboru oferty (`SelectOfferDialogComponent.open`). */
export interface SelectOfferDialogContext {
  slot: ComparisonSlot;
  excludedOfferId: string | null;
  offers: ComparableOffer[];
}
