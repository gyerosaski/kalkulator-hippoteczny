import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  ComparisonDiffRow,
  ComparisonOfferData,
  OverheadCostItem,
  IconSize,
  OverheadCostKind,
} from '../../../model';
import { IconSlotAComponent } from '../../icons/icon-slot-a/icon-slot-a.component';
import { IconSlotBComponent } from '../../icons/icon-slot-b/icon-slot-b.component';

const AMOUNT_FORMATTER = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const PERCENT_FORMATTER = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const EMPTY_CELL_TEXT = '—';

/** Rodzaje kosztów składające się na wiersz „Ubezpieczenia i koszty dodatkowe” (bez prowizji, wyceny i prowizji za nadpłaty). */
const INSURANCE_COST_KINDS: readonly OverheadCostKind[] = [
  OverheadCostKind.PROPERTY_INSURANCE,
  OverheadCostKind.LIFE_INSURANCE,
  OverheadCostKind.JOB_LOSS_INSURANCE,
  OverheadCostKind.ADDITIONAL_COST,
  OverheadCostKind.TRANCHE_DISBURSEMENT_FEE,
];

function formatAmount(value: number): string {
  return AMOUNT_FORMATTER.format(value);
}

function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value);
}

function sign(value: number): string {
  return value > 0 ? '+' : value < 0 ? '−' : '';
}

function sumBreakdownOfKinds(
  breakdown: OverheadCostItem[],
  kinds: readonly OverheadCostKind[],
): number {
  return breakdown
    .filter((item) => kinds.includes(item.kind))
    .reduce((sum, item) => sum + item.value, 0);
}

interface DiffRowOptions {
  unit?: string;
  isInverted?: boolean;
  isEmphasized?: boolean;
  equalThreshold?: number;
  format?: (value: number) => string;
}

function buildRow(
  label: string,
  aValue: number,
  bValue: number,
  options: DiffRowOptions = {},
): ComparisonDiffRow {
  const unit = options.unit ?? 'zł';
  const isInverted = options.isInverted ?? false;
  const isEmphasized = options.isEmphasized ?? false;
  const equalThreshold = options.equalThreshold ?? 0.5;
  const format = options.format ?? formatAmount;

  const delta = bValue - aValue;
  const isEqual = Math.abs(delta) < equalThreshold;

  let deltaClass: ComparisonDiffRow['deltaClass'];
  let aIsLeader = false;
  let bIsLeader = false;

  if (isEqual) {
    deltaClass = 'delta--flat';
  } else if (isInverted) {
    deltaClass = delta > 0 ? 'delta--down' : 'delta--up';
    aIsLeader = aValue > bValue;
    bIsLeader = bValue > aValue;
  } else {
    deltaClass = delta > 0 ? 'delta--up' : 'delta--down';
    aIsLeader = aValue < bValue;
    bIsLeader = bValue < aValue;
  }

  const deltaText = isEqual ? '=' : `${sign(delta)}${format(Math.abs(delta))} ${unit}`;

  return {
    label,
    aText: `${format(aValue)} ${unit}`,
    bText: `${format(bValue)} ${unit}`,
    deltaText,
    deltaClass,
    aIsLeader,
    bIsLeader,
    isEmphasized,
  };
}

/**
 * Wiersz dla wartości dostępnych warunkowo (np. sekcja kosztów lub nadpłat wyłączona po jednej ze stron).
 * Brakująca strona renderowana jest jako `—`; delta liczona tylko, gdy obie wartości istnieją.
 */
function buildOptionalRow(
  label: string,
  aValue: number | null,
  bValue: number | null,
  options: DiffRowOptions = {},
): ComparisonDiffRow {
  if (aValue !== null && bValue !== null) {
    return buildRow(label, aValue, bValue, options);
  }

  const unit = options.unit ?? 'zł';
  const format = options.format ?? formatAmount;
  const formatCell = (value: number | null) =>
    value === null ? EMPTY_CELL_TEXT : `${format(value)} ${unit}`;

  return {
    label,
    aText: formatCell(aValue),
    bText: formatCell(bValue),
    deltaText: EMPTY_CELL_TEXT,
    deltaClass: 'delta--flat',
    aIsLeader: false,
    bIsLeader: false,
    isEmphasized: options.isEmphasized ?? false,
  };
}

function insuranceCostsTotal(side: ComparisonOfferData): number {
  const computation = side.computation;
  if (computation) {
    return sumBreakdownOfKinds(
      computation.results.totals.overheadCostsBreakdown,
      INSURANCE_COST_KINDS,
    );
  }
  const offer = side.offer;
  return Math.max(0, offer.totalCosts - offer.commission - offer.appraisalFee);
}

/** Suma odsetek naliczonych w okresie podwyższonej marży ubezpieczenia pomostowego; `null` gdy pomostowe nie występuje. */
function bridgeInterestTotal(side: ComparisonOfferData): number | null {
  const computation = side.computation;
  const formValue = side.formValue;
  if (!computation || !formValue?.overheadCosts.enabled) return null;
  const bridgeMonths = Number(formValue.overheadCosts.fields.bridge?.bridgeMonths) || 0;
  if (bridgeMonths <= 0) return null;
  return computation.results.schedule
    .slice(0, bridgeMonths)
    .reduce((sum, row) => sum + row.interest, 0);
}

/** Suma prowizji za wcześniejszą spłatę naliczonych od nadpłat; `null` gdy sekcja nadpłat jest wyłączona. */
function earlyRepaymentCommissionTotal(side: ComparisonOfferData): number | null {
  const computation = side.computation;
  const formValue = side.formValue;
  if (!computation || !formValue?.prepayments.enabled) return null;
  return sumBreakdownOfKinds(computation.results.totals.overheadCostsBreakdown, [
    OverheadCostKind.EARLY_REPAYMENT_COMMISSION,
  ]);
}

@Component({
  selector: 'app-comparison-diff-table',
  standalone: true,
  imports: [IconSlotAComponent, IconSlotBComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comparison-diff-table.component.html',
  styleUrl: './comparison-diff-table.component.scss',
})
export class ComparisonDiffTableComponent {
  readonly sideA = input.required<ComparisonOfferData>();
  readonly sideB = input.required<ComparisonOfferData>();

  protected readonly IconSize = IconSize;

  protected readonly offerName = computed(() => ({
    a: this.sideA().offer.name,
    b: this.sideB().offer.name,
  }));

  protected readonly diffRows = computed<ComparisonDiffRow[]>(() => {
    const sideA = this.sideA();
    const sideB = this.sideB();
    const offerA = sideA.offer;
    const offerB = sideB.offer;

    const bankReturnA =
      offerA.loanAmount > 0 ? (offerA.totalPayments / offerA.loanAmount) * 100 : 0;
    const bankReturnB =
      offerB.loanAmount > 0 ? (offerB.totalPayments / offerB.loanAmount) * 100 : 0;

    return [
      buildRow('Kapitał', offerA.loanAmount, offerB.loanAmount),
      buildRow('Odsetki — łącznie', offerA.totalInterest, offerB.totalInterest),
      buildOptionalRow(
        'Odsetki — w okresie ubezp. pomostowego',
        bridgeInterestTotal(sideA),
        bridgeInterestTotal(sideB),
      ),
      buildRow('Prowizja za udzielenie', offerA.commission, offerB.commission),
      buildRow('Opłata za wycenę', offerA.appraisalFee, offerB.appraisalFee),
      buildRow('Ubezpieczenia (wszystkie)', insuranceCostsTotal(sideA), insuranceCostsTotal(sideB)),
      buildRow('Nadpłaty', offerA.totalOverpayments, offerB.totalOverpayments, {
        isInverted: true,
      }),
      buildOptionalRow(
        'Prowizja za wcześniejszą spłatę',
        earlyRepaymentCommissionTotal(sideA),
        earlyRepaymentCommissionTotal(sideB),
      ),
      buildRow('SUMA — całkowity koszt kredytu', offerA.totalPayments, offerB.totalPayments, {
        isEmphasized: true,
      }),
      buildRow('Oddasz do banku', bankReturnA, bankReturnB, {
        unit: '%',
        isEmphasized: true,
        equalThreshold: 0.05,
        format: formatPercent,
      }),
    ];
  });
}
