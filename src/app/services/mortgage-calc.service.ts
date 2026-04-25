import { Injectable } from '@angular/core';

export type InstallmentType = 'rowne' | 'malejace';
export type RateType = 'zmienna' | 'stala';

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
}

export interface ScheduleRow {
  index: number; // 1-based
  date: string; // 'YYYY-MM'
  rate: number; // Rata
  capital: number; // Kapitał
  interest: number; // Odsetki
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

    const schedule: ScheduleRow[] = [];
    let saldo = Number(inputs.loanAmount) || 0;

    // Miesiące karencji: tylko odsetki
    for (let k = 0; k < Math.min(graceMonths, nTotal); k++) {
      // Płatności są w miesiącu następującym po miesiącu uruchomienia
      const date = this.addMonths(inputs.startDate, k + 1);
      const odsetki = this.round2(saldo * i);
      const rata = odsetki; // brak kapitału w karencji
      const pozostalo = this.round2(saldo); // saldo bez zmian
      schedule.push({ index: k + 1, date, rate: rata, capital: 0, interest: odsetki, remaining: pozostalo });
    }

    // Część amortyzacyjna (po karencji)
    if (amortMonths > 0) {
      if (inputs.installmentType === 'rowne') {
        // Rata annuitetowa R = P*i / (1 - (1+i)^-n)
        const P = saldo;
        const n = amortMonths;
        const R = i === 0 ? this.round2(P / n) : this.round2(P * i / (1 - Math.pow(1 + i, -n)));
        for (let t = 1; t <= n; t++) {
          const idx = graceMonths + t; // global index
          const date = this.addMonths(inputs.startDate, idx);
          const interest = this.round2(saldo * i);
          const capital = this.round2(R - interest);
          saldo = this.round2(saldo - capital);
          // ostatnia rata – korekta do zera
          if (t === n) {
            const adjCapital = this.round2(capital + saldo);
            const adjRate = this.round2(interest + adjCapital);
            saldo = 0;
            schedule.push({ index: idx, date, rate: adjRate, capital: adjCapital, interest, remaining: saldo });
          } else {
            schedule.push({ index: idx, date, rate: R, capital, interest, remaining: saldo });
          }
        }
      } else {
        // malejące: stały kapitał = P / n, rata = kapitał + odsetki od salda
        const P = saldo;
        const n = amortMonths;
        const capitalConst = this.round2(P / n);
        for (let t = 1; t <= n; t++) {
          const idx = graceMonths + t;
          const date = this.addMonths(inputs.startDate, idx);
          const interest = this.round2(saldo * i);
          let capital = t === n ? this.round2(saldo) : capitalConst;
          const rate = this.round2(capital + interest);
          saldo = this.round2(saldo - capital);
          schedule.push({ index: idx, date, rate, capital, interest, remaining: saldo });
        }
      }
    }

    // Sumy i wskaźniki
    const totalRate = this.round2(schedule.reduce((s, r) => s + r.rate, 0));
    const totalCapital = this.round2(schedule.reduce((s, r) => s + r.capital, 0));
    const totalInterest = this.round2(schedule.reduce((s, r) => s + r.interest, 0));

    const overheadCosts = 0;
    const prepayments = 0;
    const bankReturnRatioPct = inputs.loanAmount > 0 ? this.round2(((totalRate + overheadCosts - prepayments) / inputs.loanAmount) * 100) : 0;

    const first = schedule.length > 0 ? { rate: schedule[0].rate, capital: schedule[0].capital, interest: schedule[0].interest } : null;

    return {
      effectiveRate: this.round2(effectiveRate),
      totalMonths: nTotal,
      amortizationMonths: amortMonths,
      firstInstallment: first,
      totals: {
        totalRate, totalCapital, totalInterest, overheadCosts, prepayments, bankReturnRatioPct
      },
      schedule
    };
  }
}
