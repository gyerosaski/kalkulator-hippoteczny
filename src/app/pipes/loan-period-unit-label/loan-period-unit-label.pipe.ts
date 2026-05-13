import { Pipe, PipeTransform } from '@angular/core';
import { LoanPeriodUnit } from '../../model/mortgage.model';

const LABELS: Record<LoanPeriodUnit, string> = {
  [LoanPeriodUnit.YEARS]: 'lata',
  [LoanPeriodUnit.MONTHS]: 'miesiące',
};

@Pipe({ name: 'loanPeriodUnitLabel', standalone: true })
export class LoanPeriodUnitLabelPipe implements PipeTransform {
  transform(value: LoanPeriodUnit): string;
  transform(value: readonly LoanPeriodUnit[]): string[];
  transform(value: LoanPeriodUnit | readonly LoanPeriodUnit[]): string | string[] {
    if (Array.isArray(value)) return value.map((v) => LABELS[v as LoanPeriodUnit]);
    return LABELS[value as LoanPeriodUnit];
  }
}
