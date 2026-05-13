import { Pipe, PipeTransform } from '@angular/core';
import { LifeInsuranceCalcMethod } from '../../model/mortgage.model';

const LABELS: Record<LifeInsuranceCalcMethod, string> = {
  [LifeInsuranceCalcMethod.PCT_LOAN_AMOUNT]: '% kwoty kredytu',
  [LifeInsuranceCalcMethod.PCT_BALANCE]: '% salda kredytu',
  [LifeInsuranceCalcMethod.FIXED_AMOUNT]: 'znam kwotę',
};

@Pipe({ name: 'lifeInsuranceCalcMethodLabel', standalone: true })
export class LifeInsuranceCalcMethodLabelPipe implements PipeTransform {
  transform(value: LifeInsuranceCalcMethod): string;
  transform(value: readonly LifeInsuranceCalcMethod[]): string[];
  transform(
    value: LifeInsuranceCalcMethod | readonly LifeInsuranceCalcMethod[],
  ): string | string[] {
    if (Array.isArray(value)) return value.map((v) => LABELS[v as LifeInsuranceCalcMethod]);
    return LABELS[value as LifeInsuranceCalcMethod];
  }
}
