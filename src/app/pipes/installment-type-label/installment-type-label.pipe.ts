import { Pipe, PipeTransform } from '@angular/core';
import { InstallmentType } from '../../model/mortgage.model';

const LABELS: Record<InstallmentType, string> = {
  [InstallmentType.EQUAL]: 'równe',
  [InstallmentType.DECREASING]: 'malejące',
};

@Pipe({ name: 'installmentTypeLabel', standalone: true })
export class InstallmentTypeLabelPipe implements PipeTransform {
  transform(value: InstallmentType): string;
  transform(value: readonly InstallmentType[]): string[];
  transform(value: InstallmentType | readonly InstallmentType[]): string | string[] {
    if (Array.isArray(value)) return value.map((v) => LABELS[v as InstallmentType]);
    return LABELS[value as InstallmentType];
  }
}
