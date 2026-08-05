import { ChartSlice } from '../model';

/**
 * Porządkuje pozycje legendy/wykresu od najistotniejszej do najmniej istotnej — malejąco po wartości
 * bezwzględnej (składniki ujemne, np. promocja oprocentowania, ważą tyle, ile wynosi ich wpływ).
 * Sortowanie jest rekurencyjne: rozwijane składowe porządkowane są tak samo w obrębie swojej kategorii.
 * Zwraca nowe tablice — nie modyfikuje wejścia.
 */
export function sortChartSlicesBySignificance(slices: ChartSlice[]): ChartSlice[] {
  return [...slices]
    .sort((first, second) => Math.abs(second.value) - Math.abs(first.value))
    .map((slice) =>
      slice.children
        ? { ...slice, children: sortChartSlicesBySignificance(slice.children) }
        : slice,
    );
}
