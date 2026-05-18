import { Pipe, PipeTransform } from '@angular/core';
import { CommissionCalcMethod } from '../../model/mortgage.model';

const LABELS: Record<CommissionCalcMethod, string> = {
  [CommissionCalcMethod.PERCENTAGE]: '%',
  [CommissionCalcMethod.FIXED_AMOUNT]: 'zł',
};

@Pipe({ name: 'commissionCalcMethodLabel', standalone: true })
export class CommissionCalcMethodLabelPipe implements PipeTransform {
  transform(value: CommissionCalcMethod): string;
  transform(value: readonly CommissionCalcMethod[]): string[];
  transform(value: CommissionCalcMethod | readonly CommissionCalcMethod[]): string | string[] {
    if (Array.isArray(value)) return value.map((v) => LABELS[v as CommissionCalcMethod]);
    return LABELS[value as CommissionCalcMethod];
  }
}
