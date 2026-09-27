import { Pipe, PipeTransform } from '@angular/core';
import { OverheadCostItem, OverheadCostKind } from '../../model';

const LABELS: Record<OverheadCostKind, string> = {
  [OverheadCostKind.LOAN_COMMISSION]: 'Prowizja za udzielenie',
  [OverheadCostKind.APPRAISAL_FEE]: 'Opłata za wycenę',
  [OverheadCostKind.PROPERTY_INSURANCE]: 'Ubezpieczenie nieruchomości',
  [OverheadCostKind.LIFE_INSURANCE]: 'Ubezpieczenie na życie',
  [OverheadCostKind.JOB_LOSS_INSURANCE]: 'Ubezpieczenie od utraty pracy',
  [OverheadCostKind.ADDITIONAL_COST]: 'Koszt dodatkowy',
  [OverheadCostKind.EARLY_REPAYMENT_COMMISSION]: 'Prowizja za wcześniejszą spłatę',
  [OverheadCostKind.TRANCHE_DISBURSEMENT_FEE]: 'Opłata za uruchomienie transzy',
};

@Pipe({ name: 'overheadCostKindLabel', standalone: true })
export class OverheadCostKindLabelPipe implements PipeTransform {
  transform(value: OverheadCostItem): string {
    if (value.kind === OverheadCostKind.ADDITIONAL_COST) {
      return value.name?.trim() || LABELS[OverheadCostKind.ADDITIONAL_COST];
    }
    return LABELS[value.kind];
  }
}
