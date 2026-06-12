import { Injectable } from '@angular/core';
import {
  CommissionCalcMethod,
  InstallmentType,
  RatePeriod,
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
  OverheadCostKind,
  OverheadCostItem,
  CashFlowEvent,
} from '../../model/mortgage.model';
import { computeRrso } from '../../helpers/rrso.helper';

export {
  CommissionCalcMethod,
  InstallmentType,
  RateType,
  PrepaymentFrequency,
  PrepaymentEffect,
  InsuranceFrequency,
  InsuranceCalcMethod,
  LifeInsuranceCalcMethod,
  OverheadCostKind,
};

export type {
  RatePeriod,
  PrepaymentRule,
  TargetInstallmentRule,
  EarlyRepaymentCommission,
  Tranche,
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
  OverheadCostItem,
};

@Injectable({ providedIn: 'root' })
export class CalculatorService {
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
    if (monthlyRate === 0) return principal / periods;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -periods));
  }

  /**
   * Liczba miesięcy potrzebna do spłaty salda przy stałej racie annuitetowej.
   * Zwraca Infinity, gdy rata nie pokrywa odsetek (saldo nie amortyzuje się).
   */
  private annuityTermMonths(balance: number, monthlyRate: number, payment: number): number {
    if (balance <= 0) return 0;
    if (payment <= 0) return Number.POSITIVE_INFINITY;
    if (monthlyRate === 0) return Math.ceil(balance / payment);
    if (payment <= balance * monthlyRate) return Number.POSITIVE_INFINITY;
    return Math.ceil(
      Math.log(payment / (payment - balance * monthlyRate)) / Math.log(1 + monthlyRate),
    );
  }

  /**
   * Skrócony pozostały okres amortyzacji po nadpłacie skracającej okres:
   * rata (lub część kapitałowa) pozostaje bez zmian, skraca się liczba miesięcy.
   */
  private shortenedAmortMonths(
    balance: number,
    monthlyRate: number,
    currentAmortMonths: number,
    installmentType: InstallmentType,
    equalRate: number,
    decreasingCapitalPart: number,
  ): number {
    if (installmentType === InstallmentType.EQUAL) {
      const referencePayment =
        equalRate > 0 ? equalRate : this.annuityPayment(balance, monthlyRate, currentAmortMonths);
      return Math.min(
        currentAmortMonths,
        this.annuityTermMonths(balance, monthlyRate, referencePayment),
      );
    }
    const capitalPart =
      decreasingCapitalPart > 0 ? decreasingCapitalPart : balance / Math.max(1, currentAmortMonths);
    return Math.min(currentAmortMonths, Math.ceil(balance / capitalPart));
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
      case PrepaymentFrequency.ONE_TIME:
        return diff === 0;
      case PrepaymentFrequency.MONTHLY:
        return true;
      case PrepaymentFrequency.QUARTERLY:
        return diff % 3 === 0;
      case PrepaymentFrequency.YEARLY:
        return diff % 12 === 0;
      default:
        return false;
    }
  }

  private prepaymentFromRule(month: string, rule: PrepaymentRule): number {
    if (!this.isMonthInRange(month, rule.from, rule.to)) return 0;
    if (!this.matchesFrequency(month, rule)) return 0;
    return this.asNonNegativeNumber(rule.amount);
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
      resultAmount = safePV * (resultLtv / 100);
    } else if (edited === 'loanAmount' || edited === 'propertyValue') {
      // LTV = Kwota / Wartość * 100 (jeśli PV > 0)
      if (safePV > 0) {
        resultLtv = (resultAmount / safePV) * 100;
      } else {
        resultLtv = 0;
      }
    }
    // Ograniczenia domenowe
    if (resultPV > 0 && resultAmount > resultPV) {
      resultAmount = resultPV;
      resultLtv = safePV > 0 ? (resultAmount / safePV) * 100 : 0;
    }
    if (resultLtv < 0) resultLtv = 0;
    if (resultLtv > 100) {
      resultLtv = 100;
      resultAmount = safePV * (resultLtv / 100);
    }

    return { propertyValue: resultPV, loanAmount: resultAmount, ltv: resultLtv };
  }

  private calcInsuranceCostForMonth(
    date: string,
    saldo: number,
    inputs: MortgageInputs,
    oc: OverheadCostsInputs,
    monthIndexFromStart: number,
  ): OverheadCostItem[] {
    const items: OverheadCostItem[] = [];

    // 4. Ubezpieczenie nieruchomości
    const pi = oc.propertyInsurance;
    if (pi && pi.value > 0 && this.isMonthInRange(date, pi.from, pi.to)) {
      const diffFromStart = this.monthDiff(pi.from, date);
      if (diffFromStart >= 0) {
        const shouldCharge =
          pi.frequency === InsuranceFrequency.MONTHLY ||
          (pi.frequency === InsuranceFrequency.YEARLY && diffFromStart % 12 === 0);
        if (shouldCharge) {
          const base = this.getInsuranceBase(
            pi.calcMethod,
            inputs.propertyValue,
            inputs.loanAmount,
            saldo,
          );
          const amount =
            pi.calcMethod === InsuranceCalcMethod.FIXED_AMOUNT ? pi.value : (base * pi.value) / 100;
          items.push({ kind: OverheadCostKind.PROPERTY_INSURANCE, value: amount });
        }
      }
    }

    // 6. Ubezpieczenie na życie
    const li = oc.lifeInsurance;
    if (li && li.value > 0 && this.isMonthInRange(date, li.from, li.to)) {
      const diffFromStart = this.monthDiff(li.from, date);
      if (diffFromStart >= 0) {
        const shouldCharge =
          li.frequency === InsuranceFrequency.ONE_TIME
            ? diffFromStart === 0
            : li.frequency === InsuranceFrequency.MONTHLY
              ? true
              : diffFromStart % 12 === 0;
        if (shouldCharge) {
          const base = this.getInsuranceBaseNoProperty(li.calcMethod, inputs.loanAmount, saldo);
          const amount =
            li.calcMethod === LifeInsuranceCalcMethod.FIXED_AMOUNT
              ? li.value
              : (base * li.value) / 100;
          items.push({ kind: OverheadCostKind.LIFE_INSURANCE, value: amount });
        }
      }
    }

    // 7. Ubezpieczenie od utraty pracy
    const jl = oc.jobLossInsurance;
    if (jl && jl.value > 0 && date >= (jl.from || '')) {
      const diffFromStart = this.monthDiff(jl.from, date);
      if (diffFromStart >= 0) {
        const shouldCharge =
          jl.frequency === InsuranceFrequency.ONE_TIME
            ? diffFromStart === 0
            : jl.frequency === InsuranceFrequency.MONTHLY
              ? true
              : diffFromStart % 12 === 0;
        if (shouldCharge) {
          const base = this.getInsuranceBaseNoProperty(jl.calcMethod, inputs.loanAmount, saldo);
          const amount =
            jl.calcMethod === LifeInsuranceCalcMethod.FIXED_AMOUNT
              ? jl.value
              : (base * jl.value) / 100;
          items.push({ kind: OverheadCostKind.JOB_LOSS_INSURANCE, value: amount });
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
        ac.frequency === InsuranceFrequency.ONE_TIME
          ? diffFromStart === 0
          : ac.frequency === InsuranceFrequency.MONTHLY
            ? true
            : diffFromStart % 12 === 0;
      if (shouldCharge) {
        const base = this.getInsuranceBaseNoProperty(ac.calcMethod, inputs.loanAmount, saldo);
        const amount =
          ac.calcMethod === LifeInsuranceCalcMethod.FIXED_AMOUNT
            ? ac.value
            : (base * ac.value) / 100;
        items.push({ kind: OverheadCostKind.ADDITIONAL_COST, name: ac.name, value: amount });
      }
    }

    return items;
  }

  private getInsuranceBase(
    method: InsuranceCalcMethod,
    propertyValue: number,
    loanAmount: number,
    saldo: number,
  ): number {
    switch (method) {
      case InsuranceCalcMethod.PCT_PROPERTY_VALUE:
        return propertyValue;
      case InsuranceCalcMethod.PCT_LOAN_AMOUNT:
        return loanAmount;
      case InsuranceCalcMethod.PCT_BALANCE:
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
      case LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT:
        return loanAmount;
      case LifeInsuranceCalcMethod.PCT_BALANCE:
        return saldo;
      default:
        return 0;
    }
  }

  private getEffectiveRateForMonth(
    baseRate: number,
    date: string,
    startDate: string,
    currentBalance: number,
    propertyValue: number,
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

    // 5. Ubezpieczenie niskiego wkładu – podwyższenie oprocentowania gdy LTV > 80%
    const lei = oc.lowEquityInsurance;
    if (lei && lei.rateIncrease > 0) {
      const currentLtv = propertyValue > 0 ? (currentBalance / propertyValue) * 100 : 100;
      if (currentLtv > 80) {
        rate += lei.rateIncrease;
      }
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

    const oc = inputs.overheadCosts;

    // Okresy oprocentowania — posortowane wg daty obowiązywania
    const sortedPeriods: RatePeriod[] = [...(inputs.ratePeriods ?? [])].sort((a, b) =>
      a.from <= b.from ? -1 : 1,
    );
    const fallbackPeriod: RatePeriod = {
      from: inputs.startDate,
      rateType: RateType.VARIABLE,
      nominalRate: 9,
      wibor: 7,
      margin: 2,
    };

    const getPeriod = (date: string): RatePeriod => {
      if (sortedPeriods.length === 0) return fallbackPeriod;
      let applicable = sortedPeriods[0];
      for (const p of sortedPeriods) {
        if (p.from <= date) applicable = p;
        else break;
      }
      return applicable;
    };

    const getBaseEffectiveRate = (period: RatePeriod): number =>
      period.rateType === RateType.VARIABLE
        ? (Number(period.wibor) || 0) + (Number(period.margin) || 0)
        : Number(period.nominalRate) || 0;

    // Okres oprocentowania dla pierwszej raty
    const firstPaymentDate = this.addMonths(inputs.startDate, 1);
    const initialPeriod = getPeriod(firstPaymentDate);
    const initialBaseRate = getBaseEffectiveRate(initialPeriod);
    const initialI = this.monthlyRate(initialBaseRate);

    const prepaymentRules = (inputs.prepaymentRules ?? [])
      .filter((r) => r?.from && (r?.frequency === PrepaymentFrequency.ONE_TIME || !!r?.to))
      .map((r) => ({
        frequency: r.frequency,
        from: r.from,
        to: r.frequency === PrepaymentFrequency.ONE_TIME ? r.from : r.to || r.from,
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
        trancheDisbursementFees += this.asNonNegativeNumber(t.disbursementFee);
      }
    }

    const schedule: ScheduleRow[] = [];
    // Saldo początkowe = kwota pierwszej transzy (lub cała kwota kredytu, gdy brak transz)
    let saldo =
      tranches.length > 1
        ? this.asNonNegativeNumber(tranches[0].amount)
        : this.asNonNegativeNumber(inputs.loanAmount);
    let remainingAmortMonths = amortMonths;
    let equalRate = this.annuityPayment(saldo, initialI, amortMonths);
    let decreasingCapitalPart = amortMonths > 0 ? saldo / amortMonths : 0;
    let prevPeriod = initialPeriod;
    // Flaga: transza uruchomiona w tym miesiącu – przelicz ratę dopiero w kolejnym
    let needsRateRecalcAfterTranche = false;

    const loanCommission = oc
      ? oc.commissionCalcMethod === CommissionCalcMethod.FIXED_AMOUNT
        ? oc.commissionValue || 0
        : (inputs.loanAmount * (oc.commissionValue || 0)) / 100
      : 0;
    const appraisalFee = oc ? oc.appraisalFee || 0 : 0;
    const upfrontCosts = loanCommission + appraisalFee;

    const maxMonthsLimit = Math.max(nTotal, 1) + 1_200;
    for (let idx = 1; idx <= maxMonthsLimit; idx++) {
      if (saldo <= 0) break;

      const date = this.addMonths(inputs.startDate, idx);
      const period = getPeriod(date);
      const baseEffectiveRate = getBaseEffectiveRate(period);
      const iCurrent = this.monthlyRate(baseEffectiveRate);

      const inGrace = idx <= graceMonths;

      // Odroczone przeliczenie raty po transzy z poprzedniego miesiąca
      if (needsRateRecalcAfterTranche && !inGrace && remainingAmortMonths > 0) {
        needsRateRecalcAfterTranche = false;
        if (inputs.installmentType === InstallmentType.EQUAL) {
          equalRate = this.annuityPayment(saldo, iCurrent, Math.max(1, remainingAmortMonths));
        } else {
          decreasingCapitalPart = saldo / Math.max(1, remainingAmortMonths);
        }
      }

      // Przy zmianie okresu oprocentowania przelicz ratę
      if (period !== prevPeriod) {
        prevPeriod = period;
        if (!inGrace && remainingAmortMonths > 0) {
          if (inputs.installmentType === InstallmentType.EQUAL) {
            equalRate = this.annuityPayment(saldo, iCurrent, remainingAmortMonths);
          } else {
            decreasingCapitalPart = saldo / remainingAmortMonths;
          }
        }
      }

      // Dynamiczna stopa dla tego miesiąca (ubezpieczenie pomostowe, niski wkład, promocja)
      const monthEffRate = this.getEffectiveRateForMonth(
        baseEffectiveRate,
        date,
        inputs.startDate,
        saldo,
        inputs.propertyValue,
        oc,
      );
      const iMonth = this.monthlyRate(monthEffRate);
      const interest = saldo * iMonth;

      let capital = 0;
      let baseRate = 0;

      if (inGrace || remainingAmortMonths <= 0) {
        capital = 0;
        baseRate = interest;
      } else if (inputs.installmentType === InstallmentType.EQUAL) {
        const planned =
          equalRate > 0 ? equalRate : this.annuityPayment(saldo, iCurrent, remainingAmortMonths);
        capital = planned - interest;
        if (capital < 0) capital = 0;
        if (capital > saldo) capital = saldo;
        baseRate = interest + capital;
      } else {
        const capitalConst =
          decreasingCapitalPart > 0
            ? decreasingCapitalPart
            : saldo / Math.max(1, remainingAmortMonths);
        capital = Math.min(saldo, capitalConst);
        baseRate = interest + capital;
      }

      const balanceForInsuranceCalc = saldo;
      saldo = Math.max(0, saldo - capital);

      // Transza uruchamiana w tym miesiącu: dodaj do salda PO obliczeniu raty,
      // żeby rata wzrosła dopiero w kolejnym miesiącu
      const trancheAmount = trancheMap.get(date) || 0;
      if (trancheAmount > 0) {
        saldo += trancheAmount;
        needsRateRecalcAfterTranche = true;
      }

      let prepaymentLower = 0;
      let prepaymentShorten = 0;

      for (const rule of prepaymentRules) {
        const amount = this.prepaymentFromRule(date, rule);
        if (amount <= 0) continue;
        if (rule.effect === PrepaymentEffect.LOWER_INSTALLMENT) {
          prepaymentLower += amount;
        } else {
          prepaymentShorten += amount;
        }
      }

      if (
        targetInstallmentRule &&
        this.isMonthInRange(date, targetInstallmentRule.from, targetInstallmentRule.to)
      ) {
        const targetRate = this.asNonNegativeNumber(targetInstallmentRule.targetRate);
        const targetPrepayment = Math.max(0, targetRate - baseRate);
        if (targetPrepayment > 0) {
          if (targetInstallmentRule.effect === PrepaymentEffect.LOWER_INSTALLMENT) {
            prepaymentLower += targetPrepayment;
          } else {
            prepaymentShorten += targetPrepayment;
          }
        }
      }

      // Clamp do salda: najpierw konsumowana jest część obniżająca ratę,
      // dopiero reszta salda przypada części skracającej okres
      const appliedPrepaymentLower = Math.min(prepaymentLower, saldo);
      const appliedPrepaymentShorten = Math.min(
        prepaymentShorten,
        Math.max(0, saldo - appliedPrepaymentLower),
      );
      const prepayment = appliedPrepaymentLower + appliedPrepaymentShorten;
      saldo = Math.max(0, saldo - prepayment);

      const commission =
        prepayment > 0 &&
        commissionRatePct > 0 &&
        (!commissionValidUntil || date <= commissionValidUntil)
          ? prepayment * (commissionRatePct / 100)
          : 0;

      // Koszt ubezpieczeń i dodatkowych kosztów w tym miesiącu — rozbity na składowe
      const costBreakdown: OverheadCostItem[] = [];
      if (idx === 1) {
        if (loanCommission > 0) {
          costBreakdown.push({ kind: OverheadCostKind.LOAN_COMMISSION, value: loanCommission });
        }
        if (appraisalFee > 0) {
          costBreakdown.push({ kind: OverheadCostKind.APPRAISAL_FEE, value: appraisalFee });
        }
      }
      if (oc) {
        costBreakdown.push(
          ...this.calcInsuranceCostForMonth(date, balanceForInsuranceCalc, inputs, oc, idx),
        );
      }
      const insuranceCost = costBreakdown.reduce((sum, item) => sum + item.value, 0);

      const totalRateForMonth = baseRate;

      schedule.push({
        index: idx,
        date,
        rate: totalRateForMonth,
        capital,
        interest,
        interestRate: monthEffRate,
        prepayment,
        commission,
        remaining: saldo,
        insuranceCost,
        costBreakdown,
      });

      if (!inGrace && remainingAmortMonths > 0) {
        remainingAmortMonths -= 1;
        if (saldo <= 0) {
          remainingAmortMonths = 0;
        } else {
          // Kolejność efektów w miesiącu: najpierw skrócenie okresu przy utrzymanej racie,
          // potem przeliczenie raty na (ewentualnie skróconym) pozostałym okresie
          if (appliedPrepaymentShorten > 0) {
            remainingAmortMonths = this.shortenedAmortMonths(
              saldo,
              iCurrent,
              remainingAmortMonths,
              inputs.installmentType,
              equalRate,
              decreasingCapitalPart,
            );
          }
          if (appliedPrepaymentLower > 0) {
            if (inputs.installmentType === InstallmentType.EQUAL) {
              equalRate = this.annuityPayment(saldo, iCurrent, Math.max(1, remainingAmortMonths));
            } else {
              decreasingCapitalPart = saldo / Math.max(1, remainingAmortMonths);
            }
          }
        }
      } else if (inGrace && remainingAmortMonths > 0 && saldo > 0) {
        if (appliedPrepaymentShorten > 0) {
          remainingAmortMonths = this.shortenedAmortMonths(
            saldo,
            iCurrent,
            remainingAmortMonths,
            inputs.installmentType,
            equalRate,
            decreasingCapitalPart,
          );
        }
        if (appliedPrepaymentLower > 0) {
          if (inputs.installmentType === InstallmentType.EQUAL) {
            equalRate = this.annuityPayment(saldo, iCurrent, Math.max(1, remainingAmortMonths));
          } else {
            decreasingCapitalPart = saldo / Math.max(1, remainingAmortMonths);
          }
        }
      }

      if (nTotal > 0 && idx >= nTotal && prepayment === 0 && remainingAmortMonths === 0) {
        break;
      }
    }

    const hasRateChanges =
      schedule.length > 1 && schedule.some((row) => row.interestRate !== schedule[0].interestRate);

    // Sumy i wskaźniki
    const totalRate = schedule.reduce((s, r) => s + r.rate, 0);
    const totalCapital = schedule.reduce((s, r) => s + r.capital, 0);
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);

    const totalInsuranceCosts = schedule.reduce((s, r) => s + r.insuranceCost, 0);
    const earlyRepaymentCommissions = schedule.reduce((s, r) => s + r.commission, 0);

    const overheadCosts = totalInsuranceCosts + earlyRepaymentCommissions + trancheDisbursementFees;

    // Agregat rozbicia kosztów okołokredytowych dla całego okresu (suma value == overheadCosts)
    const breakdownByKey = new Map<string, OverheadCostItem>();
    for (const row of schedule) {
      for (const item of row.costBreakdown) {
        const key =
          item.kind === OverheadCostKind.ADDITIONAL_COST
            ? `${item.kind}:${item.name ?? ''}`
            : item.kind;
        const existing = breakdownByKey.get(key);
        if (existing) {
          existing.value += item.value;
        } else {
          breakdownByKey.set(key, { kind: item.kind, name: item.name, value: item.value });
        }
      }
    }
    const overheadCostsBreakdown: OverheadCostItem[] = [...breakdownByKey.values()];
    if (earlyRepaymentCommissions > 0) {
      overheadCostsBreakdown.push({
        kind: OverheadCostKind.EARLY_REPAYMENT_COMMISSION,
        value: earlyRepaymentCommissions,
      });
    }
    if (trancheDisbursementFees > 0) {
      overheadCostsBreakdown.push({
        kind: OverheadCostKind.TRANCHE_DISBURSEMENT_FEE,
        value: trancheDisbursementFees,
      });
    }
    const prepayments = schedule.reduce((s, r) => s + r.prepayment, 0);
    const totalAllPayments = totalRate + overheadCosts + prepayments;
    const bankReturnRatioPct =
      inputs.loanAmount > 0 ? (totalAllPayments / inputs.loanAmount) * 100 : 0;

    // RRSO — przepływy pieniężne z perspektywy kredytobiorcy.
    // Wypłaty: saldo początkowe w t=0 + kolejne transze w miesiącach ich uruchomienia.
    // Płatności: raty + nadpłaty + prowizje + koszty z harmonogramu, przy czym koszty
    // wstępne (prowizja za udzielenie + wycena, księgowane w wierszu 1) trafiają do t=0,
    // a prowizje za uruchomienie transz (nieobecne w harmonogramie) do miesięcy transz.
    const initialDisbursement =
      tranches.length > 1
        ? this.asNonNegativeNumber(tranches[0].amount)
        : this.asNonNegativeNumber(inputs.loanAmount);
    const disbursements: CashFlowEvent[] = [{ monthOffset: 0, amount: initialDisbursement }];
    const borrowerPayments: CashFlowEvent[] = [];
    if (tranches.length > 1) {
      // Pierwsza transza z definicji nie ma prowizji za uruchomienie — pomijana tu i w totals
      for (let trancheIndex = 1; trancheIndex < tranches.length; trancheIndex++) {
        const tranche = tranches[trancheIndex];
        const trancheAmount = this.asNonNegativeNumber(tranche.amount);
        const trancheMonthOffset = tranche.date
          ? Math.max(0, this.monthDiff(inputs.startDate, tranche.date))
          : 0;
        if (trancheAmount > 0 && tranche.date) {
          disbursements.push({ monthOffset: trancheMonthOffset, amount: trancheAmount });
        }
        const trancheFee = this.asNonNegativeNumber(tranche.disbursementFee);
        if (trancheFee > 0) {
          borrowerPayments.push({ monthOffset: trancheMonthOffset, amount: trancheFee });
        }
      }
    }
    if (upfrontCosts > 0 && schedule.length > 0) {
      borrowerPayments.push({ monthOffset: 0, amount: upfrontCosts });
    }
    for (const row of schedule) {
      const upfrontCostsInRow = row.index === 1 ? upfrontCosts : 0;
      const paymentAmount =
        row.rate + row.prepayment + row.commission + row.insuranceCost - upfrontCostsInRow;
      if (paymentAmount > 0) {
        borrowerPayments.push({ monthOffset: row.index, amount: paymentAmount });
      }
    }
    const rrso = computeRrso(disbursements, borrowerPayments);

    const firstCapitalRow = schedule.find((r) => r.capital > 0) ?? schedule[0] ?? null;
    const first = firstCapitalRow
      ? {
          rate: firstCapitalRow.rate,
          capital: firstCapitalRow.capital,
          interest: firstCapitalRow.interest,
        }
      : null;

    return {
      effectiveRate: initialBaseRate,
      rrso,
      totalMonths: schedule.length,
      amortizationMonths: Math.max(0, schedule.length - Math.min(graceMonths, schedule.length)),
      firstInstallment: first,
      hasRateChanges,
      totals: {
        totalRate,
        totalCapital,
        totalInterest,
        overheadCosts,
        overheadCostsBreakdown,
        prepayments,
        bankReturnRatioPct,
        totalAllPayments,
      },
      schedule,
    };
  }
}
