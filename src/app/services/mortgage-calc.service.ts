import { Injectable } from '@angular/core';

export type InstallmentType = 'rowne' | 'malejace';
export type RateType = 'zmienna' | 'stala';

export type PrepaymentFrequency = 'jednorazowo' | 'co miesiąc' | 'co kwartał' | 'co rok';
export type PrepaymentEffect = 'niższa rata' | 'skrócenie okresu';

export interface PrepaymentRule {
  frequency: PrepaymentFrequency;
  from: string; // 'YYYY-MM'
  to?: string; // 'YYYY-MM' (opcjonalne dla jednorazowej nadpłaty)
  amount: number; // PLN
  effect: PrepaymentEffect;
}

export interface TargetInstallmentRule {
  targetRate: number; // PLN
  from: string; // 'YYYY-MM'
  to: string; // 'YYYY-MM'
  effect: PrepaymentEffect;
}

export interface EarlyRepaymentCommission {
  ratePct: number; // %
  validUntil: string; // 'YYYY-MM'
}

export interface Tranche {
  amount: number; // PLN
  date: string; // 'YYYY-MM'
  disbursementFee?: number; // PLN (dla transz dodatkowych)
}

export interface MortgageInputs {
  propertyValue: number; // Wartość nieruchomości (PLN)
  loanAmount: number; // Kwota kredytu (PLN)
  ltv: number; // % 0-100
  years: number; // lata >= 0
  months: number; // m-ce 0-11
  startDate: string; // 'YYYY-MM' (pierwszy miesiąc kredytu)
  capitalStartDate: string; // 'YYYY-MM' (początek spłat kapitału)
  installmentType: InstallmentType; // równe | malejące
  rateType: RateType; // zmienna | stała
  nominalRate: number; // % (przy stałej edytowalne; przy zmiennej = wibor+margin)
  wibor: number; // % (gdy zmienna)
  margin: number; // % (gdy zmienna)
  prepaymentRules?: PrepaymentRule[];
  targetInstallmentRule?: TargetInstallmentRule;
  earlyRepaymentCommission?: EarlyRepaymentCommission;
  tranches?: Tranche[];
}

export interface ScheduleRow {
  index: number; // 1-based
  date: string; // 'YYYY-MM'
  rate: number; // Rata
  capital: number; // Kapitał
  interest: number; // Odsetki
  prepayment: number; // Nadpłata
  commission: number; // Prowizja za wcześniejszą spłatę
  remaining: number; // Pozostało do spłaty po racie
}

export interface MortgageResults {
  effectiveRate: number; // nominalna %
  totalMonths: number; // n łącznie (lata*12+miesiące)
  amortizationMonths: number; // n po karencji
  firstInstallment: { rate: number; capital: number; interest: number } | null;
  totals: {
    totalRate: number;
    totalCapital: number;
    totalInterest: number;
    overheadCosts: number; // tu 0.00 (brak zakładki Koszty)
    prepayments: number; // tu 0.00 (brak zakładki Nadpłaty)
    bankReturnRatioPct: number; // Suma wszystkich płatności / Kwota kredytu * 100
  };
  schedule: ScheduleRow[];
}

@Injectable({ providedIn: 'root' })
export class MortgageCalcService {
  // Bezpieczne zaokrąglenie do 2 miejsc (PL waluty)
  private round2(x: number): number {
    return Math.round((x + Number.EPSILON) * 100) / 100;
  }

  private asNonNegativeNumber(value: unknown): number {
    return Math.max(0, Number(value) || 0);
  }

  private parseMonth(str: string): { y: number; m: number } {
    // expects 'YYYY-MM'
    const [y, m] = str.split('-').map((v) => parseInt(v, 10));
    return { y, m };
  }

  private monthDiff(a: string, b: string): number {
    const aa = this.parseMonth(a);
    const bb = this.parseMonth(b);
    return (bb.y - aa.y) * 12 + (bb.m - aa.m);
  }

  private addMonths(base: string, offset: number): string {
    const { y, m } = this.parseMonth(base);
    const total = (y * 12 + (m - 1)) + offset;
    const ny = Math.floor(total / 12);
    const nm = (total % 12) + 1;
    return `${ny.toString().padStart(4, '0')}-${nm.toString().padStart(2, '0')}`;
  }

  private monthlyRate(nominalPercent: number): number {
    return nominalPercent / 100 / 12;
  }

  private annuityPayment(principal: number, monthlyRate: number, periods: number): number {
    if (periods <= 0) return 0;
    if (monthlyRate === 0) return this.round2(principal / periods);
    return this.round2(principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -periods)));
  }

  private isMonthInRange(month: string, from: string, to?: string): boolean {
    if (!from) return false;
    const effectiveTo = to || from;
    return month >= from && month <= effectiveTo;
  }

  private matchesFrequency(month: string, rule: PrepaymentRule): boolean {
    const diff = this.monthDiff(rule.from, month);
    if (diff < 0) return false;
    switch (rule.frequency) {
      case 'jednorazowo':
        return diff === 0;
      case 'co miesiąc':
        return true;
      case 'co kwartał':
        return diff % 3 === 0;
      case 'co rok':
        return diff % 12 === 0;
      default:
        return false;
    }
  }

  private prepaymentFromRule(month: string, rule: PrepaymentRule): number {
    if (!this.isMonthInRange(month, rule.from, rule.to)) return 0;
    if (!this.matchesFrequency(month, rule)) return 0;
    return this.round2(this.asNonNegativeNumber(rule.amount));
  }

  // Spójność LTV/kwota/wartość
  // Zwraca przeliczone pola wg zmian; pomocniczo wykorzystywane przez UI
  syncLtvAmountValue(
    propertyValue: number,
    loanAmount: number,
    ltv: number,
    edited: 'ltv' | 'loanAmount' | 'propertyValue'
  ): { propertyValue: number; loanAmount: number; ltv: number } {
    const safePV = Math.max(0, Number(propertyValue) || 0);
    let resultPV = safePV;
    let resultAmount = Math.max(0, Number(loanAmount) || 0);
    let resultLtv = Math.max(0, Number(ltv) || 0);

    if (edited === 'ltv') {
      // Kwota = Wartość * LTV/100
      resultAmount = this.round2(safePV * (resultLtv / 100));
    } else if (edited === 'loanAmount' || edited === 'propertyValue') {
      // LTV = Kwota / Wartość * 100 (jeśli PV > 0)
      if (safePV > 0) {
        resultLtv = this.round2((resultAmount / safePV) * 100);
      } else {
        resultLtv = 0;
      }
    }
    // Ograniczenia domenowe
    if (resultPV > 0 && resultAmount > resultPV) {
      resultAmount = resultPV;
      resultLtv = safePV > 0 ? this.round2((resultAmount / safePV) * 100) : 0;
    }
    if (resultLtv < 0) resultLtv = 0;
    if (resultLtv > 100) {
      resultLtv = 100;
      resultAmount = this.round2(safePV * (resultLtv / 100));
    }

    return { propertyValue: resultPV, loanAmount: resultAmount, ltv: resultLtv };
  }

  compute(inputs: MortgageInputs): MortgageResults {
    const nTotal = Math.max(0, Math.trunc(inputs.years) * 12 + Math.trunc(inputs.months));
    // Korekta o +1 miesiąc przesunięcia płatności: jeśli spłata kapitału ma zacząć się w kolejnym miesiącu
    // po uruchomieniu kredytu, to pierwsza płatność (w kolejnym miesiącu) powinna już zawierać kapitał.
    const graceMonths = Math.max(0, this.monthDiff(inputs.startDate, inputs.capitalStartDate) - 1);
    const amortMonths = Math.max(0, nTotal - graceMonths);

    // Efektywna stopa nominalna
    const effectiveRate = inputs.rateType === 'zmienna'
      ? (Number(inputs.wibor) || 0) + (Number(inputs.margin) || 0)
      : (Number(inputs.nominalRate) || 0);

    const i = this.monthlyRate(effectiveRate);

    const prepaymentRules = (inputs.prepaymentRules ?? [])
      .filter((r) => r?.from && (r?.frequency === 'jednorazowo' || !!r?.to))
      .map((r) => ({
        frequency: r.frequency,
        from: r.from,
        to: r.frequency === 'jednorazowo' ? r.from : (r.to || r.from),
        amount: this.asNonNegativeNumber(r.amount),
        effect: r.effect
      }));
    const targetInstallmentRule = inputs.targetInstallmentRule;
    const commissionRatePct = this.asNonNegativeNumber(inputs.earlyRepaymentCommission?.ratePct);
    const commissionValidUntil = inputs.earlyRepaymentCommission?.validUntil || '';

    // Transze – budowa mapy: miesiąc → kwota do uruchomienia
    const trancheMap = new Map<string, number>();
    let trancheDisbursementFees = 0;
    const tranches = inputs.tranches ?? [];
    if (tranches.length > 1) {
      // Pomijamy pierwszą transzę (uruchamianą w momencie startDate – stanowi saldo początkowe)
      for (let ti = 1; ti < tranches.length; ti++) {
        const t = tranches[ti];
        const amt = this.asNonNegativeNumber(t.amount);
        if (amt > 0 && t.date) {
          trancheMap.set(t.date, (trancheMap.get(t.date) || 0) + amt);
        }
        trancheDisbursementFees = this.round2(trancheDisbursementFees + this.asNonNegativeNumber(t.disbursementFee));
      }
    }

    const schedule: ScheduleRow[] = [];
    // Saldo początkowe = kwota pierwszej transzy (lub cała kwota kredytu, gdy brak transz)
    let saldo = tranches.length > 1
      ? this.asNonNegativeNumber(tranches[0].amount)
      : this.asNonNegativeNumber(inputs.loanAmount);
    let remainingAmortMonths = amortMonths;
    let equalRate = this.annuityPayment(saldo, i, amortMonths);
    let decreasingCapitalPart = amortMonths > 0 ? this.round2(saldo / amortMonths) : 0;

    const maxMonthsLimit = Math.max(nTotal, 1) + 1_200;
    for (let idx = 1; idx <= maxMonthsLimit; idx++) {
      if (saldo <= 0) break;

      const date = this.addMonths(inputs.startDate, idx);

      // Sprawdź, czy w tym miesiącu jest uruchamiana kolejna transza
      const trancheAmount = trancheMap.get(date) || 0;
      if (trancheAmount > 0) {
        saldo = this.round2(saldo + trancheAmount);
        // Przelicz ratę po dołączeniu transzy
        if (remainingAmortMonths > 0) {
          if (inputs.installmentType === 'rowne') {
            equalRate = this.annuityPayment(saldo, i, Math.max(1, remainingAmortMonths));
          } else {
            decreasingCapitalPart = this.round2(saldo / Math.max(1, remainingAmortMonths));
          }
        }
      }

      const inGrace = idx <= graceMonths;
      const interest = this.round2(saldo * i);

      let capital = 0;
      let baseRate = 0;

      if (inGrace || remainingAmortMonths <= 0) {
        capital = 0;
        baseRate = interest;
      } else if (inputs.installmentType === 'rowne') {
        const planned = equalRate > 0 ? equalRate : this.annuityPayment(saldo, i, remainingAmortMonths);
        capital = this.round2(planned - interest);
        if (capital < 0) capital = 0;
        if (capital > saldo) capital = this.round2(saldo);
        baseRate = this.round2(interest + capital);
      } else {
        const capitalConst = decreasingCapitalPart > 0 ? decreasingCapitalPart : this.round2(saldo / Math.max(1, remainingAmortMonths));
        capital = this.round2(Math.min(saldo, capitalConst));
        baseRate = this.round2(interest + capital);
      }

      saldo = this.round2(Math.max(0, saldo - capital));

      let prepaymentLower = 0;
      let prepaymentShorten = 0;

      for (const rule of prepaymentRules) {
        const amount = this.prepaymentFromRule(date, rule);
        if (amount <= 0) continue;
        if (rule.effect === 'niższa rata') {
          prepaymentLower = this.round2(prepaymentLower + amount);
        } else {
          prepaymentShorten = this.round2(prepaymentShorten + amount);
        }
      }

      if (targetInstallmentRule && this.isMonthInRange(date, targetInstallmentRule.from, targetInstallmentRule.to)) {
        const targetRate = this.asNonNegativeNumber(targetInstallmentRule.targetRate);
        const targetPrepayment = this.round2(Math.max(0, targetRate - baseRate));
        if (targetPrepayment > 0) {
          if (targetInstallmentRule.effect === 'niższa rata') {
            prepaymentLower = this.round2(prepaymentLower + targetPrepayment);
          } else {
            prepaymentShorten = this.round2(prepaymentShorten + targetPrepayment);
          }
        }
      }

      let prepayment = this.round2(prepaymentLower + prepaymentShorten);
      if (prepayment > saldo) {
        prepayment = this.round2(saldo);
      }
      saldo = this.round2(Math.max(0, saldo - prepayment));

      const commission = prepayment > 0 && commissionRatePct > 0 && (!commissionValidUntil || date <= commissionValidUntil)
        ? this.round2(prepayment * (commissionRatePct / 100))
        : 0;
      const totalRateForMonth = this.round2(baseRate + prepayment + commission);

      schedule.push({
        index: idx,
        date,
        rate: totalRateForMonth,
        capital,
        interest,
        prepayment,
        commission,
        remaining: saldo
      });

      const hasLowerRatePrepayment = prepaymentLower > 0;
      if (!inGrace && remainingAmortMonths > 0) {
        remainingAmortMonths -= 1;
        if (saldo <= 0) {
          remainingAmortMonths = 0;
        } else if (hasLowerRatePrepayment) {
          if (inputs.installmentType === 'rowne') {
            equalRate = this.annuityPayment(saldo, i, Math.max(1, remainingAmortMonths));
          } else {
            decreasingCapitalPart = this.round2(saldo / Math.max(1, remainingAmortMonths));
          }
        }
      } else if (inGrace && hasLowerRatePrepayment && remainingAmortMonths > 0) {
        if (inputs.installmentType === 'rowne') {
          equalRate = this.annuityPayment(saldo, i, Math.max(1, remainingAmortMonths));
        } else {
          decreasingCapitalPart = this.round2(saldo / Math.max(1, remainingAmortMonths));
        }
      }

      if (nTotal > 0 && idx >= nTotal && prepayment === 0 && remainingAmortMonths === 0) {
        break;
      }
    }

    // Sumy i wskaźniki
    const totalRate = this.round2(schedule.reduce((s, r) => s + r.rate, 0));
    const totalCapital = this.round2(schedule.reduce((s, r) => s + r.capital, 0));
    const totalInterest = this.round2(schedule.reduce((s, r) => s + r.interest, 0));

    const overheadCosts = this.round2(schedule.reduce((s, r) => s + r.commission, 0) + trancheDisbursementFees);
    const prepayments = this.round2(schedule.reduce((s, r) => s + r.prepayment, 0));
    const bankReturnRatioPct = inputs.loanAmount > 0 ? this.round2((totalRate / inputs.loanAmount) * 100) : 0;

    const first = schedule.length > 0 ? { rate: schedule[0].rate, capital: schedule[0].capital, interest: schedule[0].interest } : null;

    return {
      effectiveRate: this.round2(effectiveRate),
      totalMonths: schedule.length,
      amortizationMonths: Math.max(0, schedule.length - Math.min(graceMonths, schedule.length)),
      firstInstallment: first,
      totals: {
        totalRate, totalCapital, totalInterest, overheadCosts, prepayments, bankReturnRatioPct
      },
      schedule
    };
  }
}
