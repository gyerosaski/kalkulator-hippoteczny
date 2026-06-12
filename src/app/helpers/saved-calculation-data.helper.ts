import { MortgageFormRawValue } from '../model';

/**
 * Normalizuje migawkę zapisanej kalkulacji (`SavedCalculationRecord.data`) do bieżącego
 * kształtu formularza. Starsze migawki przechowywały okresy oprocentowania w
 * `basicData.ratePeriods` — obecnie żyją one w sekcji korzenia `ratePeriods.items`.
 * Zwraca `null`, gdy dane nie są obiektem.
 */
export function normalizeCalculationData(data: unknown): MortgageFormRawValue | null {
  if (typeof data !== 'object' || data === null) return null;

  const snapshot = data as Record<string, unknown>;
  const ratePeriodsSection = snapshot['ratePeriods'] as { items?: unknown } | undefined;
  if (Array.isArray(ratePeriodsSection?.items)) {
    return data as MortgageFormRawValue;
  }

  const basicData = (snapshot['basicData'] ?? {}) as Record<string, unknown>;
  const legacyRatePeriods = Array.isArray(basicData['ratePeriods']) ? basicData['ratePeriods'] : [];
  return {
    ...snapshot,
    ratePeriods: { items: legacyRatePeriods },
  } as MortgageFormRawValue;
}
