import { ScheduleRow, YearGroup } from '../model';

/** Agreguje wiersze harmonogramu spłaty w grupy po roku kalendarzowym (sumy roczne + saldo na koniec roku). */
export function groupByYear(rows: ScheduleRow[]): YearGroup[] {
  const out = new Map<number, YearGroup>();
  for (const row of rows) {
    const [year] = row.date.split('-').map((value) => parseInt(value, 10));
    const group = out.get(year) || {
      year,
      sumRate: 0,
      sumCapital: 0,
      sumInterest: 0,
      sumPrepayment: 0,
      sumCommission: 0,
      sumInsuranceCost: 0,
      lastRemaining: 0,
      firstInterestRate: 0,
      lastInterestRate: 0,
      rows: [],
    };
    group.sumRate += row.rate;
    group.sumCapital += row.capital;
    group.sumInterest += row.interest;
    group.sumPrepayment += row.prepayment;
    group.sumCommission += row.commission;
    group.sumInsuranceCost += row.insuranceCost;
    group.lastRemaining = row.remaining;
    if (group.rows.length === 0) {
      group.firstInterestRate = row.interestRate;
    }
    group.lastInterestRate = row.interestRate;
    group.rows.push(row);
    out.set(year, group);
  }
  return Array.from(out.values())
    .sort((groupA, groupB) => groupA.year - groupB.year)
    .map((group) => ({
      ...group,
      sumRate: Math.round(group.sumRate * 100) / 100,
      sumCapital: Math.round(group.sumCapital * 100) / 100,
      sumInterest: Math.round(group.sumInterest * 100) / 100,
      sumPrepayment: Math.round(group.sumPrepayment * 100) / 100,
      sumInsuranceCost: Math.round(group.sumInsuranceCost * 100) / 100,
      sumCommission: Math.round(group.sumCommission * 100) / 100,
    }));
}
