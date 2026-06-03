import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ComparableOffer, ComparisonDiffRow } from '../../../model';

const fmtAmount = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const fmtPct = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatAmount(value: number): string {
  return fmtAmount.format(value);
}

function formatPercent(value: number): string {
  return fmtPct.format(value);
}

function sign(value: number): string {
  return value > 0 ? '+' : value < 0 ? '−' : '';
}

function buildRow(
  label: string,
  aValue: number,
  bValue: number,
  options: {
    unit?: string;
    isInverted?: boolean;
    isEmphasized?: boolean;
    equalThreshold?: number;
    format?: (v: number) => string;
  } = {},
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
    aIsLeader = aValue < bValue;
    bIsLeader = bValue < aValue;
  } else {
    deltaClass = delta > 0 ? 'delta--up' : 'delta--down';
    aIsLeader = aValue < bValue;
    bIsLeader = bValue < aValue;
  }

  const deltaText = isEqual ? '=' : `${sign(delta)}${format(Math.abs(delta))} ${unit}`;

  return {
    label,
    aText: format(aValue),
    bText: format(bValue),
    deltaText,
    unit,
    deltaClass,
    aIsLeader,
    bIsLeader,
    isEmphasized,
  };
}

@Component({
  selector: 'app-comparison-diff-table',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comparison-diff-table.component.html',
  styleUrl: './comparison-diff-table.component.scss',
})
export class ComparisonDiffTableComponent {
  readonly offerA = input.required<ComparableOffer>();
  readonly offerB = input.required<ComparableOffer>();

  protected readonly diffRows = computed<ComparisonDiffRow[]>(() => {
    const offerA = this.offerA();
    const offerB = this.offerB();

    const insuranceA = Math.max(0, offerA.totalCosts - offerA.commission - offerA.appraisalFee);
    const insuranceB = Math.max(0, offerB.totalCosts - offerB.commission - offerB.appraisalFee);

    const bankReturnA =
      offerA.loanAmount > 0 ? (offerA.totalPayments / offerA.loanAmount) * 100 : 0;
    const bankReturnB =
      offerB.loanAmount > 0 ? (offerB.totalPayments / offerB.loanAmount) * 100 : 0;

    return [
      buildRow('Kapitał', offerA.loanAmount, offerB.loanAmount),
      buildRow('Odsetki — łącznie', offerA.totalInterest, offerB.totalInterest),
      buildRow('Prowizja za udzielenie', offerA.commission, offerB.commission),
      buildRow('Opłata za wycenę', offerA.appraisalFee, offerB.appraisalFee),
      buildRow('Ubezpieczenia (wszystkie)', insuranceA, insuranceB),
      buildRow('Nadpłaty', offerA.totalOverpayments, offerB.totalOverpayments, {
        isInverted: true,
      }),
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
