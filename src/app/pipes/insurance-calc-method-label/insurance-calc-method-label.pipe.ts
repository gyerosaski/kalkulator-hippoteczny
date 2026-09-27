import { Pipe, PipeTransform } from '@angular/core';
import { InsuranceCalcMethod } from '../../model/mortgage.model';

const LABELS: Record<InsuranceCalcMethod, string> = {
  [InsuranceCalcMethod.PCT_PROPERTY_VALUE]: '% wartości nieruchomości',
  [InsuranceCalcMethod.PCT_LOAN_AMOUNT]: '% kwoty kredytu',
  [InsuranceCalcMethod.PCT_BALANCE]: '% salda kredytu',
  [InsuranceCalcMethod.FIXED_AMOUNT]: 'znam kwotę',
};

@Pipe({ name: 'insuranceCalcMethodLabel', standalone: true })
export class InsuranceCalcMethodLabelPipe implements PipeTransform {
  transform(value: InsuranceCalcMethod): string;
  transform(value: readonly InsuranceCalcMethod[]): string[];
  transform(value: InsuranceCalcMethod | readonly InsuranceCalcMethod[]): string | string[] {
    if (Array.isArray(value)) return value.map((v) => LABELS[v as InsuranceCalcMethod]);
    return LABELS[value as InsuranceCalcMethod];
  }
}
