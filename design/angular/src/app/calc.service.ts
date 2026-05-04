import { Injectable, signal, computed } from '@angular/core';
import {
  CalcInput, ScheduleResult, ScheduleRow, YearAggregate,
  InstallmentType, RateType, FrequencyAll, OverpaymentEffect,
  Tweaks
} from './models';

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

const MONTHS_PL = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];
export const monthLabel = (d: Date) => `${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;

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
  startDate = signal<Date>(new Date(2026, 3, 1));

  // koszty
  commissionPct = signal(1.5);
  valuationFee = signal(400);
  bridgeRate = signal(1.2);
  bridgeMonths = signal(6);
  insurancePct = signal(0.0008);

  // przełączniki sekcji
  costsEnabled = signal(true);
  tranchesEnabled = signal(true);
  overpaymentsEnabled = signal(true);

  // nadpłaty
  overFreq = signal<FrequencyAll>('co miesiąc');
  overAmount = signal(0);
  overEffect = signal<OverpaymentEffect>('skrócenie okresu');

  // tweaks
  tweaks = signal<Tweaks>(this.loadTweaks());

  // pochodne
  ltv = computed(() => {
    const pv = this.propertyValue();
    return pv ? (this.loanAmount() / pv) * 100 : 0;
  });

  schedule = computed<ScheduleResult>(() => this.compute({
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
    costs: this.costsEnabled() ? {
      commissionPct: this.commissionPct(),
      valuationFee: this.valuationFee(),
      bridgeRate: this.bridgeRate(),
      bridgeMonths: this.bridgeMonths(),
      insurancePct: this.insurancePct(),
    } : { commissionPct: 0, valuationFee: 0, bridgeRate: 0, bridgeMonths: 0, insurancePct: 0 },
    overpayments: {
      frequency: this.overFreq(),
      amount: this.overpaymentsEnabled() ? this.overAmount() : 0,
      effect: this.overEffect(),
    },
    tranches: [],
  }));

  setLtv(pct: number) {
    this.loanAmount.set(this.propertyValue() * pct / 100);
  }

  private loadTweaks(): Tweaks {
    try {
      const raw = localStorage.getItem('khip:tweaks');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { palette: 'sage', density: 'cozy', fontPair: 'inter' };
  }
  saveTweaks(t: Partial<Tweaks>) {
    this.tweaks.update(prev => {
      const next = { ...prev, ...t };
      try { localStorage.setItem('khip:tweaks', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // ====================== logika finansowa ======================
  private compute(input: CalcInput): ScheduleResult {
    const { propertyValue, loanAmount, years, months, rateType, rate, wibor, margin,
            installmentType, startDate, costs, overpayments } = input;

    const n = years * 12 + months;
    const empty: ScheduleResult = {
      rows: [], yearly: [], totalInterest: 0, totalPayments: 0,
      firstInstallment: 0, totalCosts: 0, totalOverpayments: 0,
      commission: 0, valuationFee: 0,
    };
    if (n <= 0 || loanAmount <= 0) return empty;

    const nominal = rateType === 'zmienna' ? wibor + margin : rate;
    const i = nominal / 100 / 12;
    let balance = loanAmount;
    let installmentEqual = i === 0 ? balance / n
      : balance * i / (1 - Math.pow(1 + i, -n));

    const insuranceMonthly = (costs.insurancePct / 100) * propertyValue / 12;
    const commission = (costs.commissionPct / 100) * loanAmount;
    const valuationFee = costs.valuationFee || 0;

    const rows: ScheduleRow[] = [];
    let totalInterest = 0;
    let totalOverpayments = 0;

    for (let m = 0; m < n; m++) {
      const date = addMonths(startDate, m);
      const effRate = (nominal + (m < costs.bridgeMonths ? costs.bridgeRate : 0)) / 100 / 12;
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
        idx: m + 1, date, rata, principal, interest, overpayment, balance,
        monthlyCost: insuranceMonthly + (m < costs.bridgeMonths ? balance * (costs.bridgeRate/100/12) : 0),
      });

      if (balance === 0) break;
    }

    const byYear = new Map<number, YearAggregate>();
    rows.forEach(r => {
      const y = r.date.getFullYear();
      if (!byYear.has(y)) byYear.set(y, {
        year: y, rata: 0, principal: 0, interest: 0, overpayment: 0,
        monthlyCost: 0, balance: 0, rows: []
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
    const totalCosts = commission + valuationFee + rows.reduce((s,r)=>s+r.monthlyCost,0);
    const totalPayments = loanAmount + totalInterest + totalCosts;

    return {
      rows, yearly, totalInterest, totalPayments,
      firstInstallment: rows[0]?.rata ?? 0,
      totalCosts, totalOverpayments, commission, valuationFee,
    };
  }
}
