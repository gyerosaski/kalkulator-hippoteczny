import { Pipe, PipeTransform } from '@angular/core';
import { PrepaymentFrequency } from '../../model/mortgage.model';

const LABELS: Record<PrepaymentFrequency, string> = {
  [PrepaymentFrequency.ONE_TIME]: 'jednorazowo',
  [PrepaymentFrequency.MONTHLY]: 'co miesiąc',
  [PrepaymentFrequency.QUARTERLY]: 'co kwartał',
  [PrepaymentFrequency.YEARLY]: 'co rok',
};

@Pipe({ name: 'prepaymentFrequencyLabel', standalone: true })
export class PrepaymentFrequencyLabelPipe implements PipeTransform {
  transform(value: PrepaymentFrequency): string;
  transform(value: readonly PrepaymentFrequency[]): string[];
  transform(value: PrepaymentFrequency | readonly PrepaymentFrequency[]): string | string[] {
    if (Array.isArray(value)) return value.map((v) => LABELS[v as PrepaymentFrequency]);
    return LABELS[value as PrepaymentFrequency];
  }
}
