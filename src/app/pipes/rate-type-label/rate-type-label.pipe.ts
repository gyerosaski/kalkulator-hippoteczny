import { Pipe, PipeTransform } from '@angular/core';
import { RateType } from '../../model/mortgage.model';

const LABELS: Record<RateType, string> = {
  [RateType.VARIABLE]: 'zmienna',
  [RateType.FIXED]: 'stała',
};

@Pipe({ name: 'rateTypeLabel', standalone: true })
export class RateTypeLabelPipe implements PipeTransform {
  transform(value: RateType): string;
  transform(value: readonly RateType[]): string[];
  transform(value: RateType | readonly RateType[]): string | string[] {
    if (Array.isArray(value)) return value.map((v) => LABELS[v as RateType]);
    return LABELS[value as RateType];
  }
}
