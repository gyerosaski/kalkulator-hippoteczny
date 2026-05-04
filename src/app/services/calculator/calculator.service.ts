import { Injectable } from '@angular/core';
import {
  InstallmentType,
  RateType,
  PrepaymentFrequency,
  PrepaymentEffect,
  PrepaymentRule,
  TargetInstallmentRule,
  EarlyRepaymentCommission,
  Tranche,
  InsuranceFrequency,
  InsuranceCalcMethod,
  LifeInsuranceCalcMethod,
  BridgeInsurance,
  PropertyInsurance,
  LowEquityInsurance,
  LifeInsurance,
  JobLossInsurance,
  AdditionalCost,
  PromotionalRate,
  OverheadCostsInputs,
  MortgageInputs,
  ScheduleRow,
  MortgageResults,
} from '../../model/mortgage.model';

export type {
  InstallmentType,
  RateType,
  PrepaymentFrequency,
  PrepaymentEffect,
  PrepaymentRule,
  TargetInstallmentRule,
  EarlyRepaymentCommission,
  Tranche,
  InsuranceFrequency,
  InsuranceCalcMethod,
  LifeInsuranceCalcMethod,
  BridgeInsurance,
  PropertyInsurance,
  LowEquityInsurance,
  LifeInsurance,
  JobLossInsurance,
  AdditionalCost,
  PromotionalRate,
  OverheadCostsInputs,
  MortgageInputs,
  ScheduleRow,
  MortgageResults,
};

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  // Bezpieczne zaokrąglenie do 2 miejsc (PL waluty)
  private round2(x: number): number {
    return x;
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
    const total = y * 12 + (m - 1) + offset;
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
    return this.round2((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -periods)));
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
    edited: 'ltv' | 'loanAmount' | 'propertyValue',
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

  private calcInsuranceCostForMonth(
    date: string,
    saldo: number,
    inputs: MortgageInputs,
    oc: OverheadCostsInputs,
    monthIndexFromStart: number,
  ): number {
    let cost = 0;

    // 4. Ubezpieczenie nieruchomości
    const pi = oc.propertyInsurance;
    if (pi && pi.value > 0 && this.isMonthInRange(date, pi.from, pi.to)) {
      const diffFromStart = this.monthDiff(pi.from, date);
      if (diffFromStart >= 0) {
        const shouldCharge =
          pi.frequency === 'co miesiąc' || (pi.frequency === 'co rok' && diffFromStart % 12 === 0);
        if (shouldCharge) {
          const base = this.getInsuranceBase(
            pi.calcMethod,
            inputs.propertyValue,
            inputs.loanAmount,
            saldo,
          );
          const amount =
            pi.calcMethod === 'znam kwotę' ? pi.value : this.round2((base * pi.value) / 100);
          cost = this.round2(cost + amount);
        }
      }
    }

    // 6. Ubezpieczenie na życie
    const li = oc.lifeInsurance;
    if (li && li.value > 0 && this.isMonthInRange(date, li.from, li.to)) {
      const diffFromStart = this.monthDiff(li.from, date);
      if (diffFromStart >= 0) {
        const shouldCharge =
          li.frequency === 'jednorazowo'
            ? diffFromStart === 0
            : li.frequency === 'co miesiąc'
              ? true
              : diffFromStart % 12 === 0; // co rok
        if (shouldCharge) {
          const base = this.getInsuranceBaseNoProperty(li.calcMethod, inputs.loanAmount, saldo);
          const amount =
            li.calcMethod === 'znam kwotę' ? li.value : this.round2((base * li.value) / 100);
          cost = this.round2(cost + amount);
        }
      }
    }

    // 7. Ubezpieczenie od utraty pracy
    const jl = oc.jobLossInsurance;
    if (jl && jl.value > 0 && date >= (jl.from || '')) {
      const diffFromStart = this.monthDiff(jl.from, date);
      if (diffFromStart >= 0) {
        const shouldCharge =
          jl.frequency === 'jednorazowo'
            ? diffFromStart === 0
            : jl.frequency === 'co miesiąc'
              ? true
              : diffFromStart % 12 === 0;
        if (shouldCharge) {
          const base = this.getInsuranceBaseNoProperty(jl.calcMethod, inputs.loanAmount, saldo);
          const amount =
            jl.calcMethod === 'znam kwotę' ? jl.value : this.round2((base * jl.value) / 100);
          cost = this.round2(cost + amount);
        }
      }
    }

    // 8. Dodatkowe koszty
    for (const ac of oc.additionalCosts ?? []) {
      if (!ac.value || ac.value <= 0 || !ac.from) continue;
      if (date < ac.from) continue;
      const diffFromStart = this.monthDiff(ac.from, date);
      if (diffFromStart < 0) continue;
      const shouldCharge =
        ac.frequency === 'jednorazowo'
          ? diffFromStart === 0
          : ac.frequency === 'co miesiąc'
            ? true
            : diffFromStart % 12 === 0;
      if (shouldCharge) {
        const base = this.getInsuranceBaseNoProperty(ac.calcMethod, inputs.loanAmount, saldo);
        const amount =
          ac.calcMethod === 'znam kwotę' ? ac.value : this.round2((base * ac.value) / 100);
        cost = this.round2(cost + amount);
      }
    }

    return cost;
  }

  private getInsuranceBase(
    method: InsuranceCalcMethod,
    propertyValue: number,
    loanAmount: number,
    saldo: number,
  ): number {
    switch (method) {
      case '% wartości nieruchomości':
        return propertyValue;
      case '% kwoty kredytu':
        return loanAmount;
      case '% salda kredytu':
        return saldo;
      default:
        return 0;
    }
  }

  private getInsuranceBaseNoProperty(
    method: LifeInsuranceCalcMethod,
    loanAmount: number,
    saldo: number,
  ): number {
    switch (method) {
      case '% kwoty kredytu':
        return loanAmount;
      case '% salda kredytu':
        return saldo;
      default:
        return 0;
    }
  }

  private getEffectiveRateForMonth(
    baseRate: number,
    date: string,
    startDate: string,
    oc?: OverheadCostsInputs,
  ): number {
    let rate = baseRate;
    if (!oc) return rate;

    // 3. Ubezpieczenie pomostowe – podwyższenie oprocentowania
    const bi = oc.bridgeInsurance;
    if (bi && bi.rateIncrease > 0 && bi.months > 0) {
      const monthIdx = this.monthDiff(startDate, date);
      if (monthIdx >= 1 && monthIdx <= bi.months) {
        rate += bi.rateIncrease;
      }
    }

    // 5. Ubezpieczenie niskiego wkładu – podwyższenie oprocentowania (bezterminowe)
    const lei = oc.lowEquityInsurance;
    if (lei && lei.rateIncrease > 0) {
      rate += lei.rateIncrease;
    }

    // 9. Promocyjna wysokość oprocentowania – obniżenie
    const pr = oc.promotionalRate;
    if (pr && pr.rateDecrease > 0 && this.isMonthInRange(date, pr.from, pr.to)) {
      rate = Math.max(0, rate - pr.rateDecrease);
    }

    return rate;
  }

  compute(inputs: MortgageInputs): MortgageResults {
    const nTotal = Math.max(0, Math.trunc(inputs.loanPeriod));
    const graceMonths = Math.max(0, this.monthDiff(inputs.startDate, inputs.capitalStartDate) - 1);
    const amortMonths = Math.max(0, nTotal - graceMonths);

    const baseEffectiveRate =
      inputs.rateType === 'zmienna'
        ? (Number(inputs.wibor) || 0) + (Number(inputs.margin) || 0)
        : Number(inputs.nominalRate) || 0;

    const oc = inputs.overheadCosts;

    // Początkowe i – bez modyfikacji (do annuity na start)
    const effectiveRate = baseEffectiveRate;
    const i = this.monthlyRate(effectiveRate);

    const prepaymentRules = (inputs.prepaymentRules ?? [])
      .filter((r) => r?.from && (r?.frequency === 'jednorazowo' || !!r?.to))
      .map((r) => ({
        frequency: r.frequency,
        from: r.from,
        to: r.frequency === 'jednorazowo' ? r.from : r.to || r.from,
        amount: this.asNonNegativeNumber(r.amount),
        effect: r.effect,
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
        trancheDisbursementFees = this.round2(
          trancheDisbursementFees + this.asNonNegativeNumber(t.disbursementFee),
        );
      }
    }

    const schedule: ScheduleRow[] = [];
    // Saldo początkowe = kwota pierwszej transzy (lub cała kwota kredytu, gdy brak transz)
    let saldo =
      tranches.length > 1
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

      // Dynamiczna stopa dla tego miesiąca (ubezpieczenie pomostowe, niski wkład, promocja)
      const monthEffRate = this.getEffectiveRateForMonth(
        baseEffectiveRate,
        date,
        inputs.startDate,
        oc,
      );
      const iMonth = this.monthlyRate(monthEffRate);
      const interest = this.round2(saldo * iMonth);

      let capital = 0;
      let baseRate = 0;

      if (inGrace || remainingAmortMonths <= 0) {
        capital = 0;
        baseRate = interest;
      } else if (inputs.installmentType === 'rowne') {
        const planned =
          equalRate > 0 ? equalRate : this.annuityPayment(saldo, i, remainingAmortMonths);
        capital = this.round2(planned - interest);
        if (capital < 0) capital = 0;
        if (capital > saldo) capital = this.round2(saldo);
        baseRate = this.round2(interest + capital);
      } else {
        const capitalConst =
          decreasingCapitalPart > 0
            ? decreasingCapitalPart
            : this.round2(saldo / Math.max(1, remainingAmortMonths));
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

      if (
        targetInstallmentRule &&
        this.isMonthInRange(date, targetInstallmentRule.from, targetInstallmentRule.to)
      ) {
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

      const commission =
        prepayment > 0 &&
        commissionRatePct > 0 &&
        (!commissionValidUntil || date <= commissionValidUntil)
          ? this.round2(prepayment * (commissionRatePct / 100))
          : 0;

      // Koszt ubezpieczeń i dodatkowych kosztów w tym miesiącu
      const insuranceCost = oc ? this.calcInsuranceCostForMonth(date, saldo, inputs, oc, idx) : 0;

      const totalRateForMonth = this.round2(baseRate + prepayment + commission);

      schedule.push({
        index: idx,
        date,
        rate: totalRateForMonth,
        capital,
        interest,
        prepayment,
        commission,
        remaining: saldo,
        insuranceCost,
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
          decreasingCapitalPart = saldo / Math.max(1, remainingAmortMonths);
        }
      }

      if (nTotal > 0 && idx >= nTotal && prepayment === 0 && remainingAmortMonths === 0) {
        break;
      }
    }

    // Sumy i wskaźniki
    const totalRate = schedule.reduce((s, r) => s + r.rate, 0);
    const totalCapital = schedule.reduce((s, r) => s + r.capital, 0);
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);

    const totalInsuranceCosts = schedule.reduce((s, r) => s + r.insuranceCost, 0);
    const loanCommission = oc
      ? this.round2((inputs.loanAmount * (oc.commissionPct || 0)) / 100)
      : 0;
    const appraisalFee = oc ? oc.appraisalFee || 0 : 0;
    const earlyRepaymentCommissions = schedule.reduce((s, r) => s + r.commission, 0);

    const overheadCosts =
      loanCommission +
      appraisalFee +
      totalInsuranceCosts +
      earlyRepaymentCommissions +
      trancheDisbursementFees;
    const prepayments = schedule.reduce((s, r) => s + r.prepayment, 0);
    const totalAllPayments = totalRate + overheadCosts;
    const bankReturnRatioPct =
      inputs.loanAmount > 0 ? (totalAllPayments / inputs.loanAmount) * 100 : 0;

    const first =
      schedule.length > 0
        ? { rate: schedule[0].rate, capital: schedule[0].capital, interest: schedule[0].interest }
        : null;

    return {
      effectiveRate: effectiveRate,
      totalMonths: schedule.length,
      amortizationMonths: Math.max(0, schedule.length - Math.min(graceMonths, schedule.length)),
      firstInstallment: first,
      totals: {
        totalRate,
        totalCapital,
        totalInterest,
        overheadCosts,
        prepayments,
        bankReturnRatioPct,
        totalAllPayments,
      },
      schedule,
    };
  }
}
