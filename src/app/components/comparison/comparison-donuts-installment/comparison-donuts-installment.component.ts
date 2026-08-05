import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  ColorCodeArea,
  ComparisonDeltaClass,
  ComparisonOfferData,
  DonutSlice,
  IconSize,
} from '../../../model';
import { DonutComponent } from '../../ui/donut/donut.component';
import { ColorCodeMarkerComponent } from '../../ui/color-code-marker/color-code-marker.component';
import { IconSlotAComponent } from '../../icons/icon-slot-a/icon-slot-a.component';
import { IconSlotBComponent } from '../../icons/icon-slot-b/icon-slot-b.component';

const AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const WHOLE_AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const RATE_FORMATTER = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function sign(value: number): string {
  return value > 0 ? '+' : value < 0 ? '−' : '';
}

/** Model prezentacyjny jednego donuta pierwszej raty (strona A lub B). */
interface InstallmentDonutModel {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  installmentText: string;
  rateText: string;
  isGracePeriod: boolean;
}

const SEGMENT_LEGEND: readonly { label: string; variant: ColorCodeArea }[] = [
  { label: 'Kapitał', variant: ColorCodeArea.CAPITAL },
  { label: 'Odsetki', variant: ColorCodeArea.INTEREST },
];

const DONUT_SIZE = 160;
const DONUT_THICKNESS = 22;

@Component({
  selector: 'app-comparison-donuts-installment',
  standalone: true,
  imports: [DonutComponent, ColorCodeMarkerComponent, IconSlotAComponent, IconSlotBComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comparison-donuts-installment.component.html',
  styleUrl: './comparison-donuts-installment.component.scss',
})
export class ComparisonDonutsInstallmentComponent {
  readonly sideA = input.required<ComparisonOfferData>();
  readonly sideB = input.required<ComparisonOfferData>();

  protected readonly donutSize = DONUT_SIZE;
  protected readonly donutThickness = DONUT_THICKNESS;
  protected readonly segmentLegend = SEGMENT_LEGEND;
  protected readonly IconSize = IconSize;

  protected readonly donutA = computed<InstallmentDonutModel>(() =>
    this.buildDonutModel(this.sideA()),
  );

  protected readonly donutB = computed<InstallmentDonutModel>(() =>
    this.buildDonutModel(this.sideB()),
  );

  protected readonly sectionTitle = computed<string>(() =>
    this.donutA().isGracePeriod && this.donutB().isGracePeriod
      ? 'Pierwsza rata (okres karencji)'
      : 'Struktura pierwszej raty',
  );

  protected readonly installmentDelta = computed<{
    text: string;
    deltaClass: ComparisonDeltaClass;
  }>(() => {
    const installmentA = this.sideA().offer.firstInstallment;
    const installmentB = this.sideB().offer.firstInstallment;
    const delta = installmentB - installmentA;
    const isEqual = Math.abs(delta) < 0.005;
    return {
      text: isEqual ? '=' : `${sign(delta)}${AMOUNT_FORMATTER.format(Math.abs(delta))} zł`,
      deltaClass: isEqual ? 'delta--flat' : delta > 0 ? 'delta--up' : 'delta--down',
    };
  });

  private buildDonutModel(side: ComparisonOfferData): InstallmentDonutModel {
    const firstInstallment = side.computation?.results.firstInstallment ?? null;
    const capital = firstInstallment?.capital ?? 0;
    const interest = firstInstallment?.interest ?? 0;
    const installment = firstInstallment?.rate ?? 0;
    const isGracePeriod = capital === 0 && interest > 0;

    const slices: DonutSlice[] = isGracePeriod
      ? [{ label: 'Odsetki', value: interest, color: 'var(--c-int)' }]
      : [
          { label: 'Kapitał', value: capital, color: 'var(--c-cap)' },
          { label: 'Odsetki', value: interest, color: 'var(--c-int)' },
        ];

    return {
      slices,
      centerLabel: isGracePeriod ? '100%' : 'rata',
      centerValue: isGracePeriod ? 'odsetek' : `${WHOLE_AMOUNT_FORMATTER.format(installment)} zł`,
      installmentText: `rata ${AMOUNT_FORMATTER.format(installment)} zł`,
      rateText: `${RATE_FORMATTER.format(side.offer.nominalRate)}%`,
      isGracePeriod,
    };
  }
}
