import {
  buildMonthPickerShortcuts,
  MonthPickerReferenceDates,
} from './month-picker-shortcuts.helper';

const references: MonthPickerReferenceDates = {
  currentMonth: '2026-06',
  loanStart: '2026-01',
  capitalStart: '2026-02',
  loanEnd: '2046-01',
};

describe('buildMonthPickerShortcuts', () => {
  it('zwraca bieżący miesiąc oraz kluczowe daty kredytu w ustalonej kolejności', () => {
    const result = buildMonthPickerShortcuts(references);
    expect(result.map((shortcut) => shortcut.value)).toEqual([
      '2026-06',
      '2026-01',
      '2026-02',
      '2046-01',
    ]);
  });

  it('pomija skrót o pustej wartości (np. brak ostatniego miesiąca kredytu)', () => {
    const result = buildMonthPickerShortcuts({ ...references, loanEnd: '' });
    expect(result.map((shortcut) => shortcut.value)).toEqual(['2026-06', '2026-01', '2026-02']);
  });

  it('zwraca tylko bieżący miesiąc, gdy żadna data kredytu nie jest określona', () => {
    const result = buildMonthPickerShortcuts({
      currentMonth: '2026-06',
      loanStart: '',
      capitalStart: '',
      loanEnd: '',
    });
    expect(result.map((shortcut) => shortcut.value)).toEqual(['2026-06']);
  });
});
