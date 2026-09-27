/** Zaokrągla wartość w górę do najbliższej wielokrotności kroku osi; minimum to jeden krok. */
export function roundUpToStep(value: number, step: number): number {
  if (value <= 0) return step;
  return Math.ceil(value / step) * step;
}
