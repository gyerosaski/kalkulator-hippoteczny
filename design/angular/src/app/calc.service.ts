import { Injectable, signal, computed } from '@angular/core';
import {
  CalcInput,
  ScheduleResult,
  ScheduleRow,
  YearAggregate,
  InstallmentType,
  RateType,
  FrequencyAll,
  OverpaymentEffect,
  RatePeriod,
  Tweaks,
  ExtraCost,
  FormError,
  SavedCalculation,
} from './models';

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

const MONTHS_PL = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];
export const monthLabel = (d: Date) => `${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
export const fmtPLN = (v: number, decimals = 0) =>
  new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);

@Injectable({ providedIn: 'root' })
export class CalcService {
  // wejścia — sygnały
  propertyValue = signal(500_000);
  loanAmount = signal(400_000);
  years = signal(20);
  months = signal(0);
  installmentType = signal<InstallmentType>('równe');
  rateType = signal<RateType>('zmienna');
  rate = signal(9);
  wibor = signal(7);
  margin = signal(2);
  ratePeriods = signal<RatePeriod[]>([]);

  addRatePeriod() {
    const list = this.ratePeriods();
    const lastFrom = list.length ? list[list.length - 1].fromMonth : 0;
    this.ratePeriods.set([
      ...list,
      {
        id: Date.now() + Math.random(),
        fromMonth: Math.max(12, lastFrom + 12),
        rateType: this.rateType(),
        rate: this.rate(),
        wibor: this.wibor(),
        margin: this.margin(),
      },
    ]);
  }
  updateRatePeriod(id: number, patch: Partial<RatePeriod>) {
    this.ratePeriods.update((rp) => rp.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  removeRatePeriod(id: number) {
    this.ratePeriods.update((rp) => rp.filter((p) => p.id !== id));
  }
  startDate = signal<Date>(new Date(2026, 3, 1));
  firstRepaymentDate = signal<Date>(new Date(2026, 4, 1));

  // koszty — sekcje 1–3
  commissionPct = signal(1.5);
  valuationFee = signal(400);
  bridgeRate = signal(1.2);
  bridgeMonths = signal(6);

  // 4. Ubezpieczenie nieruchomości
  propInsFreq = signal<'co rok' | 'co miesiąc'>('co rok');
  propInsMode = signal<
    '% wartości nieruchomości' | '% kwoty kredytu' | '% salda kredytu' | 'znam kwotę'
  >('% wartości nieruchomości');
  insurancePct = signal(0.0008);
  propInsFrom = signal<Date>(new Date(2026, 4, 1));
  propInsTo = signal<Date>(new Date(2046, 3, 1));

  // 5. Ubezpieczenie niskiego wkładu
  lowDownRate = signal(0);

  // 6. Ubezpieczenie na życie
  lifeFreq = signal<'co rok' | 'co miesiąc' | 'jednorazowo'>('co rok');
  lifeMode = signal<'% kwoty kredytu' | '% salda kredytu' | 'znam kwotę'>('% kwoty kredytu');
  lifeValue = signal(0);
  lifeFrom = signal<Date>(new Date(2026, 4, 1));
  lifeTo = signal<Date>(new Date(2046, 3, 1));

  // 7. Ubezpieczenie od utraty pracy
  jobFreq = signal<'jednorazowo' | 'co rok' | 'co miesiąc'>('jednorazowo');
  jobMode = signal<'% kwoty kredytu' | '% salda kredytu' | 'znam kwotę'>('% kwoty kredytu');
  jobValue = signal(0);
  jobFrom = signal<Date>(new Date(2026, 4, 1));

  // 8. Dodatkowe koszty — lista
  extraCosts = signal<ExtraCost[]>([
    {
      id: 1,
      name: '',
      freq: 'jednorazowo',
      mode: 'znam kwotę',
      value: 0,
      from: new Date(2026, 4, 1),
    },
  ]);
  addExtraCost() {
    this.extraCosts.update((arr) => [
      ...arr,
      {
        id: Date.now(),
        name: '',
        freq: 'jednorazowo',
        mode: 'znam kwotę',
        value: 0,
        from: new Date(2026, 4, 1),
      },
    ]);
  }
  updateExtraCost(id: number, patch: Partial<ExtraCost>) {
    this.extraCosts.update((arr) => arr.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  removeExtraCost(id: number) {
    this.extraCosts.update((arr) => arr.filter((c) => c.id !== id));
  }

  // 9. Promocyjna wysokość oprocentowania
  promoRate = signal(0);
  promoFrom = signal<Date>(new Date(2026, 4, 1));
  promoTo = signal<Date>(new Date(2027, 3, 1));

  // przełączniki sekcji
  costsEnabled = signal(true);
  tranchesEnabled = signal(true);
  overpaymentsEnabled = signal(true);

  // nadpłaty — reguła A
  overFreq = signal<FrequencyAll>('co miesiąc');
  overAmount = signal(0);
  overEffect = signal<OverpaymentEffect>('skrócenie okresu');
  overFrom = signal<Date>(new Date(2026, 4, 1));
  overTo = signal<Date>(new Date(2046, 3, 1));

  // nadpłaty — docelowa rata miesięczna (B)
  targetRata = signal(0);
  targetFrom = signal<Date>(new Date(2026, 4, 1));
  targetTo = signal<Date>(new Date(2046, 3, 1));
  targetEffect = signal<OverpaymentEffect>('niższa rata');

  // nadpłaty — prowizja za wcześniejszą spłatę (C)
  earlyRepayFee = signal(0);
  earlyRepayFeeUntil = signal<Date>(new Date(2029, 3, 1));

  // tweaks
  tweaks = signal<Tweaks>(this.loadTweaks());

  // ====================== TWOJE KALKULACJE ======================
  savedCalculations = signal<SavedCalculation[]>([
    {
      id: 'c1',
      name: 'Mieszkanie 65 m² · Wrocław Krzyki',
      note: 'wersja z prowizją 1,5 %',
      tag: null,
      propertyValue: 685000,
      loanAmount: 548000,
      years: 25,
      months: 0,
      installmentType: 'równe',
      rateType: 'zmienna',
      wibor: 5.85,
      margin: 1.9,
      rate: 7.75,
      firstInstallment: 4124.78,
      totalInterest: 689420,
      totalCosts: 18540,
      overpaymentsEnabled: true,
      tranches: 1,
      updatedAt: new Date(2026, 4, 13, 17, 42),
      createdAt: new Date(2026, 3, 28),
    },
    {
      id: 'c2',
      name: 'Dom 120 m² · podmiejski',
      note: 'oferta z banku PKO',
      tag: 'ulubiona',
      propertyValue: 950000,
      loanAmount: 712500,
      years: 30,
      months: 0,
      installmentType: 'równe',
      rateType: 'stała',
      wibor: 0,
      margin: 0,
      rate: 7.39,
      firstInstallment: 4923.65,
      totalInterest: 1059314,
      totalCosts: 22890,
      overpaymentsEnabled: false,
      tranches: 4,
      updatedAt: new Date(2026, 4, 10, 9, 15),
      createdAt: new Date(2026, 2, 14),
    },
    {
      id: 'c3',
      name: 'Refinansowanie 2026',
      note: 'porównanie do obecnej oferty',
      tag: null,
      propertyValue: 580000,
      loanAmount: 320000,
      years: 20,
      months: 0,
      installmentType: 'malejące',
      rateType: 'zmienna',
      wibor: 5.85,
      margin: 2.1,
      rate: 7.95,
      firstInstallment: 3454.2,
      totalInterest: 268940,
      totalCosts: 9810,
      overpaymentsEnabled: false,
      tranches: 1,
      updatedAt: new Date(2026, 4, 8, 21, 3),
      createdAt: new Date(2026, 4, 8),
    },
    {
      id: 'c4',
      name: 'Kawalerka inwestycyjna',
      note: null,
      tag: 'robocza',
      propertyValue: 320000,
      loanAmount: 256000,
      years: 30,
      months: 0,
      installmentType: 'równe',
      rateType: 'zmienna',
      wibor: 5.85,
      margin: 2.4,
      rate: 8.25,
      firstInstallment: 1924.1,
      totalInterest: 436920,
      totalCosts: 8740,
      overpaymentsEnabled: false,
      tranches: 1,
      updatedAt: new Date(2026, 4, 6, 14, 22),
      createdAt: new Date(2026, 1, 4),
    },
    {
      id: 'c5',
      name: 'Wersja z nadpłatą 1 000 zł / m-c',
      note: 'skrócenie okresu',
      tag: null,
      propertyValue: 685000,
      loanAmount: 548000,
      years: 25,
      months: 0,
      installmentType: 'równe',
      rateType: 'zmienna',
      wibor: 5.85,
      margin: 1.9,
      rate: 7.75,
      firstInstallment: 4124.78,
      totalInterest: 412690,
      totalCosts: 18540,
      overpaymentsEnabled: true,
      tranches: 1,
      updatedAt: new Date(2026, 4, 2, 11, 8),
      createdAt: new Date(2026, 3, 30),
    },
    {
      id: 'c6',
      name: 'Plan B — krótszy okres (15 lat)',
      note: null,
      tag: null,
      propertyValue: 685000,
      loanAmount: 548000,
      years: 15,
      months: 0,
      installmentType: 'równe',
      rateType: 'stała',
      wibor: 0,
      margin: 0,
      rate: 7.1,
      firstInstallment: 4938.1,
      totalInterest: 340120,
      totalCosts: 18540,
      overpaymentsEnabled: false,
      tranches: 1,
      updatedAt: new Date(2026, 3, 28, 19, 51),
      createdAt: new Date(2026, 3, 28),
    },
    {
      id: 'c7',
      name: 'Mieszkanie rodziców — Gdańsk',
      note: 'bez ubezpieczeń, raty malejące',
      tag: null,
      propertyValue: 540000,
      loanAmount: 432000,
      years: 22,
      months: 0,
      installmentType: 'malejące',
      rateType: 'zmienna',
      wibor: 5.85,
      margin: 1.75,
      rate: 7.6,
      firstInstallment: 4373.55,
      totalInterest: 374230,
      totalCosts: 5400,
      overpaymentsEnabled: false,
      tranches: 1,
      updatedAt: new Date(2026, 3, 19, 8, 41),
      createdAt: new Date(2026, 3, 19),
    },
    {
      id: 'c8',
      name: 'Symulacja wzrostu WIBOR do 9 %',
      note: 'stress-test',
      tag: 'robocza',
      propertyValue: 685000,
      loanAmount: 548000,
      years: 25,
      months: 0,
      installmentType: 'równe',
      rateType: 'zmienna',
      wibor: 9.0,
      margin: 1.9,
      rate: 10.9,
      firstInstallment: 5249.3,
      totalInterest: 1027840,
      totalCosts: 18540,
      overpaymentsEnabled: false,
      tranches: 1,
      updatedAt: new Date(2026, 3, 11, 22, 14),
      createdAt: new Date(2026, 3, 11),
    },
  ]);
  activeCalculationId = signal<string | null>('c1');

  renameSavedCalc(id: string, newName: string) {
    this.savedCalculations.update((arr) =>
      arr.map((c) => (c.id === id ? { ...c, name: newName, updatedAt: new Date() } : c)),
    );
  }
  deleteSavedCalc(id: string) {
    this.savedCalculations.update((arr) => arr.filter((c) => c.id !== id));
    if (this.activeCalculationId() === id) this.activeCalculationId.set(null);
  }
  duplicateSavedCalc(id: string): SavedCalculation | null {
    const src = this.savedCalculations().find((c) => c.id === id);
    if (!src) return null;
    const copy: SavedCalculation = {
      ...src,
      id: 'c' + Date.now(),
      name: src.name + ' — kopia',
      updatedAt: new Date(),
      createdAt: new Date(),
      tag: 'robocza',
    };
    this.savedCalculations.update((arr) => [copy, ...arr]);
    return copy;
  }
  toggleFavSavedCalc(id: string) {
    this.savedCalculations.update((arr) =>
      arr.map((c) => (c.id === id ? { ...c, tag: c.tag === 'ulubiona' ? null : 'ulubiona' } : c)),
    );
  }
  loadSavedCalc(c: SavedCalculation) {
    this.propertyValue.set(c.propertyValue);
    this.loanAmount.set(c.loanAmount);
    this.years.set(c.years);
    this.months.set(c.months);
    this.installmentType.set(c.installmentType);
    this.rateType.set(c.rateType);
    this.wibor.set(c.wibor);
    this.margin.set(c.margin);
    this.rate.set(c.rate);
    this.activeCalculationId.set(c.id);
    this.saveTweaks({ activeTab: 'kalkulator' });
  }

  // pochodne
  ltv = computed(() => {
    const pv = this.propertyValue();
    return pv ? (this.loanAmount() / pv) * 100 : 0;
  });

  schedule = computed<ScheduleResult>(() =>
    this.compute({
      propertyValue: this.propertyValue(),
      loanAmount: this.loanAmount(),
      years: this.years(),
      months: this.months(),
      installmentType: this.installmentType(),
      rateType: this.rateType(),
      rate: this.rate(),
      wibor: this.wibor(),
      margin: this.margin(),
      startDate: this.startDate(),
      costs: this.costsEnabled()
        ? {
            commissionPct: this.commissionPct(),
            valuationFee: this.valuationFee(),
            bridgeRate: this.bridgeRate(),
            bridgeMonths: this.bridgeMonths(),
            insurancePct: this.insurancePct(),
          }
        : { commissionPct: 0, valuationFee: 0, bridgeRate: 0, bridgeMonths: 0, insurancePct: 0 },
      overpayments: {
        frequency: this.overFreq(),
        amount: this.overpaymentsEnabled() ? this.overAmount() : 0,
        effect: this.overEffect(),
      },
      tranches: [],
      ratePeriods: this.ratePeriods(),
    }),
  );

  setLtv(pct: number) {
    this.loanAmount.set((this.propertyValue() * pct) / 100);
  }

  // ====================== walidacja formularza ======================
  // Suma transz — w prototypie zawsze 1 transza równa kwocie kredytu.
  tranchesTotal = computed(() => this.loanAmount());

  realErrors = computed<FormError[]>(() => {
    const errs: FormError[] = [];
    const loan = this.loanAmount();
    const prop = this.propertyValue();
    const totalMonths = this.years() * 12 + this.months();

    if (loan > prop) {
      const diff = loan - prop;
      errs.push({
        section: 'Dane podstawowe',
        message: 'Kwota kredytu nie może być większa niż wartość nieruchomości.',
        detail: `${fmtPLN(loan)} zł kwoty kredytu vs ${fmtPLN(prop)} zł wartości — różnica ${fmtPLN(diff)} zł`,
        fieldNum: '2',
        fieldLabel: 'Kwota kredytu',
        fieldId: 'field-loan',
      });
    }
    if (totalMonths <= 0) {
      errs.push({
        section: 'Dane podstawowe',
        message: 'Łączna liczba miesięcy musi być większa od 0.',
        detail: 'Ustaw okres kredytowania na co najmniej 1 miesiąc.',
        fieldNum: '4',
        fieldLabel: 'Okres kredytowania',
        fieldId: 'field-period',
      });
    }
    if (this.firstRepaymentDate() < this.startDate()) {
      errs.push({
        section: 'Dane podstawowe',
        message: 'Początek spłat kapitału nie może być wcześniejszy niż data uruchomienia.',
        detail: `uruchomienie ${monthLabel(this.startDate())} → start spłat ${monthLabel(this.firstRepaymentDate())}`,
        fieldNum: '6',
        fieldLabel: 'Początek spłat kapitału',
        fieldId: 'field-first-repayment',
      });
    }
    if (this.overpaymentsEnabled() && this.overFrom() > this.overTo()) {
      errs.push({
        section: 'Nadpłaty',
        message: 'W regule nadpłaty data „do” nie może być wcześniejsza niż data „od”.',
        detail: `od ${monthLabel(this.overFrom())} → do ${monthLabel(this.overTo())}`,
        fieldNum: '2',
        fieldLabel: 'Reguła nadpłat — okres',
        fieldId: 'field-over-dates',
      });
    }
    if (this.overpaymentsEnabled() && this.targetFrom() > this.targetTo()) {
      errs.push({
        section: 'Nadpłaty',
        message: 'W regule docelowej raty data „do” nie może być wcześniejsza niż data „od”.',
        detail: `od ${monthLabel(this.targetFrom())} → do ${monthLabel(this.targetTo())}`,
        fieldNum: '6',
        fieldLabel: 'Docelowa rata — okres',
        fieldId: 'field-target-dates',
      });
    }
    if (this.tranchesEnabled() && Math.abs(this.tranchesTotal() - loan) > 0.5) {
      const diff = loan - this.tranchesTotal();
      errs.push({
        section: 'Transze',
        message: 'Suma transz musi być równa kwocie kredytu.',
        detail: `suma ${fmtPLN(this.tranchesTotal())} zł vs kwota ${fmtPLN(loan)} zł — ${diff > 0 ? 'brakuje' : 'nadwyżka'} ${fmtPLN(Math.abs(diff))} zł`,
        fieldNum: '∑',
        fieldLabel: 'Suma transz',
        fieldId: 'field-tranches',
      });
    }
    return errs;
  });

  // Demo: pełna lista przykładowych błędów na potrzeby podglądu projektu.
  readonly demoErrors: FormError[] = [
    {
      section: 'Dane podstawowe',
      message: 'Kwota kredytu nie może być większa niż wartość nieruchomości.',
      detail: '520 000 zł kwoty kredytu vs 500 000 zł wartości — różnica 20 000 zł',
      fieldNum: '2',
      fieldLabel: 'Kwota kredytu',
      fieldId: 'field-loan',
    },
    {
      section: 'Dane podstawowe',
      message: 'Łączna liczba miesięcy musi być większa od 0.',
      detail: 'Ustaw okres kredytowania na co najmniej 1 miesiąc.',
      fieldNum: '4',
      fieldLabel: 'Okres kredytowania',
      fieldId: 'field-period',
    },
    {
      section: 'Dane podstawowe',
      message: 'Początek spłat kapitału nie może być wcześniejszy niż data uruchomienia.',
      detail: 'uruchomienie kwi 2026 → start spłat mar 2026',
      fieldNum: '6',
      fieldLabel: 'Początek spłat kapitału',
      fieldId: 'field-first-repayment',
    },
    {
      section: 'Transze',
      message: 'Suma transz musi być równa kwocie kredytu.',
      detail: 'suma 350 000 zł vs kwota 400 000 zł — brakuje 50 000 zł',
      fieldNum: '∑',
      fieldLabel: 'Suma transz',
      fieldId: 'field-tranches',
    },
    {
      section: 'Nadpłaty',
      message: 'W regule nadpłaty data „do” nie może być wcześniejsza niż data „od”.',
      detail: 'od maj 2028 → do sty 2027',
      fieldNum: '2',
      fieldLabel: 'Reguła nadpłat — okres',
      fieldId: 'field-over-dates',
    },
    {
      section: 'Nadpłaty',
      message: 'W regule docelowej raty data „do” nie może być wcześniejsza niż data „od”.',
      detail: 'od maj 2030 → do sty 2028',
      fieldNum: '6',
      fieldLabel: 'Docelowa rata — okres',
      fieldId: 'field-target-dates',
    },
  ];

  errors = computed<FormError[]>(() =>
    this.tweaks().viewState === 'errors' ? this.demoErrors : this.realErrors(),
  );

  showErrors = computed<boolean>(() => {
    const v = this.tweaks().viewState;
    if (v === 'errors') return true;
    if (v === 'results') return false;
    return this.realErrors().length > 0;
  });

  private loadTweaks(): Tweaks {
    const defaults: Tweaks = {
      palette: 'sage',
      density: 'cozy',
      fontPair: 'inter',
      viewState: 'errors',
      activeTab: 'kalkulator',
    };
    try {
      const raw = localStorage.getItem('khip:tweaks');
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch {}
    return defaults;
  }
  saveTweaks(t: Partial<Tweaks>) {
    this.tweaks.update((prev) => {
      const next = { ...prev, ...t };
      try {
        localStorage.setItem('khip:tweaks', JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  // ====================== logika finansowa ======================
  private compute(input: CalcInput): ScheduleResult {
    const {
      propertyValue,
      loanAmount,
      years,
      months,
      rateType,
      rate,
      wibor,
      margin,
      installmentType,
      startDate,
      costs,
      overpayments,
      ratePeriods,
    } = input;

    const n = years * 12 + months;
    const empty: ScheduleResult = {
      rows: [],
      yearly: [],
      totalInterest: 0,
      totalPayments: 0,
      firstInstallment: 0,
      totalCosts: 0,
      totalOverpayments: 0,
      commission: 0,
      valuationFee: 0,
    };
    if (n <= 0 || loanAmount <= 0) return empty;

    const baseNominal = rateType === 'zmienna' ? wibor + margin : rate;
    const periods = (ratePeriods || []).slice().sort((a, b) => a.fromMonth - b.fromMonth);
    const rateAt = (m: number) => {
      let r = baseNominal;
      for (const p of periods) {
        if (m >= p.fromMonth) {
          r = p.rateType === 'zmienna' ? p.wibor + p.margin : p.rate;
        }
      }
      return r;
    };
    const i = baseNominal / 100 / 12;
    let balance = loanAmount;
    let installmentEqual = i === 0 ? balance / n : (balance * i) / (1 - Math.pow(1 + i, -n));

    const insuranceMonthly = ((costs.insurancePct / 100) * propertyValue) / 12;
    const commission = (costs.commissionPct / 100) * loanAmount;
    const valuationFee = costs.valuationFee || 0;

    const rows: ScheduleRow[] = [];
    let totalInterest = 0;
    let totalOverpayments = 0;

    for (let m = 0; m < n; m++) {
      const date = addMonths(startDate, m);
      const effRate = (rateAt(m) + (m < costs.bridgeMonths ? costs.bridgeRate : 0)) / 100 / 12;
      const interest = balance * effRate;
      let principal: number, rata: number;
      if (installmentType === 'równe') {
        rata = installmentEqual;
        principal = rata - interest;
      } else {
        principal = loanAmount / n;
        rata = principal + interest;
      }

      let overpayment = 0;
      if (overpayments.amount > 0) {
        const f = overpayments.frequency;
        if (f === 'jednorazowo' && m === 0) overpayment = overpayments.amount;
        else if (f === 'co miesiąc') overpayment = overpayments.amount;
        else if (f === 'co rok' && m % 12 === 0) overpayment = overpayments.amount;
        else if (f === 'co kwartał' && m % 3 === 0) overpayment = overpayments.amount;
      }
      overpayment = Math.min(overpayment, Math.max(0, balance - principal));

      if (principal > balance) principal = balance;
      balance = balance - principal - overpayment;
      if (balance < 0.01) balance = 0;

      totalInterest += interest;
      totalOverpayments += overpayment;

      rows.push({
        idx: m + 1,
        date,
        rata,
        principal,
        interest,
        overpayment,
        balance,
        monthlyCost:
          insuranceMonthly + (m < costs.bridgeMonths ? balance * (costs.bridgeRate / 100 / 12) : 0),
      });

      if (balance === 0) break;
    }

    const byYear = new Map<number, YearAggregate>();
    rows.forEach((r) => {
      const y = r.date.getFullYear();
      if (!byYear.has(y))
        byYear.set(y, {
          year: y,
          rata: 0,
          principal: 0,
          interest: 0,
          overpayment: 0,
          monthlyCost: 0,
          balance: 0,
          rows: [],
        });
      const a = byYear.get(y)!;
      a.rata += r.rata;
      a.principal += r.principal;
      a.interest += r.interest;
      a.overpayment += r.overpayment;
      a.monthlyCost += r.monthlyCost;
      a.balance = r.balance;
      a.rows.push(r);
    });

    const yearly = Array.from(byYear.values());
    const totalCosts = commission + valuationFee + rows.reduce((s, r) => s + r.monthlyCost, 0);
    const totalPayments = loanAmount + totalInterest + totalCosts;

    return {
      rows,
      yearly,
      totalInterest,
      totalPayments,
      firstInstallment: rows[0]?.rata ?? 0,
      totalCosts,
      totalOverpayments,
      commission,
      valuationFee,
    };
  }
}
