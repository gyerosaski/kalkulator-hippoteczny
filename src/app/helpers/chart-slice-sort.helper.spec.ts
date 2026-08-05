import { ChartSlice, ColorCodeArea } from '../model';
import { sortChartSlicesBySignificance } from './chart-slice-sort.helper';

function buildSlice(label: string, value: number, children?: ChartSlice[]): ChartSlice {
  const slice: ChartSlice = {
    label,
    value,
    color: 'var(--c-cost)',
    variant: ColorCodeArea.COST,
  };
  if (children) slice.children = children;
  return slice;
}

describe('sortChartSlicesBySignificance', () => {
  it('sortuje pozycje najwyższego poziomu malejąco po wartości', () => {
    const sorted = sortChartSlicesBySignificance([
      buildSlice('Kapitał', 400000),
      buildSlice('Odsetki', 250000),
      buildSlice('Koszty okołokredytowe', 12000),
      buildSlice('Nadpłaty', 300000),
    ]);

    expect(sorted.map((slice) => slice.label)).toEqual([
      'Kapitał',
      'Nadpłaty',
      'Odsetki',
      'Koszty okołokredytowe',
    ]);
  });

  it('sortuje rekurencyjnie składowe rozwijanej pozycji', () => {
    const sorted = sortChartSlicesBySignificance([
      buildSlice('Koszty okołokredytowe', 12000, [
        buildSlice('Prowizja', 4000),
        buildSlice('Wycena nieruchomości', 600),
        buildSlice('Ubezpieczenie nieruchomości', 7400),
      ]),
    ]);

    expect(sorted[0].children?.map((child) => child.label)).toEqual([
      'Ubezpieczenie nieruchomości',
      'Prowizja',
      'Wycena nieruchomości',
    ]);
  });

  it('plasuje pozycję ujemną według wartości bezwzględnej, nie na końcu', () => {
    const sorted = sortChartSlicesBySignificance([
      buildSlice('Odsetki bazowe', 250000),
      buildSlice('Ubezpieczenie pomostowe', 1200),
      buildSlice('Promocja oprocentowania', -3000),
    ]);

    expect(sorted.map((slice) => slice.label)).toEqual([
      'Odsetki bazowe',
      'Promocja oprocentowania',
      'Ubezpieczenie pomostowe',
    ]);
  });

  it('zachowuje kolejność wejściową dla pozycji o równych wartościach', () => {
    const sorted = sortChartSlicesBySignificance([
      buildSlice('Pierwsza', 1000),
      buildSlice('Druga', 1000),
      buildSlice('Trzecia', 1000),
    ]);

    expect(sorted.map((slice) => slice.label)).toEqual(['Pierwsza', 'Druga', 'Trzecia']);
  });

  it('nie modyfikuje tablicy wejściowej ani jej składowych', () => {
    const input = [
      buildSlice('Koszty okołokredytowe', 12000, [
        buildSlice('Prowizja', 4000),
        buildSlice('Ubezpieczenie nieruchomości', 7400),
      ]),
      buildSlice('Kapitał', 400000),
    ];

    sortChartSlicesBySignificance(input);

    expect(input.map((slice) => slice.label)).toEqual(['Koszty okołokredytowe', 'Kapitał']);
    expect(input[0].children?.map((child) => child.label)).toEqual([
      'Prowizja',
      'Ubezpieczenie nieruchomości',
    ]);
  });
});
