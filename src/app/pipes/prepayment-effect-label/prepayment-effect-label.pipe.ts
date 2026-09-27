import { Pipe, PipeTransform } from '@angular/core';
import { PrepaymentEffect } from '../../model/mortgage.model';

const LABELS: Record<PrepaymentEffect, string> = {
  [PrepaymentEffect.LOWER_INSTALLMENT]: 'niższa rata',
  [PrepaymentEffect.SHORTEN_PERIOD]: 'skrócenie okresu',
};

@Pipe({ name: 'prepaymentEffectLabel', standalone: true })
export class PrepaymentEffectLabelPipe implements PipeTransform {
  transform(value: PrepaymentEffect): string;
  transform(value: readonly PrepaymentEffect[]): string[];
  transform(value: PrepaymentEffect | readonly PrepaymentEffect[]): string | string[] {
    if (Array.isArray(value)) return value.map((v) => LABELS[v as PrepaymentEffect]);
    return LABELS[value as PrepaymentEffect];
  }
}
