import { ScheduleRow } from '../model';
import { groupByYear } from './year-group.helper';

function buildScheduleRow(overrides: Partial<ScheduleRow>): ScheduleRow {
  return {
    index: 0,
    date: '2026-01',
    rate: 0,
    capital: 0,
    interest: 0,
    interestRate: 0,
    prepayment: 0,
    commission: 0,
    remaining: 0,
    insuranceCost: 0,
    costBreakdown: [],
    ...overrides,
  };
}

describe('groupByYear', () => {
  it('powinien zagregować wiersze w grupy roczne z sumami i saldem na koniec roku', () => {
    const rows: ScheduleRow[] = [
      buildScheduleRow({
        index: 1,
        date: '2026-11',
        rate: 1000,
        capital: 600,
        interest: 400,
        interestRate: 7.5,
        remaining: 299_400,
      }),
      buildScheduleRow({
        index: 2,
        date: '2026-12',
        rate: 1000,
        capital: 610,
        interest: 390,
        interestRate: 7.5,
        remaining: 298_790,
      }),
      buildScheduleRow({
        index: 3,
        date: '2027-01',
        rate: 1000,
        capital: 620,
        interest: 380,
        interestRate: 6.8,
        prepayment: 5000,
        remaining: 293_170,
      }),
    ];

    const groups = groupByYear(rows);

    expect(groups).toHaveLength(2);
    expect(groups[0].year).toBe(2026);
    expect(groups[0].sumRate).toBe(2000);
    expect(groups[0].sumCapital).toBe(1210);
    expect(groups[0].sumInterest).toBe(790);
    expect(groups[0].lastRemaining).toBe(298_790);
    expect(groups[0].rows).toHaveLength(2);
    expect(groups[1].year).toBe(2027);
    expect(groups[1].sumPrepayment).toBe(5000);
    expect(groups[1].lastRemaining).toBe(293_170);
  });

  it('powinien zapamiętać stopę z pierwszego i ostatniego miesiąca roku oraz zaokrąglić sumy do groszy', () => {
    const rows: ScheduleRow[] = [
      buildScheduleRow({ index: 1, date: '2026-01', interest: 0.111, interestRate: 7.5 }),
      buildScheduleRow({ index: 2, date: '2026-02', interest: 0.222, interestRate: 6.9 }),
    ];

    const groups = groupByYear(rows);

    expect(groups[0].firstInterestRate).toBe(7.5);
    expect(groups[0].lastInterestRate).toBe(6.9);
    expect(groups[0].sumInterest).toBe(0.33);
  });

  it('powinien posortować grupy rosnąco po roku', () => {
    const rows: ScheduleRow[] = [
      buildScheduleRow({ index: 1, date: '2027-01' }),
      buildScheduleRow({ index: 2, date: '2026-12' }),
    ];

    const groups = groupByYear(rows);

    expect(groups.map((group) => group.year)).toEqual([2026, 2027]);
  });
});
