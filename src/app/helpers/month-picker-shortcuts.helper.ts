import { MonthPickerShortcut } from '../model';

/** Wartości kluczowych dat kredytu (`YYYY-MM`) używane do budowy skrótów pickera. Pusty string = brak. */
export interface MonthPickerReferenceDates {
  readonly currentMonth: string;
  readonly loanStart: string;
  readonly capitalStart: string;
  readonly loanEnd: string;
}

const SHORTCUT_LABEL = {
  currentMonth: 'Bieżący miesiąc',
  loanStart: 'Data uruchomienia',
  capitalStart: 'Początek spłat kapitału',
  loanEnd: 'Ostatni miesiąc kredytu',
} as const;

/**
 * Buduje listę skrótów dat dla okna wyboru miesiąca — bieżący miesiąc oraz kluczowe daty kredytu.
 * Skróty o pustej wartości są pomijane (np. brak liczby rat ⇒ brak ostatniego miesiąca kredytu).
 */
export function buildMonthPickerShortcuts(
  references: MonthPickerReferenceDates,
): MonthPickerShortcut[] {
  return [
    { label: SHORTCUT_LABEL.currentMonth, value: references.currentMonth },
    { label: SHORTCUT_LABEL.loanStart, value: references.loanStart },
    { label: SHORTCUT_LABEL.capitalStart, value: references.capitalStart },
    { label: SHORTCUT_LABEL.loanEnd, value: references.loanEnd },
  ].filter((shortcut) => shortcut.value !== '');
}
