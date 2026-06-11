export function ym(date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

export function nextMonthStr(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return ym(d);
}

/** Liczba miesięcy między dwiema datami `YYYY-MM` (dodatnia, gdy `toYm` jest późniejszy). */
export function monthsBetweenStr(fromYm: string, toYm: string): number {
  const [fromYear, fromMonth] = fromYm.split('-').map((part) => parseInt(part, 10));
  const [toYear, toMonth] = toYm.split('-').map((part) => parseInt(part, 10));
  return toYear * 12 + toMonth - (fromYear * 12 + fromMonth);
}

export function addMonthsStr(baseYm: string, monthsToAdd: number): string {
  const [y, m] = baseYm.split('-').map((v) => parseInt(v, 10));
  const d = new Date(y, m - 1 + monthsToAdd, 1);
  return ym(d);
}
