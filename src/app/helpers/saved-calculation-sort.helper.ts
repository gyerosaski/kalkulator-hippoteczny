import { SavedCalculation, SavedCalculationSortOption, SortDirection } from '../model';

type SavedCalculationComparator = (a: SavedCalculation, b: SavedCalculation) => number;

const ASCENDING_COMPARATORS: Record<SavedCalculationSortOption, SavedCalculationComparator> = {
  [SavedCalculationSortOption.UPDATED]: (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
  [SavedCalculationSortOption.CREATED]: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  [SavedCalculationSortOption.NAME]: (a, b) => a.name.localeCompare(b.name, 'pl'),
  [SavedCalculationSortOption.LOAN_AMOUNT]: (a, b) => a.loanAmount - b.loanAmount,
  [SavedCalculationSortOption.FIRST_INSTALLMENT]: (a, b) => a.firstInstallment - b.firstInstallment,
};

/** Domyślny kierunek sortowania dla każdego kryterium — odwzorowuje naturalne oczekiwania (najnowsze/największe najpierw, nazwy A–Z). */
export const DEFAULT_SORT_DIRECTIONS: Record<SavedCalculationSortOption, SortDirection> = {
  [SavedCalculationSortOption.UPDATED]: SortDirection.DESCENDING,
  [SavedCalculationSortOption.CREATED]: SortDirection.DESCENDING,
  [SavedCalculationSortOption.NAME]: SortDirection.ASCENDING,
  [SavedCalculationSortOption.LOAN_AMOUNT]: SortDirection.DESCENDING,
  [SavedCalculationSortOption.FIRST_INSTALLMENT]: SortDirection.ASCENDING,
};

/** Zwraca posortowaną kopię listy kalkulacji według podanego kryterium i kierunku. */
export function sortSavedCalculations(
  calculations: SavedCalculation[],
  sortOption: SavedCalculationSortOption,
  sortDirection: SortDirection,
): SavedCalculation[] {
  const sorted = [...calculations].sort(ASCENDING_COMPARATORS[sortOption]);
  return sortDirection === SortDirection.DESCENDING ? sorted.reverse() : sorted;
}
