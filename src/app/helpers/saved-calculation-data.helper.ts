import { MortgageFormRawValue } from '../model';

/**
 * Migruje pojedynczy okres oprocentowania do bieżącego kształtu. Pole wskaźnika referencyjnego
 * nosiło wcześniej nazwę `wibor` — starsze migawki są mapowane na `referenceIndex`.
 */
function migrateRatePeriod(ratePeriod: unknown): unknown {
  if (typeof ratePeriod !== 'object' || ratePeriod === null) return ratePeriod;

  const period = { ...(ratePeriod as Record<string, unknown>) };
  if ('wibor' in period) {
    period['referenceIndex'] ??= period['wibor'];
    delete period['wibor'];
  }
  return period;
}

/**
 * Normalizuje migawkę zapisanej kalkulacji (`SavedCalculationRecord.data`) do bieżącego
 * kształtu formularza. Obsługuje dwie historyczne zmiany struktury:
 * - starsze migawki przechowywały okresy oprocentowania w `basicData.ratePeriods` —
 *   obecnie żyją one w sekcji korzenia `ratePeriods.items`;
 * - pole wskaźnika referencyjnego nosiło wcześniej nazwę `wibor` — jest mapowane na `referenceIndex`.
 * Zwraca `null`, gdy dane nie są obiektem.
 */
export function normalizeCalculationData(data: unknown): MortgageFormRawValue | null {
  if (typeof data !== 'object' || data === null) return null;

  const snapshot = data as Record<string, unknown>;
  const ratePeriodsSection = snapshot['ratePeriods'] as { items?: unknown } | undefined;
  const basicData = (snapshot['basicData'] ?? {}) as Record<string, unknown>;

  const rawRatePeriods = Array.isArray(ratePeriodsSection?.items)
    ? ratePeriodsSection.items
    : Array.isArray(basicData['ratePeriods'])
      ? (basicData['ratePeriods'] as unknown[])
      : [];

  return {
    ...snapshot,
    ratePeriods: { items: rawRatePeriods.map(migrateRatePeriod) },
  } as MortgageFormRawValue;
}
