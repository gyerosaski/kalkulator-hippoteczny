export type FrequencyAll = 'jednorazowo' | 'co miesiąc' | 'co kwartał' | 'co rok';
export type InstallmentType = 'równe' | 'malejące';
export type RateType = 'zmienna' | 'stała';
export type OverpaymentEffect = 'niższa rata' | 'skrócenie okresu';
export type PeriodUnit = 'lata' | 'miesiące';

export interface Costs {
  commissionPct: number;
  valuationFee: number;
  bridgeRate: number;
  bridgeMonths: number;
  insurancePct: number; // % wartości nieruchomości / rok
}

export type PropertyInsuranceFreq = 'co rok' | 'co miesiąc';
export type PropertyInsuranceMode =
  | '% wartości nieruchomości'
  | '% kwoty kredytu'
  | '% salda kredytu'
  | 'znam kwotę';
export type LifeInsuranceFreq = 'co rok' | 'co miesiąc' | 'jednorazowo';
export type LifeInsuranceMode = '% kwoty kredytu' | '% salda kredytu' | 'znam kwotę';
export type ExtraCostFreq = 'jednorazowo' | 'co rok' | 'co miesiąc';
export type ExtraCostMode = '% kwoty kredytu' | '% salda kredytu' | 'znam kwotę';

export interface ExtraCost {
  id: number;
  name: string;
  freq: ExtraCostFreq;
  mode: ExtraCostMode;
  value: number;
  from: Date;
}

export interface Overpayments {
  frequency: FrequencyAll;
  amount: number;
  effect: OverpaymentEffect;
}

export interface Tranche {
  amount: number;
  date: Date;
  fee?: number;
}

export interface ScheduleRow {
  idx: number;
  date: Date;
  rata: number;
  principal: number;
  interest: number;
  overpayment: number;
  balance: number;
  monthlyCost: number;
  /** Efektywna nominalna stopa oprocentowania (%) z uwzględnieniem pomostowego, niskiego wkładu i promocji. */
  rate: number;
  /** Stopa nominalna aktywnego okresu (bez modyfikatorów). */
  rateBase: number;
  /** Indeks okresu oprocentowania (0 = okres bazowy, 1, 2, …). */
  ratePeriodIdx: number;
  bridgeUp: number;
  lowDownUp: number;
  promoDown: number;
}

export interface YearAggregate {
  year: number;
  rata: number;
  principal: number;
  interest: number;
  overpayment: number;
  monthlyCost: number;
  balance: number;
  rows: ScheduleRow[];
  rateMin: number;
  rateMax: number;
  rateStart: number;
  rateEnd: number;
}

export type RateChangeCause =
  | 'start'
  | 'period'
  | 'bridge-on'
  | 'bridge-off'
  | 'lowdown-on'
  | 'lowdown-off'
  | 'promo-on'
  | 'promo-off';

export interface RateChange {
  fromMonth: number;
  date: Date;
  rate: number;
  cause: RateChangeCause;
}

export type RateBandKind = 'bridge' | 'lowDown' | 'promo' | 'period';

export interface RateBand {
  kind: RateBandKind;
  fromMonth: number;
  toMonth: number;
  delta: number;
  label: string;
  periodIdx?: number;
}

export interface ScheduleResult {
  rows: ScheduleRow[];
  yearly: YearAggregate[];
  totalInterest: number;
  totalPayments: number;
  firstInstallment: number;
  totalCosts: number;
  totalOverpayments: number;
  commission: number;
  valuationFee: number;
  /** Czy w trakcie symulacji zmienia się oprocentowanie (=> renderuj wykres i kolumnę). */
  hasRateChange: boolean;
  rateChanges: RateChange[];
  rateBands: RateBand[];
}

export interface RatePeriod {
  id: number;
  fromMonth: number;
  rateType: RateType;
  rate: number;
  wibor: number;
  margin: number;
}

export interface CalcInput {
  propertyValue: number;
  loanAmount: number;
  years: number;
  months: number;
  installmentType: InstallmentType;
  rateType: RateType;
  rate: number;
  wibor: number;
  margin: number;
  startDate: Date;
  costs: Costs;
  overpayments: Overpayments;
  tranches: Tranche[];
  ratePeriods?: RatePeriod[];
  /** Ubezpieczenie niskiego wkładu — procentowy uplift dopóki saldo > 80 % wartości. */
  lowDown?: { rate: number };
  /** Promocja oprocentowania — obniżka pomiędzy datami `from` a `to`. */
  promo?: { rate: number; from: Date; to: Date };
}

export type Palette = 'sage' | 'peach' | 'lavender' | 'mist';
export type Density = 'cozy' | 'comfy' | 'roomy';
export type FontPair = 'inter' | 'fraunces' | 'system';
export type ViewState = 'auto' | 'results' | 'errors';
export type ActiveTab = 'kalkulator' | 'kalkulacje' | 'porownanie';

export interface Tweaks {
  palette: Palette;
  density: Density;
  fontPair: FontPair;
  viewState: ViewState;
  activeTab: ActiveTab;
}

export interface FormError {
  section: 'Dane podstawowe' | 'Transze' | 'Nadpłaty' | 'Koszty okołokredytowe i promocje';
  message: string;
  detail?: string;
  fieldNum?: string;
  fieldLabel: string;
  fieldId: string;
}

/* ============ TWOJE KALKULACJE ============ */
export type SavedCalcTag = 'ulubiona' | 'robocza' | null;

export interface SavedCalculation {
  id: string;
  name: string;
  note: string | null;
  tag: SavedCalcTag;
  propertyValue: number;
  loanAmount: number;
  years: number;
  months: number;
  installmentType: InstallmentType;
  rateType: RateType;
  wibor: number;
  margin: number;
  rate: number;
  firstInstallment: number;
  totalInterest: number;
  totalCosts: number;
  overpaymentsEnabled: boolean;
  tranches: number;
  updatedAt: Date;
  createdAt: Date;
}

export type SavedCalcSort = 'updated' | 'created' | 'name' | 'loan' | 'rata';
export type SavedCalcFilter = 'all' | 'fav' | 'work';

/* ============ PORÓWNANIE OFERT ============ */
/* Oferta = SavedCalculation + pełny wynik harmonogramu (ScheduleResult) */
export interface Offer {
  id: string;
  name: string;
  savedAt: Date;
  source: SavedCalculation; // pełna kopia danych wejściowych
  startDate: Date;
  result: ScheduleResult; // wynik = generateSchedule(input)
}

export type ComparisonTrendMode = 'overlay' | 'side-by-side';

export interface Comparison {
  offerAId: string | null;
  offerBId: string | null;
  trendMode: ComparisonTrendMode;
  showZeroSegments: boolean;
  diffOnly: boolean;
}
