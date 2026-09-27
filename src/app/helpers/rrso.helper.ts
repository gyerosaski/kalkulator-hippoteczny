import { CashFlowEvent } from '../model';

const LOWER_BOUND = -0.9999;
const MAX_UPPER_BOUND = 100; // 10 000% — powyżej uznajemy RRSO za nieobliczalne
const MAX_ITERATIONS = 200;
const PRECISION = 1e-10;

function presentValue(events: CashFlowEvent[], annualRate: number): number {
  return events.reduce(
    (sum, event) => sum + event.amount * Math.pow(1 + annualRate, -event.monthOffset / 12),
    0,
  );
}

/**
 * Wylicza RRSO (Rzeczywistą Roczną Stopę Oprocentowania) zgodnie z formułą APRC
 * z dyrektywy 2008/48/WE: szuka stopy `X`, dla której suma zdyskontowanych wypłat
 * kredytu równa się sumie zdyskontowanych płatności kredytobiorcy
 * (`Σ Dₖ·(1+X)^(−tₖ/12) = Σ Pⱼ·(1+X)^(−tⱼ/12)`, czas w miesiącach, wykładnik w latach).
 *
 * Solver: bisekcja na przedziale od −99,99% do górnej granicy podwajanej aż do zmiany znaku.
 * Zwraca wartość w procentach (np. `7.85`) lub `null`, gdy RRSO jest nieobliczalne
 * (brak wypłat/płatności lub brak pierwiastka w sensownym zakresie).
 */
export function computeRrso(
  disbursements: CashFlowEvent[],
  payments: CashFlowEvent[],
): number | null {
  const totalDisbursed = disbursements.reduce((sum, event) => sum + event.amount, 0);
  const totalPaid = payments.reduce((sum, event) => sum + event.amount, 0);
  if (totalDisbursed <= 0 || totalPaid <= 0) return null;

  const netPresentValue = (annualRate: number): number =>
    presentValue(payments, annualRate) - presentValue(disbursements, annualRate);

  let lowerBound = LOWER_BOUND;
  if (netPresentValue(lowerBound) < 0) return null;

  let upperBound = 1;
  while (netPresentValue(upperBound) > 0) {
    upperBound *= 2;
    if (upperBound > MAX_UPPER_BOUND) return null;
  }

  for (
    let iteration = 0;
    iteration < MAX_ITERATIONS && upperBound - lowerBound > PRECISION;
    iteration++
  ) {
    const midpoint = (lowerBound + upperBound) / 2;
    if (netPresentValue(midpoint) > 0) {
      lowerBound = midpoint;
    } else {
      upperBound = midpoint;
    }
  }

  return ((lowerBound + upperBound) / 2) * 100;
}
