import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { ComparableOffer, ComparisonKpiRow, ComparisonOfferData } from '../../../model';
import { InstallmentTypeLabelPipe } from '../../../pipes/installment-type-label/installment-type-label.pipe';
import { RateTypeLabelPipe } from '../../../pipes/rate-type-label/rate-type-label.pipe';
import { SectionComponent } from '../../ui/section/section.component';

const AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const WHOLE_AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const PERCENT_FORMATTER = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const RATE_FORMATTER = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatAmount(value: number): string {
  return AMOUNT_FORMATTER.format(value);
}

function formatWholeAmount(value: number): string {
  return WHOLE_AMOUNT_FORMATTER.format(value);
}

function sign(value: number): string {
  return value > 0 ? '+' : value < 0 ? '−' : '';
}

interface KpiRowDefinition {
  label: string;
  value: (offer: ComparableOffer) => number;
  meta: (offer: ComparableOffer) => string;
  format: (value: number) => string;
}

@Component({
  selector: 'app-comparison-kpi-grid',
  standalone: true,
  imports: [SectionComponent],
  providers: [InstallmentTypeLabelPipe, RateTypeLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comparison-kpi-grid.component.html',
  styleUrl: './comparison-kpi-grid.component.scss',
})
export class ComparisonKpiGridComponent {
  private readonly installmentTypeLabel = inject(InstallmentTypeLabelPipe);
  private readonly rateTypeLabel = inject(RateTypeLabelPipe);

  readonly sideA = input.required<ComparisonOfferData>();
  readonly sideB = input.required<ComparisonOfferData>();

  protected readonly kpiRows = computed<ComparisonKpiRow[]>(() => {
    const offerA = this.sideA().offer;
    const offerB = this.sideB().offer;
    return this.rowDefinitions().map((definition) => this.buildRow(definition, offerA, offerB));
  });

  private rowDefinitions(): KpiRowDefinition[] {
    return [
      {
        label: 'Pierwsza rata',
        value: (offer) => offer.firstInstallment,
        meta: (offer) =>
          `raty ${this.installmentTypeLabel.transform(offer.installmentType)} · stopa ${this.rateTypeLabel.transform(offer.rateType)} · ${RATE_FORMATTER.format(offer.nominalRate)}%`,
        format: formatAmount,
      },
      {
        label: 'Suma wszystkich płatności',
        value: (offer) => offer.totalPayments,
        meta: (offer) =>
          offer.loanAmount > 0
            ? `oddasz ${PERCENT_FORMATTER.format((offer.totalPayments / offer.loanAmount) * 100)}% pożyczonej kwoty`
            : '',
        format: formatWholeAmount,
      },
      {
        label: 'Odsetki',
        value: (offer) => offer.totalInterest,
        meta: (offer) =>
          offer.loanAmount > 0
            ? `${PERCENT_FORMATTER.format((offer.totalInterest / offer.loanAmount) * 100)}% od kapitału`
            : '',
        format: formatWholeAmount,
      },
      {
        label: 'Koszty okołokredytowe',
        value: (offer) => offer.totalCosts,
        meta: (offer) =>
          `prowizja ${formatWholeAmount(offer.commission)} zł · wycena ${formatWholeAmount(offer.appraisalFee)} zł`,
        format: formatWholeAmount,
      },
    ];
  }

  private buildRow(
    definition: KpiRowDefinition,
    offerA: ComparableOffer,
    offerB: ComparableOffer,
  ): ComparisonKpiRow {
    const aValue = definition.value(offerA);
    const bValue = definition.value(offerB);
    const delta = bValue - aValue;
    const isEqual = Math.abs(delta) < 0.5;
    const deltaPercent = aValue > 0 ? (delta / aValue) * 100 : null;

    return {
      label: definition.label,
      aValueText: `${definition.format(aValue)} zł`,
      aMetaText: definition.meta(offerA),
      bValueText: `${definition.format(bValue)} zł`,
      bMetaText: definition.meta(offerB),
      deltaText: isEqual ? '=' : `${sign(delta)}${definition.format(Math.abs(delta))} zł`,
      deltaPercentText:
        isEqual || deltaPercent === null
          ? ''
          : `(${sign(deltaPercent)}${PERCENT_FORMATTER.format(Math.abs(deltaPercent))}%)`,
      deltaClass: isEqual ? 'delta--flat' : delta > 0 ? 'delta--up' : 'delta--down',
      aIsLeader: !isEqual && aValue < bValue,
      bIsLeader: !isEqual && bValue < aValue,
    };
  }
}
