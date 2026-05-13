import { Pipe, PipeTransform } from '@angular/core';
import { InsuranceFrequency } from '../../model/mortgage.model';

const LABELS: Record<InsuranceFrequency, string> = {
  [InsuranceFrequency.YEARLY]: 'co rok',
  [InsuranceFrequency.MONTHLY]: 'co miesiąc',
  [InsuranceFrequency.ONE_TIME]: 'jednorazowo',
};

@Pipe({ name: 'insuranceFrequencyLabel', standalone: true })
export class InsuranceFrequencyLabelPipe implements PipeTransform {
  transform(value: InsuranceFrequency): string;
  transform(value: readonly InsuranceFrequency[]): string[];
  transform(value: InsuranceFrequency | readonly InsuranceFrequency[]): string | string[] {
    if (Array.isArray(value)) return value.map((v) => LABELS[v as InsuranceFrequency]);
    return LABELS[value as InsuranceFrequency];
  }
}
