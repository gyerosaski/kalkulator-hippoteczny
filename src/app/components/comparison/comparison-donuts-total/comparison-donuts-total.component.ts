import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  ColorCodeArea,
  ComparisonDonutDeltaRow,
  ComparisonOfferData,
  DonutSlice,
} from '../../../model';
import { DonutComponent } from '../../ui/donut/donut.component';
import { ColorCodeMarkerComponent } from '../../ui/color-code-marker/color-code-marker.component';

const WHOLE_AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });

function formatWholeAmount(value: number): string {
  return WHOLE_AMOUNT_FORMATTER.format(value);
}

function sign(value: number): string {
  return value > 0 ? '+' : value < 0 ? '−' : '';
}

interface PaymentSegmentDescriptor {
  label: string;
  color: string;
  variant: ColorCodeArea;
  value: (side: ComparisonOfferData) => number;
}

const PAYMENT_SEGMENT_DESCRIPTORS: readonly PaymentSegmentDescriptor[] = [
  {
    label: 'Kapitał',
    color: 'var(--c-cap)',
    variant: ColorCodeArea.CAPITAL,
    value: (side) => side.computation?.results.totals.totalCapital ?? 0,
  },
  {
    label: 'Odsetki',
    color: 'var(--c-int)',
    variant: ColorCodeArea.INTEREST,
    value: (side) => side.computation?.results.totals.totalInterest ?? 0,
  },
  {
    label: 'Koszty okołokredytowe',
    color: 'var(--c-cost)',
    variant: ColorCodeArea.COST,
    value: (side) => side.computation?.results.totals.overheadCosts ?? 0,
  },
  {
    label: 'Nadpłaty',
    color: 'var(--c-over)',
    variant: ColorCodeArea.PREPAYMENT,
    value: (side) => side.computation?.results.totals.prepayments ?? 0,
  },
];

const DONUT_SIZE = 200;
const DONUT_THICKNESS = 28;

@Component({
  selector: 'app-comparison-donuts-total',
  standalone: true,
  imports: [DonutComponent, ColorCodeMarkerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comparison-donuts-total.component.html',
  styleUrl: './comparison-donuts-total.component.scss',
})
export class ComparisonDonutsTotalComponent {
  readonly sideA = input.required<ComparisonOfferData>();
  readonly sideB = input.required<ComparisonOfferData>();
  readonly showExcludedSegments = input<boolean>(false);

  protected readonly donutSize = DONUT_SIZE;
  protected readonly donutThickness = DONUT_THICKNESS;

  /** Segmenty widoczne w tej parze donutów — segment znika tylko, gdy jest zerowy w OBU ofertach i toggle jest wyłączony. */
  protected readonly visibleSegments = computed<PaymentSegmentDescriptor[]>(() => {
    if (this.showExcludedSegments()) return [...PAYMENT_SEGMENT_DESCRIPTORS];
    const sideA = this.sideA();
    const sideB = this.sideB();
    return PAYMENT_SEGMENT_DESCRIPTORS.filter(
      (segment) => segment.value(sideA) > 0 || segment.value(sideB) > 0,
    );
  });

  protected readonly slicesA = computed<DonutSlice[]>(() => this.buildSlices(this.sideA()));
  protected readonly slicesB = computed<DonutSlice[]>(() => this.buildSlices(this.sideB()));

  protected readonly totalTextA = computed<string>(() => this.buildTotalText(this.sideA()));
  protected readonly totalTextB = computed<string>(() => this.buildTotalText(this.sideB()));

  protected readonly centerValueA = computed<string>(() => this.buildCenterValue(this.sideA()));
  protected readonly centerValueB = computed<string>(() => this.buildCenterValue(this.sideB()));

  protected readonly deltaRows = computed<ComparisonDonutDeltaRow[]>(() => {
    const sideA = this.sideA();
    const sideB = this.sideB();
    return this.visibleSegments().map((segment) => {
      const delta = segment.value(sideB) - segment.value(sideA);
      const isEqual = Math.abs(delta) < 0.5;
      const isInverted = segment.variant === ColorCodeArea.PREPAYMENT;
      return {
        label: segment.label,
        variant: segment.variant,
        deltaText: isEqual ? '0,00 zł' : `${sign(delta)}${formatWholeAmount(Math.abs(delta))} zł`,
        deltaClass: isEqual
          ? 'delta--flat'
          : delta > 0 !== isInverted
            ? 'delta--up'
            : 'delta--down',
      };
    });
  });

  private buildSlices(side: ComparisonOfferData): DonutSlice[] {
    return this.visibleSegments().map((segment) => ({
      label: segment.label,
      value: segment.value(side),
      color: segment.color,
    }));
  }

  private buildTotalText(side: ComparisonOfferData): string {
    const totalAllPayments = side.computation?.results.totals.totalAllPayments ?? 0;
    return `${formatWholeAmount(totalAllPayments)} zł`;
  }

  private buildCenterValue(side: ComparisonOfferData): string {
    const totalAllPayments = side.computation?.results.totals.totalAllPayments ?? 0;
    return `${formatWholeAmount(totalAllPayments / 1000)} tys.`;
  }
}
