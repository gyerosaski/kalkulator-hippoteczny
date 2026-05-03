import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatCurrencyAmount',
})
export class FormatCurrencyAmountPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
